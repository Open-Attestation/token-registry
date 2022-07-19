import { computeInterfaceId } from "../utils";
import { contractInterfaces } from "./contract-interfaces";

export const contractInterfaceId = {
  TradeTrustERC721: computeInterfaceId(contractInterfaces.TradeTrustERC721),
  TitleEscrow: computeInterfaceId(contractInterfaces.TitleEscrow),
  TitleEscrowSignable: computeInterfaceId(contractInterfaces.TitleEscrowSignable),
  TitleEscrowFactory: computeInterfaceId(contractInterfaces.TitleEscrowFactory),
  AccessControl: computeInterfaceId(contractInterfaces.AccessControl),
  ERC721: computeInterfaceId(contractInterfaces.ERC721),
};
