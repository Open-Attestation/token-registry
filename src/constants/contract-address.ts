import { defaultAddress } from "./default-address";

const ChainId = {
  Ethereum: 1,
  Ropsten: 3,
  Rinkeby: 4,
  Goerli: 5,
  Kovan: 42,
  Polygon: 137,
  PolygonMumbai: 80001,
};

export const contractAddress = {
  TitleEscrowFactory: {
    [ChainId.Ethereum]: defaultAddress.Zero,
    [ChainId.Rinkeby]: defaultAddress.Zero,
    [ChainId.Ropsten]: defaultAddress.Zero,
    [ChainId.Goerli]: defaultAddress.Zero,
    [ChainId.Kovan]: defaultAddress.Zero,
    [ChainId.Polygon]: defaultAddress.Zero,
    [ChainId.PolygonMumbai]: defaultAddress.Zero,
  },
  Deployer: {
    [ChainId.Ethereum]: defaultAddress.Zero,
    [ChainId.Rinkeby]: defaultAddress.Zero,
    [ChainId.Ropsten]: defaultAddress.Zero,
    [ChainId.Goerli]: defaultAddress.Zero,
    [ChainId.Kovan]: defaultAddress.Zero,
    [ChainId.Polygon]: defaultAddress.Zero,
    [ChainId.PolygonMumbai]: defaultAddress.Zero,
  },
  TokenImplementation: {
    [ChainId.Ethereum]: defaultAddress.Zero,
    [ChainId.Rinkeby]: defaultAddress.Zero,
    [ChainId.Ropsten]: defaultAddress.Zero,
    [ChainId.Goerli]: defaultAddress.Zero,
    [ChainId.Kovan]: defaultAddress.Zero,
    [ChainId.Polygon]: defaultAddress.Zero,
    [ChainId.PolygonMumbai]: defaultAddress.Zero,
  },
};
