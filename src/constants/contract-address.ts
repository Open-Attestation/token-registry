const ChainId = {
  Ethereum: 1,
  Sepolia: 11155111,
  Polygon: 137,
  PolygonMumbai: 80001,
  PolygonAmoy: 80002,
  XDC: 50,
  XDCApothem: 51,
};

export const contractAddress = {
  TitleEscrowFactory: {
    [ChainId.Ethereum]: "0xA38CC56c9291B9C1f52F862dd92326d352e710b8",
    [ChainId.Sepolia]: "0x5aA71Cc9559bC5e54E9504a81496d9F8454721F5",
    [ChainId.Polygon]: "0x5B5F8d94782be18E22420f3276D5ef5a1bc65C53",
    [ChainId.PolygonAmoy]: "0x0B0E0DA7Db10dB96f673dBe3796f7A509c68B472",
    [ChainId.XDC]: "0x50BfCc1b699fD2308B978B7a6A26e3C3Bbad16DC",
    [ChainId.XDCApothem]: "0xce28778bE6cF32ef3Ccbc09910258DF592F3b6F1",
  },
  Deployer: {
    [ChainId.Ethereum]: "0x92470d0Fc33Cbf2f04B39696733806a15eD7eef3",
    [ChainId.Sepolia]: "0x9eBC30E7506E6Ce36eAc5507FCF0121BaF7AeA57",
    [ChainId.Polygon]: "0x92470d0Fc33Cbf2f04B39696733806a15eD7eef3",
    [ChainId.PolygonAmoy]: "0x7a46A1eA20E260987a28b192efbfBb266C097C42",
  },
  TokenImplementation: {
    [ChainId.Ethereum]: "0xd3F09dD800525Ecf7e452C3c167C7c716632d016",
    [ChainId.Sepolia]: "0xC78BA1a49663Ef8b920F36B036E91Ab40D8F26D6",
    [ChainId.Polygon]: "0xd3F09dD800525Ecf7e452C3c167C7c716632d016",
    [ChainId.PolygonAmoy]: "0x718355AE8c625C3A84F734fCC1D59aAd1700f819",
  },
};
