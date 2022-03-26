import { waffle, ethers } from "hardhat";
import faker from "faker";
import { ContractTransaction } from "ethers";
import { TitleEscrow, TitleEscrowFactory } from "@tradetrust/contracts";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from ".";
import { deployEscrowFactoryFixture } from "./fixtures";
import { getTestUsers, TestUsers } from "./helpers";
import { computeTitleEscrowAddress, getEventFromTransaction } from "../src/utils";
import { computeInterfaceId } from "./helpers/computeInterfaceId";
import { ContractInterfaces, AddressConstants } from "../src/common";

const { loadFixture } = waffle;

describe("TitleEscrowFactory", async () => {
  let users: TestUsers;

  let titleEscrowFactory: TitleEscrowFactory;

  const createEventAbi = [
    "event TitleEscrowCreated (address indexed titleEscrow, address indexed tokenRegistry, uint256 indexed tokenId, address beneficiary, address holder)",
  ];

  beforeEach(async () => {
    users = await getTestUsers();

    titleEscrowFactory = await loadFixture(deployEscrowFactoryFixture({ deployer: users.carrier }));
  });

  describe("Implementation", () => {
    let implAddr: string;
    let titleEscrowContract: TitleEscrow;

    beforeEach(async () => {
      implAddr = await titleEscrowFactory.implementation();
      titleEscrowContract = (await ethers.getContractFactory("TitleEscrow")).attach(implAddr) as TitleEscrow;
    });

    it("should have an implementation", async () => {
      expect(implAddr).to.not.equal(AddressConstants.Zero);
    });

    it("should have the correct title escrow implementation", async () => {
      const interfaceId = computeInterfaceId(ContractInterfaces.ITitleEscrow);

      const res = await titleEscrowContract.supportsInterface(interfaceId);

      expect(res).to.be.true;
    });

    it("should initialise implementation", async () => {
      const zeroAddress = AddressConstants.Zero;
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

      const tx = titleEscrowContract.connect(punk).initialize(badAddress, badAddress, badAddress, "123");

      await expect(tx).to.be.revertedWith("Initializable: contract is already initialized");
    });

    it("should not allow calling shred on implementation", async () => {
      const punk = users.others[faker.datatype.number(users.others.length - 1)];

      const tx = titleEscrowContract.connect(punk).shred();

      await expect(tx).to.be.reverted;
    });
  });

  describe("Create Title Escrow Contract", () => {
    let fakeRegistrySigner: SignerWithAddress;
    let titleEscrowFactoryCreateTx: ContractTransaction;
    let titleEscrowContract: TitleEscrow;
    let tokenId: string;

    beforeEach(async () => {
      tokenId = faker.datatype.hexaDecimal(64);
      fakeRegistrySigner = users.others[faker.datatype.number(users.others.length - 1)];
      titleEscrowFactoryCreateTx = await titleEscrowFactory
        .connect(fakeRegistrySigner)
        .create(users.beneficiary.address, users.holder.address, tokenId);

      const event = await getEventFromTransaction(titleEscrowFactoryCreateTx, createEventAbi, "TitleEscrowCreated");
      titleEscrowContract = (await ethers.getContractFactory("TitleEscrow")).attach(
        event.titleEscrow as string
      ) as TitleEscrow;
    });

    it("should create with the correct token registry address", async () => {
      const registryAddress = await titleEscrowContract.registry();

      expect(registryAddress).to.equal(fakeRegistrySigner.address);
    });

    it("should create with the correct beneficiary", async () => {
      const beneficiary = await titleEscrowContract.beneficiary();

      expect(beneficiary).to.equal(users.beneficiary.address);
    });

    it("should create with the correct holder ", async () => {
      const holder = await titleEscrowContract.holder();

      expect(holder).to.equal(users.holder.address);
    });

    it("should emit TitleEscrowCreated event", async () => {
      expect(titleEscrowFactoryCreateTx)
        .to.emit(titleEscrowFactory, "TitleEscrowCreated")
        .withArgs(
          titleEscrowContract.address,
          fakeRegistrySigner.address,
          tokenId,
          users.beneficiary.address,
          users.holder.address
        );
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
