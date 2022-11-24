import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers } from "hardhat";
import { TDocDeployer } from "@tradetrust/contracts";
import ERC1967Proxy from "./artifacts/ERC1967Proxy.json";

export const deployTDocDeployerFixture = async ({ deployer }: { deployer: SignerWithAddress }) => {
  const impl = (await (await ethers.getContractFactory("TDocDeployer")).connect(deployer).deploy()) as TDocDeployer;
  const proxyImpl = await (
    await ethers.getContractFactory(ERC1967Proxy.abi, ERC1967Proxy.data.bytecode.object, deployer)
  ).deploy(impl.address, "0x8129fc1c");

  return (await ethers.getContractFactory("TDocDeployer")).attach(proxyImpl.address) as TDocDeployer;
};
