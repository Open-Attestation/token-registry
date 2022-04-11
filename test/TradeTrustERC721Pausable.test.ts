import { waffle } from "hardhat";
import { TitleEscrowCloneable, TradeTrustERC721, TradeTrustERC721Mock } from "@tradetrust/contracts";
import faker from "faker";
import { expect } from ".";
import { deployTokenFixture, mintTokenFixture } from "./fixtures";
import { getTestUsers, TestUsers } from "./utils";

const { loadFixture } = waffle;

describe("TradeTrustERC721 Pausable Behaviour", async () => {
  let users: TestUsers;
  let registryContract: TradeTrustERC721;

  let registryContractAsAdmin: TradeTrustERC721;
  let registryContractAsNonAdmin: TradeTrustERC721;

  beforeEach(async () => {
    users = await getTestUsers();

    registryContract = await loadFixture(
      deployTokenFixture<TradeTrustERC721>({
        tokenContractName: "TradeTrustERC721Mock",
        tokenName: "The Great Shipping Company",
        tokenInitials: "GSC",
        deployer: users.carrier,
      })
    );

    registryContractAsAdmin = registryContract.connect(users.carrier);
    registryContractAsNonAdmin = registryContract.connect(users.beneficiary);
  });

  describe("Rights to pause and unpause registry", () => {
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

        await expect(tx).to.be.revertedWith("RegistryAccess: caller does not have the Admin role");
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

        await expect(tx).to.be.revertedWith("RegistryAccess: caller does not have the Admin role");
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

        const tx = registryContractAsAdmin.mintTitle(users.beneficiary.address, users.beneficiary.address, tokenId);

        await expect(tx).to.be.revertedWith("Pausable: paused");
      });

      it("should not allow transfers token", async () => {
        const registryContractMock = await loadFixture(
          deployTokenFixture<TradeTrustERC721Mock>({
            tokenContractName: "TradeTrustERC721Mock",
            tokenName: "The Great Shipping Company",
            tokenInitials: "GSC",
            deployer: users.carrier,
          })
        );
        await registryContractMock.mintInternal(users.beneficiary.address, tokenId);
        await registryContractMock.pause();

        const tx = registryContractMock
          .connect(users.beneficiary)
          .transferFrom(users.beneficiary.address, users.holder.address, tokenId);

        await expect(tx).to.be.revertedWith("Pausable: paused");
      });
    });

    describe("Token Registry and Title Escrow Behaviours", () => {
      let titleEscrowContract: TitleEscrowCloneable;

      beforeEach(async () => {
        titleEscrowContract = (
          await loadFixture(
            mintTokenFixture({
              token: registryContractAsAdmin,
              beneficiary: users.beneficiary,
              holder: users.beneficiary,
              tokenId,
            })
          )
        ).titleEscrow;
      });

      describe("Token Registry Behaviour", () => {
        beforeEach(async () => {
          await titleEscrowContract.connect(users.beneficiary).surrender();
          await registryContractAsAdmin.pause();

          const paused = await registryContract.paused();

          expect(paused).to.be.true;
        });

        it("should not allow restoring token", async () => {
          const tx = registryContractAsAdmin.restoreTitle(tokenId);

          await expect(tx).to.be.revertedWith("Pausable: paused");
        });

        it("should not allow accepting token", async () => {
          const tx = registryContractAsAdmin.destroyToken(tokenId);

          await expect(tx).to.be.revertedWith("Pausable: paused");
        });
      });

      describe("Title Escrow Behaviour", () => {
        beforeEach(async () => {
          await registryContractAsAdmin.pause();

          const paused = await registryContract.paused();

          expect(paused).to.be.true;
        });

        it("should not be allowed to call surrender", async () => {
          const tx = titleEscrowContract.connect(users.beneficiary).surrender();

          await expect(tx).to.be.revertedWith("TitleEscrow: Token Registry is paused");
        });

        it("should not allow approve of new owners", async () => {
          const tx = titleEscrowContract.approveNewTransferTargets(users.beneficiary.address, users.holder.address);

          await expect(tx).to.be.revertedWith("TitleEscrow: Token Registry is paused");
        });

        it("should not allow transfer to new title escrow", async () => {
          const tx = titleEscrowContract.transferToNewEscrow(users.beneficiary.address, users.holder.address);

          await expect(tx).to.be.revertedWith("TitleEscrow: Token Registry is paused");
        });

        it("should not allow change of holdership", async () => {
          const tx = titleEscrowContract.changeHolder(users.holder.address);

          await expect(tx).to.be.revertedWith("TitleEscrow: Token Registry is paused");
        });
      });
    });
  });
});
