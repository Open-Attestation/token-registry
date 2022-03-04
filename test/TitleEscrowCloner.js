const { expect } = require("chai").use(require("chai-as-promised"));
const { solidity } = require("ethereum-waffle");
const chai = require("chai");

chai.use(solidity);

const SAMPLE_TOKEN_ID = "0x624d0d7ae6f44d41d368d8280856dbaac6aa29fb3b35f45b80a7c1c90032eeb3";

describe("TitleEscrowCloner", async () => {
  let carrier1;
  let beneficiary1;
  let beneficiary2;
  let holder2;
  let ERC721;

  let TitleEscrowClonerFactory;
  let TitleEscrowCloneableFactory;

  before("Initialising contract factories and accounts for TitleEscrowCreator tests", async () => {
    [carrier1, beneficiary1, beneficiary2, holder2] = await ethers.getSigners();
    TitleEscrowClonerFactory = await ethers.getContractFactory("TitleEscrowClonerMock");
    TitleEscrowCloneableFactory = await ethers.getContractFactory("TitleEscrowCloneableMock");
    ERC721 = await ethers.getContractFactory("TradeTrustERC721Mock");
  });

  let ERC721Address = "";
  let ERC721Instance;
  let cloner;

  beforeEach("Initialising fresh Token Registry for each test", async () => {
    ERC721Instance = await ERC721.connect(carrier1).deploy("foo", "bar");
    cloner = await TitleEscrowClonerFactory.connect(carrier1).deploy();
    ERC721Address = ERC721Instance.address;
  });

  it("should deploy new instance of TitleEscrow", async () => {
    const txReceipt = await (
      await cloner.deployNewTitleEscrow(ERC721Address, beneficiary1.address, beneficiary1.address)
    ).wait();
    const escrowInstance = await TitleEscrowCloneableFactory.attach(txReceipt.events[1].args.escrowAddress);
    const escrowBeneficiary = await escrowInstance.beneficiary();
    const escrowHolder = await escrowInstance.holder();
    const escrowTokenRegistry = await escrowInstance.tokenRegistry();
    expect(escrowBeneficiary).to.be.equal(beneficiary1.address);
    expect(escrowHolder).to.be.equal(beneficiary1.address);
    expect(escrowTokenRegistry).to.be.equal(ERC721Address);
  });

  it("two instances of TitleEscrow clones should not interfere with each other", async () => {
    const escrow1Receipt = await (
      await cloner.deployNewTitleEscrow(ERC721Address, beneficiary1.address, beneficiary1.address)
    ).wait();
    const escrow1Instance = await TitleEscrowCloneableFactory.attach(escrow1Receipt.events[1].args.escrowAddress);
    const escrow1Beneficiary = await escrow1Instance.beneficiary();
    const escrow1Holder = await escrow1Instance.holder();
    const escrow1TokenRegistry = await escrow1Instance.tokenRegistry();
    expect(escrow1Beneficiary).to.be.equal(beneficiary1.address);
    expect(escrow1Holder).to.be.equal(beneficiary1.address);
    expect(escrow1TokenRegistry).to.be.equal(ERC721Address);

    const escrow2Receipt = await (
      await cloner.deployNewTitleEscrow(ERC721Address, beneficiary2.address, beneficiary2.address)
    ).wait();
    const escrow2Instance = await TitleEscrowCloneableFactory.attach(escrow2Receipt.events[1].args.escrowAddress);
    const escrow2Beneficiary = await escrow2Instance.beneficiary();
    const escrow2Holder = await escrow2Instance.holder();
    const escrow2TokenRegistry = await escrow2Instance.tokenRegistry();
    expect(escrow2Beneficiary).to.be.equal(beneficiary2.address);
    expect(escrow2Holder).to.be.equal(beneficiary2.address);
    expect(escrow2TokenRegistry).to.be.equal(ERC721Address);
  });

  it("should allow instances of TitleEscrow to have the function transferToNewEscrow", async () => {
    const { events } = await (
      await ERC721Instance.deployNewTitleEscrow(ERC721Address, beneficiary1.address, beneficiary1.address)
    ).wait();
    const { escrowAddress } = events[1].args;

    await ERC721Instance["safeMintInternal(address,uint256)"](escrowAddress, SAMPLE_TOKEN_ID);

    const escrowInstance = await TitleEscrowCloneableFactory.attach(escrowAddress);
    const receipt = await (
      await escrowInstance.connect(beneficiary1).transferToNewEscrow(beneficiary2.address, holder2.address)
    ).wait();
    const titleCededLog = receipt.events.find((log) => log.event === "TitleCeded");
    const newAddress = titleCededLog.args._to; // eslint-disable-line no-underscore-dangle
    const ownerOnRegistry = await ERC721Instance.ownerOf(SAMPLE_TOKEN_ID);

    expect(escrowAddress).not.to.be.equal(newAddress);
    expect(newAddress).to.be.equal(ownerOnRegistry);

    const newEscrowInstance = await TitleEscrowCloneableFactory.attach(ownerOnRegistry);
    const escrowBeneficiary = await newEscrowInstance.beneficiary();
    const escrowHolder = await newEscrowInstance.holder();
    const escrowTokenRegistry = await newEscrowInstance.tokenRegistry();
    expect(escrowBeneficiary).to.be.equal(beneficiary2.address);
    expect(escrowHolder).to.be.equal(holder2.address);
    expect(escrowTokenRegistry).to.be.equal(ERC721Address);
  });

  // TODO: test that implementation's onERC721Received cannot be called
  it("should not be able to call onERC721Received on the implementation", async () => {
    const implAddr = await cloner.titleEscrowImplementation();
    const implInstance = await TitleEscrowCloneableFactory.attach(implAddr);

    const onReceived = implInstance.onERC721Received(implAddr, implAddr, SAMPLE_TOKEN_ID, "0x");

    await expect(onReceived).to.be.revertedWith("Only tokens from predefined token registry can be accepted");
  });
});
