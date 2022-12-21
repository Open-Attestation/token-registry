import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import faker from "faker";
import { ContractTransaction, Signer } from "ethers";
import { DummyContractMock, TitleEscrow, TitleEscrowFactory } from "@tradetrust/contracts";
import { TitleEscrowCreatedEvent } from "@tradetrust/contracts/contracts/TitleEscrowFactory";
import { expect } from ".";
import { deployEscrowFactoryFixture } from "./fixtures";
import { computeTitleEscrowAddress, getEventFromReceipt } from "../src/utils";
import { contractInterfaceId, defaultAddress } from "../src/constants";
import { createDeployFixtureRunner, getTestUsers, impersonateAccount, TestUsers } from "./helpers";

describe("TitleEscrowFactory", async () => {
  let users: TestUsers;

  let titleEscrowFactory: TitleEscrowFactory;

  let deployFixturesRunner: () => Promise<[TitleEscrowFactory]>;

  // eslint-disable-next-line no-undef
  before(async () => {
    users = await getTestUsers();

    deployFixturesRunner = async () =>
      createDeployFixtureRunner(deployEscrowFactoryFixture({ deployer: users.carrier }));
  });

  beforeEach(async () => {
    [titleEscrowFactory] = await loadFixture(deployFixturesRunner);
  });

  describe("Implementation", () => {
    let implAddr: string;
    let titleEscrowContract: TitleEscrow;

    beforeEach(async () => {
      implAddr = await titleEscrowFactory.implementation();
      titleEscrowContract = (await ethers.getContractFactory("TitleEscrow")).attach(implAddr) as TitleEscrow;
    });

    it("should have an implementation", async () => {
      expect(implAddr).to.not.equal(defaultAddress.Zero);
    });

    it("should have the correct title escrow implementation", async () => {
      const interfaceId = contractInterfaceId.TitleEscrow;

      const res = await titleEscrowContract.supportsInterface(interfaceId);

      expect(res).to.be.true;
    });

    it("should initialise implementation", async () => {
      const zeroAddress = defaultAddress.Zero;
      const [registry, beneficiary, holder, tokenId] = await Promise.all([
        titleEscrowContract.registry(),
        titleEscrowContract.beneficiary(),
        titleEscrowContract.holder(),
        titleEscrowContract.tokenId(),
      ]);

      expect(registry).to.equal(zeroAddress);
      expect(beneficiary).to.equal(zeroAddress);
      expect(holder).to.equal(zeroAddress);
      expect(tokenId).to.equal(ethers.constants.HashZero);
    });

    it("should not allow initialising implementation externally", async () => {
      const punk = users.others[faker.datatype.number(users.others.length - 1)];
      const badAddress = faker.finance.ethereumAddress();

      const tx = titleEscrowContract.connect(punk).initialize(badAddress, "123");

      await expect(tx).to.be.revertedWith("Initializable: contract is already initialized");
    });

    it("should not allow calling shred on implementation", async () => {
      const punk = users.others[faker.datatype.number(users.others.length - 1)];

      const tx = titleEscrowContract.connect(punk).shred();

      await expect(tx).to.be.reverted;
    });
  });

  describe("Create Title Escrow Contract", () => {
    let tokenId: string;

    beforeEach(async () => {
      tokenId = faker.datatype.hexaDecimal(64);
    });

    describe("Create Caller", () => {
      it("should revert when calls create from an EOA", async () => {
        const eoa = users.others[faker.datatype.number(users.others.length - 1)];

        const tx = titleEscrowFactory.connect(eoa).create(tokenId);

        await expect(tx).to.be.revertedWithCustomError(titleEscrowFactory, "CreateCallerNotContract");
      });

      it("should call create successfully from a contract", async () => {
        const dummyContractMock = (await (
          await ethers.getContractFactory("DummyContractMock")
        ).deploy()) as DummyContractMock;
        const mockContractSigner = await impersonateAccount({ address: dummyContractMock.address });

        const tx = titleEscrowFactory.connect(mockContractSigner).create(tokenId);

        await expect(tx).to.not.be.reverted;
      });
    });

    describe("Create Title Escrow Behaviours", () => {
      let mockContractSigner: Signer;
      let titleEscrowFactoryCreateTx: ContractTransaction;
      let titleEscrowContract: TitleEscrow;

      beforeEach(async () => {
        const dummyContractMock = (await (
          await ethers.getContractFactory("DummyContractMock")
        ).deploy()) as DummyContractMock;
        mockContractSigner = await impersonateAccount({ address: dummyContractMock.address });
        titleEscrowFactoryCreateTx = await titleEscrowFactory.connect(mockContractSigner).create(tokenId);

        const receipt = await titleEscrowFactoryCreateTx.wait();
        const titleEscrowAddress = getEventFromReceipt<TitleEscrowCreatedEvent>(
          receipt,
          titleEscrowFactory.interface.getEventTopic("TitleEscrowCreated")
        ).args.titleEscrow;

        titleEscrowContract = (await ethers.getContractFactory("TitleEscrow")).attach(
          titleEscrowAddress
        ) as TitleEscrow;
      });

      it("should create with the correct token registry address", async () => {
        const registryAddress = await titleEscrowContract.registry();
        const signerAddress = await mockContractSigner.getAddress();

        expect(registryAddress).to.equal(signerAddress);
      });

      it("should emit TitleEscrowCreated event", async () => {
        const signerAddress = await mockContractSigner.getAddress();

        expect(titleEscrowFactoryCreateTx)
          .to.emit(titleEscrowFactory, "TitleEscrowCreated")
          .withArgs(titleEscrowContract.address, signerAddress, tokenId);
      });
    });
  });

  describe("Compute Title Escrow address", () => {
    it("should return the correct title escrow address", async () => {
      const fakeRegistryAddress = faker.finance.ethereumAddress();
      const tokenId = faker.datatype.hexaDecimal(64);
      const implementationAddr = await titleEscrowFactory.implementation();
      const expectedAddress = computeTitleEscrowAddress({
        registryAddress: fakeRegistryAddress,
        tokenId,
        implementationAddress: implementationAddr,
        factoryAddress: titleEscrowFactory.address,
      });

      const res = await titleEscrowFactory.getAddress(fakeRegistryAddress, tokenId);

      expect(res).to.equal(expectedAddress);
    });
  });
});
