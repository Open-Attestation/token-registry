import { TitleEscrowCloneable, TradeTrustERC721 } from "@tradetrust/contracts";
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
    token: TradeTrustERC721;
    beneficiary: SignerWithAddress;
    holder: SignerWithAddress;
    tokenId: string;
  }) =>
  async () => {
    const tx = await token.mintTitle(beneficiary.address, holder.address, tokenId);

    const abi = [
      "event TitleEscrowDeployed (address indexed escrowAddress, address indexed tokenRegistry, address beneficiary, address holder)",
    ];
    const event = await getEventFromTransaction(tx, abi, "TitleEscrowDeployed");
    const escrowAddress = event.escrowAddress as string;

    const titleEscrowFactory = await ethers.getContractFactory("TitleEscrowCloneable");
    const titleEscrow = titleEscrowFactory.attach(escrowAddress) as TitleEscrowCloneable;

    return { tokenId, titleEscrow, event };
  };
