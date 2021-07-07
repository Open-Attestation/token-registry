const { expect } = require("chai").use(require("chai-as-promised"));
const { solidity } = require("ethereum-waffle");
const chai = require("chai");

chai.use(solidity);

const SAMPLE_TOKEN_ID = "0x624d0d7ae6f44d41d368d8280856dbaac6aa29fb3b35f45b80a7c1c90032eeb3";

describe("TitleEscrowCreator", async () => {
  let carrier1;
  let beneficiary1;
  let beneficiary2;
  let holder2;
  let TitleEscrowFactory;
  let ERC721;
  before("", async () => {
    const accounts = await ethers.getSigners();
    [carrier1, beneficiary1, beneficiary2, holder2] = accounts;
    TitleEscrowFactory = await ethers.getContractFactory("TitleEscrow");
    ERC721 = await ethers.getContractFactory("TradeTrustERC721");
  });

  let ERC721Address = "";
  let ERC721Instance;

  beforeEach(async () => {
    ERC721Instance = await ERC721.connect(carrier1).deploy("foo", "bar");
    ERC721Address = ERC721Instance.address;
  });

  it("should deploy new instance of TitleEscrow", async () => {
    const { events } = await (
      await ERC721Instance.deployNewTitleEscrow(ERC721Address, beneficiary1.address, beneficiary1.address)
    ).wait();
    const escrowInstance = await TitleEscrowFactory.attach(events[1].args.escrowAddress);
    const escrowBeneficiary = await escrowInstance.beneficiary();
    const escrowHolder = await escrowInstance.holder();
    const escrowTokenRegistry = await escrowInstance.tokenRegistry();
    expect(escrowBeneficiary).to.be.equal(beneficiary1.address);
    expect(escrowHolder).to.be.equal(beneficiary1.address);
    expect(escrowTokenRegistry).to.be.equal(ERC721Address);
  });

  it("should allow instances of TitleEscrow to have the function transferToNewEscrow", async () => {
    const { events } = await (
      await ERC721Instance.deployNewTitleEscrow(ERC721Address, beneficiary1.address, beneficiary1.address)
    ).wait();
    const { escrowAddress } = events[1].args;

    await ERC721Instance["safeMint(address,uint256)"](escrowAddress, SAMPLE_TOKEN_ID);

    const escrowInstance = await TitleEscrowFactory.attach(escrowAddress);
    const receipt = await (
      await escrowInstance.connect(beneficiary1).transferToNewEscrow(beneficiary2.address, holder2.address)
    ).wait();
    const titleCededLog = receipt.events.find((log) => log.event === "TitleCeded");
    const newAddress = titleCededLog.args._to; // eslint-disable-line no-underscore-dangle
    const ownerOnRegistry = await ERC721Instance.ownerOf(SAMPLE_TOKEN_ID);

    expect(escrowAddress).not.to.be.equal(newAddress);
    expect(newAddress).to.be.equal(ownerOnRegistry);

    const newEscrowInstance = await TitleEscrowFactory.attach(ownerOnRegistry);
    const escrowBeneficiary = await newEscrowInstance.beneficiary();
    const escrowHolder = await newEscrowInstance.holder();
    const escrowTokenRegistry = await newEscrowInstance.tokenRegistry();
    expect(escrowBeneficiary).to.be.equal(beneficiary2.address);
    expect(escrowHolder).to.be.equal(holder2.address);
    expect(escrowTokenRegistry).to.be.equal(ERC721Address);
  });
});
