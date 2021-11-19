import { HardhatRuntimeEnvironment } from "hardhat/types";
import { Signer } from "ethers";
import { TradeTrustERC721RootTunnel } from "@tradetrust/contracts";
import { StatusManager } from "./status-manager/status-manager";

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
  const status = StatusManager.create();

  try {
    const deployerAddress = await deployer.getAddress();
    status.add(`Deploying root chain manager contract ${contractName} as deployer ${deployerAddress}...`);
    const chainManagerFactory = await ethers.getContractFactory(contractName);
    const chainManager = (await chainManagerFactory
      .connect(deployer)
      .deploy(checkPointManager, fxRoot, rootToken)) as TradeTrustERC721RootTunnel;

    const tx = chainManager.deployTransaction;
    status.update(`Pending deployment transaction ${tx.hash}...`);

    await chainManager.deployed();
    status.succeed(`Deployed ${contractName} at ${chainManager.address}`);

    return chainManager;
  } catch (err) {
    status.fail(`Root chain manager deployment failed: ${err}`);
    throw err;
  }
};
