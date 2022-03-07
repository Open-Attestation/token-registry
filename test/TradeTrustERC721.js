const { expect } = require("chai").use(require("chai-as-promised"));
const chai = require("chai");
const { solidity, loadFixture } = require("ethereum-waffle");
const { deployTokenFixture } = require("./fixtures/index.ts");
const { getTitleEscrowContract } = require("./utils/index.ts");

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
  let beneficiary;
  let holder;

  before("Initialising contract factories and accounts for TradeTrustErc721 tests", async () => {
    [carrier1, owner1, owner2, nonMinter, holder1] = await ethers.getSigners();
    TitleEscrow = await ethers.getContractFactory("TitleEscrowCloneableMock");
  });

  const merkleRoot = "0x624d0d7ae6f44d41d368d8280856dbaac6aa29fb3b35f45b80a7c1c90032eeb3";
  const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

  let tradeTrustERC721Instance;
  let tokenRegistryInstanceWithShippingLineWallet;

  beforeEach(async () => {
    beneficiary = owner1;
    holder = holder1;

    tradeTrustERC721Instance = await loadFixture(
      deployTokenFixture({
        tokenContractName: "TradeTrustERC721Mock",
        tokenName: "foo",
        tokenInitials: "bar",
        deployer: carrier1,
      })
    );
    tokenRegistryInstanceWithShippingLineWallet = tradeTrustERC721Instance.connect(carrier1);
  });

  it("should have the correct ERC165 interface support", async () => {
    // should support
    // 1. ITradeTrustERC721 (so the extra stuff we tacked on to ERC721 to handle surrender)
    // 2. ITitleEscrowCreator (to act as a TE factory)
    // 3. IERC721 (basic so that someone expecting a token registry knows how to work with it)

    const ITradeTrustERC721InterfaceId = "0xa9b5af52";
    const IERC721InterfaceId = "0x80ac58cd";
    expect(await tradeTrustERC721Instance.supportsInterface(ITradeTrustERC721InterfaceId)).to.be.true;
    expect(await tradeTrustERC721Instance.supportsInterface(IERC721InterfaceId)).to.be.true;
  });

  it("should work without a wallet for read operations", async () => {
    await tokenRegistryInstanceWithShippingLineWallet.mintInternal(owner1.address, merkleRoot);
    const currentOwner = await tokenRegistryInstanceWithShippingLineWallet.ownerOf(merkleRoot);
    expect(currentOwner).to.deep.equal(owner1.address);
  });

  it("should not burn tokens that it receives", async () => {
    await tokenRegistryInstanceWithShippingLineWallet.mintInternal(owner1.address, merkleRoot);
    const currentOwner = await tokenRegistryInstanceWithShippingLineWallet.ownerOf(merkleRoot);
    expect(currentOwner).to.deep.equal(owner1.address);

    await tokenRegistryInstanceWithShippingLineWallet
      .connect(owner1)
      ["safeTransferFrom(address,address,uint256)"](
        owner1.address,
        tokenRegistryInstanceWithShippingLineWallet.address,
        merkleRoot
      );
    const nextOwner = await tokenRegistryInstanceWithShippingLineWallet.ownerOf(merkleRoot);
    expect(nextOwner).to.deep.equal(tokenRegistryInstanceWithShippingLineWallet.address);
  });

  it("should be able to mint", async () => {
    await tokenRegistryInstanceWithShippingLineWallet.mintInternal(owner1.address, merkleRoot);
    const currentOwner = await tokenRegistryInstanceWithShippingLineWallet.ownerOf(merkleRoot);
    expect(currentOwner).to.deep.equal(owner1.address);
  });

  it("should be able to transfer", async () => {
    await tokenRegistryInstanceWithShippingLineWallet.mintInternal(owner1.address, merkleRoot);
    const currentOwner = await tokenRegistryInstanceWithShippingLineWallet.ownerOf(merkleRoot);
    expect(currentOwner).to.deep.equal(owner1.address);

    await tokenRegistryInstanceWithShippingLineWallet
      .connect(owner1)
      ["safeTransferFrom(address,address,uint256)"](owner1.address, owner2.address, merkleRoot);
    const nextOwner = await tokenRegistryInstanceWithShippingLineWallet.ownerOf(merkleRoot);
    expect(nextOwner).to.deep.equal(owner2.address);
  });

  it("non-owner should not be able to initiate a transfer", async () => {
    await tokenRegistryInstanceWithShippingLineWallet.mintInternal(owner1.address, merkleRoot);
    const currentOwner = await tokenRegistryInstanceWithShippingLineWallet.ownerOf(merkleRoot);
    expect(currentOwner).to.deep.equal(owner1.address);

    const transferQuery = tokenRegistryInstanceWithShippingLineWallet["safeTransferFrom(address,address,uint256)"](
      owner1.address,
      tokenRegistryInstanceWithShippingLineWallet.address,
      merkleRoot
    );
    await expect(transferQuery).to.be.revertedWith("transfer caller is not owner nor approved");
  });

  it("should emit TokenReceive event on mint", async () => {
    const tokenRegistryInstanceAddress = tokenRegistryInstanceWithShippingLineWallet.address;
    const mintTx = await (
      await tokenRegistryInstanceWithShippingLineWallet["mintInternal(address,uint256)"](
        tokenRegistryInstanceAddress,
        merkleRoot
      )
    ).wait();
    const receivedTokenLog = mintTx.events.find((log) => log.event === "TokenReceived");
    assertTokenReceivedLog(receivedTokenLog, carrier1.address, ZERO_ADDRESS, merkleRoot, null);
  });

  describe("Minting new title escrows", () => {
    beforeEach(async () => {
      beneficiary = owner1;
      holder = holder1;
    });

    it("should mint a new title by a minter", async () => {
      await tokenRegistryInstanceWithShippingLineWallet.mintTitle(beneficiary.address, holder.address, merkleRoot);

      const titleEscrowAddr = (await getTitleEscrowContract(tradeTrustERC721Instance, merkleRoot)).address;
      const currentOwner = await tokenRegistryInstanceWithShippingLineWallet.ownerOf(merkleRoot);
      expect(currentOwner).to.deep.equal(titleEscrowAddr);
    });

    it("should mint with the correct details in title escrow", async () => {
      await tokenRegistryInstanceWithShippingLineWallet.mintTitle(beneficiary.address, holder.address, merkleRoot);

      const newEscrowInstance = await getTitleEscrowContract(tradeTrustERC721Instance, merkleRoot);
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

      await expect(tx).to.be.revertedWith("RegistryAccess: caller does not have the Minter role");
    });
  });

  describe("Surrendering TradeTrustERC721 Work Flow", () => {
    let previousTitleEscrowAddress;

    beforeEach("Initialising fresh Token Registry and minting token for each test", async () => {
      beneficiary = owner1;

      // Starting test after the point of surrendering ERC721 Token
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
