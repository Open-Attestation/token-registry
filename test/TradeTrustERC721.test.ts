import hre, { ethers, waffle } from "hardhat";
// eslint-disable-next-line camelcase
import { TitleEscrowCloneable, TradeTrustERC721, TitleEscrowCloneable__factory } from "@tradetrust/contracts";
import * as faker from "faker";
import { MockContract, smock } from "@defi-wonderland/smock";
import { expect } from ".";
import { setupFixture, TestUsers } from "./fixtures/setupFixture";
import { mintTokenFixture } from "./fixtures/mintToken";

const { loadFixture } = waffle;

/*
 * This is a partial test file for TradeTrustERC721.
 * As we plan to move this repository and all of its test files to Typescript,
 * this will be carried out part by part through a gradual process.
 * All new test cases should be added into this file.
 */

describe.only("TradeTrustERC721 (Partial)", async () => {
  let users: TestUsers;
  let tradeTrustERC721: TradeTrustERC721;

  beforeEach(async () => {
    const setupData = await loadFixture(setupFixture(hre));
    users = setupData.users;
    tradeTrustERC721 = setupData.token;
  });

  describe("Restore Surrendered Token", () => {
    describe("When caller is a minter", () => {
      beforeEach(async () => {
        // Connect to minter who is the carrier
        tradeTrustERC721.connect(users.carrier);
      });

      it("should revert when token does not exist", async () => {
        const fakeTokenId = faker.datatype.hexaDecimal();

        const tx = tradeTrustERC721.restoreTitle(fakeTokenId);

        await expect(tx).to.be.revertedWith("TokenRegistry: Token does not exist");
      });

      describe("When token has been surrendered", () => {
        let tokenId: string;

        beforeEach(async () => {
          tokenId = faker.datatype.hexaDecimal(64);
        });

        describe("When previous owner is a Title Escrow", () => {
          let mockTitleEscrow: MockContract<TitleEscrowCloneable>;

          describe("Interface checking", () => {
            beforeEach(async () => {
              // eslint-disable-next-line camelcase
              const mockTitleEscrowFactory = await smock.mock<TitleEscrowCloneable__factory>("TitleEscrowCloneable");
              mockTitleEscrow = await mockTitleEscrowFactory.deploy();
              await mockTitleEscrow.initialize(
                tradeTrustERC721.address,
                users.beneficiary.address,
                users.beneficiary.address,
                mockTitleEscrow.address
              );
              await tradeTrustERC721["safeMint(address,uint256)"](mockTitleEscrow.address, tokenId);
              await mockTitleEscrow.connect(users.beneficiary).surrender();
            });

            it("should check the interface on title escrow for support", async () => {
              await tradeTrustERC721.restoreTitle(tokenId);

              expect(mockTitleEscrow.supportsInterface).to.have.been.calledOnce;
            });

            it("should not revert if the receiver contract supports Title Escrow interface", async () => {
              mockTitleEscrow.supportsInterface.returns(true);

              const tx = tradeTrustERC721.restoreTitle(tokenId);

              await expect(tx).to.not.be.reverted;
            });

            it("should revert if the receiver contract does not support Title Escrow interface", async () => {
              mockTitleEscrow.supportsInterface.returns(false);

              const tx = tradeTrustERC721.restoreTitle(tokenId);

              await expect(tx).to.be.revertedWith("TokenRegistry: Previous owner is an unsupported Title Escrow");
            });

            it("should revert if the receiver contract is a bad title escrow", async () => {
              mockTitleEscrow.supportsInterface.reverts("kaboom");

              const tx = tradeTrustERC721.restoreTitle(tokenId);

              await expect(tx).to.be.revertedWith("TokenRegistry: Previous owner is not a TitleEscrow implementer");
            });
          });

          describe("Information restored", () => {
            let titleEscrow: TitleEscrowCloneable;

            beforeEach(async () => {
              const { beneficiary } = users;
              titleEscrow = (
                await loadFixture(
                  mintTokenFixture({
                    token: tradeTrustERC721,
                    holder: beneficiary,
                    beneficiary,
                    tokenId
                  })
                )
              ).titleEscrow;

              // Surrender by beneficiary
              await titleEscrow.connect(beneficiary).surrender();
            });

            it("should perform surrender without revert", async () => {
              const tx = tradeTrustERC721.restoreTitle(tokenId);

              await expect(tx).to.not.be.reverted;
            });

            it("should restore into a new title escrow contract", async () => {
              await tradeTrustERC721.restoreTitle(tokenId);

              const newTitleEscrowAddress = await tradeTrustERC721.ownerOf(tokenId);
              expect(titleEscrow.address).to.be.not.equal(newTitleEscrowAddress);
            });

            it("should restore previous ownership correctly", async () => {
              await tradeTrustERC721.restoreTitle(tokenId);

              const newOwner = await tradeTrustERC721.ownerOf(tokenId);
              const titleEscrowFactory = await ethers.getContractFactory("TitleEscrowCloneable");
              const newTitleEscrow = titleEscrowFactory.attach(newOwner) as TitleEscrowCloneable;
              const restoredBeneficiary = await newTitleEscrow.beneficiary();
              const restoredHolder = await newTitleEscrow.holder();

              expect(restoredBeneficiary).to.be.equal(users.beneficiary.address);
              expect(restoredHolder).to.be.equal(users.beneficiary.address);
            });

            it("should restore title escrow from the correct token registry", async () => {
              await tradeTrustERC721.restoreTitle(tokenId);

              const newOwner = await tradeTrustERC721.ownerOf(tokenId);
              const titleEscrowFactory = await ethers.getContractFactory("TitleEscrowCloneable");
              const newTitleEscrow = titleEscrowFactory.attach(newOwner) as TitleEscrowCloneable;
              const tokenRegistryAddress = await newTitleEscrow.tokenRegistry();

              expect(tokenRegistryAddress).to.be.equal(tradeTrustERC721.address);
            });
          });
        });

        describe("When previous owner is an EOA", () => {});
      });

      describe("When token has not been surrendered", () => {});
    });

    describe("When caller is not a minter", () => {
      describe("When token does not exist", () => {});
    });
  });

  it("should be successful!!!", async () => {
    expect(true).to.be.true;
  });
});
