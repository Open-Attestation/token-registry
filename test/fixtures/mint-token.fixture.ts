import { TitleEscrow, TradeTrustERC721, TradeTrustERC721Mock } from "@tradetrust/contracts";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers } from "hardhat";
import { getEventFromTransaction } from "../utils";

export const mintTokenFixture =
  ({
    token,
    beneficiary,
    holder,
    tokenId,
  }: {
    token: TradeTrustERC721 | TradeTrustERC721Mock;
    beneficiary: SignerWithAddress;
    holder: SignerWithAddress;
    tokenId: string;
  }) =>
  async () => {
    const tx = await token.mintTitle(beneficiary.address, holder.address, tokenId);

    const abi = [
      "event TitleEscrowCreated (address indexed titleEscrow, address indexed tokenRegistry, uint256 indexed tokenId, address beneficiary, address holder)",
    ];
    const event = await getEventFromTransaction(tx, abi, "TitleEscrowCreated");
    const escrowAddress = event.titleEscrow as string;

    const titleEscrowFactory = await ethers.getContractFactory("TitleEscrow");
    const titleEscrow = titleEscrowFactory.attach(escrowAddress) as TitleEscrow;

    return { tokenId, titleEscrow, event };
  };
