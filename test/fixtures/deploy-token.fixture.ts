import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers } from "hardhat";
import { Contract, Signer } from "ethers";
import { TitleEscrowFactory } from "@tradetrust/contracts";
import { smock } from "@defi-wonderland/smock";

export const deployTokenFixture = async <T extends Contract | unknown>({
  tokenContractName,
  tokenName,
  tokenInitials,
  deployer,
  escrowFactoryAddress = undefined,
  useMock = false,
}: {
  tokenContractName: string;
  tokenName: string;
  tokenInitials: string;
  deployer: SignerWithAddress | Signer;
  escrowFactoryAddress?: string;
  useMock?: boolean;
}): Promise<[TitleEscrowFactory, T]> => {
  const escrowFactory = await ethers.getContractFactory("TitleEscrowFactory");
  let titleEscrowFactoryContract: TitleEscrowFactory;
  if (!escrowFactoryAddress) {
    titleEscrowFactoryContract = (await escrowFactory.connect(deployer).deploy()) as TitleEscrowFactory;
    // eslint-disable-next-line no-param-reassign
    escrowFactoryAddress = titleEscrowFactoryContract.address;
  } else {
    titleEscrowFactoryContract = escrowFactory.attach(escrowFactoryAddress) as TitleEscrowFactory;
  }

  const tradeTrustTokenFactory = await ethers.getContractFactory(tokenContractName);
  let tradeTrustTokenContract: T;

  if (useMock) {
    tradeTrustTokenContract = (await (
      await smock.mock(tokenContractName, deployer)
    ).deploy(tokenName, tokenInitials, escrowFactoryAddress)) as unknown as T;
  } else {
    tradeTrustTokenContract = (await tradeTrustTokenFactory
      .connect(deployer)
      .deploy(tokenName, tokenInitials, escrowFactoryAddress)) as T;
  }

  return [titleEscrowFactoryContract, tradeTrustTokenContract];
};
