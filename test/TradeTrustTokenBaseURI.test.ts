import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { TradeTrustToken } from "@tradetrust/contracts";
import faker from "faker";
import { expect } from ".";
import { getTestUsers, TestUsers, createDeployFixtureRunner, toAccessControlRevertMessage } from "./helpers";
import { deployTokenFixture, DeployTokenFixtureRunner } from "./fixtures";
import { roleHash } from "../src/constants";

describe("TradeTrustTokenBaseURI", async () => {
  let users: TestUsers;
  let registryContract: TradeTrustToken;

  let registryName: string;
  let registrySymbol: string;

  let registryContractAsAdmin: TradeTrustToken;

  let fakeBaseURI: string;

  let deployTokenFixtureRunner: DeployTokenFixtureRunner;

  // eslint-disable-next-line no-undef
  before(async () => {
    users = await getTestUsers();

    registryName = "The Great Shipping Company";
    registrySymbol = "GSC";

    deployTokenFixtureRunner = async () =>
      createDeployFixtureRunner(
        ...(await deployTokenFixture<TradeTrustToken>({
          tokenContractName: "TradeTrustToken",
          tokenName: registryName,
          tokenInitials: registrySymbol,
          deployer: users.carrier,
        }))
      );
  });

  beforeEach(async () => {
    fakeBaseURI = `${faker.internet.url()}/`;

    [, registryContract] = await loadFixture(deployTokenFixtureRunner);

    registryContractAsAdmin = registryContract.connect(users.carrier);
  });

  it("should revert set base URI when caller has no admin role", async () => {
    const nonAdminSigner = users.beneficiary;
    const tx = registryContract.connect(nonAdminSigner).setBaseURI(fakeBaseURI);

    await expect(tx).to.be.revertedWith(toAccessControlRevertMessage(nonAdminSigner.address, roleHash.DefaultAdmin));
  });

  it("should set base URI when caller has admin role", async () => {
    const tx = registryContractAsAdmin.setBaseURI(fakeBaseURI);

    await expect(tx).to.not.be.reverted;
  });

  describe("Behaviours of tokenURI and baseURI", () => {
    let tokenId: number;

    beforeEach(async () => {
      tokenId = faker.datatype.number();
      await registryContractAsAdmin.mint(users.beneficiary.address, users.beneficiary.address, tokenId);
    });

    it("should return the correct tokenURI when baseURI is set", async () => {
      await registryContractAsAdmin.setBaseURI(fakeBaseURI);

      const tokenURI = await registryContract.tokenURI(tokenId);

      expect(tokenURI).to.equal(`${fakeBaseURI}${tokenId}`);
    });

    it("should return empty string as tokenURI when baseURI is not set", async () => {
      const tokenURI = await registryContract.tokenURI(tokenId);

      expect(tokenURI).to.be.empty;
    });
  });
});
