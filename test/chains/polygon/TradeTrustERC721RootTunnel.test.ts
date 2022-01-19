/* eslint-disable camelcase */
import { ethers } from "hardhat";
import {
  FxRootMock,
  TradeTrustERC721RootTunnelMock,
  TradeTrustERC721RootMintable,
  TradeTrustERC721ChildTunnelMock,
} from "@tradetrust/contracts";
import * as faker from "faker";
import { MockContract } from "@defi-wonderland/smock";
import { loadFixture } from "ethereum-waffle";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "../../index";
import { TestUsers } from "../../fixtures/deploy-token.fixture";
import { getTestUsers } from "../../utils";
import { deployAllMintableFixture } from "../../fixtures/chains/polygon/deploy-all.fixture";

describe("TradeTrustERC721RootTunnel - Common", () => {
  let checkPointManagerAddress: string;
  let users: TestUsers;

  let stubFxRootMock: MockContract<FxRootMock>;
  let stubRootToken: MockContract<TradeTrustERC721RootMintable>;
  let tradeTrustERC721ChildTunnelMock: TradeTrustERC721ChildTunnelMock;

  beforeEach(async () => {
    users = await getTestUsers();
    checkPointManagerAddress = faker.finance.ethereumAddress();

    const mintableFixtures = await loadFixture(
      deployAllMintableFixture({
        checkPointManagerAddress,
        users,
      })
    );

    stubFxRootMock = mintableFixtures.stubFxRootMock;
    stubRootToken = mintableFixtures.stubRootToken;
    tradeTrustERC721ChildTunnelMock = mintableFixtures.tradeTrustERC721ChildTunnelMock;
  });

  describe("Linking child chain manager", () => {
    let deployer: SignerWithAddress;
    let chainManager: TradeTrustERC721RootTunnelMock;

    beforeEach(async () => {
      deployer = users.carrier;
      const tradeTrustERC721RootTunnelMockFactory = await ethers.getContractFactory("TradeTrustERC721RootTunnelMock");
      chainManager = (await tradeTrustERC721RootTunnelMockFactory
        .connect(deployer)
        .deploy(
          checkPointManagerAddress,
          stubFxRootMock.address,
          stubRootToken.address
        )) as TradeTrustERC721RootTunnelMock;
    });

    it("should allow deployer to set root tunnel", async () => {
      await chainManager.connect(deployer).setFxChildTunnel(tradeTrustERC721ChildTunnelMock.address);

      const childTunnel = await chainManager.fxChildTunnel();

      expect(childTunnel).to.equal(tradeTrustERC721ChildTunnelMock.address);
    });

    it("should revert when a non-owner sets the root tunnel", async () => {
      const tx = chainManager.connect(users.beneficiary).setFxChildTunnel(tradeTrustERC721ChildTunnelMock.address);

      await expect(tx).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });
});
