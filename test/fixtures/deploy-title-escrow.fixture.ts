import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers } from "hardhat";
import { TitleEscrow } from "@tradetrust/contracts";

export const deployTitleEscrowFixture =
  ({ deployer }: { deployer: SignerWithAddress }) =>
  async () => {
    const titleEscrowFactory = await ethers.getContractFactory("TitleEscrow");
    return (await titleEscrowFactory.connect(deployer).deploy()) as TitleEscrow;
  };
