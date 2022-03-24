import { ethers } from "ethers";
import { ChainId } from ".";

export const AddressConstants = {
  Zero: ethers.constants.AddressZero,
  Burn: "0x000000000000000000000000000000000000dEaD",
};

export const RoleConstants = {
  DefaultAdmin: ethers.constants.HashZero,
  MinterRole: ethers.utils.id("MINTER_ROLE"),
  AccepterRole: ethers.utils.id("ACCEPTER_ROLE"),
  RestorerRole: ethers.utils.id("RESTORER_ROLE"),
};

export const ContractAddress = {
  TitleEscrowFactory: {
    [ChainId.Ethereum]: AddressConstants.Zero,
    [ChainId.Rinkeby]: AddressConstants.Zero,
    [ChainId.Ropsten]: AddressConstants.Zero,
    [ChainId.Goerli]: AddressConstants.Zero,
    [ChainId.Kovan]: AddressConstants.Zero,
    [ChainId.Polygon]: AddressConstants.Zero,
    [ChainId.PolygonMumbai]: AddressConstants.Zero,
  },
  Deployer: {
    [ChainId.Ethereum]: AddressConstants.Zero,
    [ChainId.Rinkeby]: AddressConstants.Zero,
    [ChainId.Ropsten]: AddressConstants.Zero,
    [ChainId.Goerli]: AddressConstants.Zero,
    [ChainId.Kovan]: AddressConstants.Zero,
    [ChainId.Polygon]: AddressConstants.Zero,
    [ChainId.PolygonMumbai]: AddressConstants.Zero,
  },
};
