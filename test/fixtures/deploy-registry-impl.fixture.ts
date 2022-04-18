import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers } from "hardhat";
import { TradeTrustERC721Impl } from "@tradetrust/contracts";

export const deployTradeTrustERC721ImplFixture =
  ({ deployer }: { deployer: SignerWithAddress }) =>
  async () => {
    return (await (await ethers.getContractFactory("TradeTrustERC721Impl"))
      .connect(deployer)
      .deploy()) as TradeTrustERC721Impl;
  };
