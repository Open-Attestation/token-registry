const {expect} = require("chai").use(require("chai-as-promised"));
const ethers = require("ethers");

const Erc721 = artifacts.require("TradeTrustERC721");
const Erc721WithTitleEscrow = artifacts.require("TradeTrustERC721WithTitleEscrow");
const TitleEscrow = artifacts.require("TitleEscrow");

const SAMPLE_TOKEN_ID = "0x624d0d7ae6f44d41d368d8280856dbaac6aa29fb3b35f45b80a7c1c90032eeb3";

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

  const merkleRoot = "0x624d0d7ae6f44d41d368d8280856dbaac6aa29fb3b35f45b80a7c1c90032eeb3";
  const merkleRoot1 = "0x624d0d7ae6f44d41d368d8280856dbaac6aa29fb3b35f45b80a7c1c90032eeb4";
  const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
  const BURN_ADDRESS = "0x000000000000000000000000000000000000dEaD";

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
  });
});


contract("TradeTrustErc721WithTitleEscrow", accounts => {

  const carrier1 = accounts[0];
  const beneficiary1 = accounts[1];
  const beneficiary2 = accounts[2];
  const holder1 = accounts[3];
  const holder2 = accounts[4];

  let ERC721Address = "";
  let ERC721Instance;

  beforeEach("", async () => {
    ERC721Instance = await Erc721WithTitleEscrow.new("foo", "bar");
    // ERC721Instance = await Erc721.new("foo", "bar");
    ERC721Address = ERC721Instance.address;
  });
  it("should be able to transfer to a new owner and holder instantly", async () => {
    // const titleEscrowCreatorInstance = await TitleEscrowCreator.new();
    const escrowInstance = await TitleEscrow.new(
      ERC721Address,
      beneficiary1,
      beneficiary1,
      {
        from: beneficiary1
      }
    );

    await ERC721Instance.safeMint(escrowInstance.address, SAMPLE_TOKEN_ID);

    // const receipt = await escrowInstance.transferToNewEscrow(beneficiary2, holder2, {from: beneficiary1});
    const receipt = await ERC721Instance.transferToNewTitleEscrow(beneficiary2, holder2, SAMPLE_TOKEN_ID, {from: beneficiary1});
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
  it("should allow holder to execute transferToNewEscrow when new beneficiary and holder has been appointed by beneficiary", async () => {
    // const titleEscrowCreatorInstance = await TitleEscrowCreator.new();
    const escrowInstance = await TitleEscrow.new(
      ERC721Address,
      beneficiary1,
      holder1,
      {
        from: beneficiary1
      }
    );

    await ERC721Instance.safeMint(escrowInstance.address, SAMPLE_TOKEN_ID);

    await escrowInstance.approveNewTransferTargets(beneficiary2, holder2, {from: beneficiary1});

    await ERC721Instance.transferToNewTitleEscrow(beneficiary2, holder2, SAMPLE_TOKEN_ID, {from: holder1});

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
    // const titleEscrowCreatorInstance = await TitleEscrowCreator.new();
    const escrowInstance = await TitleEscrow.new(
      ERC721Address,
      beneficiary1,
      holder1,
      {
        from: beneficiary1
      }
    );

    await ERC721Instance.safeMint(escrowInstance.address, SAMPLE_TOKEN_ID);

    const attemptToTransfer = escrowInstance.transferToNewEscrow(beneficiary2, holder2, {from: holder1});

    await expect(attemptToTransfer).to.be.rejectedWith(/TitleEscrow: Beneficiary has not been endorsed by beneficiary/);
  });

  it("should not allow anyone else (esp beneficiary) to execute transferToNewEscrow when new beneficiary and holder has been appointed", async () => {
    // const titleEscrowCreatorInstance = await TitleEscrowCreator.new();
    const escrowInstance = await TitleEscrow.new(
      ERC721Address,
      beneficiary1,
      holder1,
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
    // const titleEscrowCreatorInstance = await TitleEscrowCreator.new();
    const escrowInstance = await TitleEscrow.new(
      ERC721Address,
      beneficiary1,
      holder1,
      {
        from: beneficiary1
      }
    );

    await ERC721Instance.safeMint(escrowInstance.address, SAMPLE_TOKEN_ID);

    await escrowInstance.approveNewTransferTargets(beneficiary2, holder2, {from: beneficiary1});

    const attemptToTransfer = escrowInstance.transferToNewEscrow(carrier1, carrier1, {from: holder1});

    await expect(attemptToTransfer).to.be.rejectedWith(/TitleEscrow: Beneficiary has not been endorsed by beneficiary/);
  });
})
