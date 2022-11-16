import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers } from "hardhat";
import { TradeTrustTokenImpl } from "@tradetrust/contracts";

export const deployTradeTrustTokenImplFixture = async ({ deployer }: { deployer: SignerWithAddress }) => {
  return (await (await ethers.getContractFactory("TradeTrustTokenImpl"))
    .connect(deployer)
    .deploy()) as TradeTrustTokenImpl;
};
