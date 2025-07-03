import { baseSepolia } from "viem/chains";
import { account, baseSepoliaClient, core, walletClient } from "./config";
import { getOrCreateBudget, getTransparentBudget, transferToBudget } from "./utils/budget";
import { eventActionPayload } from "./utils/eventAction";
import { erc20Abi, parseEventLogs, parseUnits } from "viem";
import { boostCoreAbi, StrategyType } from "@boostxyz/sdk";

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

const createBoostWithTransparentBudget = async () => {
  console.log("Starting Boost Deployment...");

  const transparentBudget = await getTransparentBudget(baseSepolia.id);

  const action = core.EventAction(eventActionPayload);
  const incentive = core.ERC20Incentive(incentivePayload);

  // Allowlist is open to all addresses.
  const allowList = core.SimpleDenyList({
    owner: account.address,
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

  console.log("Approving reward...");
  const approvalHash = await walletClient.writeContract({
    address: rewardAddress,
    abi: erc20Abi,
    functionName: "approve",
    args: [transparentBudget.assertValidAddress(), rewardAmountWithFee]
  });

  const approvalReceipt = await baseSepoliaClient.waitForTransactionReceipt({
    hash: approvalHash
  });

  if (approvalReceipt.status === "reverted") {
    throw new Error("Approval failed");
  }
  console.log("Approval successful");

  console.log("Creating Boost...");
  // raw version returns the hash instead of the boost object
  const { hash } = await core.createBoostWithTransparentBudgetRaw(
    transparentBudget, // can use the transparent budgetaddress here instead of the object
    [{ amount: rewardAmountWithFee, asset: rewardAddress, target: account.address }],
    {
      action,
      incentives: [incentive],
      allowList,
      validator,
      owner: account.address
    }
  );

  const boostReceipt = await baseSepoliaClient.waitForTransactionReceipt({ hash });

  if (boostReceipt.status === "reverted") {
    throw new Error("Boost Deployment failed");
  }

  console.log("Boost Deployment successful");

  const logs = parseEventLogs({
    abi: boostCoreAbi,
    eventName: "BoostCreated",
    logs: boostReceipt.logs
  });

  const boostId = logs[0].args.boostId;

  console.log("Boost ID:", boostId);
  console.log(`https://sepolia.basescan.org/tx/${hash}`);
};

const createBoostWithManagedBudget = async () => {
  const managedBudget = await getOrCreateBudget(account);

  // make sure the budget has enough funds
  const balance = await managedBudget.available(
    "0x036cbd53842c5426634e7929541ec2318f3dcf7e"
  ); // USDC (Base Sepolia)

  if (balance < parseUnits("1.1", 6)) {
    await transferToBudget(
      managedBudget,
      "0x036cbd53842c5426634e7929541ec2318f3dcf7e",
      parseUnits("1.1", 6) - balance
    );
  }

  const action = core.EventAction(eventActionPayload);
  const incentive = core.ERC20Incentive(incentivePayload);

  // Allowlist is open to all addresses.
  const allowList = core.SimpleDenyList({
    owner: account.address,
    denied: []
  });
  const validator = core.LimitedSignerValidator({
    signers: [signers.staging], // use production signer for mainnet
    validatorCaller: core.assertValidAddress(), // address for BoostCore (https://github.com/boostxyz/boost-protocol/blob/c638b3f599c10e3f6cab7152849ddae612f2bd26/packages/evm/deploys/84532.json#L3)
    maxClaimCount: 1 // allows for only 1 claim per address
  });

  console.log("Creating Boost...");
  // raw version returns the hash instead of the boost object
  const { hash } = await core.createBoostRaw({
    budget: managedBudget,
    action,
    incentives: [incentive],
    allowList,
    validator,
    owner: account.address
  });

  const boostReceipt = await baseSepoliaClient.waitForTransactionReceipt({ hash });

  if (boostReceipt.status === "reverted") {
    throw new Error("Boost Deployment failed");
  }

  console.log("Boost Deployment successful");

  const logs = parseEventLogs({
    abi: boostCoreAbi,
    eventName: "BoostCreated",
    logs: boostReceipt.logs
  });

  const boostId = logs[0].args.boostId;

  console.log("Boost ID:", boostId);
  console.log(`https://sepolia.basescan.org/tx/${hash}`);
};

createBoostWithTransparentBudget();
// createBoostWithManagedBudget();
