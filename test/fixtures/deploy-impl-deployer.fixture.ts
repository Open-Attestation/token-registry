import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers } from "hardhat";
import { ImplDeployer } from "@tradetrust/contracts";
import ERC1967Proxy from "./artifacts/ERC1967Proxy.json";

export const deployImplDeployerFixture =
  ({ deployer }: { deployer: SignerWithAddress }) =>
  async () => {
    const impl = (await (await ethers.getContractFactory("ImplDeployer")).connect(deployer).deploy()) as ImplDeployer;
    const proxyImpl = await (
      await ethers.getContractFactory(ERC1967Proxy.abi, ERC1967Proxy.data.bytecode.object, deployer)
    ).deploy(impl.address, "0x8129fc1c");

    return (await ethers.getContractFactory("ImplDeployer")).attach(proxyImpl.address) as ImplDeployer;
  };
