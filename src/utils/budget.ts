import { core } from "../config";
import { TransparentBudget } from "@boostxyz/sdk";

/* TRANSPARENT BUDGET */
export async function getTransparentBudget(chainId: number) {
  // use the base address for the transparent budget
  const transparentBudgetAddress = TransparentBudget.bases[chainId];
  if (!transparentBudgetAddress) {
    throw new Error(`Transparent budget not found for chainId: ${chainId}`);
  }
  return core.TransparentBudget(transparentBudgetAddress);
}
