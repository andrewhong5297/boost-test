import { baseSepolia } from "viem/chains";
import { core, config } from "./config";
import { getTransparentBudget } from "./utils/budget";
import { eventActionPayload } from "./utils/eventAction";
import { Address, parseUnits } from "viem";
import { StrategyType } from "@boostxyz/sdk";

// Needed for validator. Use production signer for mainnet.
const signers = {
  production: "0xCBD0C302040bC803B4B2EDaF21Be0e49Deff5480" as const,
  staging: "0xd63167e9db11B108940b2E8236581F961f33f396" as const
};

const incentivePayload = {
  asset: "0x036cbd53842c5426634e7929541ec2318f3dcf7e" as const, // USDC (Base Sepolia)
  reward: parseUnits("0.1", 6),
  limit: 1n,
  strategy: StrategyType.POOL
};

const accountAddress = "0x4d6E6ef749D2C0E3ee89Fc788A00e28DB71aa6b5";

const createBoostWithTransparentBudget = async () => {
  console.log("Starting Boost Payload Preparation...");

  const transparentBudget = await getTransparentBudget(baseSepolia.id);

  const action = core.EventAction(eventActionPayload);
  const incentive = core.ERC20Incentive(incentivePayload);

  // Allowlist is open to all addresses.
  const allowList = core.SimpleDenyList({
    owner: accountAddress,
    denied: []
  });
  const validator = core.LimitedSignerValidator({
    signers: [signers.staging], // use production signer for mainnet
    validatorCaller: core.assertValidAddress(), // address for BoostCore (https://github.com/boostxyz/boost-protocol/blob/c638b3f599c10e3f6cab7152849ddae612f2bd26/packages/evm/deploys/84532.json#L3)
    maxClaimCount: 1 // allows for only 1 claim per address
  });

  const rewardAddress = incentivePayload.asset;
  const rewardAmount = incentivePayload.reward;

  const feeAmount = (rewardAmount * BigInt(10)) / BigInt(100); // 10% fee
  const rewardAmountWithFee = rewardAmount + feeAmount;

  // console.log("Approving reward...");
  // const approvalHash = await walletClient.writeContract({
  //   address: rewardAddress,
  //   abi: erc20Abi,
  //   functionName: "approve",
  //   args: [transparentBudget.assertValidAddress(), rewardAmountWithFee]
  // });

  // const approvalReceipt = await baseSepoliaClient.waitForTransactionReceipt({
  //   hash: approvalHash
  // });

  // if (approvalReceipt.status === "reverted") {
  //   throw new Error("Approval failed");
  // }
  console.log("Approval successful");

  console.log("Preparing Boost Payload...");
  
  const coreAddress = core.assertValidAddress();
  const chainId = baseSepolia.id;
  const payload = {
    budget: transparentBudget,
    action,
    incentives: [incentive],
    allowList,
    validator,
    owner: accountAddress as Address
  };
  
  const options = {
    config: config
  };

  const onChainPayload = await core.prepareCreateBoostPayload(
    coreAddress,
    chainId,
    payload,
    options,
  );

  console.log("Final Boost Payload:", onChainPayload);

  const hashedPayload = core.prepareBoostPayload(onChainPayload);
  return hashedPayload;
};

const prepareBoostPayload = async () => {
  const payload = await createBoostWithTransparentBudget();
  console.log("Prepared Boost Payload:", payload);
  return payload;
};

prepareBoostPayload();
// createBoostWithManagedBudget();
