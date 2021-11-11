/* eslint-disable camelcase */
import { ethers } from "hardhat";
import { utils as ethersUtils } from "ethers";
import * as faker from "faker";
import { MockContract, smock } from "@defi-wonderland/smock";
import { TradeTrustERC721ChildMintableMock, TradeTrustERC721ChildMintableMock__factory } from "@tradetrust/contracts";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "../../../index";
import { TestUsers } from "../../../fixtures/deploy-token.fixture";

describe("TradeTrustERC721ChildMintable", () => {
  const CHAIN_MANAGER_ROLE = ethersUtils.id("CHAIN_MANAGER_ROLE");

  let users: TestUsers;
  let tradeTrustERC721ChildMintableMock: MockContract<TradeTrustERC721ChildMintableMock>;
  let fakeChainManager: SignerWithAddress;

  let tokenId: number;

  beforeEach(async () => {
    tokenId = faker.datatype.number();

    const tradeTrustERC721ChildMintableMockFactory = await smock.mock<TradeTrustERC721ChildMintableMock__factory>(
      "TradeTrustERC721ChildMintableMock"
    );
    tradeTrustERC721ChildMintableMock = await tradeTrustERC721ChildMintableMockFactory.deploy(
      "The Great Shipping Company",
      "GSC"
    );

    const [carrier, beneficiary, holder, ...others] = await ethers.getSigners();
    users = { carrier, beneficiary, holder, others };

    fakeChainManager = users.others[users.others.length - 1];

    await tradeTrustERC721ChildMintableMock.grantRole(CHAIN_MANAGER_ROLE, fakeChainManager.address);
  });

  describe("Mintable Child Token", () => {
    let mintableTokenAsCarrier: MockContract<TradeTrustERC721ChildMintableMock>;

    beforeEach(async () => {
      mintableTokenAsCarrier = tradeTrustERC721ChildMintableMock.connect(users.carrier);
    });

    describe("When token has not been withdrawn", () => {
      it("should mint token when calling mintTitle", async () => {
        const receipt = await mintableTokenAsCarrier.mintTitle(
          users.beneficiary.address,
          users.holder.address,
          tokenId
        );
        const newOwner = await mintableTokenAsCarrier.ownerOf(tokenId);

        expect(receipt)
          .to.emit(mintableTokenAsCarrier, "TitleEscrowDeployed")
          .withArgs(newOwner, mintableTokenAsCarrier.address, users.beneficiary.address, users.holder.address);
      });

      it("should mint token when calling mint", async () => {
        await mintableTokenAsCarrier.mint(users.beneficiary.address, tokenId);
        const newOwner = await mintableTokenAsCarrier.ownerOf(tokenId);

        expect(newOwner).to.not.equal(ethers.constants.AddressZero);
      });
    });

    describe("When token has been withdrawn", () => {
      beforeEach(async () => {
        await mintableTokenAsCarrier.mint(users.beneficiary.address, tokenId);
        await tradeTrustERC721ChildMintableMock.connect(users.beneficiary).approve(fakeChainManager.address, tokenId);
        await tradeTrustERC721ChildMintableMock
          .connect(fakeChainManager)
          .withdraw(users.beneficiary.address, tokenId, "0x");
      });

      it("should revert mintTitle when token is already on root chain", async () => {
        const tx = mintableTokenAsCarrier.mintTitle(users.beneficiary.address, users.holder.address, tokenId);

        await expect(tx).to.be.revertedWith("TradeTrustERC721Child: Token is on root chain");
      });

      it("should revert mint when token is already on root chain", async () => {
        const tx = mintableTokenAsCarrier.mint(users.beneficiary.address, tokenId);

        await expect(tx).to.be.revertedWith("TradeTrustERC721Child: Token is on root chain");
      });
    });
  });

  describe("Members of the IChildToken", () => {
    let mintableTokenAsChainManager: MockContract<TradeTrustERC721ChildMintableMock>;

    beforeEach(async () => {
      mintableTokenAsChainManager = tradeTrustERC721ChildMintableMock.connect(fakeChainManager);
    });

    describe("Deposit on child chain", () => {
      it("should revert if caller is not chain manager", async () => {
        const tx = tradeTrustERC721ChildMintableMock
          .connect(users.carrier)
          .deposit(users.beneficiary.address, tokenId, "0x");

        await expect(tx).to.be.revertedWith("AccessControl");
      });

      it("should reset withdrawn status of token", async () => {
        await tradeTrustERC721ChildMintableMock.setVariable("_withdrawnTokens", {
          [tokenId]: true,
        });

        await mintableTokenAsChainManager.deposit(users.beneficiary.address, tokenId, "0x");

        const newWithdrawnStatus = await mintableTokenAsChainManager.withdrawnTokensInternal(tokenId);
        expect(newWithdrawnStatus).to.be.false;
      });

      it("should mint token with title escrow", async () => {
        const receipt = await mintableTokenAsChainManager.deposit(users.beneficiary.address, tokenId, "0x");

        const titleEscrowAddress = await mintableTokenAsChainManager.ownerOf(tokenId);
        expect(receipt)
          .to.emit(mintableTokenAsChainManager, "TitleEscrowDeployed")
          .withArgs(
            titleEscrowAddress,
            mintableTokenAsChainManager.address,
            users.beneficiary.address,
            users.beneficiary.address
          );
      });
    });

    describe("Withdraw from child chain", () => {
      beforeEach(async () => {
        await tradeTrustERC721ChildMintableMock.connect(users.carrier).mint(users.beneficiary.address, tokenId);
      });

      it("should revert if caller is not chain manager", async () => {
        const tx = tradeTrustERC721ChildMintableMock
          .connect(users.carrier)
          .withdraw(users.beneficiary.address, tokenId, "0x");

        expect(tx).to.be.revertedWith("AccessControl");
      });

      it("should revert if chain manager is not approved", async () => {
        const tx = tradeTrustERC721ChildMintableMock
          .connect(fakeChainManager)
          .withdraw(users.beneficiary.address, tokenId, "0x");

        await expect(tx).to.be.revertedWith("TradeTrustERC721ChildMintable: Caller is not owner nor approved");
      });

      describe("When chain manager is approved", () => {
        beforeEach(async () => {
          await tradeTrustERC721ChildMintableMock.connect(users.beneficiary).approve(fakeChainManager.address, tokenId);
        });

        it("should update token status to be withdrawn", async () => {
          await tradeTrustERC721ChildMintableMock
            .connect(fakeChainManager)
            .withdraw(users.beneficiary.address, tokenId, "0x");

          const withdrawnStatus = await tradeTrustERC721ChildMintableMock.withdrawnTokensInternal(tokenId);
          expect(withdrawnStatus).to.be.true;
        });

        it("should burn the token to zero address", async () => {
          await tradeTrustERC721ChildMintableMock
            .connect(fakeChainManager)
            .withdraw(users.beneficiary.address, tokenId, "0x");

          const tx = tradeTrustERC721ChildMintableMock.ownerOf(tokenId);

          expect(tx).to.be.revertedWith("ERC721: owner query for nonexistent token");
        });
      });
    });
  });
});
