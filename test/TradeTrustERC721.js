const { expect } = require("chai").use(require("chai-as-promised"));
const Erc721 = artifacts.require("TradeTrustERC721");
const TitleEscrow = artifacts.require("TitleEscrow");

contract("TradeTrustErc721", (accounts) => {
  const shippingLine = accounts[0];
  const owner1 = accounts[1];
  const owner2 = accounts[2];
  const nonMinter = accounts[3];

  const merkleRoot = "0x624d0d7ae6f44d41d368d8280856dbaac6aa29fb3b35f45b80a7c1c90032eeb3";
  const merkleRoot1 = "0x624d0d7ae6f44d41d368d8280856dbaac6aa29fb3b35f45b80a7c1c90032eeb4";

  it("should work without a wallet for read operations", async () => {
    const tokenRegistryInstanceWithShippingLine = await Erc721.new("foo", "bar");
    await tokenRegistryInstanceWithShippingLine.mint(owner1, merkleRoot);
    const currentOwner = await tokenRegistryInstanceWithShippingLine.ownerOf(merkleRoot);
    expect(currentOwner).to.deep.equal(owner1);
  });

  it("should not burn tokens that it receives", async () => {
    const tokenRegistryInstanceWithShippingLine = await Erc721.new("foo", "bar", { from: shippingLine });
    await tokenRegistryInstanceWithShippingLine.mint(owner1, merkleRoot);
    const currentOwner = await tokenRegistryInstanceWithShippingLine.ownerOf(merkleRoot);
    expect(currentOwner).to.deep.equal(owner1);

    await tokenRegistryInstanceWithShippingLine.safeTransferFrom(
      owner1,
      tokenRegistryInstanceWithShippingLine.address,
      merkleRoot,
      { from: owner1 }
    );
    const nextOwner = await tokenRegistryInstanceWithShippingLine.ownerOf(merkleRoot);
    expect(nextOwner).to.deep.equal(tokenRegistryInstanceWithShippingLine.address);
  });

  it("should be able to mint", async () => {
    const tokenRegistryInstance = await Erc721.new("foo", "bar", { from: shippingLine });
    await tokenRegistryInstance.mint(owner1, merkleRoot);
    const currentOwner = await tokenRegistryInstance.ownerOf(merkleRoot);
    expect(currentOwner).to.deep.equal(owner1);
  });

  it("should be able to transfer", async () => {
    const tokenRegistryInstanceWithShippingLineWallet = await Erc721.new("foo", "bar", { from: shippingLine });
    await tokenRegistryInstanceWithShippingLineWallet.mint(owner1, merkleRoot);
    const currentOwner = await tokenRegistryInstanceWithShippingLineWallet.ownerOf(merkleRoot);
    expect(currentOwner).to.deep.equal(owner1);

    await tokenRegistryInstanceWithShippingLineWallet.safeTransferFrom(owner1, owner2, merkleRoot, { from: owner1 });
    const nextOwner = await tokenRegistryInstanceWithShippingLineWallet.ownerOf(merkleRoot);
    expect(nextOwner).to.deep.equal(owner2);
  });

  it("non-owner should not be able to initiate a transfer", async () => {
    const tokenRegistryInstanceWithShippingLine = await Erc721.new("foo", "bar", { from: shippingLine });
    await tokenRegistryInstanceWithShippingLine.mint(owner1, merkleRoot);
    const currentOwner = await tokenRegistryInstanceWithShippingLine.ownerOf(merkleRoot);
    expect(currentOwner).to.deep.equal(owner1);

    const transferQuery = tokenRegistryInstanceWithShippingLine.safeTransferFrom(
      owner1,
      tokenRegistryInstanceWithShippingLine.address,
      merkleRoot
    );
    await expect(transferQuery).to.be.rejectedWith(
      /VM Exception while processing transaction: revert ERC721: transfer caller is not owner nor approved/
    );
  });

  describe("Surrendered TradeTrustERC721 Work Flow", () => {
    let tokenRegistryInstanceWithShippingLineWallet;
    let tokenRegistryAddress;

    beforeEach("", async () => {
      // Starting test after the point of surrendering ERC721 Token
      tokenRegistryInstanceWithShippingLineWallet = await Erc721.new("foo", "bar", { from: shippingLine });
      tokenRegistryAddress = tokenRegistryInstanceWithShippingLineWallet.address;
      await tokenRegistryInstanceWithShippingLineWallet.safeMint(tokenRegistryAddress, merkleRoot);
    });

    it("should be able to destroy token", async () => {
      await tokenRegistryInstanceWithShippingLineWallet.destroyToken(merkleRoot);
      const currentOwner = tokenRegistryInstanceWithShippingLineWallet.ownerOf(merkleRoot);
      await expect(currentOwner).to.be.rejectedWith(
        /VM Exception while processing transaction: revert ERC721: owner query for nonexistent token/
      );
    });

    it("non-minter should not be able to destroy token", async () => {
      const attemptDestroyToken = tokenRegistryInstanceWithShippingLineWallet.destroyToken(merkleRoot, {
        from: nonMinter,
      });
      await expect(attemptDestroyToken).to.be.rejectedWith(
        /VM Exception while processing transaction: revert MinterRole: caller does not have the Minter role/
      );
    });

    it("token cannot be destroyed if not owned by registry", async () => {
      await tokenRegistryInstanceWithShippingLineWallet.safeMint(owner1, merkleRoot1);
      const attemptDestroyToken = tokenRegistryInstanceWithShippingLineWallet.destroyToken(merkleRoot1);
      await expect(attemptDestroyToken).to.be.rejectedWith(
        /VM Exception while processing transaction: revert Cannot destroy token: Token not owned by token registry/
      );
    });

    it("should be able to send token owned by registry", async () => {
      await tokenRegistryInstanceWithShippingLineWallet.sendToken(owner1, merkleRoot);
      const currentOwner = await tokenRegistryInstanceWithShippingLineWallet.ownerOf(merkleRoot);
      expect(currentOwner).to.deep.equal(owner1);
    });

    it("non-minter should not be able to send token", async () => {
      const attemptSendToken = tokenRegistryInstanceWithShippingLineWallet.sendToken(
        owner1,
        merkleRoot,
        { from: nonMinter }
      );
      await expect(attemptSendToken).to.be.rejectedWith(
        /VM Exception while processing transaction: revert MinterRole: caller does not have the Minter role/
      );
    });

    it("minter should not be able to send token not owned by registry", async () => {
      await tokenRegistryInstanceWithShippingLineWallet.safeMint(owner1, merkleRoot1);
      const attemptSendToken = tokenRegistryInstanceWithShippingLineWallet.sendToken(
        owner2,
        merkleRoot1
      );
      await expect(attemptSendToken).to.be.rejectedWith(
        /VM Exception while processing transaction: revert Cannot send token: Token not owned by token registry/
      );
    });
  });
});
