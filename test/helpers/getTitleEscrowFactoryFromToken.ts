import { ethers } from "hardhat";
import { TitleEscrowFactory, TradeTrustERC721, TradeTrustERC721Mock } from "@tradetrust/contracts";

export const getTitleEscrowFactoryFromToken = async (
  tokenContract: TradeTrustERC721 | TradeTrustERC721Mock
): Promise<TitleEscrowFactory> => {
  const escrowFactoryAddr = await tokenContract.titleEscrowFactory();
  return (await ethers.getContractFactory("TitleEscrowFactory")).attach(escrowFactoryAddr) as TitleEscrowFactory;
};
