import {providers} from "ethers";
import {TitleEscrowFactory, TradeTrustERC721Factory, TitleEscrowCreatorFactory} from "./index";
import {TradeTrustERC721} from "../types/TradeTrustERC721";
import {TitleEscrowCreator} from "../types/TitleEscrowCreator";

const provider = new providers.JsonRpcProvider();
const signer1 = provider.getSigner(0);
const signer2 = provider.getSigner(1);
const tokenId = "0x624d0d7ae6f44d41d368d8280856dbaac6aa29fb3b35f45b80a7c1c90032eeb3";
let account1: string;
let account2: string;

beforeAll(async () => {
  account1 = await signer1.getAddress();
  account2 = await signer2.getAddress();
});

describe("TitleEscrowCreatorFactory", () => {
  let tokenRegistry: TradeTrustERC721;
  let titleEscrowFactory: TitleEscrowCreator;

  beforeEach(async () => {
    const factory = new TitleEscrowCreatorFactory(signer1);
    titleEscrowFactory = await factory.deploy();
    const tokenRegistryFactory = new TradeTrustERC721Factory(signer1);
    tokenRegistry = await tokenRegistryFactory.deploy("MY_TOKEN_REGISTRY", "TKN");
  });

  it("should be able to deploy a new TitleEscrowCreator", async () => {
    expect(titleEscrowFactory.address).not.toBeUndefined();
  });

  it("should be able to connect to an existing TitleEscrowCreator and write to it", async () => {
    const connectedCreator = TitleEscrowCreatorFactory.connect(titleEscrowFactory.address, signer1);
    const receipt = await connectedCreator.deployNewTitleEscrow(tokenRegistry.address, account1, account2);
    const tx = await receipt.wait();
    const deployedEventArgs = tx.events?.find(evt => evt.event === "TitleEscrowDeployed")?.args as any;
    expect(deployedEventArgs.tokenRegistry).toBe(tokenRegistry.address);
    expect(deployedEventArgs.beneficiary).toBe(account1);
    expect(deployedEventArgs.holder).toBe(account2);
  });
});

describe("TitleEscrowFactory", () => {
  let tokenRegistry: TradeTrustERC721;

  beforeEach(async () => {
    const tokenRegistryFactory = new TradeTrustERC721Factory(signer1);
    tokenRegistry = await tokenRegistryFactory.deploy("MY_TOKEN_REGISTRY", "TKN");
  });

  const deployTitleEscrow = async () => {
    const factory = new TitleEscrowFactory(signer1);
    const escrowInstance = await factory.deploy(tokenRegistry.address, account1, account2, account1);
    return escrowInstance;
  };

  it("should be able to deploy a new TitleEscrow", async () => {
    const escrowInstance = await deployTitleEscrow();
    const beneficiary = await escrowInstance.beneficiary();
    const holder = await escrowInstance.holder();
    expect(beneficiary).toBe(account1);
    expect(holder).toBe(account2);
  });

  it("should be able to connect to an existing TitleEscrow", async () => {
    const escrowInstance = await deployTitleEscrow();
    const existingTitleEscrowAddress = escrowInstance.address;
    const connectedEscrow = TitleEscrowFactory.connect(existingTitleEscrowAddress, signer1);
    const beneficiary = await connectedEscrow.beneficiary();
    const holder = await connectedEscrow.holder();
    expect(beneficiary).toBe(account1);
    expect(holder).toBe(account2);
  });

  it("should be able to write to TitleEscrow", async () => {
    const escrowInstance = await deployTitleEscrow();
    await tokenRegistry.safeMint(escrowInstance.address, tokenId, []);
    await escrowInstance.approveNewOwner(account2);
    const target = await escrowInstance.approvedOwner();
    expect(target).toBe(account2);
  });
});

describe("TradeTrustERC721Factory", () => {
  const deployTradeTrustERC721 = async () => {
    const factory = new TradeTrustERC721Factory(signer1);
    const registryInstance = await factory.deploy("TOKEN_REGISTRY_NAME", "TKN");
    return registryInstance;
  };

  it("should be able to deploy a new TradeTrustERC721", async () => {
    const instance = await deployTradeTrustERC721();
    const sym = await instance.symbol();
    expect(sym).toBe("TKN");
  });
  it("should be able to connect to an existing TradeTrustERC721", async () => {
    const deployedInstance = await deployTradeTrustERC721();
    const instance = await TradeTrustERC721Factory.connect(deployedInstance.address, signer1);
    const sym = await instance.symbol();
    expect(sym).toBe("TKN");
  });
  it("should be able to write to TradeTrustERC721", async () => {
    const instance = await deployTradeTrustERC721();
    await instance.safeMint(account1, tokenId, []);
    const ownerOfToken = await instance.ownerOf(tokenId);
    expect(ownerOfToken).toBe(account1);
  });
});
