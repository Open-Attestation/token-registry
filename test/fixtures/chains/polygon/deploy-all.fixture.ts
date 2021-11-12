/* eslint-disable camelcase */
import { MockContract, smock } from "@defi-wonderland/smock";
import {
  FxRootMock,
  FxRootMock__factory,
  TradeTrustERC721RootTunnelMock,
  TradeTrustERC721ChildTunnelMock,
  FxChildMock,
  FxChildMock__factory,
  TradeTrustERC721RootMintable,
  TradeTrustERC721ChildMintable,
  TradeTrustERC721,
  TradeTrustERC721Child,
} from "@tradetrust/contracts";
import { ethers } from "hardhat";
import { utils as ethersUtils } from "ethers/lib/ethers";
import { ContractFactory } from "ethers";
import { TestUsers } from "../../deploy-token.fixture";

const deployAllFixture = async <
  TRootToken extends TradeTrustERC721RootMintable | TradeTrustERC721,
  TChildToken extends TradeTrustERC721ChildMintable | TradeTrustERC721Child
>({
  checkPointManagerAddress,
  users,
  rootTokenContractName,
  childTokenContractName,
}: {
  checkPointManagerAddress: string;
  users: TestUsers;
  rootTokenContractName: "TradeTrustERC721RootMintable" | "TradeTrustERC721";
  childTokenContractName: "TradeTrustERC721ChildMintable" | "TradeTrustERC721Child";
}) => {
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
  const stubTradeTrustERC721Factory = await smock.mock<ContractFactory>(rootTokenContractName);
  const stubRootToken = (await stubTradeTrustERC721Factory.deploy(
    "The Great Shipping Company",
    "GSC"
  )) as MockContract<TRootToken>;

  // Deploy root chain manager
  const tradeTrustERC721RootTunnelMockFactory = await ethers.getContractFactory("TradeTrustERC721RootTunnelMock");
  const tradeTrustERC721RootTunnelMock = (await tradeTrustERC721RootTunnelMockFactory
    .connect(users.carrier)
    .deploy(checkPointManagerAddress, stubFxRootMock.address, stubRootToken.address)) as TradeTrustERC721RootTunnelMock;

  /**
   * Deployment on Child chain
   */
  // Deploy FxChildMock
  const stubFxChildMockFactory = await smock.mock<FxChildMock__factory>("FxChildMock");
  const stubFxChildMock: MockContract<FxChildMock> = await stubFxChildMockFactory.connect(users.carrier).deploy();

  // Deploy child token
  const stubTradeTrustERC721ChildFactory = await smock.mock<ContractFactory>(childTokenContractName);
  const stubChildToken = (await stubTradeTrustERC721ChildFactory.deploy(
    "The Great Shipping Company",
    "GSC"
  )) as MockContract<TChildToken>;

  // Deploy child chain manager
  const tradeTrustERC721ChildTunnelMockFactory = await ethers.getContractFactory("TradeTrustERC721ChildTunnelMock");
  const tradeTrustERC721ChildTunnelMock = (await tradeTrustERC721ChildTunnelMockFactory
    .connect(users.carrier)
    .deploy(stubFxChildMock.address, stubChildToken.address)) as TradeTrustERC721ChildTunnelMock;

  /**
   * Setup
   */
  // Setup the roles
  await Promise.all([
    stubRootToken.grantRole(CHAIN_MANAGER_ROLE, tradeTrustERC721RootTunnelMock.address),
    stubChildToken.grantRole(CHAIN_MANAGER_ROLE, tradeTrustERC721ChildTunnelMock.address),
  ]);

  // Link up cross-chain managers
  await Promise.all([
    tradeTrustERC721RootTunnelMock.setFxChildTunnel(tradeTrustERC721ChildTunnelMock.address),
    tradeTrustERC721ChildTunnelMock.setFxRootTunnel(tradeTrustERC721RootTunnelMock.address),
  ]);

  return {
    stubFxRootMock,
    stubFxChildMock,
    stubRootToken,
    stubChildToken,
    tradeTrustERC721RootTunnelMock,
    tradeTrustERC721ChildTunnelMock,
  };
};

export const deployAllMintableFixture =
  ({ checkPointManagerAddress, users }: { checkPointManagerAddress: string; users: TestUsers }) =>
  async () =>
    deployAllFixture<TradeTrustERC721RootMintable, TradeTrustERC721ChildMintable>({
      checkPointManagerAddress,
      users,
      rootTokenContractName: "TradeTrustERC721RootMintable",
      childTokenContractName: "TradeTrustERC721ChildMintable",
    });

export const deployAllNonMintableFixture =
  ({ checkPointManagerAddress, users }: { checkPointManagerAddress: string; users: TestUsers }) =>
  async () =>
    deployAllFixture<TradeTrustERC721, TradeTrustERC721Child>({
      checkPointManagerAddress,
      users,
      rootTokenContractName: "TradeTrustERC721",
      childTokenContractName: "TradeTrustERC721Child",
    });
