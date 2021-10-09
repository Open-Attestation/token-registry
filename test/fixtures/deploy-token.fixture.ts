import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { TradeTrustERC721 } from "@tradetrust/contracts";
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
    const tradeTrustERC721Factory = await ethers.getContractFactory("TradeTrustERC721");
    const [carrier, beneficiary, holder, ...others] = await ethers.getSigners();
    const users: TestUsers = { carrier, beneficiary, holder, others };
    const token = (await tradeTrustERC721Factory
      .connect(users.carrier)
      .deploy(tokenName, tokenInitials)) as TradeTrustERC721;

    return { token, users };
  };
