const { expect } = require("chai").use(require("chai-as-promised"));

describe("TradeTrustErc721", async () => {
  const accounts = await ethers.getSigners();
  const Erc721 = await ethers.getContractFactory("TradeTrustERC721Mock");
  const TitleEscrow = await ethers.getContractFactory("TitleEscrowCloneableMock");
  const shippingLine = accounts[0];
  const beneficiary1 = accounts[1];

  const merkleRoot = "0x624d0d7ae6f44d41d368d8280856dbaac6aa29fb3b35f45b80a7c1c90032eeb3";

  describe("TradeTrustERC721 Surrender Flow", () => {
    let tokenRegistryInstanceWithShippingLineWallet;
    let tokenRegistryAddress;

    beforeEach("Initialising fresh Token Registry for each test", async () => {
      tokenRegistryInstanceWithShippingLineWallet = await Erc721.connect(shippingLine).deploy("foo", "bar");
      tokenRegistryAddress = tokenRegistryInstanceWithShippingLineWallet.address;
    });

    it("should be able to surrender token", async () => {
      const titleEscrowTx = await tokenRegistryInstanceWithShippingLineWallet
        .connect(beneficiary1)
        .deployNewTitleEscrow(tokenRegistryAddress, beneficiary1.address, beneficiary1.address);
      const titleEscrowReceipt = await titleEscrowTx.wait();
      const event = titleEscrowReceipt.events.find((evt) => evt.event === "TitleEscrowDeployed");
      const escrowInstance = TitleEscrow.connect(beneficiary1).attach(event.args.escrowAddress);

      const escrowInstanceAddress = escrowInstance.address;
      await tokenRegistryInstanceWithShippingLineWallet["safeMintInternal(address,uint256)"](
        escrowInstanceAddress,
        merkleRoot
      );
      const currentOwner = await tokenRegistryInstanceWithShippingLineWallet.ownerOf(merkleRoot);
      expect(currentOwner).to.deep.equal(escrowInstanceAddress);
      await escrowInstance.surrender();

      const nextOwner = await tokenRegistryInstanceWithShippingLineWallet.ownerOf(merkleRoot);
      expect(nextOwner).to.deep.equal(tokenRegistryAddress);
    });
  });
});
