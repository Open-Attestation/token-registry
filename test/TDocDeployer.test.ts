import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { TDocDeployer, TradeTrustTokenStandard } from "@tradetrust/contracts";
import { DeploymentEvent } from "@tradetrust/contracts/contracts/utils/TDocDeployer";
import faker from "faker";
import { ContractTransaction } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from ".";
import { encodeInitParams, getEventFromReceipt } from "../src/utils";
import { defaultAddress, contractInterfaceId } from "../src/constants";
import { deployTDocDeployerFixture, deployTradeTrustTokenStandardFixture } from "./fixtures";
import { createDeployFixtureRunner, getTestUsers, TestUsers } from "./helpers";

describe("TDocDeployer", async () => {
  let users: TestUsers;
  let deployer: SignerWithAddress;

  let deployerContract: TDocDeployer;
  let implContract: TradeTrustTokenStandard;
  let fakeTitleEscrowFactory: string;

  let deployerContractAsOwner: TDocDeployer;
  let deployerContractAsNonOwner: TDocDeployer;

  let deployFixturesRunner: () => Promise<[TradeTrustTokenStandard, TDocDeployer]>;

  // eslint-disable-next-line no-undef
  before(async () => {
    users = await getTestUsers();
    deployer = users.carrier;

    deployFixturesRunner = async () =>
      createDeployFixtureRunner(
        deployTradeTrustTokenStandardFixture({ deployer }),
        deployTDocDeployerFixture({ deployer })
      );
  });

  beforeEach(async () => {
    fakeTitleEscrowFactory = ethers.utils.getAddress(faker.finance.ethereumAddress());

    [implContract, deployerContract] = await loadFixture(deployFixturesRunner);

    deployerContractAsOwner = deployerContract.connect(deployer);
    deployerContractAsNonOwner = deployerContract.connect(users.beneficiary);
  });

  describe("Deployer Implementation", () => {
    let deployerImpl: TDocDeployer;

    beforeEach(async () => {
      deployerImpl = (await (await ethers.getContractFactory("TDocDeployer"))
        .connect(deployer)
        .deploy()) as TDocDeployer;
    });

    it("should initialise deployer implementation", async () => {
      const tx = deployerImpl.initialize();

      await expect(tx).to.be.revertedWith("Initializable: contract is already initialized");
    });

    it("should have zero address as owner", async () => {
      const res = await deployerImpl.owner();

      expect(res).to.equal(defaultAddress.Zero);
    });
  });

  describe("Upgrade Deployer", () => {
    let mockDeployerImpl: TDocDeployer;

    beforeEach(async () => {
      mockDeployerImpl = (await (await ethers.getContractFactory("TDocDeployer")).deploy()) as TDocDeployer;
    });

    it("should allow owner to upgrade", async () => {
      const tx = deployerContractAsOwner.upgradeTo(mockDeployerImpl.address);

      await expect(tx).to.not.be.reverted;
    });

    it("should not allow non-owner to upgrade", async () => {
      const tx = deployerContractAsNonOwner.upgradeTo(mockDeployerImpl.address);

      await expect(tx).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("Implementation Administration", () => {
    it("should have the correct owner", async () => {
      const res = await deployerContract.owner();

      expect(res).to.equal(deployer.address);
    });

    describe("Adding Implementation", () => {
      beforeEach(async () => {
        await deployerContractAsOwner.addImplementation(implContract.address, fakeTitleEscrowFactory);
      });

      it("should add implementation correctly", async () => {
        const res = await deployerContractAsNonOwner.implementations(implContract.address);

        expect(res).to.equal(fakeTitleEscrowFactory);
      });

      it("should emit AddImplementation when add implementation", async () => {
        const tx = await deployerContractAsNonOwner.implementations(implContract.address);

        expect(tx)
          .to.emit(deployerContract, "AddImplementation")
          .withArgs(implContract.address, fakeTitleEscrowFactory);
      });

      it("should not allow adding an already added implementation", async () => {
        const tx = deployerContractAsOwner.addImplementation(implContract.address, fakeTitleEscrowFactory);

        await expect(tx).to.be.revertedWithCustomError(deployerContractAsNonOwner, "ImplementationAlreadyAdded");
      });

      it("should not allow non-owner to add implementation", async () => {
        const tx = deployerContractAsNonOwner.addImplementation(implContract.address, fakeTitleEscrowFactory);

        await expect(tx).to.be.revertedWith("Ownable: caller is not the owner");
      });
    });

    describe("Removing Implementation", () => {
      it("should remove implementation correctly", async () => {
        await deployerContractAsOwner.addImplementation(implContract.address, fakeTitleEscrowFactory);
        const initialRes = await deployerContract.implementations(implContract.address);

        await deployerContractAsOwner.removeImplementation(implContract.address);
        const currentRes = await deployerContract.implementations(implContract.address);

        expect(initialRes).to.equal(fakeTitleEscrowFactory);
        expect(currentRes).to.equal(defaultAddress.Zero);
      });

      it("should not allow non-owner to remove implementation", async () => {
        const tx = deployerContractAsNonOwner.removeImplementation(implContract.address);

        await expect(tx).to.be.revertedWith("Ownable: caller is not the owner");
      });

      it("should not allow removing an invalid implementation", async () => {
        const fakeImplContract = faker.finance.ethereumAddress();

        const tx = deployerContractAsOwner.removeImplementation(fakeImplContract);

        await expect(tx).to.be.revertedWithCustomError(deployerContractAsNonOwner, "InvalidImplementation");
      });
    });
  });

  describe("Deployment Behaviours", () => {
    let fakeTokenName: string;
    let fakeTokenSymbol: string;
    let registryAdmin: SignerWithAddress;

    beforeEach(async () => {
      fakeTokenName = "The Great Shipping Co.";
      fakeTokenSymbol = "GSC";
      registryAdmin = users.others[faker.datatype.number(users.others.length - 1)];

      await deployerContractAsOwner.addImplementation(implContract.address, fakeTitleEscrowFactory);
    });

    it("should not allow non-whitelisted implementations", async () => {
      const fakeAddress = faker.finance.ethereumAddress();
      const initParams = encodeInitParams({
        name: fakeTokenName,
        symbol: fakeTokenSymbol,
        deployer: registryAdmin.address,
      });
      const tx = deployerContractAsNonOwner.deploy(fakeAddress, initParams);

      await expect(tx).to.be.revertedWithCustomError(
        deployerContractAsNonOwner,
        "UnsupportedImplementationContractAddress"
      );
    });

    it("should revert when registry admin is zero address", async () => {
      const initParams = encodeInitParams({
        name: fakeTokenName,
        symbol: fakeTokenSymbol,
        deployer: defaultAddress.Zero,
      });
      const tx = deployerContractAsNonOwner.deploy(implContract.address, initParams);

      await expect(tx).to.be.revertedWithCustomError(deployerContractAsNonOwner, "ImplementationInitializationFailure");
    });

    describe("Deploy", () => {
      let createTx: ContractTransaction;
      let clonedRegistryContract: TradeTrustTokenStandard;
      let initParams: string;

      beforeEach(async () => {
        initParams = encodeInitParams({
          name: fakeTokenName,
          symbol: fakeTokenSymbol,
          deployer: registryAdmin.address,
        });
        createTx = await deployerContractAsNonOwner.deploy(implContract.address, initParams);
        const createReceipt = await createTx.wait();
        const event = getEventFromReceipt<DeploymentEvent>(
          createReceipt,
          deployerContract.interface.getEventTopic("Deployment")
        );
        clonedRegistryContract = (await ethers.getContractFactory("TradeTrustTokenStandard")).attach(
          event.args.deployed
        ) as TradeTrustTokenStandard;
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

          expect(res).to.equal(fakeTitleEscrowFactory);
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

      it("should emit Deployment event", async () => {
        expect(createTx)
          .to.emit(deployerContract, "Deployment")
          .withArgs(
            clonedRegistryContract.address,
            implContract.address,
            users.beneficiary.address,
            fakeTitleEscrowFactory,
            initParams
          );
      });

      describe("Clone TradeTrustTokenStandard with key interfaces", () => {
        it("should support ITradeTrustTokenMintable", async () => {
          const interfaceId = contractInterfaceId.TradeTrustTokenMintable;

          const res = await clonedRegistryContract.supportsInterface(interfaceId);

          expect(res).to.be.true;
        });

        it("should support ITradeTrustTokenBurnable", async () => {
          const interfaceId = contractInterfaceId.TradeTrustTokenBurnable;

          const res = await clonedRegistryContract.supportsInterface(interfaceId);

          expect(res).to.be.true;
        });

        it("should support ITradeTrustTokenRestorable", async () => {
          const interfaceId = contractInterfaceId.TradeTrustTokenRestorable;

          const res = await clonedRegistryContract.supportsInterface(interfaceId);

          expect(res).to.be.true;
        });

        it("should support the SBT interface", async () => {
          const interfaceId = contractInterfaceId.SBT;

          const res = await clonedRegistryContract.supportsInterface(interfaceId);

          expect(res).to.be.true;
        });
      });
    });
  });
});
