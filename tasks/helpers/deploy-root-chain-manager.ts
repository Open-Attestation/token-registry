import { HardhatRuntimeEnvironment } from "hardhat/types";
import { Signer } from "ethers";
import { TradeTrustERC721RootTunnel } from "@tradetrust/contracts";

type DeployRootChainManagerConstructorParams = {
  checkPointManager: string;
  fxRoot: string;
  rootToken: string;
};

export const deployRootChainManager = async ({
  constructorParams,
  hre,
  deployer,
}: {
  constructorParams: DeployRootChainManagerConstructorParams;
  hre: HardhatRuntimeEnvironment;
  deployer: Signer;
}) => {
  const { ethers } = hre;
  const { checkPointManager, fxRoot, rootToken } = constructorParams;
  const contractName = "TradeTrustERC721RootTunnel";

  const deployerAddress = await deployer.getAddress();
  console.log(`[Deployer] ${deployerAddress}`);

  const chainManagerFactory = await ethers.getContractFactory(contractName);
  const chainManager = (await chainManagerFactory
    .connect(deployer)
    .deploy(checkPointManager, fxRoot, rootToken)) as TradeTrustERC721RootTunnel;

  const tx = chainManager.deployTransaction;
  console.log(`[Transaction] Pending ${tx.hash}...`);

  await chainManager.deployed();
  console.log(`[Address] Deployed to ${chainManager.address}`);

  return chainManager;
};
