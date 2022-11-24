const ChainId = {
  Ethereum: 1,
  Goerli: 5,
  Sepolia: 11155111,
  Polygon: 137,
  PolygonMumbai: 80001,
};

export const contractAddress = {
  TitleEscrowFactory: {
    [ChainId.Ethereum]: undefined,
    [ChainId.Goerli]: "0x878A327daA390Bc602Ae259D3A374610356b6485",
    [ChainId.Sepolia]: "0x878A327daA390Bc602Ae259D3A374610356b6485",
    [ChainId.Polygon]: undefined,
    [ChainId.PolygonMumbai]: "0xBf6aF71F523aD7A0531536eB33972E6fCA5aaA53",
  },
  Deployer: {
    [ChainId.Ethereum]: undefined,
    [ChainId.Goerli]: "0x9eBC30E7506E6Ce36eAc5507FCF0121BaF7AeA57",
    [ChainId.Sepolia]: "0x9eBC30E7506E6Ce36eAc5507FCF0121BaF7AeA57",
    [ChainId.Polygon]: undefined,
    [ChainId.PolygonMumbai]: "0x9eBC30E7506E6Ce36eAc5507FCF0121BaF7AeA57",
  },
  TokenImplementation: {
    [ChainId.Ethereum]: undefined,
    [ChainId.Goerli]: "0xC78BA1a49663Ef8b920F36B036E91Ab40D8F26D6",
    [ChainId.Sepolia]: "0xC78BA1a49663Ef8b920F36B036E91Ab40D8F26D6",
    [ChainId.Polygon]: undefined,
    [ChainId.PolygonMumbai]: "0x83A533397eFE1d90baA26dEc7743626d7598656F",
  },
};
