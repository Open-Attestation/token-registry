import { computeInterfaceId } from "../utils";
import { contractInterfaces } from "./contract-interfaces";

export const contractInterfaceId = {
  TradeTrustTokenMintable: computeInterfaceId(contractInterfaces.TradeTrustTokenMintable),
  TradeTrustTokenBurnable: computeInterfaceId(contractInterfaces.TradeTrustTokenBurnable),
  TradeTrustTokenRestorable: computeInterfaceId(contractInterfaces.TradeTrustTokenRestorable),
  TitleEscrow: computeInterfaceId(contractInterfaces.TitleEscrow),
  TitleEscrowSignable: computeInterfaceId(contractInterfaces.TitleEscrowSignable),
  TitleEscrowFactory: computeInterfaceId(contractInterfaces.TitleEscrowFactory),
  AccessControl: computeInterfaceId(contractInterfaces.AccessControl),
  SBT: computeInterfaceId(contractInterfaces.SBT),
};
