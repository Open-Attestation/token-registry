const ChainId = {
  Ethereum: 1,
  Goerli: 5,
  Sepolia: 11155111,
  Polygon: 137,
  PolygonMumbai: 80001,
  XDC : 50,
  XDCApothem : 51
};

export const contractAddress = {
  TitleEscrowFactory: {
    [ChainId.Ethereum]: "0xA38CC56c9291B9C1f52F862dd92326d352e710b8",
    [ChainId.Goerli]: "0x5aA71Cc9559bC5e54E9504a81496d9F8454721F5",
    [ChainId.Sepolia]: "0x5aA71Cc9559bC5e54E9504a81496d9F8454721F5",
    [ChainId.Polygon]: "0xA38CC56c9291B9C1f52F862dd92326d352e710b8",
    [ChainId.PolygonMumbai]: "0x5aA71Cc9559bC5e54E9504a81496d9F8454721F5",
    [ChainId.XDC]: "0xce28778bE6cF32ef3Ccbc09910258DF592F3b6F1",
    [ChainId.XDCApothem]: "0xce28778bE6cF32ef3Ccbc09910258DF592F3b6F1"
  },
  Deployer: {
    [ChainId.Ethereum]: "0x92470d0Fc33Cbf2f04B39696733806a15eD7eef3",
    [ChainId.Goerli]: "0x9eBC30E7506E6Ce36eAc5507FCF0121BaF7AeA57",
    [ChainId.Sepolia]: "0x9eBC30E7506E6Ce36eAc5507FCF0121BaF7AeA57",
    [ChainId.Polygon]: "0x92470d0Fc33Cbf2f04B39696733806a15eD7eef3",
    [ChainId.PolygonMumbai]: "0x9eBC30E7506E6Ce36eAc5507FCF0121BaF7AeA57",
    [ChainId.XDC]: "0x09C4183aC99B432c4BA78d354F8d21257bd15aaa",
    [ChainId.XDCApothem]: "0x09C4183aC99B432c4BA78d354F8d21257bd15aaa"
  },
  TokenImplementation: {
    [ChainId.Ethereum]: "0xd3F09dD800525Ecf7e452C3c167C7c716632d016",
    [ChainId.Goerli]: "0xC78BA1a49663Ef8b920F36B036E91Ab40D8F26D6",
    [ChainId.Sepolia]: "0xC78BA1a49663Ef8b920F36B036E91Ab40D8F26D6",
    [ChainId.Polygon]: "0xd3F09dD800525Ecf7e452C3c167C7c716632d016",
    [ChainId.PolygonMumbai]: "0x83A533397eFE1d90baA26dEc7743626d7598656F",
    [ChainId.XDC]: "0x5228b10FF132C1BFEa8bB08C10E8766f7938f289",
    [ChainId.XDCApothem]: "0x5228b10FF132C1BFEa8bB08C10E8766f7938f289"
  },
};
