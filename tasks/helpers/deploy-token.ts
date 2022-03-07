import { HardhatRuntimeEnvironment } from "hardhat/types";
import { Signer } from "ethers";
import { TradeTrustERC721 } from "@tradetrust/contracts";

type DeployTokenConstructorParameters = {
  name: string;
  symbol: string;
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

  const deployerAddress = await deployer.getAddress();
  console.log(`[Deployer] ${deployerAddress}`);

  const tokenFactory = await ethers.getContractFactory(contractName);
  const token = (await tokenFactory
    .connect(deployer)
    .deploy(constructorParams.name, constructorParams.symbol)) as TToken;

  const tx = token.deployTransaction;
  console.log(`[Transaction] Pending ${tx.hash}...`);

  await token.deployed();
  console.log(`[Address] Deployed to ${token.address}`);

  return token;
};
