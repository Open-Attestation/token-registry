import { ethers } from "ethers";

export const AddressConstants = {
  Burn: "0x000000000000000000000000000000000000dEaD",
};

export const RoleConstants = {
  DefaultAdmin: ethers.constants.HashZero,
  MinterRole: ethers.utils.id("MINTER_ROLE"),
  AccepterRole: ethers.utils.id("ACCEPTER_ROLE"),
  RestorerRole: ethers.utils.id("RESTORER_ROLE"),
};
