import { Account } from "viem";
import { core, registry, account } from "../config";
import { Roles, TransparentBudget } from "@boostxyz/sdk";

export const deployManagedBudget = async () => {
  // initialize a new budget contract
  const budget = await registry.initialize(
    "Boost_Budget_Test",
    core.ManagedBudget({
      owner: account.address,
      authorized: [account.address, core.assertValidAddress()],
      roles: [Roles.ADMIN, Roles.MANAGER],
    })
  );

  return budget;
};

export async function getBudget(account: Account) {
  const [,identifier] = await registry.getClones(account.address);

  if (identifier) {
    const { instance } = await registry.getClone(identifier);
    const budget = core.ManagedBudget(instance);
    return budget;
  }

  return null;
}

export async function getOrCreateBudget(account: Account) {
  const existingBudget = await getBudget(account);
  
  if (existingBudget) {
    return existingBudget;
  }
  
  const newBudget = await deployManagedBudget();
  return newBudget;
}

export async function getTransparentBudget(chainId: number) {
    const transparentBudgetAddress = TransparentBudget.bases[chainId];
    if (!transparentBudgetAddress) {
      throw new Error(`Transparent budget not found for chainId: ${chainId}`);
    }
    return core.TransparentBudget(transparentBudgetAddress); 
}
