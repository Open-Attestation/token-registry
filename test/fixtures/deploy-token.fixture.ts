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
}) => {
  if (!escrowFactoryAddress) {
    const escrowFactory = await ethers.getContractFactory("TitleEscrowFactory");
    const escrowFactoryContract = (await escrowFactory.connect(deployer).deploy()) as TitleEscrowFactory;
    // eslint-disable-next-line no-param-reassign
    escrowFactoryAddress = escrowFactoryContract.address;
  }

  if (useMock) {
    return (await (
      await smock.mock(tokenContractName, deployer)
    ).deploy(tokenName, tokenInitials, escrowFactoryAddress)) as unknown as T;
  }

  const tradeTrustTokenFactory = await ethers.getContractFactory(tokenContractName);
  return (await tradeTrustTokenFactory.connect(deployer).deploy(tokenName, tokenInitials, escrowFactoryAddress)) as T;
};
