/* eslint-disable camelcase */
import hre, { ethers, waffle } from "hardhat";
import {
  TitleEscrowCloneable,
  TradeTrustERC721,
  TitleEscrowCloneable__factory,
  TradeTrustERC721__factory,
} from "@tradetrust/contracts";
import * as faker from "faker";
import { MockContract, smock } from "@defi-wonderland/smock";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
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

describe("TradeTrustERC721 (TS Migration)", async () => {
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
                    tokenId,
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
              const tx = await tradeTrustERC721.restoreTitle(tokenId);

              const newTitleEscrowAddress = await tradeTrustERC721.ownerOf(tokenId);
              expect(titleEscrow.address).to.be.not.equal(newTitleEscrowAddress);
              expect(tx)
                .to.emit(tradeTrustERC721, "TitleEscrowDeployed")
                .withArgs(
                  newTitleEscrowAddress,
                  tradeTrustERC721.address,
                  users.beneficiary.address,
                  users.beneficiary.address
                );
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

        describe("When previous owner is an EOA", () => {
          let eoa: SignerWithAddress;

          beforeEach(async () => {
            tokenId = faker.datatype.hexaDecimal(64);
            eoa = users.beneficiary;

            await tradeTrustERC721
              .connect(users.carrier)
              ["safeMint(address,uint256)"](users.beneficiary.address, tokenId);

            // EOA surrendering
            await tradeTrustERC721
              .connect(eoa)
              ["safeTransferFrom(address,address,uint256)"](eoa.address, tradeTrustERC721.address, tokenId);
          });

          it("should restore EOA to a new title escrow", async () => {
            const currentOwner = await tradeTrustERC721.ownerOf(tokenId);

            await tradeTrustERC721.connect(users.carrier).restoreTitle(tokenId);

            const newOwner = await tradeTrustERC721.ownerOf(tokenId);
            expect(newOwner).to.be.not.equal(currentOwner);
          });

          it("should restore the EOA into a new title escrow", async () => {
            const currentOwner = await tradeTrustERC721.ownerOf(tokenId);

            const tx = await tradeTrustERC721.connect(users.carrier).restoreTitle(tokenId);

            const newOwner = await tradeTrustERC721.ownerOf(tokenId);

            expect(currentOwner).to.be.not.equal(newOwner);
            expect(tx)
              .to.emit(tradeTrustERC721, "TitleEscrowDeployed")
              .withArgs(newOwner, tradeTrustERC721.address, eoa.address, eoa.address);
          });

          it("should make the EOA as the beneficiary and holder of the restored title escrow", async () => {
            await tradeTrustERC721.connect(users.carrier).restoreTitle(tokenId);

            const newOwner = await tradeTrustERC721.ownerOf(tokenId);
            const titleEscrowFactory = await ethers.getContractFactory("TitleEscrowCloneable");
            const titleEscrow = titleEscrowFactory.attach(newOwner) as TitleEscrowCloneable;

            const beneficiary = await titleEscrow.beneficiary();
            const holder = await titleEscrow.holder();
            expect(beneficiary).to.be.equal(eoa.address);
            expect(holder).to.be.equal(eoa.address);
          });
        });
      });

      describe("When token has not been surrendered", () => {
        let mockTradeTrustERC721: MockContract<TradeTrustERC721>;
        let tokenId: string;

        beforeEach(async () => {
          tokenId = faker.datatype.hexaDecimal(2);

          const mockTradeTrustERC721Factory = await smock.mock<TradeTrustERC721__factory>("TradeTrustERC721");
          mockTradeTrustERC721 = await mockTradeTrustERC721Factory.deploy("Mock Shipper", "MSC");
          await mockTradeTrustERC721
            .connect(users.carrier)
            .mintTitle(users.beneficiary.address, users.beneficiary.address, tokenId);
        });

        it("should revert when restoring token", async () => {
          const tx = mockTradeTrustERC721.connect(users.carrier).restoreTitle(tokenId);

          await expect(tx).to.be.revertedWith("TokenRegistry: Token is not surrendered");
        });

        describe("When _owners and _surrenderedOwners are out of sync", () => {
          // This scenario should never happen unless something bad has really gone wrong in the transfer.
          beforeEach(async () => {
            const titleEscrowAddress = await mockTradeTrustERC721.ownerOf(tokenId);
            const titleEscrowFactory = await ethers.getContractFactory("TitleEscrowCloneable");
            const titleEscrow = titleEscrowFactory.attach(titleEscrowAddress) as TitleEscrowCloneable;
            await titleEscrow.connect(users.beneficiary).surrender();
          });

          it("should revert if owner is not token registry", async () => {
            await mockTradeTrustERC721.setVariable("_owners", {
              [tokenId]: faker.finance.ethereumAddress(),
            });

            const tx = mockTradeTrustERC721.connect(users.carrier).restoreTitle(tokenId);

            await expect(tx).to.be.revertedWith("TokenRegistry: Token is not surrendered");
          });

          it("should revert if previous surrendered owner is zero", async () => {
            await mockTradeTrustERC721.setVariable("_surrenderedOwners", {
              [ethers.BigNumber.from(tokenId).toNumber()]: ethers.constants.AddressZero,
            });

            const tx = mockTradeTrustERC721.connect(users.carrier).restoreTitle(tokenId);

            await expect(tx).to.be.revertedWith("TokenRegistry: Token is not surrendered");
          });
        });
      });
    });

    describe("When caller is not a minter", () => {
      describe("When token does not exist", () => {
        it("should revert when restoring a token that does not exist", async () => {
          const nonExistentTokenId = faker.datatype.hexaDecimal(64);

          const tx = tradeTrustERC721.connect(users.carrier).restoreTitle(nonExistentTokenId);

          await expect(tx).to.be.revertedWith("TokenRegistry: Token does not exist");
        });
      });
    });
  });
});
