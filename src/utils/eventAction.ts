import {
  ActionStep,
  SignatureType,
  ActionClaimant,
  FilterType,
  PrimitiveType
} from "@boostxyz/sdk";
import { base } from "viem/chains";

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
export const eventActionPayload = {
  actionClaimant,
  actionSteps: [
    donationActionStep,
    donationActionStep,
    donationActionStep,
    donationActionStep
  ]
};
