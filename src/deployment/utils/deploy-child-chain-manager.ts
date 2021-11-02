/* eslint-disable import/no-extraneous-dependencies */
import logger from "consola";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { Signer } from "ethers";
import { TradeTrustERC721ChildTunnel } from "@tradetrust/contracts";

type DeployChildChainManagerConstructorParams = {
  fxChild: string;
  childToken: string;
};

export const deployChildChainManager = async ({
  constructorParams,
  hre,
  deployer
}: {
  constructorParams: DeployChildChainManagerConstructorParams;
  hre: HardhatRuntimeEnvironment;
  deployer: Signer;
}) => {
  const { ethers } = hre;
  const { fxChild, childToken } = constructorParams;
  const contractName = "TradeTrustERC721ChildTunnel";
  try {
    const deployerAddress = await deployer.getAddress();
    const chainId = await deployer.getChainId();
    logger.info(
      `Deploying child chain manager contract ${contractName} with signer address ${deployerAddress} on chain ${chainId}`
    );
    const chainManagerFactory = await ethers.getContractFactory(contractName);
    const chainManager = (await chainManagerFactory
      .connect(deployer)
      .deploy(fxChild, childToken)) as TradeTrustERC721ChildTunnel;

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
