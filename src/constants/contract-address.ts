import { defaultAddress } from "./default-address";

const ChainId = {
  Ethereum: 1,
  Ropsten: 3,
  Rinkeby: 4,
  Goerli: 5,
  Sepolia: 11155111,
  Kovan: 42,
  Polygon: 137,
  PolygonMumbai: 80001,
};

export const contractAddress = {
  TitleEscrowFactory: {
    [ChainId.Ethereum]: defaultAddress.Zero,
    [ChainId.Rinkeby]: "0x878A327daA390Bc602Ae259D3A374610356b6485",
    [ChainId.Ropsten]: "0x878A327daA390Bc602Ae259D3A374610356b6485",
    [ChainId.Goerli]: defaultAddress.Zero,
    [ChainId.Sepolia]: "0x878A327daA390Bc602Ae259D3A374610356b6485",
    [ChainId.Kovan]: defaultAddress.Zero,
    [ChainId.Polygon]: defaultAddress.Zero,
    [ChainId.PolygonMumbai]: "0x878A327daA390Bc602Ae259D3A374610356b6485",
  },
  Deployer: {
    [ChainId.Ethereum]: defaultAddress.Zero,
    [ChainId.Rinkeby]: "0x021C1e895e39D53Cf87722211FF0a824d9D73c60",
    [ChainId.Ropsten]: "0x9eBC30E7506E6Ce36eAc5507FCF0121BaF7AeA57",
    [ChainId.Goerli]: defaultAddress.Zero,
    [ChainId.Sepolia]: "0x9eBC30E7506E6Ce36eAc5507FCF0121BaF7AeA57",
    [ChainId.Kovan]: defaultAddress.Zero,
    [ChainId.Polygon]: defaultAddress.Zero,
    [ChainId.PolygonMumbai]: "0x9eBC30E7506E6Ce36eAc5507FCF0121BaF7AeA57",
  },
  TokenImplementation: {
    [ChainId.Ethereum]: defaultAddress.Zero,
    [ChainId.Rinkeby]: "0x83A533397eFE1d90baA26dEc7743626d7598656F",
    [ChainId.Ropsten]: "0xE5C75026d5f636C89cc77583B6BCe7C99F512763",
    [ChainId.Goerli]: defaultAddress.Zero,
    [ChainId.Sepolia]: "0xE5C75026d5f636C89cc77583B6BCe7C99F512763",
    [ChainId.Kovan]: defaultAddress.Zero,
    [ChainId.Polygon]: defaultAddress.Zero,
    [ChainId.PolygonMumbai]: "0xE5C75026d5f636C89cc77583B6BCe7C99F512763",
  },
};
