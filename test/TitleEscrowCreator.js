const TitleEscrow = artifacts.require("TitleEscrow");
const TitleEscrowCreator = artifacts.require("TitleEscrowCreator");
const ERC721 = artifacts.require("TradeTrustERC721");
const {expect} = require("chai").use(require("chai-as-promised"));

const SAMPLE_TOKEN_ID = "0x624d0d7ae6f44d41d368d8280856dbaac6aa29fb3b35f45b80a7c1c90032eeb3";

contract("TitleEscrowCreator", accounts => {
  const beneficiary1 = accounts[1];
  const beneficiary2 = accounts[2];
  const holder2 = accounts[4];

  let ERC721Address = "";
  let ERC721Instance;

  beforeEach(async () => {
    ERC721Instance = await ERC721.new("foo", "bar");
    ERC721Address = ERC721Instance.address;
  });

  it("should deploy new instance of TitleEscrow", async () => {
    const {logs} = await ERC721Instance.deployNewTitleEscrow(ERC721Address, beneficiary1, beneficiary1, {
      from: beneficiary1
    });
    const escrowInstance = await TitleEscrow.at(logs[0].args.escrowAddress);
    const escrowBeneficiary = await escrowInstance.beneficiary();
    const escrowHolder = await escrowInstance.holder();
    const escrowTokenRegistry = await escrowInstance.tokenRegistry();
    expect(escrowBeneficiary).to.be.equal(beneficiary1);
    expect(escrowHolder).to.be.equal(beneficiary1);
    expect(escrowTokenRegistry).to.be.equal(ERC721Address);
  });

  it("should allow instances of TitleEscrow to have the function transferToNewEscrow", async () => {
    const {logs} = await ERC721Instance.deployNewTitleEscrow(ERC721Address, beneficiary1, beneficiary1, {
      from: beneficiary1
    });

    const {escrowAddress} = logs[0].args;

    await ERC721Instance.safeMint(escrowAddress, SAMPLE_TOKEN_ID);

    const escrowInstance = await TitleEscrow.at(escrowAddress);
    const receipt = await escrowInstance.transferToNewEscrow(beneficiary2, holder2, {from: beneficiary1});
    const titleCededLog = receipt.logs.find(log => log.event === "TitleCeded");
    const newAddress = titleCededLog.args._to; // eslint-disable-line no-underscore-dangle
    const ownerOnRegistry = await ERC721Instance.ownerOf(SAMPLE_TOKEN_ID);

    expect(escrowAddress).not.to.be.equal(newAddress);
    expect(newAddress).to.be.equal(ownerOnRegistry);

    const newEscrowInstance = await TitleEscrow.at(ownerOnRegistry);
    const escrowBeneficiary = await newEscrowInstance.beneficiary();
    const escrowHolder = await newEscrowInstance.holder();
    const escrowTokenRegistry = await newEscrowInstance.tokenRegistry();
    expect(escrowBeneficiary).to.be.equal(beneficiary2);
    expect(escrowHolder).to.be.equal(holder2);
    expect(escrowTokenRegistry).to.be.equal(ERC721Address);
  });
});
