/* eslint-disable import/no-extraneous-dependencies */
import logger from "consola";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { Signer } from "ethers";
import { TradeTrustERC721Base } from "@tradetrust/contracts";

type DeployTokenConstructorParameters = {
  name: string;
  symbol: string;
};

export const deployToken = async <TToken extends TradeTrustERC721Base>({
  constructorParams,
  contractName,
  hre,
  deployer,
}: {
  constructorParams: DeployTokenConstructorParameters;
  contractName: string;
  hre: HardhatRuntimeEnvironment;
  deployer: Signer;
}): Promise<TToken> => {
  const { ethers } = hre;

  try {
    const deployerAddress = await deployer.getAddress();
    logger.info(`Deploying ${contractName} contract with signer address:`, deployerAddress);
    const tokenFactory = await ethers.getContractFactory(contractName);
    const token = (await tokenFactory
      .connect(deployer)
      .deploy(constructorParams.name, constructorParams.symbol)) as TToken;

    const tx = token.deployTransaction;
    logger.success(`Sent to transaction ${tx.hash} on chain ${tx.chainId}`);

    await token.deployed();
    logger.success(`Success! Deployed ${contractName} at ${token.address}`);

    return token;
  } catch (err) {
    logger.error(err);
    throw err;
  }
};
