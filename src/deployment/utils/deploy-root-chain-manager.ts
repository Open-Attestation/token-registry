/* eslint-disable import/no-extraneous-dependencies */
import logger from "consola";
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
  try {
    const deployerAddress = await deployer.getAddress();
    const chainId = await deployer.getChainId();
    logger.info(
      `Deploying root chain manager contract ${contractName} with signer address ${deployerAddress} on chain ${chainId}`
    );
    const chainManagerFactory = await ethers.getContractFactory(contractName);
    const chainManager = (await chainManagerFactory
      .connect(deployer)
      .deploy(checkPointManager, fxRoot, rootToken)) as TradeTrustERC721RootTunnel;

    const tx = chainManager.deployTransaction;
    logger.success(`Sent out transaction ${tx.hash}`);

    await chainManager.deployed();
    logger.success(`Success! Deployed ${contractName} at ${chainManager.address}`);

    return chainManager;
  } catch (err) {
    logger.error(err);
    throw err;
  }
};
