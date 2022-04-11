import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers } from "hardhat";
import { Contract, Signer } from "ethers";
import { TitleEscrowFactory } from "@tradetrust/contracts";

export const deployTokenFixture =
  <T extends Contract>({
    tokenContractName,
    tokenName,
    tokenInitials,
    deployer,
    escrowFactoryAddress = undefined,
  }: {
    tokenContractName: string;
    tokenName: string;
    tokenInitials: string;
    deployer: SignerWithAddress | Signer;
    escrowFactoryAddress?: string;
  }) =>
  async () => {
    if (!escrowFactoryAddress) {
      const escrowFactory = await ethers.getContractFactory("TitleEscrowFactory");
      const escrowFactoryContract = (await escrowFactory.connect(deployer).deploy()) as TitleEscrowFactory;
      // eslint-disable-next-line no-param-reassign
      escrowFactoryAddress = escrowFactoryContract.address;
    }
    const tradeTrustERC721Factory = await ethers.getContractFactory(tokenContractName);
    return (await tradeTrustERC721Factory
      .connect(deployer)
      .deploy(tokenName, tokenInitials, escrowFactoryAddress)) as T;
  };
