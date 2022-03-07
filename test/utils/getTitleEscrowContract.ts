import { ethers } from "hardhat";
import { TitleEscrowCloneable, TradeTrustERC721, TradeTrustERC721Mock } from "@tradetrust/contracts";

export const getTitleEscrowContract = async (
  tokenContract: TradeTrustERC721 | TradeTrustERC721Mock,
  tokenId: string | number
): Promise<TitleEscrowCloneable> => {
  const titleEscrowAddr = await tokenContract.ownerOf(tokenId);
  const titleEscrowFactory = await ethers.getContractFactory("TitleEscrowCloneable");
  return titleEscrowFactory.attach(titleEscrowAddr) as TitleEscrowCloneable;
};
