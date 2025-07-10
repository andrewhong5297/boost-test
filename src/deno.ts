//Do not delete any comments in this file, and read them carefully. This typescript code is hosted on Deno, which is why all imports must use the npm: prefix.
//For most crypto code logic, you should use viem which can be imported with "npm:viem". Viem docs can be found at https://viem.sh
import { initializeHerdCodeServer } from "npm:@herd-labs/trails-code-framework";
import { z } from "npm:zod";

import {
createPublicClient,
http,
parseUnits,
Address
} from "npm:viem";

import {
TransparentBudget,
BoostCore,
prepareBoostPayload,
StrategyType,
SignatureType,
ActionStep,
ActionClaimant,
FilterType,
PrimitiveType
} from "npm:@boostxyz/sdk";

import { base } from "npm:viem/chains";

// Define your input and output schemas using zod.
const inputSchema = z.object({
accountAddress: z.string(), // Address to own the boost
tokenAddress: z.string(), // ERC20 token address used for reward
rewardAmount: z.string(), // Decimal number string, e.g. "0.1"
crowdfundId: z.string(), // Hex string without leading 0x, e.g. "0793"
});

const outputSchema = z.object({
boostPayload: z.string(), // This is a bytes value, returned as string
});

async function handler(input: z.infer<typeof inputSchema>): Promise<z.infer<typeof outputSchema>> {
const client = createPublicClient({
transport: http("https://base-sepolia.g.alchemy.com/v2/demo"),
chain: base,
});

const core = new BoostCore({
config: {
chains: [base],
client: () => client,
},
});

const chainId = base.id;
const coreAddress = core.assertValidAddress();

// Load Transparent Budget contract
const transparentBudgetAddress = TransparentBudget.bases[chainId];
if (!transparentBudgetAddress) {
throw new Error(`Transparent budget not found for chainId: ${chainId}`);
}
const transparentBudget = core.TransparentBudget(transparentBudgetAddress);

const donationSelector =
"0x78143f48dfa1849efc52492df442294aeac95fa001fd9fdc45a8bb47aa9167f7" as const;
const targetContract =
"0x016dF4C52fB5C0E1cb3432ebd6071a90b1F6dCD9" as const;

const paddedCrowdfundId = input.crowdfundId.length % 2 === 0
? `0x${input.crowdfundId}`
: `0x0${input.crowdfundId}`;

const donationActionStep: ActionStep = {
chainid: chainId,
signature: donationSelector,
signatureType: SignatureType.EVENT,
targetContract,
actionParameter: {
filterType: FilterType.EQUAL,
fieldType: PrimitiveType.UINT,
fieldIndex: 0,
filterData: paddedCrowdfundId,
},
};

const actionClaimant: ActionClaimant = {
chainid: chainId,
signature: donationSelector,
signatureType: SignatureType.EVENT,
targetContract,
fieldIndex: 3,
};

const action = core.EventAction({
actionClaimant,
actionSteps: [donationActionStep, donationActionStep, donationActionStep, donationActionStep],
});

const incentive = core.ERC20Incentive({
asset: input.tokenAddress as Address,
reward: parseUnits(input.rewardAmount, 6),
limit: 1n,
strategy: StrategyType.POOL,
});

const allowList = core.SimpleDenyList({
owner: input.accountAddress as Address,
denied: [],
});

const validator = core.LimitedSignerValidator({
signers: ["0xCBD0C302040bC803B4B2EDaF21Be0e49Deff5480"],
validatorCaller: coreAddress,
maxClaimCount: 1,
});

const payload = {
budget: transparentBudget,
action,
incentives: [incentive],
allowList,
validator,
owner: input.accountAddress as Address,
};

const onChainPayload = await core.prepareCreateBoostPayload(
coreAddress,
chainId,
payload,
{ config: { chains: [base], client: () => client } }
);

const boostPayload = prepareBoostPayload(onChainPayload);
return { boostPayload };
}

export default initializeHerdCodeServer(inputSchema, outputSchema, handler);