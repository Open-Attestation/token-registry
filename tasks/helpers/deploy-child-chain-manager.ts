/* eslint-disable import/no-extraneous-dependencies */
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
  deployer,
}: {
  constructorParams: DeployChildChainManagerConstructorParams;
  hre: HardhatRuntimeEnvironment;
  deployer: Signer;
}) => {
  const { ethers } = hre;
  const { fxChild, childToken } = constructorParams;
  const contractName = "TradeTrustERC721ChildTunnel";

  const deployerAddress = await deployer.getAddress();
  console.log(`[Deployer] ${deployerAddress}`);

  const chainManagerFactory = await ethers.getContractFactory(contractName);
  const chainManager = (await chainManagerFactory
    .connect(deployer)
    .deploy(fxChild, childToken)) as TradeTrustERC721ChildTunnel;

  const tx = chainManager.deployTransaction;
  console.log(`[Transaction] Pending ${tx.hash}...`);

  await chainManager.deployed();
  console.log(`[Address] Deployed to ${chainManager.address}`);

  return chainManager;
};
