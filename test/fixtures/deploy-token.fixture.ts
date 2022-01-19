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
    tokenInitials,
    users,
  }: {
    tokenContractName: string;
    tokenName: string;
    tokenInitials: string;
    users: TestUsers;
  }) =>
  async () => {
    const tradeTrustERC721MockFactory = await ethers.getContractFactory(tokenContractName);
    return (await tradeTrustERC721MockFactory.connect(users.carrier).deploy(tokenName, tokenInitials)) as T;
  };
