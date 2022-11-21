import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { TitleEscrowFactory, TradeTrustToken } from "@tradetrust/contracts";
import { deployEscrowFactoryFixture, deployTokenFixture } from "./index";

export type DeployTokenFixtureRunner = () => Promise<[TitleEscrowFactory, TradeTrustToken]>;

export const deployTokenFixtureRunnerCreator = async (
  tokenName: string,
  tokenInitials: string,
  deployer: SignerWithAddress,
  tokenContractName?: string
): Promise<[TitleEscrowFactory, TradeTrustToken]> => {
  const titleEscrowFactoryContractFixture = await deployEscrowFactoryFixture({ deployer });

  const registryContractFixture = await deployTokenFixture<TradeTrustToken>({
    tokenContractName: tokenContractName ?? "TradeTrustToken",
    tokenName,
    tokenInitials,
    escrowFactoryAddress: titleEscrowFactoryContractFixture.address,
    deployer,
  });

  return [titleEscrowFactoryContractFixture, registryContractFixture];
};
