import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { TradeTrustERC721Mock } from "@tradetrust/contracts";
import { ethers } from "hardhat";

export type TestUsers = {
  carrier: SignerWithAddress;
  beneficiary: SignerWithAddress;
  holder: SignerWithAddress;
  others: SignerWithAddress[];
};

export const deployTokenFixture =
  ({ tokenName, tokenInitials }: { tokenName: string; tokenInitials: string }) =>
  async () => {
    const tradeTrustERC721MockFactory = await ethers.getContractFactory("TradeTrustERC721Mock");
    const [carrier, beneficiary, holder, ...others] = await ethers.getSigners();
    const users: TestUsers = { carrier, beneficiary, holder, others };
    const token = (await tradeTrustERC721MockFactory
      .connect(users.carrier)
      .deploy(tokenName, tokenInitials)) as TradeTrustERC721Mock;

    return { token, users };
  };
