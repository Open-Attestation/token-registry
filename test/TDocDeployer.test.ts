import { ethers, waffle } from "hardhat";
import { TDocDeployer, TradeTrustERC721Impl } from "@tradetrust/contracts";
import faker from "faker";
import { ContractTransaction } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { DeploymentEvent } from "@tradetrust/contracts/TDocDeployer";
import { expect } from ".";
import { encodeInitParams, getEventFromReceipt } from "../src/utils";
import { defaultAddress, contractInterfaceId } from "../src/constants";
import { deployTDocDeployerFixture, deployTradeTrustERC721ImplFixture } from "./fixtures";
import { getTestUsers, TestUsers } from "./helpers";

const { loadFixture } = waffle;

describe("TDocDeployer", async () => {
  let users: TestUsers;
  let deployer: SignerWithAddress;

  let deployerContract: TDocDeployer;
  let implContract: TradeTrustERC721Impl;
  let fakeTitleEscrowFactory: string;

  let deployerContractAsOwner: TDocDeployer;
  let deployerContractAsNonOwner: TDocDeployer;

  beforeEach(async () => {
    users = await getTestUsers();
    deployer = users.carrier;

    fakeTitleEscrowFactory = ethers.utils.getAddress(faker.finance.ethereumAddress());

    [implContract, deployerContract] = await Promise.all([
      loadFixture(deployTradeTrustERC721ImplFixture({ deployer })),
      loadFixture(deployTDocDeployerFixture({ deployer })),
    ]);

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

      it("should not allow adding an already added implementation", async () => {
        const tx = deployerContractAsOwner.addImplementation(implContract.address, fakeTitleEscrowFactory);

        await expect(tx).to.be.revertedWith("TDocDeployer: Already added");
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

      await expect(tx).to.be.revertedWith("TDocDeployer: Not whitelisted");
    });

    it("should revert when registry admin is zero address", async () => {
      const initParams = encodeInitParams({
        name: fakeTokenName,
        symbol: fakeTokenSymbol,
        deployer: defaultAddress.Zero,
      });
      const tx = deployerContractAsNonOwner.deploy(implContract.address, initParams);

      await expect(tx).to.be.revertedWith("TDocDeployer: Init fail");
    });

    describe("Deploy", () => {
      let createTx: ContractTransaction;
      let clonedRegistryContract: TradeTrustERC721Impl;
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
        clonedRegistryContract = (await ethers.getContractFactory("TradeTrustERC721Impl")).attach(
          event.args.deployed
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

      it("should clone TradeTrustERC721Impl", async () => {
        const interfaceId = contractInterfaceId.TradeTrustERC721;

        const res = await clonedRegistryContract.supportsInterface(interfaceId);

        expect(res).to.be.true;
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
    });
  });
});
