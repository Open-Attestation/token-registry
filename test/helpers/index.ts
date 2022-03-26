import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

export type TestUsers = {
  carrier: SignerWithAddress;
  beneficiary: SignerWithAddress;
  holder: SignerWithAddress;
  others: SignerWithAddress[];
};

export const getTestUsers = async () => {
  const [carrier, beneficiary, holder, ...others] = await ethers.getSigners();
  const users: TestUsers = { carrier, beneficiary, holder, others };
  return users;
};

export const toAccessControlRevertMessage = (account: string, role: string): string => {
  return `AccessControl: account ${account.toLowerCase()} is missing role ${role}`;
};

export { impersonateAccount, stopImpersonatingAccount } from "./impersonateAccount";
export { getTitleEscrowContract } from "./getTitleEscrowContract";
export { getTitleEscrowFactoryFromToken } from "./getTitleEscrowFactoryFromToken";
