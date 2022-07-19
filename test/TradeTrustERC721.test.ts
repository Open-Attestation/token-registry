import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { TitleEscrow, TitleEscrowFactory, TradeTrustERC721, TradeTrustERC721Mock } from "@tradetrust/contracts";
import faker from "faker";
import { MockContract, smock } from "@defi-wonderland/smock";
import { expect } from ".";
import { deployTokenFixture } from "./fixtures";
import {
  getTitleEscrowContract,
  impersonateAccount,
  getTestUsers,
  TestUsers,
  createDeployFixtureRunner,
} from "./helpers";
import { computeTitleEscrowAddress } from "../src/utils";
import { contractInterfaceId, defaultAddress } from "../src/constants";

describe("TradeTrustERC721", async () => {
  let users: TestUsers;
  let registryContract: TradeTrustERC721;

  let registryName: string;
  let registrySymbol: string;

  let registryContractAsAdmin: TradeTrustERC721;

  let mockTitleEscrowFactoryContract: MockContract<TitleEscrowFactory>;

  let tokenId: string;
  let titleEscrowImplAddr: string;

  let deployTokenFixtureRunner: () => Promise<[MockContract<TitleEscrowFactory>, TradeTrustERC721]>;

  // eslint-disable-next-line no-undef
  before(async () => {
    users = await getTestUsers();

    registryName = "The Great Shipping Company";
    registrySymbol = "GSC";

    deployTokenFixtureRunner = async () => {
      const mockTitleEscrowFactoryContractFixture = (await (
        await smock.mock("TitleEscrowFactory", users.carrier)
      ).deploy()) as unknown as MockContract<TitleEscrowFactory>;

      const registryContractFixture = await deployTokenFixture<TradeTrustERC721>({
        tokenContractName: "TradeTrustERC721",
        tokenName: registryName,
        tokenInitials: registrySymbol,
        escrowFactoryAddress: mockTitleEscrowFactoryContractFixture.address,
        deployer: users.carrier,
      });

      return [mockTitleEscrowFactoryContractFixture, registryContractFixture];
    };
  });

  beforeEach(async () => {
    tokenId = faker.datatype.hexaDecimal(64);

    [mockTitleEscrowFactoryContract, registryContract] = await loadFixture(deployTokenFixtureRunner);

    registryContractAsAdmin = registryContract.connect(users.carrier);
    titleEscrowImplAddr = await mockTitleEscrowFactoryContract.implementation();
  });

  describe("ERC165 Support", () => {
    it("should support ITradeTrustERC721 interface", async () => {
      const interfaceId = contractInterfaceId.TradeTrustERC721;

      const res = await registryContract.supportsInterface(interfaceId);

      expect(res).to.be.true;
    });

    it("should support ERC721 interface", async () => {
      const interfaceId = contractInterfaceId.ERC721;

      const res = await registryContract.supportsInterface(interfaceId);

      expect(res).to.be.true;
    });

    it("should support AccessControl interface", async () => {
      const interfaceId = contractInterfaceId.AccessControl;

      const res = await registryContract.supportsInterface(interfaceId);

      expect(res).to.be.true;
    });
  });

  describe("Initialisation", () => {
    it("should deploy with token name", async () => {
      expect(await registryContract.name()).to.equal(registryName);
    });

    it("should deploy with symbol", async () => {
      expect(await registryContract.symbol()).to.equal(registrySymbol);
    });

    it("should deploy with genesis block", async () => {
      const genesisBlock = registryContract.deployTransaction.blockNumber;
      expect(await registryContract.genesis()).to.equal(genesisBlock);
    });

    it("should deploy with title escrow factory address", async () => {
      expect(await registryContract.titleEscrowFactory()).to.equal(mockTitleEscrowFactoryContract.address);
    });
  });

  describe("IERC721Receiver Support", () => {
    it("should have onERC721Received function", async () => {
      const fakeAddress = faker.finance.ethereumAddress();

      const tx = registryContract.onERC721Received(fakeAddress, fakeAddress, "123", "0x00");

      await expect(tx).to.not.be.rejected;
    });
  });

  describe("Registry Operation Behaviours", () => {
    let titleEscrowContract: TitleEscrow;

    beforeEach(async () => {
      await registryContractAsAdmin.mint(users.beneficiary.address, users.beneficiary.address, tokenId);
      titleEscrowContract = await getTitleEscrowContract(registryContract, tokenId);
    });

    describe("Burn Token", () => {
      describe("When token has been surrendered", () => {
        beforeEach(async () => {
          await titleEscrowContract.connect(users.beneficiary).surrender();
        });

        it("should shred the correct title escrow", async () => {
          const initialActive = await titleEscrowContract.active();

          await registryContractAsAdmin.burn(tokenId);
          const currentActive = await titleEscrowContract.active();

          expect(initialActive).to.be.true;
          expect(currentActive).to.be.false;
        });

        it("should transfer token to burn address", async () => {
          await registryContractAsAdmin.burn(tokenId);

          const res = await registryContract.ownerOf(tokenId);

          expect(res).to.equal(defaultAddress.Burn);
        });

        it("should not allow burning a burnt token", async () => {
          await registryContractAsAdmin.burn(tokenId);

          const tx = registryContractAsAdmin.burn(tokenId);

          await expect(tx).to.be.reverted;
        });

        it("should emit Transfer event with correct values", async () => {
          const tx = await registryContractAsAdmin.burn(tokenId);

          expect(tx)
            .to.emit(registryContract, "Transfer")
            .withArgs(registryContract.address, defaultAddress.Burn, tokenId);
        });
      });

      describe("When token has not been surrendered", () => {
        it("should not allow to burn the token even if registry is approved", async () => {
          // Note: This is an edge case and not a normal flow.
          const operator = users.carrier;
          const titleEscrowSigner = await impersonateAccount({ address: titleEscrowContract.address });
          await registryContract.connect(titleEscrowSigner).approve(operator.address, tokenId);

          const tx = registryContract.connect(operator).burn(tokenId);

          await expect(tx).to.be.reverted;
        });

        it("should revert when burn token", async () => {
          const tx = registryContractAsAdmin.burn(tokenId);

          await expect(tx).to.be.revertedWith("TE: Not surrendered");
        });

        it("should revert before transfer when forcefully sent to burn address", async () => {
          // Note: This is only an additional defence and is not a normal flow.
          const deployMockTokenFixturesRunner = async () =>
            createDeployFixtureRunner(
              deployTokenFixture<TradeTrustERC721Mock>({
                tokenContractName: "TradeTrustERC721Mock",
                tokenName: "The Great Shipping Company",
                tokenInitials: "GSC",
                deployer: users.carrier,
              })
            );

          const [registryContractMock] = await loadFixture(deployMockTokenFixturesRunner);
          await registryContractMock.mintInternal(users.carrier.address, tokenId);

          const tx = registryContractMock
            .connect(users.carrier)
            .transferFrom(users.carrier.address, defaultAddress.Burn, tokenId);

          await expect(tx).to.be.revertedWithCustomError(registryContractMock, "TokenNotSurrendered");
        });
      });
    });

    describe("Mint Token", () => {
      beforeEach(async () => {
        // Fixtures need to be redeployed here without loadFixture because snapshot does not reset call counts in mocks
        // Only this section has tests that test for call counts
        [mockTitleEscrowFactoryContract, registryContract] = await deployTokenFixtureRunner();

        registryContractAsAdmin = registryContract.connect(users.carrier);
        titleEscrowImplAddr = await mockTitleEscrowFactoryContract.implementation();

        await registryContractAsAdmin.mint(users.beneficiary.address, users.beneficiary.address, tokenId);
        titleEscrowContract = await getTitleEscrowContract(registryContract, tokenId);
      });

      it("should mint token to a title escrow", async () => {
        const interfaceId = contractInterfaceId.TitleEscrow;

        const res = await titleEscrowContract.supportsInterface(interfaceId);

        expect(res).to.be.true;
      });

      it("should mint token to a correct title escrow address", async () => {
        const expectedTitleEscrowAddr = computeTitleEscrowAddress({
          tokenId,
          registryAddress: registryContract.address,
          implementationAddress: titleEscrowImplAddr,
          factoryAddress: mockTitleEscrowFactoryContract.address,
        });

        const res = await registryContract.ownerOf(tokenId);

        expect(res).to.equal(expectedTitleEscrowAddr);
      });

      it("should not allow minting a token that has been burnt", async () => {
        await titleEscrowContract.connect(users.beneficiary).surrender();
        await registryContractAsAdmin.burn(tokenId);

        const tx = registryContractAsAdmin.mint(users.beneficiary.address, users.beneficiary.address, tokenId);

        await expect(tx).to.be.revertedWithCustomError(registryContractAsAdmin, "TokenExists");
      });

      it("should not allow minting an existing token", async () => {
        const tx = registryContractAsAdmin.mint(users.beneficiary.address, users.beneficiary.address, tokenId);

        await expect(tx).to.be.revertedWithCustomError(registryContractAsAdmin, "TokenExists");
      });

      it("should create title escrow from factory", async () => {
        expect(mockTitleEscrowFactoryContract.create).to.have.been.calledOnce;
      });

      it("should create title escrow with correct token ID", async () => {
        expect(mockTitleEscrowFactoryContract.create).to.have.been.calledOnceWith(tokenId);
      });

      describe("Minting with correct beneficiary and holder", () => {
        beforeEach(async () => {
          tokenId = faker.datatype.hexaDecimal(64);
          await registryContractAsAdmin.mint(users.beneficiary.address, users.holder.address, tokenId);
          titleEscrowContract = await getTitleEscrowContract(registryContract, tokenId);
        });

        it("should create title escrow with the correct beneficiary", async () => {
          const beneficiary = await titleEscrowContract.beneficiary();

          expect(beneficiary).to.equal(users.beneficiary.address);
        });

        it("should create title escrow with the correct holder", async () => {
          const holder = await titleEscrowContract.holder();

          expect(holder).to.equal(users.holder.address);
        });
      });

      it("should emit Transfer event with correct values", async () => {
        tokenId = faker.datatype.hexaDecimal(64);
        const tx = await registryContractAsAdmin.mint(users.beneficiary.address, users.holder.address, tokenId);
        titleEscrowContract = await getTitleEscrowContract(registryContract, tokenId);

        expect(tx)
          .to.emit(registryContract, "Transfer")
          .withArgs(defaultAddress.Zero, titleEscrowContract.address, tokenId);
      });
    });

    describe("Restore Token", () => {
      it("should revert if Invalid token", async () => {
        const invalidTokenId = faker.datatype.hexaDecimal(64);
        const tx = registryContractAsAdmin.restore(invalidTokenId);

        await expect(tx).to.be.revertedWithCustomError(registryContractAsAdmin, "InvalidTokenId");
      });

      it("should revert if token is not surrendered", async () => {
        const tx = registryContractAsAdmin.restore(tokenId);

        await expect(tx).to.be.revertedWithCustomError(registryContractAsAdmin, "TokenNotSurrendered");
      });

      it("should not allow to restore burnt token", async () => {
        await titleEscrowContract.connect(users.beneficiary).surrender();
        await registryContractAsAdmin.burn(tokenId);

        const tx = registryContractAsAdmin.restore(tokenId);

        await expect(tx).to.be.revertedWithCustomError(registryContractAsAdmin, "TokenNotSurrendered");
      });

      it("should allow to restore after token is surrendered", async () => {
        await titleEscrowContract.connect(users.beneficiary).surrender();

        const tx = registryContractAsAdmin.restore(tokenId);

        await expect(tx).to.not.be.reverted;
      });

      it("should restore to the correct title escrow", async () => {
        const expectedTitleEscrowAddr = computeTitleEscrowAddress({
          tokenId,
          registryAddress: registryContract.address,
          implementationAddress: titleEscrowImplAddr,
          factoryAddress: mockTitleEscrowFactoryContract.address,
        });
        await titleEscrowContract.connect(users.beneficiary).surrender();

        await registryContractAsAdmin.restore(tokenId);
        const res = await registryContract.ownerOf(tokenId);

        expect(res).to.equal(expectedTitleEscrowAddr);
      });

      it("should emit Transfer event with the correct values", async () => {
        const titleEscrowAddress = computeTitleEscrowAddress({
          tokenId,
          registryAddress: registryContract.address,
          implementationAddress: titleEscrowImplAddr,
          factoryAddress: mockTitleEscrowFactoryContract.address,
        });
        await titleEscrowContract.connect(users.beneficiary).surrender();

        const tx = await registryContractAsAdmin.restore(tokenId);

        expect(tx)
          .to.emit(registryContract, "Transfer")
          .withArgs(registryContract.address, titleEscrowAddress, tokenId);
      });
    });

    describe("Surrender Status", () => {
      it("should return false for an unsurrendered token", async () => {
        const res = await registryContract.isSurrendered(tokenId);

        expect(res).to.be.false;
      });

      it("should return true for a surrendered token", async () => {
        await titleEscrowContract.connect(users.beneficiary).surrender();

        const res = await registryContract.isSurrendered(tokenId);

        expect(res).to.be.true;
      });

      it("should return true for an accepted token", async () => {
        await titleEscrowContract.connect(users.beneficiary).surrender();
        await registryContract.burn(tokenId);

        const res = await registryContract.isSurrendered(tokenId);

        expect(res).to.be.true;
      });

      it("should return false for a restored token", async () => {
        await titleEscrowContract.connect(users.beneficiary).surrender();
        await registryContract.restore(tokenId);

        const res = await registryContract.isSurrendered(tokenId);

        expect(res).to.be.false;
      });

      it("should revert if a Invalid token", async () => {
        const invalidTokenId = faker.datatype.hexaDecimal(64);

        const tx = registryContract.isSurrendered(invalidTokenId);

        await expect(tx).to.be.revertedWith("Registry: Invalid token");
      });
    });
  });
});
