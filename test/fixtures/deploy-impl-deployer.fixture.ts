import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers } from "hardhat";
import { ImplDeployer } from "@tradetrust/contracts";

export const deployImplDeployerFixture =
  ({ deployer }: { deployer: SignerWithAddress }) =>
  async () => {
    return (await (await ethers.getContractFactory("ImplDeployer")).connect(deployer).deploy()) as ImplDeployer;
  };
