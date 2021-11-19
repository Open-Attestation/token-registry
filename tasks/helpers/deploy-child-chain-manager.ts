/* eslint-disable import/no-extraneous-dependencies */
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { Signer } from "ethers";
import { TradeTrustERC721ChildTunnel } from "@tradetrust/contracts";
import { StatusManager } from "../utils/status-manager/status-manager";

type DeployChildChainManagerConstructorParams = {
  fxChild: string;
  childToken: string;
};

export const deployChildChainManager = async ({
  constructorParams,
  hre,
  deployer,
}: {
  constructorParams: DeployChildChainManagerConstructorParams;
  hre: HardhatRuntimeEnvironment;
  deployer: Signer;
}) => {
  const { ethers } = hre;
  const { fxChild, childToken } = constructorParams;
  const contractName = "TradeTrustERC721ChildTunnel";
  const status = StatusManager.create();

  try {
    const deployerAddress = await deployer.getAddress();
    status.add(`Deploying child chain manager contract ${contractName} as deployer ${deployerAddress}...`);

    const chainManagerFactory = await ethers.getContractFactory(contractName);
    const chainManager = (await chainManagerFactory
      .connect(deployer)
      .deploy(fxChild, childToken)) as TradeTrustERC721ChildTunnel;

    const tx = chainManager.deployTransaction;
    status.update(`Pending deployment transaction ${tx.hash}...`);

    await chainManager.deployed();
    status.succeed(`Deployed ${contractName} at ${chainManager.address}`);

    return chainManager;
  } catch (err) {
    status.fail(`Child chain manager deployment failed: ${err}`);
    throw err;
  }
};
