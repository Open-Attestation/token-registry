import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { TitleEscrow, TitleEscrowFactory, TradeTrustToken } from "@tradetrust/contracts";
import faker from "faker";
import { Signer } from "ethers";
import { expect } from ".";
import {
  getTitleEscrowContract,
  getTestUsers,
  TestUsers,
  createDeployFixtureRunner,
  impersonateAccount,
} from "./helpers";
import { contractInterfaceId, defaultAddress } from "../src/constants";
import { deployTokenFixture, DeployTokenFixtureRunner } from "./fixtures";

describe("TradeTrustToken", async () => {
  let users: TestUsers;
  let registryContract: TradeTrustToken;

  let registryName: string;
  let registrySymbol: string;

  let registryContractAsAdmin: TradeTrustToken;

  let mockTitleEscrowFactoryContract: TitleEscrowFactory;

  let tokenId: string;

  let deployTokenFixtureRunner: DeployTokenFixtureRunner;

  // eslint-disable-next-line no-undef
  before(async () => {
    users = await getTestUsers();

    registryName = "The Great Shipping Company";
    registrySymbol = "GSC";

    deployTokenFixtureRunner = async () =>
      createDeployFixtureRunner(
        ...(await deployTokenFixture<TradeTrustToken>({
          tokenContractName: "TradeTrustToken",
          tokenName: registryName,
          tokenInitials: registrySymbol,
          deployer: users.carrier,
        }))
      );
  });

  beforeEach(async () => {
    tokenId = faker.datatype.hexaDecimal(64);

    [mockTitleEscrowFactoryContract, registryContract] = await loadFixture(deployTokenFixtureRunner);

    registryContractAsAdmin = registryContract.connect(users.carrier);
  });

  describe("ERC165 Support", () => {
    it("should support ITradeTrustTokenMintable", async () => {
      const interfaceId = contractInterfaceId.TradeTrustTokenMintable;

      const res = await registryContract.supportsInterface(interfaceId);

      expect(res).to.be.true;
    });

    it("should support ITradeTrustTokenBurnable", async () => {
      const interfaceId = contractInterfaceId.TradeTrustTokenBurnable;

      const res = await registryContract.supportsInterface(interfaceId);

      expect(res).to.be.true;
    });

    it("should support ITradeTrustTokenRestorable", async () => {
      const interfaceId = contractInterfaceId.TradeTrustTokenRestorable;

      const res = await registryContract.supportsInterface(interfaceId);

      expect(res).to.be.true;
    });

    it("should support the SBT interface", async () => {
      const interfaceId = contractInterfaceId.SBT;

      const res = await registryContract.supportsInterface(interfaceId);

      expect(res).to.be.true;
    });

    it("should support AccessControl interface", async () => {
      const interfaceId = contractInterfaceId.AccessControl;

      const res = await registryContract.supportsInterface(interfaceId);

      expect(res).to.be.true;
    });
  });

  describe("Initialisation", () => {
    it("should deploy with token name", async () => {
      expect(await registryContract.name()).to.equal(registryName);
    });

    it("should deploy with symbol", async () => {
      expect(await registryContract.symbol()).to.equal(registrySymbol);
    });

    it("should deploy with genesis block", async () => {
      const genesisBlock = registryContract.deployTransaction.blockNumber;
      expect(await registryContract.genesis()).to.equal(genesisBlock);
    });

    it("should deploy with title escrow factory address", async () => {
      expect(await registryContract.titleEscrowFactory()).to.equal(mockTitleEscrowFactoryContract.address);
    });
  });

  describe("IERC721Receiver Support", () => {
    it("should have onERC721Received function", async () => {
      const fakeAddress = faker.finance.ethereumAddress();

      const tx = registryContract.onERC721Received(fakeAddress, fakeAddress, "123", "0x00");

      await expect(tx).to.not.be.rejected;
    });
  });

  describe("Registry Operation Behaviours", () => {
    let titleEscrowContract: TitleEscrow;

    beforeEach(async () => {
      await registryContractAsAdmin.mint(users.beneficiary.address, users.beneficiary.address, tokenId);
      titleEscrowContract = await getTitleEscrowContract(registryContract, tokenId);
    });

    describe("Soulbound Properties", () => {
      let titleEscrowContractSigner: Signer;

      beforeEach(async () => {
        titleEscrowContractSigner = await impersonateAccount({ address: titleEscrowContract.address });
      });

      it("should revert with TransferFailure when transfer to non-designated title escrow contract", async () => {
        const nonDesignatedTitleEscrowAddress = await mockTitleEscrowFactoryContract.getAddress(
          registryContract.address,
          faker.datatype.hexaDecimal(64)
        );

        const tx = registryContract
          .connect(titleEscrowContractSigner)
          .transferFrom(titleEscrowContract.address, nonDesignatedTitleEscrowAddress, tokenId);

        await expect(tx).to.be.revertedWithCustomError(registryContract, "TransferFailure");
      });

      it("should revert with TransferFailure when transfer to an EOA", async () => {
        const tx = registryContract
          .connect(titleEscrowContractSigner)
          .transferFrom(titleEscrowContract.address, users.beneficiary.address, tokenId);

        await expect(tx).to.be.revertedWithCustomError(registryContract, "TransferFailure");
      });

      it("should transfer successfully to registry token contract", async () => {
        await registryContract
          .connect(titleEscrowContractSigner)
          .transferFrom(titleEscrowContract.address, registryContract.address, tokenId);

        const owner = await registryContract.ownerOf(tokenId);

        expect(owner).to.equal(registryContract.address);
      });

      it("should transfer successfully to designated title escrow contract", async () => {
        const tx = registryContract
          .connect(titleEscrowContractSigner)
          .transferFrom(titleEscrowContract.address, titleEscrowContract.address, tokenId);

        await expect(tx).to.not.be.reverted;
      });
    });

    describe("Surrender Status", () => {
      // These are just extra cases to test how the surrender status will be checked in an app
      it("should not have registry and burn address as owner for an unsurrendered token", async () => {
        const owner = await registryContract.ownerOf(tokenId);

        expect(owner).to.not.equal(registryContract.address);
        expect(owner).to.not.equal(defaultAddress.Burn);
      });

      it("should have registry as owner for a surrendered token", async () => {
        await titleEscrowContract.connect(users.beneficiary).surrender();

        const owner = await registryContract.ownerOf(tokenId);

        expect(owner).to.equal(registryContract.address);
      });

      it("should have burn address as owner for an accepted token", async () => {
        await titleEscrowContract.connect(users.beneficiary).surrender();
        await registryContract.burn(tokenId);

        const owner = await registryContract.ownerOf(tokenId);

        expect(owner).to.equal(defaultAddress.Burn);
      });

      it("should not have registry and burn address as owner for a restored token", async () => {
        await titleEscrowContract.connect(users.beneficiary).surrender();
        await registryContract.restore(tokenId);

        const owner = await registryContract.ownerOf(tokenId);

        expect(owner).to.not.equal(registryContract.address);
        expect(owner).to.not.equal(defaultAddress.Burn);
      });
    });
  });
});
