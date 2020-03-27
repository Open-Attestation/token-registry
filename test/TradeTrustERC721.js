const {expect} = require("chai").use(require("chai-as-promised"));

const ERC721 = artifacts.require("TradeTrustERC721");

contract("TradeTrustERC721", accounts => {
  const shippingLine = accounts[0];
  const owner1 = accounts[1];
  const owner2 = accounts[2];

  const merkleRoot = "0x624d0d7ae6f44d41d368d8280856dbaac6aa29fb3b35f45b80a7c1c90032eeb3";

  it("should work without a wallet for read operations", async () => {
    const tokenRegistryInstanceWithShippingLine = await ERC721.new("foo", "bar");
    await tokenRegistryInstanceWithShippingLine.mint(owner1, merkleRoot);
    const currentOwner = await tokenRegistryInstanceWithShippingLine.ownerOf(merkleRoot);
    expect(currentOwner).to.deep.equal(owner1);
  });

  it("should burn tokens that it receives", async () => {
    const tokenRegistryInstanceWithShippingLine = await ERC721.new("foo", "bar", {from: shippingLine});
    await tokenRegistryInstanceWithShippingLine.mint(owner1, merkleRoot);
    const currentOwner = await tokenRegistryInstanceWithShippingLine.ownerOf(merkleRoot);
    expect(currentOwner).to.deep.equal(owner1);

    await tokenRegistryInstanceWithShippingLine.safeTransferFrom(
      owner1,
      tokenRegistryInstanceWithShippingLine.address,
      merkleRoot,
      {from: owner1}
    );
    const nextOwnerQuery = tokenRegistryInstanceWithShippingLine.ownerOf(merkleRoot);
    await expect(nextOwnerQuery).to.be.rejectedWith(
      /VM Exception while processing transaction: revert ERC721: owner query for nonexistent token/
    );
  });

  it("should be able to mint", async () => {
    const tokenRegistryInstance = await ERC721.new("foo", "bar", {from: shippingLine});
    await tokenRegistryInstance.mint(owner1, merkleRoot);
    const currentOwner = await tokenRegistryInstance.ownerOf(merkleRoot);
    expect(currentOwner).to.deep.equal(owner1);
  });

  it("should be able to transfer", async () => {
    const tokenRegistryInstanceWithShippingLineWallet = await ERC721.new("foo", "bar", {from: shippingLine});
    await tokenRegistryInstanceWithShippingLineWallet.mint(owner1, merkleRoot);
    const currentOwner = await tokenRegistryInstanceWithShippingLineWallet.ownerOf(merkleRoot);
    expect(currentOwner).to.deep.equal(owner1);

    await tokenRegistryInstanceWithShippingLineWallet.safeTransferFrom(owner1, owner2, merkleRoot, {from: owner1});
    const nextOwner = await tokenRegistryInstanceWithShippingLineWallet.ownerOf(merkleRoot);
    expect(nextOwner).to.deep.equal(owner2);
  });

  it("non-owner should not be able to initiate a transfer", async () => {
    const tokenRegistryInstanceWithShippingLine = await ERC721.new("foo", "bar", {from: shippingLine});
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
});
