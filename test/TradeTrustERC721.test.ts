/* eslint-disable camelcase */
import { ethers, waffle } from "hardhat";
import {
  TitleEscrowCloneable,
  TitleEscrowCloneable__factory,
  TradeTrustERC721,
  TradeTrustERC721__factory,
  TradeTrustERC721Mock,
} from "@tradetrust/contracts";
import * as faker from "faker";
import { MockContract, smock } from "@defi-wonderland/smock";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from ".";
import { deployTokenFixture, deployEscrowFactoryFixture, mintTokenFixture } from "./fixtures";
import { getTestUsers, getTitleEscrowContract, getEscrowFactoryFromToken, TestUsers } from "./utils";
import { AddressConstants } from "../src/common/constants";

const { loadFixture } = waffle;

/*
 * This is a partial test file for TradeTrustERC721.
 * As we plan to migrate this repository and all of its test files to be fully in Typescript,
 * this will be carried out part by part through a gradual process.
 * All new test cases for TradeTrustERC721 should be added into this file.
 */

describe("TradeTrustERC721 (TS Migration)", async () => {
  let users: TestUsers;
  let tradeTrustERC721Mock: TradeTrustERC721Mock;

  beforeEach(async () => {
    users = await getTestUsers();

    tradeTrustERC721Mock = await loadFixture(
      deployTokenFixture<TradeTrustERC721Mock>({
        tokenContractName: "TradeTrustERC721Mock",
        tokenName: "The Great Shipping Company",
        tokenInitials: "GSC",
        deployer: users.carrier,
      })
    );
  });

  describe("Restore Surrendered Token", () => {
    let tokenId: string;

    beforeEach(async () => {
      tokenId = faker.datatype.hexaDecimal(64);
    });

    describe("When caller is a minter", () => {
      beforeEach(async () => {
        // Connect to minter who is the carrier
        tradeTrustERC721Mock.connect(users.carrier);
      });

      it("should revert when token does not exist", async () => {
        const tx = tradeTrustERC721Mock.restoreTitle(tokenId);

        await expect(tx).to.be.revertedWith("TokenRegistry: Token does not exist");
      });

      describe("When token has been surrendered", () => {
        describe("When previous owner is a Title Escrow", () => {
          let stubTitleEscrow: MockContract<TitleEscrowCloneable>;

          describe("Interface checking", () => {
            beforeEach(async () => {
              const stubTitleEscrowFactory = await smock.mock<TitleEscrowCloneable__factory>("TitleEscrowCloneable");
              stubTitleEscrow = await stubTitleEscrowFactory.deploy();
              await stubTitleEscrow.initialize(
                tradeTrustERC721Mock.address,
                users.beneficiary.address,
                users.beneficiary.address,
                stubTitleEscrow.address
              );
              await tradeTrustERC721Mock["mintInternal(address,uint256)"](stubTitleEscrow.address, tokenId);
              await stubTitleEscrow.connect(users.beneficiary).surrender();
            });

            it("should check the interface on title escrow for support", async () => {
              await tradeTrustERC721Mock.restoreTitle(tokenId);

              expect(stubTitleEscrow.supportsInterface).to.have.been.calledOnce;
            });

            it("should not revert if the receiver contract supports Title Escrow interface", async () => {
              stubTitleEscrow.supportsInterface.returns(true);

              const tx = tradeTrustERC721Mock.restoreTitle(tokenId);

              await expect(tx).to.not.be.reverted;
            });

            it("should revert if the receiver contract does not support Title Escrow interface", async () => {
              stubTitleEscrow.supportsInterface.returns(false);

              const tx = tradeTrustERC721Mock.restoreTitle(tokenId);

              await expect(tx).to.be.revertedWith("TokenRegistry: Previous owner is an unsupported Title Escrow");
            });

            it("should revert if the receiver contract is a bad title escrow", async () => {
              stubTitleEscrow.supportsInterface.reverts("kaboom");

              const tx = tradeTrustERC721Mock.restoreTitle(tokenId);

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
                    token: tradeTrustERC721Mock,
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
              const tx = tradeTrustERC721Mock.restoreTitle(tokenId);

              await expect(tx).to.not.be.reverted;
            });

            it("should restore into a new title escrow contract", async () => {
              const tx = await tradeTrustERC721Mock.restoreTitle(tokenId);

              const escrowFactory = await getEscrowFactoryFromToken(tradeTrustERC721Mock);
              const newTitleEscrowAddress = await tradeTrustERC721Mock.ownerOf(tokenId);
              expect(titleEscrow.address).to.be.not.equal(newTitleEscrowAddress);
              expect(tx)
                .to.emit(escrowFactory, "TitleEscrowDeployed")
                .withArgs(
                  newTitleEscrowAddress,
                  tradeTrustERC721Mock.address,
                  users.beneficiary.address,
                  users.beneficiary.address
                );
            });

            it("should restore previous ownership correctly", async () => {
              await tradeTrustERC721Mock.restoreTitle(tokenId);

              const newOwner = await tradeTrustERC721Mock.ownerOf(tokenId);
              const titleEscrowFactory = await ethers.getContractFactory("TitleEscrowCloneable");
              const newTitleEscrow = titleEscrowFactory.attach(newOwner) as TitleEscrowCloneable;
              const restoredBeneficiary = await newTitleEscrow.beneficiary();
              const restoredHolder = await newTitleEscrow.holder();

              expect(restoredBeneficiary).to.be.equal(users.beneficiary.address);
              expect(restoredHolder).to.be.equal(users.beneficiary.address);
            });

            it("should restore title escrow from the correct token registry", async () => {
              await tradeTrustERC721Mock.restoreTitle(tokenId);

              const newOwner = await tradeTrustERC721Mock.ownerOf(tokenId);
              const titleEscrowFactory = await ethers.getContractFactory("TitleEscrowCloneable");
              const newTitleEscrow = titleEscrowFactory.attach(newOwner) as TitleEscrowCloneable;
              const tokenRegistryAddress = await newTitleEscrow.tokenRegistry();

              expect(tokenRegistryAddress).to.be.equal(tradeTrustERC721Mock.address);
            });
          });
        });

        // Note: This test scenario is not applicable in actual use case but is useful for testing.
        describe("When previous owner is an EOA", () => {
          let eoa: SignerWithAddress;

          beforeEach(async () => {
            eoa = users.beneficiary;

            await tradeTrustERC721Mock
              .connect(users.carrier)
              ["mintInternal(address,uint256)"](users.beneficiary.address, tokenId);

            // EOA surrendering
            await tradeTrustERC721Mock
              .connect(eoa)
              ["safeTransferFrom(address,address,uint256)"](eoa.address, tradeTrustERC721Mock.address, tokenId);
          });

          it("should restore EOA to a new title escrow", async () => {
            const currentOwner = await tradeTrustERC721Mock.ownerOf(tokenId);

            await tradeTrustERC721Mock.connect(users.carrier).restoreTitle(tokenId);

            const newOwner = await tradeTrustERC721Mock.ownerOf(tokenId);
            expect(newOwner).to.be.not.equal(currentOwner);
          });

          it("should restore the EOA into a new title escrow", async () => {
            const currentOwner = await tradeTrustERC721Mock.ownerOf(tokenId);

            const tx = await tradeTrustERC721Mock.connect(users.carrier).restoreTitle(tokenId);

            const newOwner = await tradeTrustERC721Mock.ownerOf(tokenId);
            const escrowFactory = await getEscrowFactoryFromToken(tradeTrustERC721Mock);

            expect(currentOwner).to.be.not.equal(newOwner);
            expect(tx)
              .to.emit(escrowFactory, "TitleEscrowDeployed")
              .withArgs(newOwner, tradeTrustERC721Mock.address, eoa.address, eoa.address);
          });

          it("should make the EOA as the beneficiary and holder of the restored title escrow", async () => {
            await tradeTrustERC721Mock.connect(users.carrier).restoreTitle(tokenId);

            const newOwner = await tradeTrustERC721Mock.ownerOf(tokenId);
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
        let stubTradeTrustERC721: MockContract<TradeTrustERC721>;

        beforeEach(async () => {
          tokenId = faker.datatype.hexaDecimal(2);

          const escrowFactory = await loadFixture(deployEscrowFactoryFixture({ deployer: users.carrier }));
          const mockTradeTrustERC721Factory = await smock.mock<TradeTrustERC721__factory>("TradeTrustERC721");
          stubTradeTrustERC721 = await mockTradeTrustERC721Factory.deploy("Mock Shipper", "MSC", escrowFactory.address);
          await stubTradeTrustERC721
            .connect(users.carrier)
            .mintTitle(users.beneficiary.address, users.beneficiary.address, tokenId);
        });

        it("should revert when restoring token", async () => {
          const tx = stubTradeTrustERC721.connect(users.carrier).restoreTitle(tokenId);

          await expect(tx).to.be.revertedWith("TokenRegistry: Token is not surrendered");
        });

        describe("When _owners and _surrenderedOwners are out of sync", () => {
          // This scenario should never happen unless something bad has really gone wrong in the transfer.
          beforeEach(async () => {
            const titleEscrowAddress = await stubTradeTrustERC721.ownerOf(tokenId);
            const titleEscrowFactory = await ethers.getContractFactory("TitleEscrowCloneable");
            const titleEscrow = titleEscrowFactory.attach(titleEscrowAddress) as TitleEscrowCloneable;
            await titleEscrow.connect(users.beneficiary).surrender();
          });

          it("should revert if owner is not token registry", async () => {
            await stubTradeTrustERC721.setVariable("_owners", {
              [tokenId]: faker.finance.ethereumAddress(),
            });

            const tx = stubTradeTrustERC721.connect(users.carrier).restoreTitle(tokenId);

            await expect(tx).to.be.revertedWith("TokenRegistry: Token is not surrendered");
          });

          it("should revert if previous surrendered owner is zero", async () => {
            await stubTradeTrustERC721.setVariable("_surrenderedOwners", {
              [ethers.BigNumber.from(tokenId).toNumber()]: ethers.constants.AddressZero,
            });

            const tx = stubTradeTrustERC721.connect(users.carrier).restoreTitle(tokenId);

            await expect(tx).to.be.revertedWith("TokenRegistry: Token is not surrendered");
          });
        });
      });
    });

    describe("When caller is not a minter", () => {
      describe("When token does not exist", () => {
        it("should revert when restoring a token that does not exist", async () => {
          const nonExistentTokenId = faker.datatype.hexaDecimal(64);

          const tx = tradeTrustERC721Mock.connect(users.carrier).restoreTitle(nonExistentTokenId);

          await expect(tx).to.be.revertedWith("TokenRegistry: Token does not exist");
        });
      });
    });
  });

  describe("Token Transfer Behaviour", () => {
    let tokenId: number;

    beforeEach(async () => {
      tokenId = faker.datatype.number();

      await tradeTrustERC721Mock
        .connect(users.carrier)
        ["mintInternal(address,uint256)"](users.beneficiary.address, tokenId);
    });

    describe("Transferring of surrendered token to burn/zero addresses", () => {
      beforeEach(async () => {
        // Manual surrendering from beneficiary
        await tradeTrustERC721Mock
          .connect(users.beneficiary)
          ["safeTransferFrom(address,address,uint256)"](
            users.beneficiary.address,
            tradeTrustERC721Mock.address,
            tokenId
          );
      });

      describe("When caller is an approved operator", () => {
        it("should not be possible for beneficiary to approve an operator after surrendering", async () => {
          const operator = users.others[users.others.length - 1];

          const tx = tradeTrustERC721Mock.connect(users.beneficiary).approve(operator.address, tokenId);

          await expect(tx).to.be.revertedWith("ERC721: approve caller is not owner nor approved for all");
        });
      });

      describe("When caller is an unapproved operator", () => {
        it("should revert when transferring to burn address", async () => {
          const unapprovedOperator = users.others[users.others.length - 1];

          const tx = tradeTrustERC721Mock
            .connect(unapprovedOperator)
            ["safeTransferFrom(address,address,uint256)"](users.beneficiary.address, AddressConstants.burn, tokenId);

          await expect(tx).to.be.revertedWith("ERC721: transfer caller is not owner nor approved");
        });

        it("should revert when transferring to zero address", async () => {
          const unapprovedOperator = users.others[users.others.length - 1];

          const tx = tradeTrustERC721Mock
            .connect(unapprovedOperator)
            ["safeTransferFrom(address,address,uint256)"](
              users.beneficiary.address,
              ethers.constants.AddressZero,
              tokenId
            );

          await expect(tx).to.be.revertedWith("ERC721: transfer caller is not owner nor approved");
        });
      });
    });

    describe("Transferring of unsurrendered token to burn/zero addresses", () => {
      describe("When caller is an approved operator", () => {
        let operator: SignerWithAddress;

        beforeEach(async () => {
          operator = users.others[users.others.length - 1];
          await tradeTrustERC721Mock.connect(users.beneficiary).approve(operator.address, tokenId);
          tradeTrustERC721Mock = tradeTrustERC721Mock.connect(operator);
        });

        it("should not allow transfer to burn address", async () => {
          const tx = tradeTrustERC721Mock["safeTransferFrom(address,address,uint256)"](
            users.beneficiary.address,
            AddressConstants.burn,
            tokenId
          );

          await expect(tx).to.be.revertedWith("TokenRegistry: Token has not been surrendered for burning");
        });

        it("should not allow transfer to zero address", async () => {
          const tx = tradeTrustERC721Mock["safeTransferFrom(address,address,uint256)"](
            users.beneficiary.address,
            ethers.constants.AddressZero,
            tokenId
          );

          await expect(tx).to.be.revertedWith("ERC721: transfer to the zero address");
        });

        it("should put current owner to surrenderedOwners of token when transferring to token registry", async () => {
          await tradeTrustERC721Mock["safeTransferFrom(address,address,uint256)"](
            users.beneficiary.address,
            tradeTrustERC721Mock.address,
            tokenId
          );

          const previousOwner = await tradeTrustERC721Mock.surrenderedOwnersInternal(tokenId);

          expect(previousOwner).to.equal(users.beneficiary.address);
        });
      });

      describe("When caller is an unapproved operator", () => {
        it("should revert if caller is an unapproved minter", async () => {
          const unapprovedOperator = users.others[users.others.length - 1];

          const tx = tradeTrustERC721Mock
            .connect(unapprovedOperator)
            ["safeTransferFrom(address,address,uint256)"](users.beneficiary.address, AddressConstants.burn, tokenId);

          await expect(tx).to.be.revertedWith("ERC721: transfer caller is not owner nor approved");
        });
      });
    });
  });

  describe("Permanent burning of tokens", () => {
    let tokenId: string;

    beforeEach(async () => {
      tokenId = faker.datatype.hexaDecimal(64);

      await tradeTrustERC721Mock
        .connect(users.carrier)
        ["mintInternal(address,uint256)"](users.beneficiary.address, tokenId);
    });

    describe("When a token has been surrendered", () => {
      beforeEach(async () => {
        // Manual surrendering from beneficiary
        await tradeTrustERC721Mock
          .connect(users.beneficiary)
          ["safeTransferFrom(address,address,uint256)"](
            users.beneficiary.address,
            tradeTrustERC721Mock.address,
            tokenId
          );
      });

      describe("When caller to burn token is minter", () => {
        let tradeTrustERC721MockAsMinter: TradeTrustERC721Mock;

        beforeEach(async () => {
          tradeTrustERC721MockAsMinter = tradeTrustERC721Mock.connect(users.carrier);
        });

        it("should transfer token to burn address", async () => {
          await tradeTrustERC721MockAsMinter.destroyToken(tokenId);

          const newOwner = await tradeTrustERC721Mock.ownerOf(tokenId);

          expect(newOwner).to.equal(AddressConstants.burn);
        });

        it("should emit TokenBurnt event on burning of token", async () => {
          const tx = await tradeTrustERC721MockAsMinter.destroyToken(tokenId);

          expect(tx).to.emit(tradeTrustERC721Mock, "TokenBurnt").withArgs(tokenId);
        });

        it("should remove previous owner of token record", async () => {
          await tradeTrustERC721MockAsMinter.destroyToken(tokenId);

          const previousOwner = await tradeTrustERC721Mock.surrenderedOwnersInternal(tokenId);

          expect(previousOwner).to.equal(ethers.constants.AddressZero);
        });
      });

      describe("When caller to burn token is not a minter", () => {
        it("should not allow a non-accepter to burn the token", async () => {
          const tx = tradeTrustERC721Mock.connect(users.beneficiary).destroyToken(tokenId);

          await expect(tx).to.be.revertedWith("RegistryAccess: caller does not have the Accepter role");
        });
      });
    });

    describe("When a token has not been surrendered", () => {
      it("should not allow to burn the token even if registry is approved", async () => {
        // Note that this is an edge case and not a normal flow.
        await tradeTrustERC721Mock.connect(users.beneficiary).approve(tradeTrustERC721Mock.address, tokenId);
        const tx = tradeTrustERC721Mock.connect(users.carrier).destroyToken(tokenId);

        await expect(tx).to.be.revertedWith("TokenRegistry: Token has not been surrendered");
      });

      it("should not allow a non-accepter to burn the token", async () => {
        const tx = tradeTrustERC721Mock.connect(users.beneficiary).destroyToken(tokenId);

        await expect(tx).to.be.revertedWith("RegistryAccess: caller does not have the Accepter role");
      });

      it("should allow ERC721 burning of unsurrendered token internally", async () => {
        await tradeTrustERC721Mock.burnInternal(tokenId);
        const tx = tradeTrustERC721Mock.ownerOf(tokenId);

        await expect(tx).to.be.revertedWith("ERC721: owner query for nonexistent token");
      });
    });

    describe("When a token has been permanently burnt", () => {
      beforeEach(async () => {
        // Manual surrendering from beneficiary
        await tradeTrustERC721Mock
          .connect(users.beneficiary)
          ["safeTransferFrom(address,address,uint256)"](
            users.beneficiary.address,
            tradeTrustERC721Mock.address,
            tokenId
          );

        await tradeTrustERC721Mock.connect(users.carrier).destroyToken(tokenId);
      });

      it("should not allow mintTitle on the same token ID again", async () => {
        const tx = tradeTrustERC721Mock
          .connect(users.carrier)
          .mintTitle(users.beneficiary.address, users.beneficiary.address, tokenId);

        await expect(tx).to.be.revertedWith("TokenRegistry: Token already exists");
      });

      it("should not allow minting of the same token ID to EOA again", async () => {
        const tx = tradeTrustERC721Mock
          .connect(users.carrier)
          ["mintInternal(address,uint256)"](users.beneficiary.address, tokenId);

        await expect(tx).to.be.revertedWith("ERC721: token already minted");
      });
    });
  });

  describe("Check is token surrendered status", () => {
    let tokenId: string;
    let titleEscrowContract: TitleEscrowCloneable;

    beforeEach(async () => {
      tokenId = faker.datatype.hexaDecimal(64);

      await tradeTrustERC721Mock
        .connect(users.carrier)
        .mintTitle(users.beneficiary.address, users.beneficiary.address, tokenId);

      titleEscrowContract = await getTitleEscrowContract(tradeTrustERC721Mock, tokenId);
    });

    it("should return false for an unsurrendered token", async () => {
      const res = await tradeTrustERC721Mock.isSurrendered(tokenId);

      expect(res).to.be.false;
    });

    it("should return true for a surrendered token", async () => {
      await titleEscrowContract.connect(users.beneficiary).surrender();

      const res = await tradeTrustERC721Mock.isSurrendered(tokenId);

      expect(res).to.be.true;
    });

    it("should return true for an accepted token", async () => {
      await titleEscrowContract.connect(users.beneficiary).surrender();
      await tradeTrustERC721Mock.destroyToken(tokenId);

      const res = await tradeTrustERC721Mock.isSurrendered(tokenId);

      expect(res).to.be.true;
    });

    it("should return false for a restored token", async () => {
      await titleEscrowContract.connect(users.beneficiary).surrender();
      await tradeTrustERC721Mock.restoreTitle(tokenId);

      const res = await tradeTrustERC721Mock.isSurrendered(tokenId);

      expect(res).to.be.false;
    });
  });
});
