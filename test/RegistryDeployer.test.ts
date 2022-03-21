import { ethers, waffle } from "hardhat";
import { RegistryDeployer, TradeTrustERC721Impl } from "@tradetrust/contracts";
import faker from "faker";
import { ContractTransaction } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from ".";
import { getEventFromTransaction, getTestUsers, TestUsers } from "./utils";
import { computeInterfaceId } from "./utils/computeInterfaceId";
import { ContractInterfaces } from "./fixtures/contract-interfaces.fixture";
import { deployRegistryImplFixture } from "./fixtures";
import { encodeInitParams } from "../src/utils";

const { loadFixture } = waffle;

const deployRegistryDeployer = (deployer: SignerWithAddress) => async () => {
  return (await (await ethers.getContractFactory("RegistryDeployer")).connect(deployer).deploy()) as RegistryDeployer;
};

describe("RegistryDeployer", async () => {
  let users: TestUsers;
  let deployer: SignerWithAddress;

  let deployerContract: RegistryDeployer;
  let implContract: TradeTrustERC721Impl;

  let deployerContractAsOwner: RegistryDeployer;
  let deployerContractasNonOwner: RegistryDeployer;

  const createEventAbi = [
    "event RegistryCreated (address indexed registry, address indexed implementation, bytes params)",
  ];

  beforeEach(async () => {
    users = await getTestUsers();
    deployer = users.carrier;

    [implContract, deployerContract] = await Promise.all([
      loadFixture(deployRegistryImplFixture({ deployer })),
      loadFixture(deployRegistryDeployer(deployer)),
    ]);

    deployerContractAsOwner = deployerContract.connect(deployer);
    deployerContractasNonOwner = deployerContract.connect(users.beneficiary);
  });

  describe("Implementation Administration", () => {
    describe("Adding Implementation", () => {
      beforeEach(async () => {
        await deployerContractAsOwner.addImplementation(implContract.address);
      });

      it("should add implementation correctly", async () => {
        const res = await deployerContractasNonOwner.implementations(implContract.address);

        expect(res).to.be.true;
      });

      it("should not allow adding an already added implementation", async () => {
        const tx = deployerContractAsOwner.addImplementation(implContract.address);

        await expect(tx).to.be.revertedWith("RegistryDeployer: Already added");
      });

      it("should not allow non-owner to add implementation", async () => {
        const tx = deployerContractasNonOwner.addImplementation(implContract.address);

        await expect(tx).to.be.revertedWith("Ownable: caller is not the owner");
      });
    });

    describe("Removing Implementation", () => {
      it("should remove implementation correctly", async () => {
        await deployerContractAsOwner.addImplementation(implContract.address);
        const initialRes = await deployerContract.implementations(implContract.address);

        await deployerContractAsOwner.removeImplementation(implContract.address);
        const currentRes = await deployerContract.implementations(implContract.address);

        expect(initialRes).to.be.true;
        expect(currentRes).to.be.false;
      });

      it("should not allow non-owner to remove implementation", async () => {
        const tx = deployerContractasNonOwner.removeImplementation(implContract.address);

        await expect(tx).to.be.revertedWith("Ownable: caller is not the owner");
      });
    });
  });

  describe("Deployment", () => {
    let fakeTokenName: string;
    let fakeTokenSymbol: string;
    let fakeTitleEscrowFactoryAddr: string;
    let registryAdmin: SignerWithAddress;

    beforeEach(async () => {
      fakeTokenName = "The Great Shipping Co.";
      fakeTokenSymbol = "GSC";
      fakeTitleEscrowFactoryAddr = ethers.utils.getAddress(faker.finance.ethereumAddress());
      registryAdmin = users.others[faker.datatype.number(users.others.length - 1)];

      await deployerContractAsOwner.addImplementation(implContract.address);
    });

    it("should not allow non-whitelisted implementations", async () => {
      const fakeAddress = faker.finance.ethereumAddress();
      const initParams = encodeInitParams({
        name: fakeTokenName,
        symbol: fakeTokenSymbol,
        titleEscrowFactory: fakeTitleEscrowFactoryAddr,
        deployer: registryAdmin.address,
      });
      const tx = deployerContractasNonOwner.create(fakeAddress, initParams);

      await expect(tx).to.be.revertedWith("RegistryDeployer: Not whitelisted");
    });

    it("should revert when registry admin is zero address", async () => {
      const initParams = encodeInitParams({
        name: fakeTokenName,
        symbol: fakeTokenSymbol,
        titleEscrowFactory: fakeTitleEscrowFactoryAddr,
        deployer: ethers.constants.AddressZero,
      });
      const tx = deployerContractasNonOwner.create(implContract.address, initParams);

      await expect(tx).to.be.revertedWith("RegistryAccess: Deployer is zero");
    });

    describe("Creation", () => {
      let createTx: ContractTransaction;
      let clonedRegistryContract: TradeTrustERC721Impl;
      let initParams: string;

      beforeEach(async () => {
        initParams = encodeInitParams({
          name: fakeTokenName,
          symbol: fakeTokenSymbol,
          titleEscrowFactory: fakeTitleEscrowFactoryAddr,
          deployer: registryAdmin.address,
        });
        createTx = await deployerContractasNonOwner.create(implContract.address, initParams);
        const registryCreatedEvent = await getEventFromTransaction(createTx, createEventAbi, "RegistryCreated");
        clonedRegistryContract = (await ethers.getContractFactory("TradeTrustERC721Impl")).attach(
          registryCreatedEvent.registry as string
        ) as TradeTrustERC721Impl;
      });

      describe("Initialisation by deployer", () => {
        it("should initialise token name", async () => {
          const res = await clonedRegistryContract.name();

          expect(res).to.equal(fakeTokenName);
        });

        it("should initialise token symbol", async () => {
          const res = await clonedRegistryContract.symbol();

          expect(res).to.equal(fakeTokenSymbol);
        });

        it("should initialise title escrow factory", async () => {
          const res = await clonedRegistryContract.titleEscrowFactory();

          expect(res).to.equal(fakeTitleEscrowFactoryAddr);
        });

        it("should initialise deployer account as admin", async () => {
          const adminRole = await clonedRegistryContract.DEFAULT_ADMIN_ROLE();
          const res = await clonedRegistryContract.hasRole(adminRole, registryAdmin.address);

          expect(res).to.be.true;
        });

        it("should not set deployer contract as admin", async () => {
          const adminRole = await clonedRegistryContract.DEFAULT_ADMIN_ROLE();
          const res = await clonedRegistryContract.hasRole(adminRole, deployerContract.address);

          expect(res).to.be.false;
        });
      });

      it("should clone TradeTrustERC721Impl", async () => {
        const interfaceId = computeInterfaceId(ContractInterfaces.ITradeTrustERC721);

        const res = await clonedRegistryContract.supportsInterface(interfaceId);

        expect(res).to.be.true;
      });

      it("should emit RegistryCreated event", async () => {
        expect(createTx)
          .to.emit(deployerContract, "RegistryCreated")
          .withArgs(clonedRegistryContract.address, implContract.address, initParams);
      });
    });
  });
});
