import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers } from "hardhat";
import { TradeTrustTokenStandard } from "@tradetrust/contracts";

export const deployTradeTrustTokenStandardFixture = async ({ deployer }: { deployer: SignerWithAddress }) => {
  return (await (await ethers.getContractFactory("TradeTrustTokenStandard"))
    .connect(deployer)
    .deploy()) as TradeTrustTokenStandard;
};
