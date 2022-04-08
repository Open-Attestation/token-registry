import { ethers } from "ethers";

export const AddressConstants = {
  burn: "0x000000000000000000000000000000000000dEaD",
};

export const RoleConstants = {
  defaultAdmin: ethers.constants.HashZero,
  minterRole: ethers.utils.id("MINTER_ROLE"),
  accepterRole: ethers.utils.id("ACCEPTER_ROLE"),
  restorerRole: ethers.utils.id("RESTORER_ROLE"),
};
