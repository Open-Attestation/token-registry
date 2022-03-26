import { waffle } from "hardhat";
import { TitleEscrow, TradeTrustERC721, TradeTrustERC721Mock } from "@tradetrust/contracts";
import faker from "faker";
import { expect } from ".";
import { deployTokenFixture, mintTokenFixture } from "./fixtures";
import { getTestUsers, TestUsers } from "./helpers";

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
        tokenContractName: "TradeTrustERC721",
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

        await expect(tx).to.be.revertedWith("RegAcc: Not Admin");
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

        await expect(tx).to.be.revertedWith("RegAcc: Not Admin");
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
      let titleEscrowContract: TitleEscrow;

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

          expect(tx).to.be.revertedWith("TE: Registry paused");
        });

        it("should not allow surrendering", async () => {
          const tx = titleEscrowContract.connect(users.beneficiary).surrender();

          await expect(tx).to.be.revertedWith("TE: Registry paused");
        });

        it("should not allow shredding", async () => {
          const tx = titleEscrowContract.shred();

          await expect(tx).to.be.revertedWith("TE: Registry paused");
        });

        it("should not allow nomination of beneficiary", async () => {
          const tx = titleEscrowContract.nominateBeneficiary(users.beneficiary.address);

          await expect(tx).to.be.revertedWith("TE: Registry paused");
        });

        it("should not allow nomination of holder", async () => {
          const tx = titleEscrowContract.nominateHolder(users.holder.address);

          await expect(tx).to.be.revertedWith("TE: Registry paused");
        });

        it("should not allow nomination of new owners", async () => {
          const tx = titleEscrowContract.nominate(users.beneficiary.address, users.holder.address);

          await expect(tx).to.be.revertedWith("TE: Registry paused");
        });

        it("should not allow endorsement of beneficiary", async () => {
          const tx = titleEscrowContract.endorseBeneficiary(users.beneficiary.address);

          await expect(tx).to.be.revertedWith("TE: Registry paused");
        });

        it("should not allow endorsement of holder", async () => {
          const tx = titleEscrowContract.endorseHolder(users.holder.address);

          await expect(tx).to.be.revertedWith("TE: Registry paused");
        });

        it("should not allow endorsement to new title escrow", async () => {
          const tx = titleEscrowContract.endorse(users.beneficiary.address, users.holder.address);

          await expect(tx).to.be.revertedWith("TE: Registry paused");
        });
      });
    });
  });
});
