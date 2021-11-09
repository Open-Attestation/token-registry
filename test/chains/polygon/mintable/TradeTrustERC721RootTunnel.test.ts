/* eslint-disable camelcase */
import { ethers } from "hardhat";
import {
  FxRootMock,
  TradeTrustERC721RootTunnelMock,
  TradeTrustERC721RootMintable,
  TradeTrustERC721ChildMintable
} from "@tradetrust/contracts";
import * as faker from "faker";
import { MockContract } from "@defi-wonderland/smock";
import { loadFixture } from "ethereum-waffle";
import { Signer, utils as ethersUtils } from "ethers/lib/ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "../../../index";
import { TestUsers } from "../../../fixtures/deploy-token.fixture";
import { getTestUsers, impersonateAccount, stopImpersonatingAccount } from "../../../utils";
import { deployMintableFixture } from "../../../fixtures/chains/polygon/deploy-mintable.fixture";

const abiCoder = new ethersUtils.AbiCoder();

describe("TradeTrustERC721RootTunnel - Mintable Tokens", () => {
  let checkPointManagerAddress: string;
  let users: TestUsers;

  let stubFxRootMock: MockContract<FxRootMock>;

  let stubRootToken: MockContract<TradeTrustERC721RootMintable>;
  let stubChildToken: MockContract<TradeTrustERC721ChildMintable>;
  let tradeTrustERC721RootTunnelMock: TradeTrustERC721RootTunnelMock;
  let rootChainManagerSigner: Signer;

  let tokenId: number;

  beforeEach(async () => {
    users = await getTestUsers();
    checkPointManagerAddress = faker.finance.ethereumAddress();

    tokenId = faker.datatype.number();

    const mintableFixtures = await loadFixture(
      deployMintableFixture({
        checkPointManagerAddress,
        users
      })
    );
    stubFxRootMock = mintableFixtures.stubFxRootMock;
    stubRootToken = mintableFixtures.stubRootToken;
    stubChildToken = mintableFixtures.stubChildToken;
    tradeTrustERC721RootTunnelMock = mintableFixtures.tradeTrustERC721RootTunnelMock;
    rootChainManagerSigner = await impersonateAccount({
      address: tradeTrustERC721RootTunnelMock.address
    });
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
      await stubRootToken.connect(rootChainManagerSigner).mint(tradeTrustERC721RootTunnelMock.address, tokenId);

      const owner = await stubRootToken.ownerOf(tokenId);
      expect(owner).to.equal(tradeTrustERC721RootTunnelMock.address);
    });
  });

  describe("Bridging on Root Token", () => {
    describe("When depositing into L1", () => {
      let rootTunnelMockAsBeneficiary: TradeTrustERC721RootTunnelMock;

      beforeEach(async () => {
        await stubRootToken.connect(rootChainManagerSigner).mint(users.beneficiary.address, tokenId);
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

        await stubRootToken.connect(rootChainManagerSigner).mint(tradeTrustERC721RootTunnelMock.address, tokenId);

        dataFromChild = abiCoder.encode(
          ["address", "address", "uint256", "bytes"],
          [stubChildToken.address, withdrawer.address, ethers.BigNumber.from(tokenId), "0x00"]
        );

        rootTunnelMockAsBeneficiary = tradeTrustERC721RootTunnelMock.connect(users.beneficiary);
      });

      it("should check if a token ID exists on root token", async () => {
        await rootTunnelMockAsBeneficiary.processMessageFromChildInternal(dataFromChild);

        expect(stubRootToken.exists).to.be.calledWith(tokenId);
      });

      it("should transfer from chain manager to withdrawer if token ID exists", async () => {
        await rootTunnelMockAsBeneficiary.processMessageFromChildInternal(dataFromChild);

        expect(stubRootToken["safeTransferFrom(address,address,uint256,bytes)"]).to.be.calledOnce;
        expect(stubRootToken["safeTransferFrom(address,address,uint256,bytes)"]).to.be.calledWith(
          rootTunnelMockAsBeneficiary.address,
          withdrawer.address,
          tokenId,
          "0x00"
        );
      });

      it("should mint the token ID to withdrawer if token ID does not exist", async () => {
        const nonExistTokenId = faker.datatype.number();
        dataFromChild = abiCoder.encode(
          ["address", "address", "uint256", "bytes"],
          [stubChildToken.address, withdrawer.address, ethers.BigNumber.from(nonExistTokenId), "0x00"]
        );

        await rootTunnelMockAsBeneficiary.processMessageFromChildInternal(dataFromChild);

        expect(stubRootToken.mintTitle).to.be.calledOnce;
        expect(stubRootToken.mintTitle).to.be.calledWith(withdrawer.address, withdrawer.address, nonExistTokenId);
      });

      it("should emit RootTokenWithdrawal event", async () => {
        const tx = rootTunnelMockAsBeneficiary.processMessageFromChildInternal(dataFromChild);

        await expect(tx)
          .to.emit(tradeTrustERC721RootTunnelMock, "RootTokenWithdrawal")
          .withArgs(stubRootToken.address, stubChildToken.address, withdrawer.address, tokenId);
      });
    });
  });
});
