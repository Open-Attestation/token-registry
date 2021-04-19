const {expect} = require("chai").use(require("chai-as-promised"));
const ethers = require("ethers");

const TitleEscrow = artifacts.require("TitleEscrow");
const Erc721 = artifacts.require("TradeTrustERC721");
const CalculateSelector = artifacts.require("CalculateTradeTrustERC721Selector");

const assertDestroyBurntLog = (logs, tokenId) => {
  expect(logs.event).to.deep.equal("TokenBurnt");
  expect(ethers.BigNumber.from(logs.args[0].toString()).toHexString()).to.deep.equal(tokenId);
};

const assertTokenReceivedLog = (logs, operator, from, tokenId, data) => {
  expect(logs.event).to.deep.equal("TokenReceived");
  expect(logs.args[0]).to.deep.equal(operator);
  expect(logs.args[1]).to.deep.equal(from);
  expect(ethers.BigNumber.from(logs.args[2].toString()).toHexString()).to.deep.equal(tokenId);
  expect(logs.args[3]).to.deep.equal(data);
};

contract("TradeTrustErc721", accounts => {
  const shippingLine = accounts[0];
  const owner1 = accounts[1];
  const owner2 = accounts[2];
  const nonMinter = accounts[3];
  const holder1 = accounts[4];

  const merkleRoot = "0x624d0d7ae6f44d41d368d8280856dbaac6aa29fb3b35f45b80a7c1c90032eeb3";
  const merkleRoot1 = "0x624d0d7ae6f44d41d368d8280856dbaac6aa29fb3b35f45b80a7c1c90032eeb4";
  const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
  const BURN_ADDRESS = "0x000000000000000000000000000000000000dEaD";

  it("should have the correct ERC165 interface support", async () => {
    const tradeTrustERC721Instance = await Erc721.new("foo", "bar");
    const calculatorInstance = await CalculateSelector.new();
    const expectedInterface = await calculatorInstance.calculateSelector();
    const interfaceSupported = await tradeTrustERC721Instance.supportsInterface(expectedInterface);
    expect(interfaceSupported).to.be.equal(true, `Expected selector: ${expectedInterface}`);
  });

  it("should work without a wallet for read operations", async () => {
    const tokenRegistryInstanceWithShippingLine = await Erc721.new("foo", "bar");
    await tokenRegistryInstanceWithShippingLine.mint(owner1, merkleRoot);
    const currentOwner = await tokenRegistryInstanceWithShippingLine.ownerOf(merkleRoot);
    expect(currentOwner).to.deep.equal(owner1);
  });

  it("should not burn tokens that it receives", async () => {
    const tokenRegistryInstanceWithShippingLine = await Erc721.new("foo", "bar", {from: shippingLine});
    await tokenRegistryInstanceWithShippingLine.mint(owner1, merkleRoot);
    const currentOwner = await tokenRegistryInstanceWithShippingLine.ownerOf(merkleRoot);
    expect(currentOwner).to.deep.equal(owner1);

    await tokenRegistryInstanceWithShippingLine.safeTransferFrom(
      owner1,
      tokenRegistryInstanceWithShippingLine.address,
      merkleRoot,
      {from: owner1}
    );
    const nextOwner = await tokenRegistryInstanceWithShippingLine.ownerOf(merkleRoot);
    expect(nextOwner).to.deep.equal(tokenRegistryInstanceWithShippingLine.address);
  });

  it("should be able to mint", async () => {
    const tokenRegistryInstance = await Erc721.new("foo", "bar", {from: shippingLine});
    await tokenRegistryInstance.mint(owner1, merkleRoot);
    const currentOwner = await tokenRegistryInstance.ownerOf(merkleRoot);
    expect(currentOwner).to.deep.equal(owner1);
  });

  it("should be able to transfer", async () => {
    const tokenRegistryInstanceWithShippingLineWallet = await Erc721.new("foo", "bar", {from: shippingLine});
    await tokenRegistryInstanceWithShippingLineWallet.mint(owner1, merkleRoot);
    const currentOwner = await tokenRegistryInstanceWithShippingLineWallet.ownerOf(merkleRoot);
    expect(currentOwner).to.deep.equal(owner1);

    await tokenRegistryInstanceWithShippingLineWallet.safeTransferFrom(owner1, owner2, merkleRoot, {from: owner1});
    const nextOwner = await tokenRegistryInstanceWithShippingLineWallet.ownerOf(merkleRoot);
    expect(nextOwner).to.deep.equal(owner2);
  });

  it("non-owner should not be able to initiate a transfer", async () => {
    const tokenRegistryInstanceWithShippingLine = await Erc721.new("foo", "bar", {from: shippingLine});
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

  it("should emit TokenReceive event on safeMint", async () => {
    const tokenRegistryInstance = await Erc721.new("foo", "bar", {from: shippingLine});
    const tokenRegistryInstanceAddress = tokenRegistryInstance.address;
    const mintTx = await tokenRegistryInstance.safeMint(tokenRegistryInstanceAddress, merkleRoot);
    const receivedTokenLog = mintTx.logs.find(log => log.event === "TokenReceived");
    assertTokenReceivedLog(receivedTokenLog, shippingLine, ZERO_ADDRESS, merkleRoot, null);
  });

  describe("Surrendered TradeTrustERC721 Work Flow", () => {
    let tokenRegistryInstanceWithShippingLineWallet;
    let tokenRegistryAddress;

    beforeEach(async () => {
      // Starting test after the point of surrendering ERC721 Token
      tokenRegistryInstanceWithShippingLineWallet = await Erc721.new("foo", "bar", {from: shippingLine});
      tokenRegistryAddress = tokenRegistryInstanceWithShippingLineWallet.address;
      await tokenRegistryInstanceWithShippingLineWallet.safeMint(tokenRegistryAddress, merkleRoot);
    });

    it("should be able to destroy token", async () => {
      const destroyTx = await tokenRegistryInstanceWithShippingLineWallet.destroyToken(merkleRoot);
      const burntTokenLog = destroyTx.logs.find(log => log.event === "TokenBurnt");
      assertDestroyBurntLog(burntTokenLog, merkleRoot);
      const currentOwner = tokenRegistryInstanceWithShippingLineWallet.ownerOf(merkleRoot);
      await expect(currentOwner).to.become(BURN_ADDRESS);
    });

    it("non-minter should not be able to destroy token", async () => {
      const attemptDestroyToken = tokenRegistryInstanceWithShippingLineWallet.destroyToken(merkleRoot, {
        from: nonMinter
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
      const attemptSendToken = tokenRegistryInstanceWithShippingLineWallet.sendToken(owner1, merkleRoot, {
        from: nonMinter
      });
      await expect(attemptSendToken).to.be.rejectedWith(
        /VM Exception while processing transaction: revert MinterRole: caller does not have the Minter role/
      );
    });

    it("minter should not be able to send token not owned by registry", async () => {
      await tokenRegistryInstanceWithShippingLineWallet.safeMint(owner1, merkleRoot1);
      const attemptSendToken = tokenRegistryInstanceWithShippingLineWallet.sendToken(owner2, merkleRoot1);
      await expect(attemptSendToken).to.be.rejectedWith(
        /VM Exception while processing transaction: revert Cannot send token: Token not owned by token registry/
      );
    });

    it("should be able to send token to new title escrow", async () => {
      const currentTokenOwner = await tokenRegistryInstanceWithShippingLineWallet.ownerOf(merkleRoot);
      expect(currentTokenOwner).to.deep.equal(tokenRegistryAddress);

      await tokenRegistryInstanceWithShippingLineWallet.sendToNewTitleEscrow(owner1, holder1, merkleRoot, {from: shippingLine})
      const nextTokenOwner = await tokenRegistryInstanceWithShippingLineWallet.ownerOf(merkleRoot);
      expect(nextTokenOwner).to.not.deep.equal(currentTokenOwner);

      const newEscrowInstance = await TitleEscrow.at(nextTokenOwner);
      const escrowBeneficiary = await newEscrowInstance.beneficiary();
      const escrowHolder = await newEscrowInstance.holder();
      const escrowTokenRegistry = await newEscrowInstance.tokenRegistry();
      expect(escrowBeneficiary).to.be.equal(owner1);
      expect(escrowHolder).to.be.equal(holder1);
      expect(escrowTokenRegistry).to.be.equal(tokenRegistryAddress);
    });

    it("non-minter should not be able to send token to new title escrow", async () => {
      const attemptSendToken = tokenRegistryInstanceWithShippingLineWallet.sendToNewTitleEscrow(owner1, holder1, merkleRoot, {
        from: nonMinter
      });
      await expect(attemptSendToken).to.be.rejectedWith(
        /VM Exception while processing transaction: revert MinterRole: caller does not have the Minter role/
      );
    });
  });
});
