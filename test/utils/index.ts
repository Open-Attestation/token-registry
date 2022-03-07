import { ethers } from "hardhat";
import { TestUsers } from "../fixtures/deploy-token.fixture";

export const getTestUsers = async () => {
  const [carrier, beneficiary, holder, ...others] = await ethers.getSigners();
  const users: TestUsers = { carrier, beneficiary, holder, others };
  return users;
};

export const toAccessControlRevertMessage = (account: string, role: string): string => {
  return `AccessControl: account ${account.toLowerCase()} is missing role ${role}`;
};

export { impersonateAccount, stopImpersonatingAccount } from "./impersonateAccount";
export { getEventFromTransaction } from "./getEventFromTransaction";
export { getTitleEscrowContract } from "./getTitleEscrowContract";
