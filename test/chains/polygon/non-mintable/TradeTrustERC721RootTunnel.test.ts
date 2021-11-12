/* eslint-disable camelcase */
import { ethers } from "hardhat";
import {
  FxRootMock,
  TradeTrustERC721RootTunnelMock,
  TradeTrustERC721,
  TradeTrustERC721Child,
} from "@tradetrust/contracts";
import * as faker from "faker";
import { MockContract } from "@defi-wonderland/smock";
import { loadFixture } from "ethereum-waffle";
import { utils as ethersUtils } from "ethers/lib/ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "../../../index";
import { TestUsers } from "../../../fixtures/deploy-token.fixture";
import { getTestUsers, stopImpersonatingAccount } from "../../../utils";
import { deployAllNonMintableFixture } from "../../../fixtures/chains/polygon/deploy-all.fixture";

const abiCoder = new ethersUtils.AbiCoder();

describe("TradeTrustERC721RootTunnel - Non-Mintable Tokens", () => {
  let checkPointManagerAddress: string;
  let users: TestUsers;

  let stubFxRootMock: MockContract<FxRootMock>;

  let stubRootToken: MockContract<TradeTrustERC721>;
  let stubChildNonMintableToken: MockContract<TradeTrustERC721Child>;
  let tradeTrustERC721RootTunnelMock: TradeTrustERC721RootTunnelMock;

  let tokenId: number;

  beforeEach(async () => {
    users = await getTestUsers();
    checkPointManagerAddress = faker.finance.ethereumAddress();

    tokenId = faker.datatype.number();

    const nonMintableFixtures = await loadFixture(
      deployAllNonMintableFixture({
        checkPointManagerAddress,
        users,
      })
    );
    stubFxRootMock = nonMintableFixtures.stubFxRootMock;
    stubRootToken = nonMintableFixtures.stubRootToken;
    stubChildNonMintableToken = nonMintableFixtures.stubChildToken;
    tradeTrustERC721RootTunnelMock = nonMintableFixtures.tradeTrustERC721RootTunnelMock;
  });

  afterEach(async () => {
    await stopImpersonatingAccount({ address: tradeTrustERC721RootTunnelMock.address });
  });

  describe("Deployment", () => {
    it("should revert if root token is zero address", async () => {
      const tradeTrustERC721RootTunnelMockFactory = await ethers.getContractFactory("TradeTrustERC721RootTunnelMock");

      const tx = tradeTrustERC721RootTunnelMockFactory
        .connect(users.carrier)
        .deploy(checkPointManagerAddress, stubFxRootMock.address, ethers.constants.AddressZero);

      await expect(tx).to.be.revertedWith("TradeTrustERC721RootTunnel: Root token is zero address");
    });
  });

  describe("ERC721 Receiver", () => {
    it("should be able to receive token", async () => {
      await stubRootToken.connect(users.carrier).mint(tradeTrustERC721RootTunnelMock.address, tokenId);

      const owner = await stubRootToken.ownerOf(tokenId);
      expect(owner).to.equal(tradeTrustERC721RootTunnelMock.address);
    });
  });

  describe("Bridging on Root Token", () => {
    describe("When depositing into L1", () => {
      let rootTunnelMockAsBeneficiary: TradeTrustERC721RootTunnelMock;

      beforeEach(async () => {
        await stubRootToken.connect(users.carrier).mint(users.beneficiary.address, tokenId);
        await stubRootToken.connect(users.beneficiary).approve(tradeTrustERC721RootTunnelMock.address, tokenId);
        rootTunnelMockAsBeneficiary = tradeTrustERC721RootTunnelMock.connect(users.beneficiary);
      });

      it("should lock root token on chain manager", async () => {
        await rootTunnelMockAsBeneficiary.deposit(tokenId, "0x");

        const safeTransferFrom = stubRootToken["safeTransferFrom(address,address,uint256,bytes)"];
        expect(safeTransferFrom).to.be.calledOnce;
        expect(safeTransferFrom).to.be.calledWith(
          users.beneficiary.address,
          tradeTrustERC721RootTunnelMock.address,
          tokenId,
          "0x"
        );
      });

      it("should send message to child chain", async () => {
        await rootTunnelMockAsBeneficiary.deposit(tokenId, "0x");

        expect(stubFxRootMock.sendMessageToChild).to.be.calledOnce;
      });

      it("should emit RootTokenDeposit event", async () => {
        const tx = rootTunnelMockAsBeneficiary.deposit(tokenId, "0x");

        await expect(tx)
          .to.be.emit(tradeTrustERC721RootTunnelMock, "RootTokenDeposit")
          .withArgs(stubRootToken.address, users.beneficiary.address, tokenId);
      });
    });

    describe("When withdrawing from L2", () => {
      let dataFromChild: string;

      let withdrawer: SignerWithAddress;
      let rootTunnelMockAsBeneficiary: TradeTrustERC721RootTunnelMock;

      beforeEach(async () => {
        withdrawer = users.beneficiary;

        await stubRootToken.connect(users.carrier).mint(tradeTrustERC721RootTunnelMock.address, tokenId);

        dataFromChild = abiCoder.encode(
          ["address", "address", "uint256", "bytes"],
          [stubChildNonMintableToken.address, withdrawer.address, ethers.BigNumber.from(tokenId), "0x00"]
        );

        rootTunnelMockAsBeneficiary = tradeTrustERC721RootTunnelMock.connect(users.beneficiary);
      });

      it("should transfer token from chain manager to withdrawer", async () => {
        await rootTunnelMockAsBeneficiary.processMessageFromChildInternal(dataFromChild);

        expect(stubRootToken["safeTransferFrom(address,address,uint256,bytes)"]).to.be.calledOnce;
        expect(stubRootToken["safeTransferFrom(address,address,uint256,bytes)"]).to.be.calledWith(
          rootTunnelMockAsBeneficiary.address,
          withdrawer.address,
          tokenId,
          "0x00"
        );
      });

      it("should revert if token ID does not exist", async () => {
        const invalidTokenId = faker.datatype.number();
        dataFromChild = abiCoder.encode(
          ["address", "address", "uint256", "bytes"],
          [stubChildNonMintableToken.address, withdrawer.address, ethers.BigNumber.from(invalidTokenId), "0x00"]
        );

        const tx = rootTunnelMockAsBeneficiary.processMessageFromChildInternal(dataFromChild);

        await expect(tx).to.be.revertedWith("MinterRole: caller does not have the Minter role");
      });

      it("should revert when root token does not support ITradeTrustERC721Mintable", async () => {
        stubRootToken.supportsInterface.returns(false);

        const tx = rootTunnelMockAsBeneficiary.processMessageFromChildInternal(dataFromChild);

        await expect(tx).to.be.revertedWith("TradeTrustERC721RootTunnel: Unsupported root token");
      });

      it("should emit RootTokenWithdrawal event", async () => {
        const tx = rootTunnelMockAsBeneficiary.processMessageFromChildInternal(dataFromChild);

        await expect(tx)
          .to.emit(tradeTrustERC721RootTunnelMock, "RootTokenWithdrawal")
          .withArgs(stubRootToken.address, stubChildNonMintableToken.address, withdrawer.address, tokenId);
      });
    });
  });
});
