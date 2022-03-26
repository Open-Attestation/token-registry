import { ethers } from "ethers";
import { TitleEscrow, TitleEscrowFactory } from "@tradetrust/contracts";
import { computeInterfaceId } from "./computeInterfaceId";
import { ContractInterfaces } from "../common";

export const isSupportedTitleEscrowFactory = async (
  factoryAddress: string,
  provider?: ethers.providers.Provider
): Promise<boolean> => {
  const titleEscrowFactoryContract = new ethers.Contract(
    factoryAddress,
    ["function implementation() view returns (address)"],
    provider ?? ethers.getDefaultProvider()
  ) as TitleEscrowFactory;
  const implAddr = await titleEscrowFactoryContract.implementation();

  const implContract = new ethers.Contract(
    implAddr,
    ["function supportsInterface(bytes4 interfaceId) view returns (bool)"],
    provider ?? ethers.getDefaultProvider()
  ) as TitleEscrow;
  return implContract.supportsInterface(computeInterfaceId(ContractInterfaces.ITitleEscrow));
};
