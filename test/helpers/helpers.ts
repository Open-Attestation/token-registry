import { TitleEscrow, TitleEscrowFactory, TradeTrustERC721, TradeTrustERC721Mock } from "@tradetrust/contracts";
import { ethers } from "hardhat";

export const getTitleEscrowContract = async (
  tokenContract: TradeTrustERC721 | TradeTrustERC721Mock,
  tokenId: string | number
): Promise<TitleEscrow> => {
  const titleEscrowAddr = await tokenContract.ownerOf(tokenId);
  const titleEscrowFactory = await ethers.getContractFactory("TitleEscrow");
  return titleEscrowFactory.attach(titleEscrowAddr) as TitleEscrow;
};

export const getTitleEscrowFactoryFromToken = async (
  tokenContract: TradeTrustERC721 | TradeTrustERC721Mock
): Promise<TitleEscrowFactory> => {
  const escrowFactoryAddr = await tokenContract.titleEscrowFactory();
  return (await ethers.getContractFactory("TitleEscrowFactory")).attach(escrowFactoryAddr) as TitleEscrowFactory;
};

export const toAccessControlRevertMessage = (account: string, role: string): string => {
  return `AccessControl: account ${account.toLowerCase()} is missing role ${role}`;
};
