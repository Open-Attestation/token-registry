import { TitleEscrow, TradeTrustERC721, TradeTrustERC721Mock } from "@tradetrust/contracts";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers } from "hardhat";
import { getEventFromTransaction } from "../../src/utils";

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
    const tx = await token.mint(beneficiary.address, holder.address, tokenId);

    const eventAbi = (await ethers.getContractFactory("TitleEscrowFactory")).interface
      .getEvent("TitleEscrowCreated")
      .format(ethers.utils.FormatTypes.full);
    const event = await getEventFromTransaction(tx, [eventAbi], "TitleEscrowCreated");
    const escrowAddress = event.titleEscrow as string;

    const titleEscrowFactory = await ethers.getContractFactory("TitleEscrow");
    const titleEscrow = titleEscrowFactory.attach(escrowAddress) as TitleEscrow;

    return { tokenId, titleEscrow, event };
  };
