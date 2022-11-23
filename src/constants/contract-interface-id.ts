import { computeInterfaceId } from "../utils";
import { contractInterfaces } from "./contract-interfaces";

export const contractInterfaceId = {
  TradeTrustToken: computeInterfaceId(contractInterfaces.TradeTrustToken),
  TitleEscrow: computeInterfaceId(contractInterfaces.TitleEscrow),
  TitleEscrowSignable: computeInterfaceId(contractInterfaces.TitleEscrowSignable),
  TitleEscrowFactory: computeInterfaceId(contractInterfaces.TitleEscrowFactory),
  AccessControl: computeInterfaceId(contractInterfaces.AccessControl),
  ERC721: computeInterfaceId(contractInterfaces.SBT),
};
