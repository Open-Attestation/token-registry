import { ethers } from "ethers";

export const roleHash = {
  DefaultAdmin: ethers.constants.HashZero,
  MinterRole: ethers.utils.id("MINTER_ROLE"),
  AccepterRole: ethers.utils.id("ACCEPTER_ROLE"),
  RestorerRole: ethers.utils.id("RESTORER_ROLE"),
};
