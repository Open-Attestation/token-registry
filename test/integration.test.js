const { expect } = require("chai").use(require("chai-as-promised"));

describe("TradeTrustErc721", async () => {
  const accounts = await ethers.getSigners();
  const Erc721 = await ethers.getContractFactory("TradeTrustERC721");
  const TitleEscrow = await ethers.getContractFactory("TitleEscrow");
  const shippingLine = accounts[0];
  const beneficiary1 = accounts[1];

  const merkleRoot = "0x624d0d7ae6f44d41d368d8280856dbaac6aa29fb3b35f45b80a7c1c90032eeb3";
  const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

  describe("TradeTrustERC721 Surrender Flow", () => {
    let tokenRegistryInstanceWithShippingLineWallet;
    let tokenRegistryAddress;

    beforeEach(async () => {
      tokenRegistryInstanceWithShippingLineWallet = await Erc721.connect(shippingLine).deploy("foo", "bar");
      tokenRegistryAddress = tokenRegistryInstanceWithShippingLineWallet.address;
    });

    it("should be able to surrender token", async () => {
      const escrowInstance = await TitleEscrow.connect(beneficiary1).deploy(
        tokenRegistryAddress,
        beneficiary1.address,
        beneficiary1.address,
        ZERO_ADDRESS
      );
      const escrowInstanceAddress = escrowInstance.address;
      await tokenRegistryInstanceWithShippingLineWallet["safeMint(address,uint256)"](escrowInstanceAddress, merkleRoot);
      const currentOwner = await tokenRegistryInstanceWithShippingLineWallet.ownerOf(merkleRoot);
      expect(currentOwner).to.deep.equal(escrowInstanceAddress);
      await escrowInstance.transferTo(tokenRegistryAddress);
      const nextOwner = await tokenRegistryInstanceWithShippingLineWallet.ownerOf(merkleRoot);
      expect(nextOwner).to.deep.equal(tokenRegistryAddress);
    });
  });
});
