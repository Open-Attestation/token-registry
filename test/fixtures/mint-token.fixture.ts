import { TitleEscrow, TradeTrustToken, TradeTrustTokenMock } from "@tradetrust/contracts";
import { TitleEscrowCreatedEvent } from "@tradetrust/contracts/contracts/TitleEscrowFactory";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers } from "hardhat";
import { getEventFromReceipt } from "../../src/utils";

export const mintTokenFixture = async ({
  token,
  beneficiary,
  holder,
  tokenId,
}: {
  token: TradeTrustToken | TradeTrustTokenMock;
  beneficiary: SignerWithAddress;
  holder: SignerWithAddress;
  tokenId: string;
}) => {
  const tx = await token.mint(beneficiary.address, holder.address, tokenId);
  const receipt = await tx.wait();

  const titleEscrowFactoryInterface = (await ethers.getContractFactory("TitleEscrowFactory")).interface;
  const event = getEventFromReceipt<TitleEscrowCreatedEvent>(
    receipt,
    titleEscrowFactoryInterface.getEventTopic("TitleEscrowCreated"),
    titleEscrowFactoryInterface
  );

  const escrowAddress = event.args.titleEscrow;

  const titleEscrowFactory = await ethers.getContractFactory("TitleEscrow");
  const titleEscrow = titleEscrowFactory.attach(escrowAddress) as TitleEscrow;

  return { tokenId, titleEscrow, event };
};
