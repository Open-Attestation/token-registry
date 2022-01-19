/* eslint-disable camelcase */
import * as faker from "faker";
import { MockContract, smock } from "@defi-wonderland/smock";
import { TradeTrustERC721Child, TradeTrustERC721Child__factory } from "@tradetrust/contracts";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "../../../index";
import { TestUsers } from "../../../fixtures/deploy-token.fixture";
import { getTestUsers, impersonateAccount, stopImpersonatingAccount } from "../../../utils";
import { RoleConstants } from "../../../../src/common/constants";

describe("TradeTrustERC721Child", () => {
  const CHAIN_MANAGER_ROLE = RoleConstants.chainManager;

  let users: TestUsers;
  let tradeTrustERC721Child: MockContract<TradeTrustERC721Child>;
  let fakeChainManager: SignerWithAddress;

  let tokenId: number;

  beforeEach(async () => {
    tokenId = faker.datatype.number();

    const tradeTrustERC721ChildFactory = await smock.mock<TradeTrustERC721Child__factory>("TradeTrustERC721Child");
    tradeTrustERC721Child = await tradeTrustERC721ChildFactory.deploy("The Great Shipping Company", "GSC");

    users = await getTestUsers();

    fakeChainManager = users.others[users.others.length - 1];

    await tradeTrustERC721Child.grantRole(CHAIN_MANAGER_ROLE, fakeChainManager.address);
  });

  describe("Members of the IChildToken", () => {
    let tokenAsChainManager: MockContract<TradeTrustERC721Child>;

    beforeEach(async () => {
      tokenAsChainManager = tradeTrustERC721Child.connect(fakeChainManager);
    });

    describe("Deposit on child chain", () => {
      it("should revert if caller is not chain manager", async () => {
        const tx = tradeTrustERC721Child.connect(users.carrier).deposit(users.beneficiary.address, tokenId, "0x");

        await expect(tx).to.be.revertedWith("AccessControl");
      });

      it("should mint token with title escrow", async () => {
        const receipt = await tokenAsChainManager.deposit(users.beneficiary.address, tokenId, "0x");

        const titleEscrowAddress = await tokenAsChainManager.ownerOf(tokenId);
        expect(receipt)
          .to.emit(tokenAsChainManager, "TitleEscrowDeployed")
          .withArgs(
            titleEscrowAddress,
            tokenAsChainManager.address,
            users.beneficiary.address,
            users.beneficiary.address
          );
      });
    });

    describe("Withdraw from child chain", () => {
      beforeEach(async () => {
        await tradeTrustERC721Child.connect(fakeChainManager).deposit(users.beneficiary.address, tokenId, "0x");
      });

      it("should revert if caller is not chain manager", async () => {
        const tx = tradeTrustERC721Child.connect(users.carrier).withdraw(users.beneficiary.address, tokenId, "0x");

        expect(tx).to.be.revertedWith("AccessControl");
      });

      it("should revert if chain manager is not approved", async () => {
        const tx = tradeTrustERC721Child.connect(fakeChainManager).withdraw(users.beneficiary.address, tokenId, "0x");

        await expect(tx).to.be.revertedWith("TradeTrustERC721Child: Caller is not owner nor approved");
      });

      describe("When chain manager is approved", () => {
        let titleEscrowAddress: string;

        beforeEach(async () => {
          titleEscrowAddress = await tradeTrustERC721Child.ownerOf(tokenId);
          const titleEscrowSigner = await impersonateAccount({ address: titleEscrowAddress });
          await tradeTrustERC721Child.connect(titleEscrowSigner).approve(fakeChainManager.address, tokenId);
        });

        afterEach(async () => {
          await stopImpersonatingAccount({ address: titleEscrowAddress });
        });

        it("should burn the token to zero address", async () => {
          await tradeTrustERC721Child.connect(fakeChainManager).withdraw(users.beneficiary.address, tokenId, "0x");

          const tx = tradeTrustERC721Child.ownerOf(tokenId);

          expect(tx).to.be.revertedWith("ERC721: owner query for nonexistent token");
        });
      });
    });
  });
});
