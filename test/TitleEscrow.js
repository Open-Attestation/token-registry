const TitleEscrow = artifacts.require("TitleEscrow");
const ERC721 = artifacts.require("TradeTrustERC721");
const CalculateSelector = artifacts.require("CalculateSelector");
const TitleEscrowCreator = artifacts.require("TitleEscrowCreator");
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
const assertTransferOwnerApprovalLog = (log, sender, receiver) => {
  expect(log.event).to.deep.equal("TransferOwnerApproval");
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
    const escrowInstance = await TitleEscrow.new(ERC721Address, beneficiary1, beneficiary1, ZERO_ADDRESS, {
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
    const escrowInstance = await TitleEscrow.new(ERC721Address, beneficiary1, beneficiary1, ZERO_ADDRESS);
    const calculatorInstance = await CalculateSelector.new();
    const expectedInterface = await calculatorInstance.calculateSelector();
    const interfaceSupported = await escrowInstance.supportsInterface(expectedInterface);
    expect(interfaceSupported).to.be.equal(true, `Expected selector: ${expectedInterface}`);
  });

  it("should be instantiated correctly when deployed by 3rd party to be held by beneficiary1", async () => {
    const escrowInstance = await TitleEscrow.new(ERC721Address, beneficiary1, beneficiary1, ZERO_ADDRESS, {
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
    const escrowInstance = await TitleEscrow.new(ERC721Address, beneficiary1, holder1, ZERO_ADDRESS, {
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
    const escrowInstance = await TitleEscrow.new(ERC721Address, beneficiary1, holder1, ZERO_ADDRESS, {
      from: carrier1
    });

    const approveNewOwnerTx = escrowInstance.approveNewOwner(beneficiary2, {
      from: beneficiary1
    });

    await expect(approveNewOwnerTx).to.be.rejectedWith(/TitleEscrow: Contract is not holding a token/);
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
    const escrowInstance = await TitleEscrow.new(ERC721Address, beneficiary1, holder1, ZERO_ADDRESS, {
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

    const escrowInstance = await TitleEscrow.new(newERC721Instance.address, beneficiary1, holder1, ZERO_ADDRESS, {
      from: beneficiary1
    });
    const mintTx = ERC721Instance.safeMint(escrowInstance.address, SAMPLE_TOKEN_ID);

    await expect(mintTx).to.be.rejectedWith(/TitleEscrow: Only tokens from predefined token registry can be accepted/);
  });

  it("should allow exit to another title escrow", async () => {
    const escrowInstance1 = await TitleEscrow.new(ERC721Address, beneficiary1, beneficiary1, ZERO_ADDRESS, {
      from: beneficiary1
    });

    const escrowInstance2 = await TitleEscrow.new(ERC721Address, beneficiary2, holder2, ZERO_ADDRESS, {
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
    const escrowInstance = await TitleEscrow.new(ERC721Address, beneficiary1, beneficiary1, ZERO_ADDRESS, {
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
    const escrowInstance = await TitleEscrow.new(ERC721Address, beneficiary1, holder1, ZERO_ADDRESS, {
      from: beneficiary1
    });

    const mintTx = await ERC721Instance.safeMint(escrowInstance.address, SAMPLE_TOKEN_ID);
    assertTransferLog(mintTx.logs[0], ZERO_ADDRESS, escrowInstance.address);

    expect(await escrowInstance.holder()).to.be.equal(holder1);

    const approveapproveNewOwnerTx = await escrowInstance.approveNewOwner(beneficiary2, {from: beneficiary1});

    assertTransferOwnerApprovalLog(approveapproveNewOwnerTx.logs[0], beneficiary1, beneficiary2);

    const tranferOwnerTx = await escrowInstance.transferTo(beneficiary2, {
      from: holder1
    });

    assertTitleCededLog(tranferOwnerTx.logs[0], ERC721Address, beneficiary2);

    const newOwner = await ERC721Instance.ownerOf(SAMPLE_TOKEN_ID);

    expect(newOwner).to.be.equal(beneficiary2);
  });
  it("should allow holder to transfer to new holder", async () => {
    const escrowInstance = await TitleEscrow.new(ERC721Address, beneficiary1, holder1, ZERO_ADDRESS, {
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
    const escrowInstance = await TitleEscrow.new(ERC721Address, beneficiary1, beneficiary1, ZERO_ADDRESS, {
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
    const escrowInstance = await TitleEscrow.new(ERC721Address, beneficiary1, holder1, ZERO_ADDRESS, {
      from: beneficiary1
    });

    const mintTx = await ERC721Instance.safeMint(escrowInstance.address, SAMPLE_TOKEN_ID);
    assertTransferLog(mintTx.logs[0], ZERO_ADDRESS, escrowInstance.address);

    expect(await escrowInstance.holder()).to.be.equal(holder1);

    const attemptToTransferOwnerTx = escrowInstance.transferTo(beneficiary2, {
      from: holder1
    });

    await expect(attemptToTransferOwnerTx).to.be.rejectedWith(
      /TitleEscrow: New owner has not been approved by beneficiary/
    );
  });
  it("should not allow unauthorised party to execute any state change", async () => {
    const escrowInstance = await TitleEscrow.new(ERC721Address, beneficiary1, holder1, ZERO_ADDRESS, {
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
    const attemptToapproveNewOwnerTx = escrowInstance.approveNewOwner(holder2, {
      from: beneficiary2
    });

    await expect(attemptToapproveNewOwnerTx).to.be.rejectedWith(
      /HasNamedBeneficiary: only the beneficiary may invoke this function/
    );
  });

  it("should lock contract after it has been spent", async () => {
    const escrowInstance1 = await TitleEscrow.new(ERC721Address, beneficiary1, beneficiary1, ZERO_ADDRESS, {
      from: beneficiary1
    });

    const escrowInstance2 = await TitleEscrow.new(ERC721Address, beneficiary2, holder2, ZERO_ADDRESS, {
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
    const escrowInstance1 = await TitleEscrow.new(ERC721Address, beneficiary1, beneficiary1, ZERO_ADDRESS, {
      from: beneficiary1
    });

    const escrowInstance2 = await TitleEscrow.new(ERC721Address, beneficiary2, beneficiary2, ZERO_ADDRESS, {
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

  it("should be able to transfer to a new beneficiary and holder instantly", async () => {
    const titleEscrowCreatorInstance = await TitleEscrowCreator.new();
    const escrowInstance = await TitleEscrow.new(
      ERC721Address,
      beneficiary1,
      beneficiary1,
      titleEscrowCreatorInstance.address,
      {
        from: beneficiary1
      }
    );

    await ERC721Instance.safeMint(escrowInstance.address, SAMPLE_TOKEN_ID);

    const receipt = await escrowInstance.transferToNewEscrow(beneficiary2, holder2, {from: beneficiary1});
    const titleCededLog = receipt.logs.find(log => log.event === "TitleCeded");
    const newAddress = titleCededLog.args._to; // eslint-disable-line no-underscore-dangle
    const ownerOnRegistry = await ERC721Instance.ownerOf(SAMPLE_TOKEN_ID);

    expect(escrowInstance.address).not.to.be.equal(newAddress);
    expect(newAddress).to.be.equal(ownerOnRegistry);

    const newEscrowInstance = await TitleEscrow.at(ownerOnRegistry);
    const escrowBeneficiary = await newEscrowInstance.beneficiary();
    const escrowHolder = await newEscrowInstance.holder();
    const escrowTokenRegistry = await newEscrowInstance.tokenRegistry();
    expect(escrowBeneficiary).to.be.equal(beneficiary2);
    expect(escrowHolder).to.be.equal(holder2);
    expect(escrowTokenRegistry).to.be.equal(ERC721Address);
  });

  it("should allow current beneficiary to appoint new beneficiary and holder as the transfer target", async () => {
    const titleEscrowCreatorInstance = await TitleEscrowCreator.new();
    const escrowInstance = await TitleEscrow.new(
      ERC721Address,
      beneficiary1,
      holder1,
      titleEscrowCreatorInstance.address,
      {
        from: beneficiary1
      }
    );

    await ERC721Instance.safeMint(escrowInstance.address, SAMPLE_TOKEN_ID);

    const prevApprovedBeneficiary = await escrowInstance.approvedBeneficiary();
    const prevApprovedHolder = await escrowInstance.approvedHolder();
    expect(prevApprovedBeneficiary).to.be.equal(ZERO_ADDRESS);
    expect(prevApprovedHolder).to.be.equal(ZERO_ADDRESS);

    // Execute the transaction to name new beneficiary & holder
    const receipt = await escrowInstance.approveNewTransferTargets(beneficiary2, holder2, {from: beneficiary1});
    expect(receipt.logs[0].args.newBeneficiary).to.be.equal(beneficiary2);
    expect(receipt.logs[0].args.newHolder).to.be.equal(holder2);

    const afterApprovedBeneficiary = await escrowInstance.approvedBeneficiary();
    const afterApprovedHolder = await escrowInstance.approvedHolder();
    expect(afterApprovedBeneficiary).to.be.equal(beneficiary2);
    expect(afterApprovedHolder).to.be.equal(holder2);
  });

  it("should not allow current beneficiary to appoint new beneficiary and holder when the contract is not the owner of a token", async () => {
    const titleEscrowCreatorInstance = await TitleEscrowCreator.new();
    const escrowInstance = await TitleEscrow.new(
      ERC721Address,
      beneficiary1,
      holder1,
      titleEscrowCreatorInstance.address,
      {
        from: beneficiary1
      }
    );

    const attemptToTransfer = escrowInstance.approveNewTransferTargets(beneficiary2, holder2, {from: beneficiary1});

    await expect(attemptToTransfer).to.be.rejectedWith(/TitleEscrow: Contract is not holding a token/);
  });

  it("should not allow user to appoint new beneficiary and holder when user is not the beneficiary", async () => {
    const titleEscrowCreatorInstance = await TitleEscrowCreator.new();
    const escrowInstance = await TitleEscrow.new(
      ERC721Address,
      beneficiary1,
      holder1,
      titleEscrowCreatorInstance.address,
      {
        from: beneficiary1
      }
    );

    await ERC721Instance.safeMint(escrowInstance.address, SAMPLE_TOKEN_ID);

    const attemptToAppoint = escrowInstance.approveNewTransferTargets(beneficiary2, holder2, {from: carrier1});

    await expect(attemptToAppoint).to.be.rejectedWith(
      /HasNamedBeneficiary: only the beneficiary may invoke this function/
    );
  });

  it("should allow holder to execute transferToNewEscrow when new beneficiary and holder has been appointed by beneficiary", async () => {
    const titleEscrowCreatorInstance = await TitleEscrowCreator.new();
    const escrowInstance = await TitleEscrow.new(
      ERC721Address,
      beneficiary1,
      holder1,
      titleEscrowCreatorInstance.address,
      {
        from: beneficiary1
      }
    );

    await ERC721Instance.safeMint(escrowInstance.address, SAMPLE_TOKEN_ID);

    await escrowInstance.approveNewTransferTargets(beneficiary2, holder2, {from: beneficiary1});

    await escrowInstance.transferToNewEscrow(beneficiary2, holder2, {from: holder1});

    // Make sure the transfer really has happened
    const ownerOnRegistry = await ERC721Instance.ownerOf(SAMPLE_TOKEN_ID);
    const newEscrowInstance = await TitleEscrow.at(ownerOnRegistry);
    const escrowBeneficiary = await newEscrowInstance.beneficiary();
    const escrowHolder = await newEscrowInstance.holder();
    const escrowTokenRegistry = await newEscrowInstance.tokenRegistry();
    expect(escrowBeneficiary).to.be.equal(beneficiary2);
    expect(escrowHolder).to.be.equal(holder2);
    expect(escrowTokenRegistry).to.be.equal(ERC721Address);
  });

  it("should not allow holder to execute transferToNewEscrow when new beneficiary and holder has not been appointed", async () => {
    const titleEscrowCreatorInstance = await TitleEscrowCreator.new();
    const escrowInstance = await TitleEscrow.new(
      ERC721Address,
      beneficiary1,
      holder1,
      titleEscrowCreatorInstance.address,
      {
        from: beneficiary1
      }
    );

    await ERC721Instance.safeMint(escrowInstance.address, SAMPLE_TOKEN_ID);

    const attemptToTransfer = escrowInstance.transferToNewEscrow(beneficiary2, holder2, {from: holder1});

    await expect(attemptToTransfer).to.be.rejectedWith(/TitleEscrow: Beneficiary has not been endorsed by beneficiary/);
  });

  it("should not allow anyone else (esp beneficiary) to execute transferToNewEscrow when new beneficiary and holder has been appointed", async () => {
    const titleEscrowCreatorInstance = await TitleEscrowCreator.new();
    const escrowInstance = await TitleEscrow.new(
      ERC721Address,
      beneficiary1,
      holder1,
      titleEscrowCreatorInstance.address,
      {
        from: beneficiary1
      }
    );

    await ERC721Instance.safeMint(escrowInstance.address, SAMPLE_TOKEN_ID);

    const attemptToTransferByBeneficiay = escrowInstance.transferToNewEscrow(beneficiary2, holder2, {
      from: beneficiary1
    });
    await expect(attemptToTransferByBeneficiay).to.be.rejectedWith(
      /HasHolder: only the holder may invoke this function/
    );

    const attemptToTransferByCarrier = escrowInstance.transferToNewEscrow(beneficiary2, holder2, {from: carrier1});
    await expect(attemptToTransferByCarrier).to.be.rejectedWith(/HasHolder: only the holder may invoke this function/);
  });

  it("should not allow holder to execute transferToNewEscrow to other targets not appointed by beneficiary", async () => {
    const titleEscrowCreatorInstance = await TitleEscrowCreator.new();
    const escrowInstance = await TitleEscrow.new(
      ERC721Address,
      beneficiary1,
      holder1,
      titleEscrowCreatorInstance.address,
      {
        from: beneficiary1
      }
    );

    await ERC721Instance.safeMint(escrowInstance.address, SAMPLE_TOKEN_ID);

    await escrowInstance.approveNewTransferTargets(beneficiary2, holder2, {from: beneficiary1});

    const attemptToTransfer = escrowInstance.transferToNewEscrow(carrier1, carrier1, {from: holder1});

    await expect(attemptToTransfer).to.be.rejectedWith(/TitleEscrow: Beneficiary has not been endorsed by beneficiary/);
  });

  it("should not allow _transferTo to be called by any user", async () => {
    const titleEscrowCreatorInstance = await TitleEscrowCreator.new();
    const escrowInstance = await TitleEscrow.new(
      ERC721Address,
      beneficiary1,
      holder1,
      titleEscrowCreatorInstance.address,
      {
        from: beneficiary1
      }
    );
    // eslint-disable-next-line no-underscore-dangle
    expect(escrowInstance._transferTo).to.be.undefined;
  });
});
