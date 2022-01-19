/* eslint-disable camelcase */
import { ethers } from "hardhat";
import {
  FxChildMock,
  TradeTrustERC721ChildTunnelMock,
  TradeTrustERC721ChildMintable,
  TradeTrustERC721RootTunnelMock,
} from "@tradetrust/contracts";
import * as faker from "faker";
import { MockContract } from "@defi-wonderland/smock";
import { loadFixture } from "ethereum-waffle";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "../../index";
import { TestUsers } from "../../fixtures/deploy-token.fixture";
import { getTestUsers } from "../../utils";
import { deployAllMintableFixture } from "../../fixtures/chains/polygon/deploy-all.fixture";

describe("TradeTrustERC721ChildTunnel - Common", () => {
  let stubFxChildMock: MockContract<FxChildMock>;

  let stubChildToken: MockContract<TradeTrustERC721ChildMintable>;
  let tradeTrustERC721RootTunnelMock: TradeTrustERC721RootTunnelMock;

  let users: TestUsers;

  beforeEach(async () => {
    users = await getTestUsers();

    const fixtures = await loadFixture(
      deployAllMintableFixture({
        checkPointManagerAddress: faker.finance.ethereumAddress(),
        users,
      })
    );

    stubFxChildMock = fixtures.stubFxChildMock;
    stubChildToken = fixtures.stubChildToken;
    tradeTrustERC721RootTunnelMock = fixtures.tradeTrustERC721RootTunnelMock;
  });

  describe("Linking root chain manager", () => {
    let deployer: SignerWithAddress;
    let chainManager: TradeTrustERC721ChildTunnelMock;

    beforeEach(async () => {
      deployer = users.carrier;
      const tradeTrustERC721ChildTunnelMockFactory = await ethers.getContractFactory("TradeTrustERC721ChildTunnelMock");
      chainManager = (await tradeTrustERC721ChildTunnelMockFactory
        .connect(deployer)
        .deploy(stubFxChildMock.address, stubChildToken.address)) as TradeTrustERC721ChildTunnelMock;
    });

    it("should allow deployer to set root tunnel", async () => {
      await chainManager.connect(deployer).setFxRootTunnel(tradeTrustERC721RootTunnelMock.address);

      const rootTunnel = await chainManager.fxRootTunnel();

      expect(rootTunnel).to.equal(tradeTrustERC721RootTunnelMock.address);
    });

    it("should revert when a non-owner sets the root tunnel", async () => {
      const tx = chainManager.connect(users.beneficiary).setFxRootTunnel(tradeTrustERC721RootTunnelMock.address);

      await expect(tx).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });
});
