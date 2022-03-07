import { ethers } from "hardhat";
import { TitleEscrow, TradeTrustERC721, TradeTrustERC721Mock } from "@tradetrust/contracts";

export const getTitleEscrowContract = async (
  tokenContract: TradeTrustERC721 | TradeTrustERC721Mock,
  tokenId: string | number
): Promise<TitleEscrow> => {
  const titleEscrowAddr = await tokenContract.ownerOf(tokenId);
  const titleEscrowFactory = await ethers.getContractFactory("TitleEscrow");
  return titleEscrowFactory.attach(titleEscrowAddr) as TitleEscrow;
};
