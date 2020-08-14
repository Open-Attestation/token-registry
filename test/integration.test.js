const { expect } = require("chai").use(require("chai-as-promised"));
const Erc721 = artifacts.require("TradeTrustERC721");
const TitleEscrow = artifacts.require("TitleEscrow");

contract("TradeTrustErc721", (accounts) => {
  const shippingLine = accounts[0];
  const beneficiary1 = accounts[1];

  const merkleRoot = "0x624d0d7ae6f44d41d368d8280856dbaac6aa29fb3b35f45b80a7c1c90032eeb3";
  const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

  describe("TradeTrustERC721 Surrender Flow", () => {
    let tokenRegistryInstanceWithShippingLineWallet;
    let tokenRegistryAddress;

    beforeEach(async () => {
      tokenRegistryInstanceWithShippingLineWallet = await Erc721.new("foo", "bar", { from: shippingLine });
      tokenRegistryAddress = tokenRegistryInstanceWithShippingLineWallet.address;
    });

    it("should be able to surrender token", async () => {
      escrowInstance = await TitleEscrow.new(tokenRegistryAddress, beneficiary1, beneficiary1, ZERO_ADDRESS, {
        from: beneficiary1,
      });
      escrowInstanceAddress = escrowInstance.address;
      await tokenRegistryInstanceWithShippingLineWallet.safeMint(escrowInstanceAddress, merkleRoot);
      const currentOwner = await tokenRegistryInstanceWithShippingLineWallet.ownerOf(merkleRoot);
      expect(currentOwner).to.deep.equal(escrowInstanceAddress);
      await escrowInstance.transferTo(tokenRegistryAddress, {
        from: beneficiary1,
      });
      const nextOwner = await tokenRegistryInstanceWithShippingLineWallet.ownerOf(merkleRoot);
      expect(nextOwner).to.deep.equal(tokenRegistryAddress);
    });
  });
});
