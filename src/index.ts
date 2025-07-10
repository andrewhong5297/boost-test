import { base } from "viem/chains";
import { TransparentBudget } from "@boostxyz/sdk";
import { Address, parseUnits } from "viem";
import { StrategyType } from "@boostxyz/sdk";
import { prepareBoostPayload } from "@boostxyz/sdk";
import {
  ActionStep,
  SignatureType,
  ActionClaimant,
  FilterType,
  PrimitiveType
} from "@boostxyz/sdk";

import { config as dotenvConfig } from "@dotenvx/dotenvx";
dotenvConfig();

import {
  createPublicClient,
  http,
  publicActions,
  walletActions
} from "viem";
import { createConfig } from "@wagmi/core";
import { BoostCore, BoostRegistry } from "@boostxyz/sdk";

export const baseClient = createPublicClient({
  transport: http("https://base-sepolia.g.alchemy.com/v2/demo"),
  chain: base
})
  .extend(publicActions)
  .extend(walletActions);

const config = createConfig({
  chains: [base],
  client: () => {
    return baseClient;
  }
});

const core = new BoostCore({ config });
// const registry = new BoostRegistry({ config });

// Needed for validator. Use production signer for mainnet.
const signers = {
  production: "0xCBD0C302040bC803B4B2EDaF21Be0e49Deff5480" as const,
  staging: "0xd63167e9db11B108940b2E8236581F961f33f396" as const
};

const incentivePayload = {
  asset: "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913" as const, // USDC (Base)
  reward: parseUnits("0.1", 6),
  limit: 1n,
  strategy: StrategyType.POOL
};

/* TRANSPARENT BUDGET */
export async function getTransparentBudget(chainId: number) {
  // use the base address for the transparent budget
  const transparentBudgetAddress = TransparentBudget.bases[chainId];
  if (!transparentBudgetAddress) {
    throw new Error(`Transparent budget not found for chainId: ${chainId}`);
  }
  return core.TransparentBudget(transparentBudgetAddress);
}

const accountAddress = "0x4d6E6ef749D2C0E3ee89Fc788A00e28DB71aa6b5";

const createBoostWithTransparentBudget = async () => {
  console.log("Starting Boost Payload Preparation...");

  const transparentBudget = await getTransparentBudget(base.id);

  const crowdFundContract = "0x016dF4C52fB5C0E1cb3432ebd6071a90b1F6dCD9" as const;
  const donationSelector =
    "0x78143f48dfa1849efc52492df442294aeac95fa001fd9fdc45a8bb47aa9167f7" as const;
  
  const donationActionStep: ActionStep = {
    chainid: base.id,
    signature: donationSelector,
    signatureType: SignatureType.EVENT,
    targetContract: crowdFundContract,
    actionParameter: {
      filterType: FilterType.EQUAL,
      fieldType: PrimitiveType.UINT,
      fieldIndex: 0, // crowdfund id
      filterData: "0x0793" // needs to be in bytes, odd number of hex digits need to be leftpadded with 0. (❌0x793 ✅0x0793)
    }
  };
  
  const actionClaimant: ActionClaimant = {
    chainid: base.id,
    signature: donationSelector,
    signatureType: SignatureType.EVENT,
    targetContract: crowdFundContract,
    fieldIndex: 3 // donor
  };

  // When not using the SDK, you need to add all 4 action steps.
  // You can simply duplicate the first step and use it for all 4.
  const eventActionPayload = {
    actionClaimant,
    actionSteps: [
      donationActionStep,
      donationActionStep,
      donationActionStep,
      donationActionStep
    ]
  };

  const action = core.EventAction(eventActionPayload);
  const incentive = core.ERC20Incentive(incentivePayload);

  // Allowlist is open to all addresses.
  const allowList = core.SimpleDenyList({
    owner: accountAddress,
    denied: []
  });
  const validator = core.LimitedSignerValidator({
    signers: [signers.production], // use production signer for mainnet
    validatorCaller: core.assertValidAddress(), // address for BoostCore (https://github.com/boostxyz/boost-protocol/blob/c638b3f599c10e3f6cab7152849ddae612f2bd26/packages/evm/deploys/84532.json#L3)
    maxClaimCount: 1 // allows for only 1 claim per address
  });

  const rewardAddress = incentivePayload.asset;
  const rewardAmount = incentivePayload.reward;

  const feeAmount = (rewardAmount * BigInt(10)) / BigInt(100); // 10% fee
  const rewardAmountWithFee = rewardAmount + feeAmount;

  // TODO: must add an approval step before launching the boost
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
  
  const coreAddress = core.assertValidAddress();
  const chainId = base.id;
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

  const hashedPayload = prepareBoostPayload(onChainPayload);
  return hashedPayload;
};

const runPayload = async () => {
  const payload = await createBoostWithTransparentBudget();
  console.log("Prepared Boost Payload:", payload);
  return payload;
};

runPayload();
