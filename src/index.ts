import { baseSepolia } from "viem/chains";
import { account, baseSepoliaClient, core, walletClient } from "./config";
import { getTransparentBudget } from "./utils/budget";
import { eventActionPayload } from "./utils/eventAction";
import { erc20Abi, parseUnits } from "viem";
import { StrategyType } from "@boostxyz/sdk";

const signers = {
  production: '0xCBD0C302040bC803B4B2EDaF21Be0e49Deff5480' as const,
  staging: '0xd63167e9db11B108940b2E8236581F961f33f396' as const,
}

const incentivePayload = {
  asset: "0x036cbd53842c5426634e7929541ec2318f3dcf7e" as const, // USDC (Base Sepolia)
  reward: parseUnits("1", 6),
  limit: 1n,
  strategy: StrategyType.POOL,
}

const main = async () => {
  const transparentBudget = await getTransparentBudget(baseSepolia.id);

  const action = core.EventAction(eventActionPayload);
  const incentive = core.ERC20Incentive(incentivePayload);
  const allowList = core.OpenAllowList();
  const validator = core.LimitedSignerValidator({
    signers: [signers.staging], // use production signer for mainnet
    validatorCaller: core.assertValidAddress(),
    maxClaimCount: 1,
  })

  const rewardAddress = incentivePayload.asset;
  const rewardAmount = incentivePayload.reward;

  const feeAmount = (rewardAmount * BigInt(10)) / BigInt(100); // 10% fee
  const rewardAmountWithFee = rewardAmount + feeAmount;

  const approvalHash = await walletClient.writeContract({
    address: rewardAddress,
    abi: erc20Abi,
    functionName: "approve",
    args: [transparentBudget.assertValidAddress(), rewardAmountWithFee],
  });

  const approvalReceipt = await baseSepoliaClient.waitForTransactionReceipt({ hash: approvalHash });

  if (approvalReceipt.status === "reverted") {
    throw new Error("Approval failed");
  }

  const boost = await core.createBoostWithTransparentBudget(
    transparentBudget,
    [{ amount: rewardAmountWithFee, asset: rewardAddress, target: account.address }],
    {
      action,
      incentives: [incentive],
      allowList,
      validator,
    }
  )

  console.log("Boost created:", boost.id);
}

main();