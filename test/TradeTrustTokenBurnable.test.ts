import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { TitleEscrow, TradeTrustToken, TradeTrustTokenMock } from "@tradetrust/contracts";
import faker from "faker";
import { expect } from ".";
import { deployTokenFixture, DeployTokenFixtureRunner, deployTokenFixtureRunnerCreator } from "./fixtures";
import { getTitleEscrowContract, getTestUsers, TestUsers, createDeployFixtureRunner } from "./helpers";
import { defaultAddress } from "../src/constants";

describe("TradeTrustTokenBurnable", async () => {
  let users: TestUsers;
  let registryContract: TradeTrustToken;

  let registryName: string;
  let registrySymbol: string;

  let registryContractAsAdmin: TradeTrustToken;

  let tokenId: string;
  let titleEscrowContract: TitleEscrow;

  let deployTokenFixtureRunner: DeployTokenFixtureRunner;

  // eslint-disable-next-line no-undef
  before(async () => {
    users = await getTestUsers();

    registryName = "The Great Shipping Company";
    registrySymbol = "GSC";

    deployTokenFixtureRunner = async () =>
      deployTokenFixtureRunnerCreator(registryName, registrySymbol, users.carrier, "TradeTrustToken");
  });

  beforeEach(async () => {
    tokenId = faker.datatype.hexaDecimal(64);

    [, registryContract] = await loadFixture(deployTokenFixtureRunner);

    registryContractAsAdmin = registryContract.connect(users.carrier);

    await registryContractAsAdmin.mint(users.beneficiary.address, users.beneficiary.address, tokenId);
    titleEscrowContract = await getTitleEscrowContract(registryContract, tokenId);
  });

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

      expect(tx).to.emit(registryContract, "Transfer").withArgs(registryContract.address, defaultAddress.Burn, tokenId);
    });
  });

  describe("When token has not been surrendered", () => {
    it("should revert when burn token", async () => {
      const tx = registryContractAsAdmin.burn(tokenId);

      await expect(tx).to.be.revertedWithCustomError(registryContractAsAdmin, "TokenNotSurrendered");
    });

    it("should revert before transfer when forcefully sent to burn address", async () => {
      // Note: This is only an additional defence and is not a normal flow.
      const deployMockTokenFixturesRunner = async () =>
        createDeployFixtureRunner(
          deployTokenFixture<TradeTrustTokenMock>({
            tokenContractName: "TradeTrustTokenMock",
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
