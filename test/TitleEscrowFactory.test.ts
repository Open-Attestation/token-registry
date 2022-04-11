import { waffle, ethers } from "hardhat";
import faker from "faker";
import { ContractTransaction } from "ethers";
import { TitleEscrowCloneable, TitleEscrowFactory } from "@tradetrust/contracts";
import { expect } from ".";
import { deployEscrowFactoryFixture } from "./fixtures";
import { getEventFromTransaction, getTestUsers, TestUsers } from "./utils";

const { loadFixture } = waffle;

describe("TitleEscrowFactory", async () => {
  let users: TestUsers;

  let titleEscrowFactory: TitleEscrowFactory;

  const createEventAbi = [
    "event TitleEscrowDeployed (address indexed escrowAddress, address indexed tokenRegistry, address beneficiary, address holder)",
  ];

  beforeEach(async () => {
    users = await getTestUsers();

    titleEscrowFactory = await loadFixture(deployEscrowFactoryFixture({ deployer: users.carrier }));
  });

  describe("Create Title Escrow Contract", () => {
    let fakeRegistryAddress: string;
    let titleEscrowFactoryCreateTx: ContractTransaction;
    let titleEscrowContract: TitleEscrowCloneable;

    beforeEach(async () => {
      fakeRegistryAddress = ethers.utils.getAddress(faker.finance.ethereumAddress());
      titleEscrowFactoryCreateTx = await titleEscrowFactory.create(
        fakeRegistryAddress,
        users.beneficiary.address,
        users.holder.address
      );

      const event = await getEventFromTransaction(titleEscrowFactoryCreateTx, createEventAbi, "TitleEscrowDeployed");
      titleEscrowContract = (await ethers.getContractFactory("TitleEscrowCloneable")).attach(
        event.escrowAddress as string
      ) as TitleEscrowCloneable;
    });

    it("should create with the correct token registry address", async () => {
      const registryAddress = await titleEscrowContract.tokenRegistry();

      expect(registryAddress).to.equal(fakeRegistryAddress);
    });

    it("should create with the correct beneficiary", async () => {
      const beneficiary = await titleEscrowContract.beneficiary();

      expect(beneficiary).to.equal(users.beneficiary.address);
    });

    it("should create with the correct holder ", async () => {
      const holder = await titleEscrowContract.holder();

      expect(holder).to.equal(users.holder.address);
    });

    it("should initialise with its own address", async () => {
      const titleEscrowFactoryAddress = await titleEscrowContract.titleEscrowFactory();

      expect(titleEscrowFactoryAddress).to.equal(titleEscrowFactory.address);
    });

    it("should emit TitleEscrowDeployed event", async () => {
      expect(titleEscrowFactoryCreateTx)
        .to.emit(titleEscrowFactory, "TitleEscrowDeployed")
        .withArgs(titleEscrowContract.address, fakeRegistryAddress, users.beneficiary.address, users.holder.address);
    });
  });
});
