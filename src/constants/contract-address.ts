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
    [ChainId.Ethereum]: undefined,
    [ChainId.Rinkeby]: "0x626E5A7043270C99C37795C1D0F85F28b3220b1C",
    [ChainId.Ropsten]: "0x021C1e895e39D53Cf87722211FF0a824d9D73c60",
    [ChainId.Goerli]: "0x878A327daA390Bc602Ae259D3A374610356b6485",
    [ChainId.Sepolia]: "0x878A327daA390Bc602Ae259D3A374610356b6485",
    [ChainId.Kovan]: undefined,
    [ChainId.Polygon]: undefined,
    [ChainId.PolygonMumbai]: "0xBf6aF71F523aD7A0531536eB33972E6fCA5aaA53",
  },
  Deployer: {
    [ChainId.Ethereum]: undefined,
    [ChainId.Rinkeby]: "0x021C1e895e39D53Cf87722211FF0a824d9D73c60",
    [ChainId.Ropsten]: "0x9eBC30E7506E6Ce36eAc5507FCF0121BaF7AeA57",
    [ChainId.Goerli]: "0x9eBC30E7506E6Ce36eAc5507FCF0121BaF7AeA57",
    [ChainId.Sepolia]: "0x9eBC30E7506E6Ce36eAc5507FCF0121BaF7AeA57",
    [ChainId.Kovan]: undefined,
    [ChainId.Polygon]: undefined,
    [ChainId.PolygonMumbai]: "0x9eBC30E7506E6Ce36eAc5507FCF0121BaF7AeA57",
  },
  TokenImplementation: {
    [ChainId.Ethereum]: undefined,
    [ChainId.Rinkeby]: "0x83A533397eFE1d90baA26dEc7743626d7598656F",
    [ChainId.Ropsten]: "0xE5C75026d5f636C89cc77583B6BCe7C99F512763",
    [ChainId.Goerli]: "0xE5C75026d5f636C89cc77583B6BCe7C99F512763",
    [ChainId.Sepolia]: "0xE5C75026d5f636C89cc77583B6BCe7C99F512763",
    [ChainId.Kovan]: undefined,
    [ChainId.Polygon]: undefined,
    [ChainId.PolygonMumbai]: "0xE5C75026d5f636C89cc77583B6BCe7C99F512763",
  },
};
