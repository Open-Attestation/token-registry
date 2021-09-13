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
  let TitleEscrow;
  let ERC721;

  before("Initialising contract factories and accounts for TitleEscrowCreator tests", async () => {
    [carrier1, beneficiary1, beneficiary2, holder2] = await ethers.getSigners();
    TitleEscrowClonerFactory = await ethers.getContractFactory("TitleEscrowCloner");
    TitleEscrowFactory = await ethers.getContractFactory("TitleEscrowCloneable");
    ERC721 = await ethers.getContractFactory("TradeTrustERC721");
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
    console.log(txReceipt.events[1].args.escrowAddress);
    const escrowInstance = await TitleEscrowFactory.attach(txReceipt.events[1].args.escrowAddress);
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
    console.log(escrow1Receipt.events[1].args.escrowAddress);
    const escrow1Instance = await TitleEscrowFactory.attach(escrow1Receipt.events[1].args.escrowAddress);
    const escrow1Beneficiary = await escrow1Instance.beneficiary();
    const escrow1Holder = await escrow1Instance.holder();
    const escrow1TokenRegistry = await escrow1Instance.tokenRegistry();
    expect(escrow1Beneficiary).to.be.equal(beneficiary1.address);
    expect(escrow1Holder).to.be.equal(beneficiary1.address);
    expect(escrow1TokenRegistry).to.be.equal(ERC721Address);

    const escrow2Receipt = await (
      await cloner.deployNewTitleEscrow(ERC721Address, beneficiary2.address, beneficiary2.address)
    ).wait();
    console.log(escrow2Receipt.events[1].args.escrowAddress);
    const escrow2Instance = await TitleEscrowFactory.attach(escrow2Receipt.events[1].args.escrowAddress);
    const escrow2Beneficiary = await escrow2Instance.beneficiary();
    const escrow2Holder = await escrow2Instance.holder();
    const escrow2TokenRegistry = await escrow2Instance.tokenRegistry();
    expect(escrow2Beneficiary).to.be.equal(beneficiary2.address);
    expect(escrow2Holder).to.be.equal(beneficiary2.address);
    expect(escrow2TokenRegistry).to.be.equal(ERC721Address);


  });

  // TODO: test that implementation's onERC721Received cannot be called
});
