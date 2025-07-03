import {
  ActionStep,
  SignatureType,
  ActionClaimant,
  FilterType,
  PrimitiveType
} from "@boostxyz/sdk";
import { base } from "viem/chains";

const crowdFundContract = "0x016dF4C52fB5C0E1cb3432ebd6071a90b1F6dCD9" as const;
const donationSelector = "0x78143f48dfa1849efc52492df442294aeac95fa001fd9fdc45a8bb47aa9167f7" as const;

const donationActionStep: ActionStep = {
  chainid: base.id,
  signature: donationSelector,
  signatureType: SignatureType.EVENT,
  targetContract: crowdFundContract,
  actionParameter: {
    filterType: FilterType.EQUAL,
    fieldType: PrimitiveType.UINT,
    fieldIndex: 0, // crowdfund id
    filterData: '0x0793',
  },
};

const actionClaimant: ActionClaimant = {
  chainid: base.id,
  signature: donationSelector,
  signatureType: SignatureType.EVENT,
  targetContract: crowdFundContract,
  fieldIndex: 3, // donor
};

export const eventActionPayload = {
  actionClaimant,
  actionSteps: [donationActionStep],
};
