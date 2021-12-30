const { expect } = require("chai").use(require("chai-as-promised"));
const chai = require("chai");
const { solidity } = require("ethereum-waffle");

chai.use(solidity);

const assertTokenReceivedLog = (logs, operator, from, tokenId) => {
  expect(logs.event).to.deep.equal("TokenReceived");
  expect(logs.args[0]).to.deep.equal(operator);
  expect(logs.args[1]).to.deep.equal(from);
  expect(ethers.BigNumber.from(logs.args[2].toString()).toHexString()).to.deep.equal(tokenId);
};

describe("TradeTrustErc721", async () => {
  let carrier1;
  let owner1;
  let owner2;
  let nonMinter;
  let holder1;
  let TitleEscrow;
  let Erc721;

  let beneficiary;
  let holder;

  before("Initialising contract factories and accounts for TradeTrustErc721 tests", async () => {
    [carrier1, owner1, owner2, nonMinter, holder1] = await ethers.getSigners();
    TitleEscrow = await ethers.getContractFactory("TitleEscrowCloneable");
    Erc721 = await ethers.getContractFactory("TradeTrustERC721");
  });

  const merkleRoot = "0x624d0d7ae6f44d41d368d8280856dbaac6aa29fb3b35f45b80a7c1c90032eeb3";
  const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

  beforeEach(async () => {
    beneficiary = owner1;
    holder = holder1;
  });

  it("should have the correct ERC165 interface support", async () => {
    // should support
    // 1. ITradeTrustERC721 (so the extra stuff we tacked on to ERC721 to handle surrender)
    // 2. ITitleEscrowCreator (to act as a TE factory)
    // 3. IERC721 (basic so that someone expecting a token registry knows how to work with it)

    const tradeTrustERC721Instance = await Erc721.connect(carrier1).deploy("foo", "bar");
    const ITradeTrustERC721InterfaceId = "0x14ac11d9";
    const IERC721InterfaceId = "0x80ac58cd";
    const ITitleEscrowCreatorInterfaceId = "0xfcd7c1df";
    expect(await tradeTrustERC721Instance.supportsInterface(ITradeTrustERC721InterfaceId)).to.be.true;
    expect(await tradeTrustERC721Instance.supportsInterface(IERC721InterfaceId)).to.be.true;
    expect(await tradeTrustERC721Instance.supportsInterface(ITitleEscrowCreatorInterfaceId)).to.be.true;
  });

  it("should work without a wallet for read operations", async () => {
    const tokenRegistryInstanceWithShippingLine = await Erc721.connect(carrier1).deploy("foo", "bar");
    await tokenRegistryInstanceWithShippingLine.mint(owner1.address, merkleRoot);
    const currentOwner = await tokenRegistryInstanceWithShippingLine.ownerOf(merkleRoot);
    expect(currentOwner).to.deep.equal(owner1.address);
  });

  it("should not burn tokens that it receives", async () => {
    const tokenRegistryInstanceWithShippingLine = await Erc721.connect(carrier1).deploy("foo", "bar");
    await tokenRegistryInstanceWithShippingLine.mint(owner1.address, merkleRoot);
    const currentOwner = await tokenRegistryInstanceWithShippingLine.ownerOf(merkleRoot);
    expect(currentOwner).to.deep.equal(owner1.address);

    await tokenRegistryInstanceWithShippingLine
      .connect(owner1)
      ["safeTransferFrom(address,address,uint256)"](
        owner1.address,
        tokenRegistryInstanceWithShippingLine.address,
        merkleRoot
      );
    const nextOwner = await tokenRegistryInstanceWithShippingLine.ownerOf(merkleRoot);
    expect(nextOwner).to.deep.equal(tokenRegistryInstanceWithShippingLine.address);
  });

  it("should be able to mint", async () => {
    const tokenRegistryInstance = await Erc721.connect(carrier1).deploy("foo", "bar");
    await tokenRegistryInstance.mint(owner1.address, merkleRoot);
    const currentOwner = await tokenRegistryInstance.ownerOf(merkleRoot);
    expect(currentOwner).to.deep.equal(owner1.address);
  });

  it("should be able to transfer", async () => {
    const tokenRegistryInstanceWithShippingLineWallet = await Erc721.connect(carrier1).deploy("foo", "bar");
    await tokenRegistryInstanceWithShippingLineWallet.mint(owner1.address, merkleRoot);
    const currentOwner = await tokenRegistryInstanceWithShippingLineWallet.ownerOf(merkleRoot);
    expect(currentOwner).to.deep.equal(owner1.address);

    await tokenRegistryInstanceWithShippingLineWallet
      .connect(owner1)
      ["safeTransferFrom(address,address,uint256)"](owner1.address, owner2.address, merkleRoot);
    const nextOwner = await tokenRegistryInstanceWithShippingLineWallet.ownerOf(merkleRoot);
    expect(nextOwner).to.deep.equal(owner2.address);
  });

  it("non-owner should not be able to initiate a transfer", async () => {
    const tokenRegistryInstanceWithShippingLine = await Erc721.connect(carrier1).deploy("foo", "bar");
    await tokenRegistryInstanceWithShippingLine.mint(owner1.address, merkleRoot);
    const currentOwner = await tokenRegistryInstanceWithShippingLine.ownerOf(merkleRoot);
    expect(currentOwner).to.deep.equal(owner1.address);

    const transferQuery = tokenRegistryInstanceWithShippingLine["safeTransferFrom(address,address,uint256)"](
      owner1.address,
      tokenRegistryInstanceWithShippingLine.address,
      merkleRoot
    );
    await expect(transferQuery).to.be.revertedWith("transfer caller is not owner nor approved");
  });

  it("should emit TokenReceive event on safeMint", async () => {
    const tokenRegistryInstance = await Erc721.connect(carrier1).deploy("foo", "bar");
    const tokenRegistryInstanceAddress = tokenRegistryInstance.address;
    const mintTx = await (
      await tokenRegistryInstance["safeMint(address,uint256)"](tokenRegistryInstanceAddress, merkleRoot)
    ).wait();
    const receivedTokenLog = mintTx.events.find((log) => log.event === "TokenReceived");
    assertTokenReceivedLog(receivedTokenLog, carrier1.address, ZERO_ADDRESS, merkleRoot, null);
  });

  describe("Minting new title escrows", () => {
    let tokenRegistryInstanceWithShippingLineWallet;

    beforeEach(async () => {
      beneficiary = owner1;
      holder = holder1;

      // Starting test after the point of surrendering ERC721 Token
      tokenRegistryInstanceWithShippingLineWallet = await Erc721.connect(carrier1).deploy("foo", "bar");
    });

    it("should mint a new title by a minter", async () => {
      const tx = await tokenRegistryInstanceWithShippingLineWallet.mintTitle(
        beneficiary.address,
        holder.address,
        merkleRoot
      );
      const receipt = await tx.wait();
      const event = receipt.events.find((evt) => evt.event === "TitleEscrowDeployed");
      const titleEscrowAddr = event.args.escrowAddress;

      const currentOwner = await tokenRegistryInstanceWithShippingLineWallet.ownerOf(merkleRoot);
      expect(currentOwner).to.deep.equal(titleEscrowAddr);
    });

    it("should mint with the correct details in title escrow", async () => {
      const tx = await tokenRegistryInstanceWithShippingLineWallet.mintTitle(
        beneficiary.address,
        holder.address,
        merkleRoot
      );
      const receipt = await tx.wait();
      const event = receipt.events.find((evt) => evt.event === "TitleEscrowDeployed");
      const titleEscrowAddr = event.args.escrowAddress;

      const newEscrowInstance = await TitleEscrow.attach(titleEscrowAddr);
      const escrowBeneficiary = await newEscrowInstance.beneficiary();
      const escrowHolder = await newEscrowInstance.holder();
      const escrowTokenRegistry = await newEscrowInstance.tokenRegistry();

      expect(escrowBeneficiary).to.be.equal(beneficiary.address);
      expect(escrowHolder).to.be.equal(holder.address);
      expect(escrowTokenRegistry).to.be.equal(tokenRegistryInstanceWithShippingLineWallet.address);
    });

    it("should revert if the title already exists", async () => {
      await (
        await tokenRegistryInstanceWithShippingLineWallet.mintTitle(beneficiary.address, holder.address, merkleRoot)
      ).wait();

      const tx = tokenRegistryInstanceWithShippingLineWallet.mintTitle(beneficiary.address, holder.address, merkleRoot);

      await expect(tx).to.be.revertedWith("TokenRegistry: Token already exists");
    });

    it("should revert when a non-minter attempts to mint a new title", async () => {
      const tx = tokenRegistryInstanceWithShippingLineWallet
        .connect(nonMinter)
        .mintTitle(beneficiary.address, holder.address, merkleRoot);

      await expect(tx).to.be.revertedWith("MinterRole: caller does not have the Minter role");
    });
  });

  describe("Surrendering TradeTrustERC721 Work Flow", () => {
    let tokenRegistryInstanceWithShippingLineWallet;
    let previousTitleEscrowAddress;

    beforeEach("Initialising fresh Token Registry and minting token for each test", async () => {
      beneficiary = owner1;

      // Starting test after the point of surrendering ERC721 Token
      tokenRegistryInstanceWithShippingLineWallet = await Erc721.connect(carrier1).deploy("foo", "bar");
      const tx = await tokenRegistryInstanceWithShippingLineWallet.mintTitle(
        beneficiary.address,
        beneficiary.address,
        merkleRoot
      );
      const receipt = await tx.wait();
      const event = receipt.events.find((evt) => evt.event === "TitleEscrowDeployed");
      previousTitleEscrowAddress = event.args.escrowAddress;
      const previousTitleEscrow = await TitleEscrow.connect(beneficiary).attach(previousTitleEscrowAddress);
      await previousTitleEscrow.surrender();
    });
  });
});
