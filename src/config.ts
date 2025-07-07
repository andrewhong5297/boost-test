import { config as dotenvConfig } from "@dotenvx/dotenvx";
dotenvConfig();

import {
  createPublicClient,
  createWalletClient,
  Hex,
  http,
  publicActions,
  walletActions
} from "viem";
import { createConfig } from "@wagmi/core";
import { baseSepolia } from "viem/chains";
import { BoostCore, BoostRegistry } from "@boostxyz/sdk";
import { privateKeyToAccount } from "viem/accounts";
import assert from "assert";

// assert(process.env.ACCOUNT_PRIVATE_KEY, "ACCOUNT_PRIVATE_KEY is not set");

// export const account = privateKeyToAccount(process.env.ACCOUNT_PRIVATE_KEY as Hex);

export const baseSepoliaClient = createPublicClient({
  transport: http("https://84532.rpc.thirdweb.com/"),
  chain: baseSepolia
})
  .extend(publicActions)
  .extend(walletActions);

// export const walletClient = createWalletClient({
//   account,
//   chain: baseSepolia,
//   transport: http("https://84532.rpc.thirdweb.com/")
// });

export const config = createConfig({
  chains: [baseSepolia],
  client: () => {
    return baseSepoliaClient;
  }
});

export const core = new BoostCore({ config });
export const registry = new BoostRegistry({ config });
