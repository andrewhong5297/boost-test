import { Account } from "viem";
import { core, registry, account } from "../config";
import { Roles, TransparentBudget } from "@boostxyz/sdk";

/* MANAGED BUDGET */ // Not used in this example
export const deployManagedBudget = async () => {
  // initialize a new budget contract
  const budget = await registry.initialize(
    `Budget_${Math.random().toString(36).substring(2, 12)}`, // unique identifier for the budget
    core.ManagedBudget({
      owner: account.address,
      authorized: [account.address, core.assertValidAddress()],
      roles: [Roles.ADMIN, Roles.MANAGER]
    })
  );

  return budget;
};

export async function getManagedBudget(account: Account) {
  const [, identifier] = await registry.getClones(account.address);

  if (identifier) {
    const { instance } = await registry.getClone(identifier);
    const budget = core.ManagedBudget(instance);
    return budget;
  }

  return null;
}

export async function getOrCreateBudget(account: Account) {
  const existingBudget = await getManagedBudget(account);

  if (existingBudget) {
    return existingBudget;
  }

  const newBudget = await deployManagedBudget();
  return newBudget;
}

/* TRANSPARENT BUDGET */
export async function getTransparentBudget(chainId: number) {
  // use the base address for the transparent budget
  const transparentBudgetAddress = TransparentBudget.bases[chainId];
  if (!transparentBudgetAddress) {
    throw new Error(`Transparent budget not found for chainId: ${chainId}`);
  }
  return core.TransparentBudget(transparentBudgetAddress);
}
