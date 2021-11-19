import { HardhatRuntimeEnvironment } from "hardhat/types";
import { Signer } from "ethers";
import { TradeTrustERC721Base } from "@tradetrust/contracts";
import { StatusManager } from "./status-manager/status-manager";

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
  const status = StatusManager.create();

  try {
    const deployerAddress = await deployer.getAddress();
    status.add(`Deploying ${contractName} contract as deployer ${deployerAddress}...`);
    const tokenFactory = await ethers.getContractFactory(contractName);
    const token = (await tokenFactory
      .connect(deployer)
      .deploy(constructorParams.name, constructorParams.symbol)) as TToken;

    const tx = token.deployTransaction;
    status.update(`Pending transaction ${tx.hash}...`);

    await token.deployed();
    status.succeed(`Deployed ${contractName}  at ${token.address}`);

    return token;
  } catch (err) {
    status.fail(`Failed to deploy ${contractName}: ${err}`);
    throw err;
  }
};
