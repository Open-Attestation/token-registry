const TitleEscrow = artifacts.require("TitleEscrow");
const ERC721 = artifacts.require("TradeTrustERC721");
const CalculateSelector = artifacts.require("CalculateSelector");
const {expect} = require("chai").use(require("chai-as-promised"));

const SAMPLE_TOKEN_ID = "0x624d0d7ae6f44d41d368d8280856dbaac6aa29fb3b35f45b80a7c1c90032eeb3";
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

const assertTransferLog = (logs, from, to) => {
  expect(logs.event).to.deep.equal("Transfer");
  expect(logs.args[0]).to.deep.equal(from);
  expect(logs.args[1]).to.deep.equal(to);
};
const assertTitleReceivedLog = (log, tokenRegistry, sender) => {
  expect(log.event).to.deep.equal("TitleReceived");
  expect(log.args[0]).to.deep.equal(tokenRegistry);
  expect(log.args[1]).to.deep.equal(sender);
};
const assertTitleCededLog = (log, tokenRegistry, receiver) => {
  expect(log.event).to.deep.equal("TitleCeded");
  expect(log.args[0]).to.deep.equal(tokenRegistry);
  expect(log.args[1]).to.deep.equal(receiver);
};
const assertTransferEndorsedLog = (log, sender, receiver) => {
  expect(log.event).to.deep.equal("TransferEndorsed");
  expect(log.args[1]).to.deep.equal(sender);
  expect(log.args[2]).to.deep.equal(receiver);
};
const assertHolderChangedLog = (log, sender, receiver) => {
  expect(log.event).to.deep.equal("HolderChanged");
  expect(log.args[0]).to.deep.equal(sender);
  expect(log.args[1]).to.deep.equal(receiver);
};
contract("TitleEscrow", accounts => {
  const carrier1 = accounts[0];
  const beneficiary1 = accounts[1];
  const beneficiary2 = accounts[2];
  const holder1 = accounts[3];
  const holder2 = accounts[4];

  let ERC721Address = "";
  let ERC721Instance;

  beforeEach("", async () => {
    ERC721Instance = await ERC721.new("foo", "bar");
    ERC721Address = ERC721Instance.address;
  });

  it("should be instantiated correctly when deployed by beneficiary", async () => {
    const escrowInstance = await TitleEscrow.new(ERC721Address, beneficiary1, beneficiary1, {
      from: beneficiary1
    });

    const escrowBeneficiary = await escrowInstance.beneficiary();
    const escrowHolder = await escrowInstance.holder();
    const escrowTokenRegistry = await escrowInstance.tokenRegistry();
    expect(escrowBeneficiary).to.be.equal(beneficiary1);
    expect(escrowHolder).to.be.equal(beneficiary1);
    expect(escrowTokenRegistry).to.be.equal(ERC721Address);
  });

  it("should have the correct ERC165 interface support", async () => {
    const escrowInstance = await TitleEscrow.new(ERC721Address, beneficiary1, beneficiary1);
    const calculatorInstance = await CalculateSelector.new();
    const expectedInterface = await calculatorInstance.calculateSelector();
    const interfaceSupported = await escrowInstance.supportsInterface(expectedInterface);
    expect(interfaceSupported).to.be.equal(true);
  });

  it("should be instantiated correctly when deployed by 3rd party to be held by beneficiary1", async () => {
    const escrowInstance = await TitleEscrow.new(ERC721Address, beneficiary1, beneficiary1, {
      from: carrier1
    });

    const escrowBeneficiary = await escrowInstance.beneficiary();
    const escrowHolder = await escrowInstance.holder();
    const escrowTokenRegistry = await escrowInstance.tokenRegistry();
    expect(escrowBeneficiary).to.be.equal(beneficiary1);
    expect(escrowHolder).to.be.equal(beneficiary1);
    expect(escrowTokenRegistry).to.be.equal(ERC721Address);
  });

  it("should be instantiated correctly when deployed by 3rd party to be held by holder1", async () => {
    const escrowInstance = await TitleEscrow.new(ERC721Address, beneficiary1, holder1, {
      from: carrier1
    });

    const escrowBeneficiary = await escrowInstance.beneficiary();
    const escrowHolder = await escrowInstance.holder();
    const escrowTokenRegistry = await escrowInstance.tokenRegistry();
    expect(escrowBeneficiary).to.be.equal(beneficiary1);
    expect(escrowHolder).to.be.equal(holder1);
    expect(escrowTokenRegistry).to.be.equal(ERC721Address);
  });

  it("should indicate that it is not holding a token when it has not received one", async () => {
    const escrowInstance = await TitleEscrow.new(ERC721Address, beneficiary1, holder1, {
      from: carrier1
    });

    const endorseTransferTx = escrowInstance.endorseTransfer(beneficiary2, {
      from: beneficiary1
    });

    await expect(endorseTransferTx).to.be.rejectedWith(/TitleEscrow: Contract is not holding a token/);
    const changeHolderTx = escrowInstance.changeHolder(holder2, {
      from: holder1
    });

    await expect(changeHolderTx).to.be.rejectedWith(/TitleEscrow: Contract is not holding a token/);
    const transferTx = escrowInstance.transferTo(beneficiary2, {
      from: holder1
    });

    await expect(transferTx).to.be.rejectedWith(/TitleEscrow: Contract is not holding a token/);
    const status = await escrowInstance.status();
    expect(status.toString()).to.equal("0");
  });

  it("should update status upon receiving a ERC721 token", async () => {
    const escrowInstance = await TitleEscrow.new(ERC721Address, beneficiary1, holder1, {
      from: beneficiary1
    });
    const mintTx = await ERC721Instance.safeMint(escrowInstance.address, SAMPLE_TOKEN_ID);
    assertTransferLog(mintTx.logs[0], ZERO_ADDRESS, escrowInstance.address);
    const owner = await ERC721Instance.ownerOf(SAMPLE_TOKEN_ID);
    expect(owner).to.equal(escrowInstance.address);

    const status = await escrowInstance.status();
    expect(status.toString()).to.equal("1");
  });

  it("should should fail to receive ERC721 if its from a different registry", async () => {
    const newERC721Instance = await ERC721.new("foo", "bar");

    const escrowInstance = await TitleEscrow.new(newERC721Instance.address, beneficiary1, holder1, {
      from: beneficiary1
    });
    const mintTx = ERC721Instance.safeMint(escrowInstance.address, SAMPLE_TOKEN_ID);

    await expect(mintTx).to.be.rejectedWith(/TitleEscrow: Only tokens from predefined token registry can be accepted/);
  });

  it("should allow exit to another title escrow", async () => {
    const escrowInstance1 = await TitleEscrow.new(ERC721Address, beneficiary1, beneficiary1, {
      from: beneficiary1
    });

    const escrowInstance2 = await TitleEscrow.new(ERC721Address, beneficiary2, holder2, {
      from: beneficiary2
    });

    const mintTx = await ERC721Instance.safeMint(escrowInstance1.address, SAMPLE_TOKEN_ID);

    assertTransferLog(mintTx.logs[0], ZERO_ADDRESS, escrowInstance1.address);

    const transferTx = await escrowInstance1.transferTo(escrowInstance2.address, {from: beneficiary1});

    assertTitleCededLog(transferTx.logs[0], ERC721Instance.address, escrowInstance2.address);
    const newOwner = await ERC721Instance.ownerOf(SAMPLE_TOKEN_ID);
    expect(newOwner).to.be.equal(escrowInstance2.address);
  });

  it("should allow exit to ethereum wallet", async () => {
    const escrowInstance = await TitleEscrow.new(ERC721Address, beneficiary1, beneficiary1, {
      from: beneficiary1
    });

    const mintTx = await ERC721Instance.safeMint(escrowInstance.address, SAMPLE_TOKEN_ID);

    assertTransferLog(mintTx.logs[0], ZERO_ADDRESS, escrowInstance.address);

    const transferTx = await escrowInstance.transferTo(beneficiary2, {
      from: beneficiary1
    });

    assertTitleCededLog(transferTx.logs[0], ERC721Instance.address, beneficiary2);

    const newOwner = await ERC721Instance.ownerOf(SAMPLE_TOKEN_ID);
    expect(newOwner).to.be.equal(beneficiary2);
  });
  it("should allow holder to transfer with beneficiary approval", async () => {
    const escrowInstance = await TitleEscrow.new(ERC721Address, beneficiary1, holder1, {
      from: beneficiary1
    });

    const mintTx = await ERC721Instance.safeMint(escrowInstance.address, SAMPLE_TOKEN_ID);
    assertTransferLog(mintTx.logs[0], ZERO_ADDRESS, escrowInstance.address);

    expect(await escrowInstance.holder()).to.be.equal(holder1);

    const approveEndorseTransferTx = await escrowInstance.endorseTransfer(beneficiary2, {from: beneficiary1});

    assertTransferEndorsedLog(approveEndorseTransferTx.logs[0], beneficiary1, beneficiary2);

    const tranferOwnerTx = await escrowInstance.transferTo(beneficiary2, {
      from: holder1
    });

    assertTitleCededLog(tranferOwnerTx.logs[0], ERC721Address, beneficiary2);

    const newOwner = await ERC721Instance.ownerOf(SAMPLE_TOKEN_ID);

    expect(newOwner).to.be.equal(beneficiary2);
  });
  it("should allow holder to transfer to new holder", async () => {
    const escrowInstance = await TitleEscrow.new(ERC721Address, beneficiary1, holder1, {
      from: beneficiary1
    });

    const mintTx = await ERC721Instance.safeMint(escrowInstance.address, SAMPLE_TOKEN_ID);
    assertTransferLog(mintTx.logs[0], ZERO_ADDRESS, escrowInstance.address);

    expect(await escrowInstance.holder()).to.be.equal(holder1);

    const transferHolderTx2 = await escrowInstance.changeHolder(holder2, {
      from: holder1
    });

    assertHolderChangedLog(transferHolderTx2.logs[0], holder1, holder2);

    expect(await escrowInstance.holder()).to.be.equal(holder2);
  });

  it("should not allow holder to transfer to 0x0", async () => {
    const escrowInstance = await TitleEscrow.new(ERC721Address, beneficiary1, beneficiary1, {
      from: beneficiary1
    });

    const mintTx = await ERC721Instance.safeMint(escrowInstance.address, SAMPLE_TOKEN_ID);
    assertTransferLog(mintTx.logs[0], ZERO_ADDRESS, escrowInstance.address);

    const attemptToTransferTx = escrowInstance.transferTo(ZERO_ADDRESS, {
      from: beneficiary1
    });
    await expect(attemptToTransferTx).to.be.rejectedWith(/TitleEscrow: Transferring to 0x0 is not allowed/);
  });
  it("should not allow holder to transfer to new beneficiary without endorsement", async () => {
    const escrowInstance = await TitleEscrow.new(ERC721Address, beneficiary1, holder1, {
      from: beneficiary1
    });

    const mintTx = await ERC721Instance.safeMint(escrowInstance.address, SAMPLE_TOKEN_ID);
    assertTransferLog(mintTx.logs[0], ZERO_ADDRESS, escrowInstance.address);

    expect(await escrowInstance.holder()).to.be.equal(holder1);

    const attemptToTransferOwnerTx = escrowInstance.transferTo(beneficiary2, {
      from: holder1
    });

    await expect(attemptToTransferOwnerTx).to.be.rejectedWith(
      /TitleEscrow: Transfer target has not been endorsed by beneficiary/
    );
  });
  it("should not allow unauthorised party to execute any state change", async () => {
    const escrowInstance = await TitleEscrow.new(ERC721Address, beneficiary1, holder1, {
      from: beneficiary1
    });

    const mintTx = await ERC721Instance.safeMint(escrowInstance.address, SAMPLE_TOKEN_ID);
    assertTransferLog(mintTx.logs[0], ZERO_ADDRESS, escrowInstance.address);

    const attemptToTransferOwnerTx = escrowInstance.transferTo(holder2, {
      from: beneficiary2
    });

    await expect(attemptToTransferOwnerTx).to.be.rejectedWith(/HasHolder: only the holder may invoke this function/);
    const attemptToTransferHolderTx = escrowInstance.changeHolder(holder2, {
      from: beneficiary2
    });

    await expect(attemptToTransferHolderTx).to.be.rejectedWith(/HasHolder: only the holder may invoke this function/);
    const attemptToEndorseTransferTx = escrowInstance.endorseTransfer(holder2, {
      from: beneficiary2
    });

    await expect(attemptToEndorseTransferTx).to.be.rejectedWith(
      /HasNamedBeneficiary: only the beneficiary may invoke a transfer/
    );
  });

  it("should lock contract after it has been spent", async () => {
    const escrowInstance1 = await TitleEscrow.new(ERC721Address, beneficiary1, beneficiary1, {
      from: beneficiary1
    });

    const escrowInstance2 = await TitleEscrow.new(ERC721Address, beneficiary2, holder2, {
      from: beneficiary2
    });

    const mintTx = await ERC721Instance.safeMint(escrowInstance1.address, SAMPLE_TOKEN_ID);
    assertTransferLog(mintTx.logs[0], ZERO_ADDRESS, escrowInstance1.address);

    const transferTx = await escrowInstance1.transferTo(escrowInstance2.address, {from: beneficiary1});
    assertTitleCededLog(transferTx.logs[0], ERC721Address, escrowInstance2.address);
    assertTitleReceivedLog(transferTx.logs[1], ERC721Address, escrowInstance1.address);

    const newOwner = await ERC721Instance.ownerOf(SAMPLE_TOKEN_ID);
    expect(newOwner).to.be.equal(escrowInstance2.address);

    const changeHolderTx = escrowInstance1.changeHolder(holder1, {from: beneficiary1});

    await expect(changeHolderTx).to.be.rejectedWith(/TitleEscrow: Contract is not in use/);
  });
  it("should not accept a token after it has been used", async () => {
    const escrowInstance1 = await TitleEscrow.new(ERC721Address, beneficiary1, beneficiary1, {
      from: beneficiary1
    });

    const escrowInstance2 = await TitleEscrow.new(ERC721Address, beneficiary2, beneficiary2, {
      from: beneficiary2
    });

    const mintTx = await ERC721Instance.safeMint(escrowInstance1.address, SAMPLE_TOKEN_ID);
    assertTransferLog(mintTx.logs[0], ZERO_ADDRESS, escrowInstance1.address);

    const transferTx = await escrowInstance1.transferTo(escrowInstance2.address, {from: beneficiary1});
    assertTitleCededLog(transferTx.logs[0], ERC721Address, escrowInstance2.address);
    assertTitleReceivedLog(transferTx.logs[1], ERC721Address, escrowInstance1.address);
    const newOwner = await ERC721Instance.ownerOf(SAMPLE_TOKEN_ID);
    expect(newOwner).to.be.equal(escrowInstance2.address);

    const transferTx2 = escrowInstance2.transferTo(escrowInstance1.address, {from: beneficiary2});

    await expect(transferTx2).to.be.rejectedWith(/TitleEscrow: Contract has been used before/);
  });
});
