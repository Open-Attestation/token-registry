/* eslint-disable camelcase */
import { ethers } from "hardhat";
import * as faker from "faker";
import { MockContract, smock } from "@defi-wonderland/smock";
import {
  TitleEscrowCloneable,
  TradeTrustERC721RootMintable,
  TradeTrustERC721RootMintable__factory,
} from "@tradetrust/contracts";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "../../../index";
import { TestUsers } from "../../../fixtures/deploy-token.fixture";
import { RoleConstants } from "../../../../src/common/constants";
import { getTestUsers, toAccessControlRevertMessage } from "../../../utils";

describe("TradeTrustERC721RootMintable", () => {
  const CHAIN_MANAGER_ROLE = RoleConstants.chainManager;

  let users: TestUsers;
  let tokenId: number;
  let fakeChainManager: SignerWithAddress;

  let tradeTrustERC721RootMintable: MockContract<TradeTrustERC721RootMintable>;

  beforeEach(async () => {
    tokenId = faker.datatype.number();

    users = await getTestUsers();

    const tradeTrustERC721RootMintableFactory = await smock.mock<TradeTrustERC721RootMintable__factory>(
      "TradeTrustERC721RootMintable"
    );
    tradeTrustERC721RootMintable = await tradeTrustERC721RootMintableFactory.deploy(
      "The Great Shipping Company",
      "GSC"
    );

    fakeChainManager = users.others[users.others.length - 1];

    await tradeTrustERC721RootMintable.grantRole(CHAIN_MANAGER_ROLE, fakeChainManager.address);
  });

  describe("When calling mintTitle", () => {
    it("should mint a new token to a title escrow with correct ownership", async () => {
      await tradeTrustERC721RootMintable
        .connect(fakeChainManager)
        .mintTitle(users.beneficiary.address, users.holder.address, tokenId);

      const titleEscrowAddr = await tradeTrustERC721RootMintable.ownerOf(tokenId);
      const titleEscrowFactory = await ethers.getContractFactory("TitleEscrowCloneable");
      const titleEscrow = titleEscrowFactory.attach(titleEscrowAddr) as TitleEscrowCloneable;
      const beneficiary = await titleEscrow.beneficiary();
      const holder = await titleEscrow.holder();

      expect(beneficiary).to.equal(users.beneficiary.address);
      expect(holder).to.equal(users.holder.address);
    });

    it("should revert if caller does not have chain manager role", async () => {
      const tx = tradeTrustERC721RootMintable
        .connect(users.carrier)
        .mintTitle(users.beneficiary.address, users.holder.address, tokenId);

      await expect(tx).to.be.revertedWith(
        toAccessControlRevertMessage(users.carrier.address, RoleConstants.chainManager)
      );
    });
  });

  describe("When calling mint", () => {
    it("should mint a new token to the specified address", async () => {
      await tradeTrustERC721RootMintable.connect(fakeChainManager).mint(users.beneficiary.address, tokenId);

      const owner = await tradeTrustERC721RootMintable.ownerOf(tokenId);

      expect(owner).to.equal(users.beneficiary.address);
    });

    it("should revert if the caller does not have chain manager role", async () => {
      const tx = tradeTrustERC721RootMintable.connect(users.carrier).mint(users.beneficiary.address, tokenId);

      await expect(tx).to.be.revertedWith(
        toAccessControlRevertMessage(users.carrier.address, RoleConstants.chainManager)
      );
    });
  });
});
