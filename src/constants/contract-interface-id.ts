import { computeInterfaceId } from "../utils/compute-interface-id";
import { contractInterfaces } from "./contract-interfaces";

export const contractInterfaceId = {
  ITradeTrustERC721: computeInterfaceId(contractInterfaces.ITradeTrustERC721),
  ITitleEscrow: computeInterfaceId(contractInterfaces.ITitleEscrow),
  ITitleEscrowFactory: computeInterfaceId(contractInterfaces.ITitleEscrowFactory),
  AccessControl: computeInterfaceId(contractInterfaces.AccessControl),
  ERC721: computeInterfaceId(contractInterfaces.ERC721),
};
