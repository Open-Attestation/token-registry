/* eslint-disable camelcase */
import { MockContract, smock } from "@defi-wonderland/smock";
import {
  FxRootMock,
  FxRootMock__factory,
  TradeTrustERC721RootTunnelMock,
  TradeTrustERC721__factory,
  TradeTrustERC721,
  TradeTrustERC721Child__factory,
  TradeTrustERC721Child,
  TradeTrustERC721ChildTunnelMock,
  FxChildMock,
  FxChildMock__factory
} from "@tradetrust/contracts";
import { ethers } from "hardhat";
import { utils as ethersUtils } from "ethers/lib/ethers";
import { TestUsers } from "../../deploy-token.fixture";

export const deployNonMintableFixture =
  ({ checkPointManagerAddress, users }: { checkPointManagerAddress: string; users: TestUsers }) =>
  async () => {
    const CHAIN_MANAGER_ROLE = ethersUtils.id("CHAIN_MANAGER_ROLE");
    const stateSenderAddress = "0x0000000000000000000000000000000000001001";

    /**
     * Deployment on Root chain
     */
    // Deploy FxRootMock
    const stubFxRootMockFactory = await smock.mock<FxRootMock__factory>("FxRootMock");
    const stubFxRootMock: MockContract<FxRootMock> = await stubFxRootMockFactory
      .connect(users.carrier)
      .deploy(stateSenderAddress);
    stubFxRootMock.sendMessageToChild.returns();

    // Deploy root token
    const stubTradeTrustERC721Factory = await smock.mock<TradeTrustERC721__factory>("TradeTrustERC721");
    const stubRootToken: MockContract<TradeTrustERC721> = await stubTradeTrustERC721Factory.deploy(
      "The Great Shipping Company",
      "GSC"
    );

    // Deploy root chain manager
    const tradeTrustERC721RootTunnelMockFactory = await ethers.getContractFactory("TradeTrustERC721RootTunnelMock");
    const tradeTrustERC721RootTunnelMock = (await tradeTrustERC721RootTunnelMockFactory
      .connect(users.carrier)
      .deploy(
        checkPointManagerAddress,
        stubFxRootMock.address,
        stubRootToken.address
      )) as TradeTrustERC721RootTunnelMock;

    /**
     * Deployment on Child chain
     */
    // Deploy FxChildMock
    const stubFxChildMockFactory = await smock.mock<FxChildMock__factory>("FxChildMock");
    const stubFxChildMock: MockContract<FxChildMock> = await stubFxChildMockFactory.connect(users.carrier).deploy();

    // Deploy child token
    const stubTradeTrustERC721ChildFactory = await smock.mock<TradeTrustERC721Child__factory>("TradeTrustERC721Child");
    const stubChildToken: MockContract<TradeTrustERC721Child> = await stubTradeTrustERC721ChildFactory.deploy(
      "The Great Shipping Company",
      "GSC"
    );

    // Deploy child chain manager
    const tradeTrustERC721ChildTunnelMockFactory = await ethers.getContractFactory("TradeTrustERC721ChildTunnelMock");
    const tradeTrustERC721ChildTunnelMock = (await tradeTrustERC721ChildTunnelMockFactory
      .connect(users.carrier)
      .deploy(stubFxChildMock.address, stubChildToken.address)) as TradeTrustERC721ChildTunnelMock;

    // Link up cross-chain managers
    await tradeTrustERC721RootTunnelMock.setFxChildTunnel(tradeTrustERC721ChildTunnelMock.address);
    await tradeTrustERC721ChildTunnelMock.setFxRootTunnel(tradeTrustERC721RootTunnelMock.address);

    // Setup the roles
    await stubRootToken.grantRole(CHAIN_MANAGER_ROLE, tradeTrustERC721RootTunnelMock.address);
    await stubChildToken.grantRole(CHAIN_MANAGER_ROLE, tradeTrustERC721ChildTunnelMock.address);

    return {
      stubFxRootMock,
      stubFxChildMock,
      stubRootToken,
      stubChildToken,
      tradeTrustERC721RootTunnelMock,
      tradeTrustERC721ChildTunnelMock
    };
  };
