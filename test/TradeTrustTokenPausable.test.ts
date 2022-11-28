import { TitleEscrow, TradeTrustToken, TradeTrustTokenMock } from "@tradetrust/contracts";
import faker from "faker";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from ".";
import { deployTokenFixture, DeployTokenFixtureRunner, mintTokenFixture } from "./fixtures";
import {
  createDeployFixtureRunner,
  getTestUsers,
  impersonateAccount,
  TestUsers,
  toAccessControlRevertMessage,
} from "./helpers";
import { roleHash } from "../src/constants";

describe("TradeTrustToken Pausable Behaviour", async () => {
  let users: TestUsers;
  let registryContract: TradeTrustToken;

  let registryContractAsAdmin: TradeTrustToken;
  let registryContractAsNonAdmin: TradeTrustToken;

  let deployTokenFixturesRunner: DeployTokenFixtureRunner;

  // eslint-disable-next-line no-undef
  before(async () => {
    users = await getTestUsers();

    deployTokenFixturesRunner = async () =>
      createDeployFixtureRunner(
        ...(await deployTokenFixture<TradeTrustToken>({
          tokenContractName: "TradeTrustToken",
          tokenName: "The Great Shipping Company",
          tokenInitials: "GSC",
          deployer: users.carrier,
        }))
      );
  });

  describe("Rights to pause and unpause registry", () => {
    beforeEach(async () => {
      [, registryContract] = await loadFixture(deployTokenFixturesRunner);

      registryContractAsAdmin = registryContract.connect(users.carrier);
      registryContractAsNonAdmin = registryContract.connect(users.beneficiary);
    });

    describe("When registry is paused", () => {
      beforeEach(async () => {
        await registryContractAsAdmin.pause();

        const paused = await registryContract.paused();

        expect(paused).to.be.true;
      });

      it("should allow admin to unpause", async () => {
        await registryContractAsAdmin.unpause();

        const paused = await registryContract.paused();

        expect(paused).to.be.false;
      });

      it("should not allow non-admin to unpause", async () => {
        const tx = registryContractAsNonAdmin.unpause();

        await expect(tx).to.be.revertedWith(
          toAccessControlRevertMessage(users.beneficiary.address, roleHash.DefaultAdmin)
        );
      });
    });

    describe("When registry is unpaused", () => {
      beforeEach(async () => {
        const paused = await registryContract.paused();

        expect(paused).to.be.false;
      });

      it("should allow admin to pause", async () => {
        await registryContractAsAdmin.pause();

        const paused = await registryContract.paused();

        expect(paused).to.be.true;
      });

      it("should not allow non-admin to pause", async () => {
        const tx = registryContractAsNonAdmin.pause();

        await expect(tx).to.be.revertedWith(
          toAccessControlRevertMessage(users.beneficiary.address, roleHash.DefaultAdmin)
        );
      });
    });
  });

  describe("When Token Registry is paused", () => {
    let tokenId: string;

    beforeEach(async () => {
      tokenId = faker.datatype.hexaDecimal(64);
    });

    describe("Minting and Transfers", () => {
      it("should not allow minting of tokens", async () => {
        await registryContractAsAdmin.pause();

        const tx = registryContractAsAdmin.mint(users.beneficiary.address, users.beneficiary.address, tokenId);

        await expect(tx).to.be.revertedWith("Pausable: paused");
      });

      it("should not allow transfers token", async () => {
        const [titleEscrowFactoryContract, registryContractMock] = await deployTokenFixture<TradeTrustTokenMock>({
          tokenContractName: "TradeTrustTokenMock",
          tokenName: "The Great Shipping Company",
          tokenInitials: "GSC",
          deployer: users.carrier,
        });
        const tokenRecipientAddress = await titleEscrowFactoryContract.getAddress(
          registryContractMock.address,
          tokenId
        );
        const tokenRecipientSigner = await impersonateAccount({ address: tokenRecipientAddress });
        await registryContractMock.mintInternal(tokenRecipientAddress, tokenId);
        await registryContractMock.pause();

        const tx = registryContractMock
          .connect(tokenRecipientSigner)
          .transferFrom(tokenRecipientAddress, users.holder.address, tokenId);

        await expect(tx).to.be.revertedWith("Pausable: paused");
      });
    });

    describe("Token Registry and Title Escrow Behaviours", () => {
      let titleEscrowContract: TitleEscrow;

      // eslint-disable-next-line no-undef
      let deployFixturesRunner: () => Promise<[TradeTrustToken, TitleEscrow]>;

      // eslint-disable-next-line no-undef
      before(async () => {
        deployFixturesRunner = async () => {
          const [, registryContractFixture] = await deployTokenFixture<TradeTrustToken>({
            tokenContractName: "TradeTrustToken",
            tokenName: "The Great Shipping Company",
            tokenInitials: "GSC",
            deployer: users.carrier,
          });
          const registryContractFixtureAsAdmin = registryContractFixture.connect(users.carrier);

          const { titleEscrow: titleEscrowFixture } = await mintTokenFixture({
            token: registryContractFixtureAsAdmin,
            beneficiary: users.beneficiary,
            holder: users.beneficiary,
            tokenId,
          });

          return [registryContractFixture, titleEscrowFixture];
        };
      });

      beforeEach(async () => {
        [registryContract, titleEscrowContract] = await loadFixture(deployFixturesRunner);

        registryContractAsAdmin = registryContract.connect(users.carrier);
        registryContractAsNonAdmin = registryContract.connect(users.beneficiary);
      });

      describe("Token Registry Behaviour", () => {
        beforeEach(async () => {
          await titleEscrowContract.connect(users.beneficiary).surrender();
          await registryContractAsAdmin.pause();

          const paused = await registryContract.paused();

          expect(paused).to.be.true;
        });

        it("should not allow restoring token", async () => {
          const tx = registryContractAsAdmin.restore(tokenId);

          await expect(tx).to.be.revertedWith("Pausable: paused");
        });

        it("should not allow accepting token", async () => {
          const tx = registryContractAsAdmin.burn(tokenId);

          await expect(tx).to.be.revertedWith("Pausable: paused");
        });
      });

      describe("Title Escrow Behaviour", () => {
        beforeEach(async () => {
          await registryContractAsAdmin.pause();

          const paused = await registryContract.paused();

          expect(paused).to.be.true;
        });

        it("should not allow onERC721Received", async () => {
          const fakeAddress = faker.finance.ethereumAddress();
          const tx = titleEscrowContract.onERC721Received(fakeAddress, fakeAddress, tokenId, "0x00");

          expect(tx).to.be.revertedWithCustomError(titleEscrowContract, "RegistryContractPaused");
        });

        it("should not allow surrendering", async () => {
          const tx = titleEscrowContract.connect(users.beneficiary).surrender();

          await expect(tx).to.be.revertedWithCustomError(titleEscrowContract, "RegistryContractPaused");
        });

        it("should not allow shredding", async () => {
          const tx = titleEscrowContract.shred();

          await expect(tx).to.be.revertedWithCustomError(titleEscrowContract, "RegistryContractPaused");
        });

        it("should not allow nomination of beneficiary", async () => {
          const tx = titleEscrowContract.nominate(users.beneficiary.address);

          await expect(tx).to.be.revertedWithCustomError(titleEscrowContract, "RegistryContractPaused");
        });

        it("should not allow transfer of beneficiary", async () => {
          const tx = titleEscrowContract.transferBeneficiary(users.beneficiary.address);

          await expect(tx).to.be.revertedWithCustomError(titleEscrowContract, "RegistryContractPaused");
        });

        it("should not allow transfer holder", async () => {
          const tx = titleEscrowContract.transferHolder(users.holder.address);

          await expect(tx).to.be.revertedWithCustomError(titleEscrowContract, "RegistryContractPaused");
        });

        it("should not allow endorse beneficiary and transfer holder", async () => {
          const tx = titleEscrowContract.transferOwners(users.beneficiary.address, users.holder.address);

          await expect(tx).to.be.revertedWithCustomError(titleEscrowContract, "RegistryContractPaused");
        });
      });
    });
  });
});
