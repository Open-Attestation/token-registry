/* eslint-disable camelcase */
import { ethers } from "hardhat";
import { Signer, utils as ethersUtils } from "ethers";
import {
  FxChildMock,
  TradeTrustERC721ChildTunnelMock,
  TradeTrustERC721ChildMintable,
  TradeTrustERC721RootMintable,
  TradeTrustERC721RootTunnelMock,
} from "@tradetrust/contracts";
import * as faker from "faker";
import { MockContract } from "@defi-wonderland/smock";
import { loadFixture } from "ethereum-waffle";
import { expect } from "../../../index";
import { TestUsers } from "../../../fixtures/deploy-token.fixture";
import { getTestUsers, impersonateAccount, stopImpersonatingAccount } from "../../../utils";
import { deployMintableFixture } from "../../../fixtures/chains/polygon/deploy-mintable.fixture";

const abiCoder = new ethersUtils.AbiCoder();

describe("TradeTrustERC721ChildTunnel - Mintable Tokens", () => {
  let stubFxChildMock: MockContract<FxChildMock>;

  let stubRootToken: MockContract<TradeTrustERC721RootMintable>;
  let stubChildToken: MockContract<TradeTrustERC721ChildMintable>;
  let tradeTrustERC721ChildTunnelMock: TradeTrustERC721ChildTunnelMock;
  let tradeTrustERC721RootTunnelMock: TradeTrustERC721RootTunnelMock;

  let users: TestUsers;
  let childChainManagerSigner: Signer;

  beforeEach(async () => {
    users = await getTestUsers();

    const fixtures = await loadFixture(
      deployMintableFixture({
        checkPointManagerAddress: faker.finance.ethereumAddress(),
        users,
      })
    );

    stubFxChildMock = fixtures.stubFxChildMock;
    stubRootToken = fixtures.stubRootToken;
    stubChildToken = fixtures.stubChildToken;
    tradeTrustERC721ChildTunnelMock = fixtures.tradeTrustERC721ChildTunnelMock;
    tradeTrustERC721RootTunnelMock = fixtures.tradeTrustERC721RootTunnelMock;

    childChainManagerSigner = await impersonateAccount({ address: tradeTrustERC721ChildTunnelMock.address });
  });

  describe("Deployment", () => {
    it("should revert if child token address is zero", async () => {
      const tradeTrustERC721ChildTunnelMockFactory = await ethers.getContractFactory("TradeTrustERC721ChildTunnelMock");
      const tx = tradeTrustERC721ChildTunnelMockFactory
        .connect(users.carrier)
        .deploy(stubFxChildMock.address, ethers.constants.AddressZero);

      await expect(tx).to.be.revertedWith("TradeTrustERC721ChildTunnel: Child token is zero address");
    });
  });

  describe("ERC721 Receiver", () => {
    it("should be able to receive token", async () => {
      const tokenId = faker.datatype.number();
      await stubChildToken.connect(users.carrier).mint(tradeTrustERC721ChildTunnelMock.address, tokenId);

      const owner = await stubChildToken.ownerOf(tokenId);
      expect(owner).to.equal(tradeTrustERC721ChildTunnelMock.address);
    });
  });

  describe("Bridging on Child Token", () => {
    let stateId: string;
    let tokenId: number;
    let data: string;

    beforeEach(async () => {
      stateId = faker.datatype.hexaDecimal();
      tokenId = faker.datatype.number();
      data = abiCoder.encode(
        ["address", "address", "uint256", "bytes"],
        [stubRootToken.address, users.beneficiary.address, ethers.BigNumber.from(tokenId), "0x00"]
      );
    });

    describe("When receiving from StateSender", () => {
      // Address of StateSender as defined by matic
      const stateSenderAddress = "0x0000000000000000000000000000000000001001";
      let stateSenderSigner: Signer;

      beforeEach(async () => {
        stateSenderSigner = await impersonateAccount({
          address: stateSenderAddress,
        });
      });

      afterEach(async () => {
        await stopImpersonatingAccount({ address: stateSenderAddress });
      });

      describe("When triggered from fxChild", () => {
        let stateData: string;

        beforeEach(async () => {
          stubFxChildMock = stubFxChildMock.connect(stateSenderSigner);

          stateData = abiCoder.encode(
            ["address", "address", "bytes"],
            [tradeTrustERC721RootTunnelMock.address, tradeTrustERC721ChildTunnelMock.address, data]
          );
        });

        it("should revert when sender is not fxChild", async () => {
          const tx = stubFxChildMock.connect(users.carrier).onStateReceive(stateId, stateData);

          await expect(tx).to.be.rejectedWith("Invalid sender");
        });
      });
    });

    describe("When depositing into L2", () => {
      beforeEach(async () => {
        // Assertion: Token is not deposited into L2 yet
        const tx = stubChildToken.ownerOf(tokenId);
        await expect(tx).to.be.reverted;
      });

      describe("Checks before processing on child tunnel", () => {
        it("should revert when caller is not fxChild", async () => {
          const tx = tradeTrustERC721ChildTunnelMock.processMessageFromRoot(
            stateId,
            tradeTrustERC721RootTunnelMock.address,
            data
          );

          await expect(tx).to.be.revertedWith("FxBaseChildTunnel: INVALID_SENDER");
        });

        it("should revert if rootMessageSender is not root tunnel", async () => {
          const childTunnelWithUnsetRootTunnelFactory = await ethers.getContractFactory(
            "TradeTrustERC721ChildTunnelMock"
          );
          const childTunnelWithUnsetRootTunnel = (await childTunnelWithUnsetRootTunnelFactory
            .connect(users.carrier)
            .deploy(stubFxChildMock.address, stubChildToken.address)) as TradeTrustERC721ChildTunnelMock;
          const fxChildSigner = await impersonateAccount({ address: stubFxChildMock.address });

          const tx = childTunnelWithUnsetRootTunnel
            .connect(fxChildSigner)
            .processMessageFromRoot(stateId, tradeTrustERC721RootTunnelMock.address, data);

          await expect(tx).to.be.revertedWith("FxBaseChildTunnel: INVALID_SENDER_FROM_ROOT");

          // Clean up
          await stopImpersonatingAccount({ address: stubFxChildMock.address });
        });
      });

      it("should call deposit on the child token", async () => {
        await tradeTrustERC721ChildTunnelMock.processMessageFromRootInternal(
          stateId,
          tradeTrustERC721RootTunnelMock.address,
          data
        );

        expect(stubChildToken.deposit).has.been.calledOnce;
        expect(stubChildToken.deposit).to.be.calledWith(users.beneficiary.address, tokenId, "0x");
      });

      it("should mint a new token on child token", async () => {
        await tradeTrustERC721ChildTunnelMock.processMessageFromRootInternal(
          stateId,
          tradeTrustERC721RootTunnelMock.address,
          data
        );

        const tx = stubChildToken.ownerOf(tokenId);
        await expect(tx).to.not.be.reverted;
      });

      it("should emit ChildTokenDeposit event", async () => {
        const tx = tradeTrustERC721ChildTunnelMock.processMessageFromRootInternal(
          stateId,
          tradeTrustERC721RootTunnelMock.address,
          data
        );

        await expect(tx)
          .to.emit(tradeTrustERC721ChildTunnelMock, "ChildTokenDeposit")
          .withArgs(stubRootToken.address, stubChildToken.address, users.beneficiary.address, tokenId);
      });
    });

    describe("When withdrawing to L1", () => {
      let titleEscrowSigner: Signer;

      beforeEach(async () => {
        titleEscrowSigner = users.beneficiary;

        await stubChildToken.connect(childChainManagerSigner).deposit(users.beneficiary.address, tokenId, "0x00");
        const titleEscrowAddr = await stubChildToken.ownerOf(tokenId);
        titleEscrowSigner = await impersonateAccount({ address: titleEscrowAddr });
        await stubChildToken.connect(titleEscrowSigner).approve(tradeTrustERC721ChildTunnelMock.address, tokenId);
      });

      it("should revert if caller is not owner of token ID", async () => {
        const wrongTokenOwner = users.holder;

        const tx = tradeTrustERC721ChildTunnelMock.connect(wrongTokenOwner).withdraw(tokenId, "0x");

        await expect(tx).to.be.revertedWith("TradeTrustERC721ChildTunnel: Caller is not an owner");
      });

      it("should revert if token ID is does not exist", async () => {
        const invalidTokenId = faker.datatype.number();

        const tx = tradeTrustERC721ChildTunnelMock.connect(users.beneficiary).withdraw(invalidTokenId, "0x");

        await expect(tx).to.be.revertedWith("ERC721: owner query for nonexistent token");
      });

      it("should call withdraw on child token", async () => {
        await tradeTrustERC721ChildTunnelMock.connect(titleEscrowSigner).withdraw(tokenId, "0x");

        const titleEscrowAddr = await titleEscrowSigner.getAddress();
        expect(stubChildToken.withdraw).has.been.calledOnce;
        expect(stubChildToken.withdraw).to.be.calledWith(titleEscrowAddr, tokenId, "0x");
      });

      it("should emit MessageSent event", async () => {
        const titleEscrowAddr = await titleEscrowSigner.getAddress();
        const message = abiCoder.encode(
          ["address", "address", "uint256", "bytes"],
          [stubChildToken.address, titleEscrowAddr, tokenId, "0x"]
        );

        const tx = tradeTrustERC721ChildTunnelMock.connect(titleEscrowSigner).withdraw(tokenId, "0x");

        await expect(tx).to.emit(tradeTrustERC721ChildTunnelMock, "MessageSent").withArgs(message);
      });

      it("should emit ChildTokenWithdrawal event", async () => {
        const titleEscrowAddr = await titleEscrowSigner.getAddress();

        const tx = tradeTrustERC721ChildTunnelMock.connect(titleEscrowSigner).withdraw(tokenId, "0x");

        await expect(tx)
          .to.emit(tradeTrustERC721ChildTunnelMock, "ChildTokenWithdrawal")
          .withArgs(stubChildToken.address, titleEscrowAddr, tokenId);
      });
    });
  });
});
