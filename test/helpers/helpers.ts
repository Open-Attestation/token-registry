import { TitleEscrow, TitleEscrowFactory, TradeTrustToken, TradeTrustTokenMock } from "@tradetrust/contracts";
import { ethers } from "hardhat";

export const getTitleEscrowContract = async (
  tokenContract: TradeTrustToken | TradeTrustTokenMock,
  tokenId: string | number
): Promise<TitleEscrow> => {
  const titleEscrowAddr = await tokenContract.ownerOf(tokenId);
  const titleEscrowFactory = await ethers.getContractFactory("TitleEscrow");
  return titleEscrowFactory.attach(titleEscrowAddr) as TitleEscrow;
};

export const getTitleEscrowFactoryFromToken = async (
  tokenContract: TradeTrustToken | TradeTrustTokenMock
): Promise<TitleEscrowFactory> => {
  const escrowFactoryAddr = await tokenContract.titleEscrowFactory();
  return (await ethers.getContractFactory("TitleEscrowFactory")).attach(escrowFactoryAddr) as TitleEscrowFactory;
};

export const toAccessControlRevertMessage = (account: string, role: string): string => {
  return `AccessControl: account ${account.toLowerCase()} is missing role ${role}`;
};

export const createDeployFixtureRunner = async <T extends any[number][]>(...fixtures: T) => {
  return Promise.all(fixtures);
};
