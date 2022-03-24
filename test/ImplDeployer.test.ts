import { ethers, waffle } from "hardhat";
import { ImplDeployer, TradeTrustERC721Impl } from "@tradetrust/contracts";
import faker from "faker";
import { ContractTransaction } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from ".";
import { getEventFromTransaction, getTestUsers, TestUsers } from "./utils";
import { computeInterfaceId } from "./utils/computeInterfaceId";
import { ContractInterfaces } from "./fixtures/contract-interfaces.fixture";
import { deployImplDeployerFixture, deployTradeTrustERC721ImplFixture } from "./fixtures";
import { encodeInitParams } from "../src/utils";

const { loadFixture } = waffle;

describe("ImplDeployer", async () => {
  let users: TestUsers;
  let deployer: SignerWithAddress;

  let deployerContract: ImplDeployer;
  let implContract: TradeTrustERC721Impl;

  let deployerContractAsOwner: ImplDeployer;
  let deployerContractAsNonOwner: ImplDeployer;

  const createEventAbi = ["event Deployment (address indexed deployed, address indexed implementation, bytes params)"];

  beforeEach(async () => {
    users = await getTestUsers();
    deployer = users.carrier;

    [implContract, deployerContract] = await Promise.all([
      loadFixture(deployTradeTrustERC721ImplFixture({ deployer })),
      loadFixture(deployImplDeployerFixture({ deployer })),
    ]);

    deployerContractAsOwner = deployerContract.connect(deployer);
    deployerContractAsNonOwner = deployerContract.connect(users.beneficiary);
  });

  describe("Implementation Administration", () => {
    describe("Adding Implementation", () => {
      beforeEach(async () => {
        await deployerContractAsOwner.addImpl(implContract.address);
      });

      it("should add implementation correctly", async () => {
        const res = await deployerContractAsNonOwner.implementations(implContract.address);

        expect(res).to.be.true;
      });

      it("should not allow adding an already added implementation", async () => {
        const tx = deployerContractAsOwner.addImpl(implContract.address);

        await expect(tx).to.be.revertedWith("ImplDeployer: Already added");
      });

      it("should not allow non-owner to add implementation", async () => {
        const tx = deployerContractAsNonOwner.addImpl(implContract.address);

        await expect(tx).to.be.revertedWith("Ownable: caller is not the owner");
      });
    });

    describe("Removing Implementation", () => {
      it("should remove implementation correctly", async () => {
        await deployerContractAsOwner.addImpl(implContract.address);
        const initialRes = await deployerContract.implementations(implContract.address);

        await deployerContractAsOwner.removeImpl(implContract.address);
        const currentRes = await deployerContract.implementations(implContract.address);

        expect(initialRes).to.be.true;
        expect(currentRes).to.be.false;
      });

      it("should not allow non-owner to remove implementation", async () => {
        const tx = deployerContractAsNonOwner.removeImpl(implContract.address);

        await expect(tx).to.be.revertedWith("Ownable: caller is not the owner");
      });
    });
  });

  describe("Deployment Behaviours", () => {
    let fakeTokenName: string;
    let fakeTokenSymbol: string;
    let fakeTitleEscrowFactoryAddr: string;
    let registryAdmin: SignerWithAddress;

    beforeEach(async () => {
      fakeTokenName = "The Great Shipping Co.";
      fakeTokenSymbol = "GSC";
      fakeTitleEscrowFactoryAddr = ethers.utils.getAddress(faker.finance.ethereumAddress());
      registryAdmin = users.others[faker.datatype.number(users.others.length - 1)];

      await deployerContractAsOwner.addImpl(implContract.address);
    });

    it("should not allow non-whitelisted implementations", async () => {
      const fakeAddress = faker.finance.ethereumAddress();
      const initParams = encodeInitParams({
        name: fakeTokenName,
        symbol: fakeTokenSymbol,
        titleEscrowFactory: fakeTitleEscrowFactoryAddr,
        deployer: registryAdmin.address,
      });
      const tx = deployerContractAsNonOwner.deploy(fakeAddress, initParams);

      await expect(tx).to.be.revertedWith("ImplDeployer: Not whitelisted");
    });

    it("should revert when registry admin is zero address", async () => {
      const initParams = encodeInitParams({
        name: fakeTokenName,
        symbol: fakeTokenSymbol,
        titleEscrowFactory: fakeTitleEscrowFactoryAddr,
        deployer: ethers.constants.AddressZero,
      });
      const tx = deployerContractAsNonOwner.deploy(implContract.address, initParams);

      await expect(tx).to.be.revertedWith("ImplDeployer: Init fail");
    });

    describe("Deploy", () => {
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
        createTx = await deployerContractAsNonOwner.deploy(implContract.address, initParams);
        const registryCreatedEvent = await getEventFromTransaction(createTx, createEventAbi, "Deployment");
        clonedRegistryContract = (await ethers.getContractFactory("TradeTrustERC721Impl")).attach(
          registryCreatedEvent.deployed as string
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

      it("should emit Deployment event", async () => {
        expect(createTx)
          .to.emit(deployerContract, "Deployment")
          .withArgs(clonedRegistryContract.address, implContract.address, initParams);
      });
    });
  });
});
