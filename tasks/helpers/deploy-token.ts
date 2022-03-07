import { HardhatRuntimeEnvironment } from "hardhat/types";
import { Signer } from "ethers";
import { TradeTrustERC721 } from "@tradetrust/contracts";

type DeployTokenConstructorParameters = {
  name: string;
  symbol: string;
  factoryAddress: string;
};

export const deployToken = async <TToken extends TradeTrustERC721>({
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

  const tokenFactory = await ethers.getContractFactory(contractName);
  const token = (await tokenFactory
    .connect(deployer)
    .deploy(constructorParams.name, constructorParams.symbol, constructorParams.factoryAddress)) as TToken;

  const tx = token.deployTransaction;
  console.log(`[Transaction - ${contractName}] Pending ${tx.hash}`);

  await token.deployed();
  console.log(`[Address - ${contractName}] Deployed to ${token.address}`);

  return token;
};
