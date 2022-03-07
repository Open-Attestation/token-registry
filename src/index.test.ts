import { providers } from "ethers";
import {
  TitleEscrowCloneable__factory as TitleEscrowCloneableFactory,
  TitleEscrowCloner,
  TitleEscrowCloner__factory as TitleEscrowClonerFactory,
  TradeTrustERC721Mock,
  TradeTrustERC721Mock__factory as TradeTrustERC721MockFactory,
} from "./contracts";

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

describe("TitleEscrowClonerFactory", () => {
  let tokenRegistry: TradeTrustERC721Mock;
  let titleEscrowFactory: TitleEscrowCloner;

  beforeEach(async () => {
    const factory = new TitleEscrowClonerFactory(signer1);
    titleEscrowFactory = await factory.deploy();
    const tokenRegistryFactory = new TradeTrustERC721MockFactory(signer1);
    tokenRegistry = await tokenRegistryFactory.deploy("MY_TOKEN_REGISTRY", "TKN");
  });

  it("should be able to deploy a new TitleEscrowCreator", async () => {
    expect(titleEscrowFactory.address).not.toBeUndefined();
  });

  it("should be able to connect to an existing TitleEscrowCreator and write to it", async () => {
    const connectedCreator = TitleEscrowClonerFactory.connect(titleEscrowFactory.address, signer1);
    const receipt = await connectedCreator.deployNewTitleEscrow(tokenRegistry.address, account1, account2);
    const tx = await receipt.wait();
    const deployedEventArgs = tx.events?.find((evt) => evt.event === "TitleEscrowDeployed")?.args as any;
    expect(deployedEventArgs.tokenRegistry).toBe(tokenRegistry.address);
    expect(deployedEventArgs.beneficiary).toBe(account1);
    expect(deployedEventArgs.holder).toBe(account2);
  });
});

describe("TitleEscrowCloneableFactory", () => {
  let tokenRegistry: TradeTrustERC721Mock;

  beforeEach(async () => {
    const tokenRegistryFactory = new TradeTrustERC721MockFactory(signer1);
    tokenRegistry = await tokenRegistryFactory.deploy("MY_TOKEN_REGISTRY", "TKN");
  });

  const deployTitleEscrow = async () => {
    const factory = new TitleEscrowCloneableFactory(signer1);
    const titleEscrowTx = await tokenRegistry.deployNewTitleEscrow(tokenRegistry.address, account1, account2);

    const titleEscrowReceipt = await titleEscrowTx.wait();
    const event = titleEscrowReceipt.events?.find((evt) => evt.event === "TitleEscrowDeployed");
    return factory.attach(event?.args?.escrowAddress);
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
    const connectedEscrow = TitleEscrowCloneableFactory.connect(existingTitleEscrowAddress, signer1);
    const beneficiary = await connectedEscrow.beneficiary();
    const holder = await connectedEscrow.holder();
    expect(beneficiary).toBe(account1);
    expect(holder).toBe(account2);
  });

  it("should be able to write to TitleEscrow", async () => {
    const escrowInstance = await deployTitleEscrow();
    await tokenRegistry.mintInternal(escrowInstance.address, tokenId);
    await escrowInstance.approveNewTransferTargets(account1, account2);
    const approvedBeneficiary = await escrowInstance.approvedBeneficiary();
    const approvedHolder = await escrowInstance.approvedHolder();
    expect(approvedBeneficiary).toBe(account1);
    expect(approvedHolder).toBe(account2);
  });
});

describe("TradeTrustErc721Factory", () => {
  const deployTradeTrustERC721 = async () => {
    const factory = new TradeTrustERC721MockFactory(signer1);
    return factory.deploy("TOKEN_REGISTRY_NAME", "TKN");
  };

  it("should be able to deploy a new TradeTrustERC721", async () => {
    const instance = await deployTradeTrustERC721();
    const sym = await instance.symbol();
    expect(sym).toBe("TKN");
  });
  it("should be able to connect to an existing TradeTrustERC721", async () => {
    const deployedInstance = await deployTradeTrustERC721();
    const instance = await TradeTrustERC721MockFactory.connect(deployedInstance.address, signer1);
    const sym = await instance.symbol();
    expect(sym).toBe("TKN");
  });
  it("should be able to write to TradeTrustERC721", async () => {
    const instance = await deployTradeTrustERC721();
    await instance.mintInternal(account1, tokenId);
    const ownerOfToken = await instance.ownerOf(tokenId);
    expect(ownerOfToken).toBe(account1);
  });
});
