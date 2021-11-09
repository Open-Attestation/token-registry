import { ethers } from "ethers";

export const AddressConstants = {
  polygon: {
    testnet: {
      checkPointManager: "0x2890bA17EfE978480615e330ecB65333b880928e",
      fxRoot: "0x3d1d3E34f7fB6D26245E6640E1c50710eFFf15bA",
      fxChild: "0xCf73231F28B7331BBe3124B907840A94851f9f11",
      stateSender: "0x0000000000000000000000000000000000001001",
    },
    mainnet: {
      checkPointManager: "0x86E4Dc95c7FBdBf52e33D563BbDB00823894C287",
      fxRoot: "0xfe5e5D361b2ad62c541bAb87C45a0B9B018389a2",
      fxChild: "0x8397259c983751DAf40400790063935a11afa28a",
      stateSender: "0x0000000000000000000000000000000000001001",
    },
  },
  burn: "0x000000000000000000000000000000000000dEaD",
};

export const EventConstants = {
  messageSent: "0x8c5261668696ce22758910d05bab8f186d6eb247ceac2af2e82c7dc17669b036",
};

export const RoleConstants = {
  chainManager: ethers.utils.id("CHAIN_MANAGER_ROLE"),
  defaultAdmin: "0x0000000000000000000000000000000000000000000000000000000000000000",
};
