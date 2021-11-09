import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers } from "hardhat";
import { Contract } from "ethers";

export type TestUsers = {
  carrier: SignerWithAddress;
  beneficiary: SignerWithAddress;
  holder: SignerWithAddress;
  others: SignerWithAddress[];
};

export const deployTokenFixture =
  <T extends Contract>({
    tokenContractName,
    tokenName,
    tokenInitials
  }: {
    tokenContractName: string;
    tokenName: string;
    tokenInitials: string;
  }) =>
  async () => {
    const tradeTrustERC721MockFactory = await ethers.getContractFactory(tokenContractName);
    const [carrier, beneficiary, holder, ...others] = await ethers.getSigners();
    const users: TestUsers = { carrier, beneficiary, holder, others };
    const token = (await tradeTrustERC721MockFactory.connect(users.carrier).deploy(tokenName, tokenInitials)) as T;

    return { token, users };
  };
