import { waffle, ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import faker from "faker";
import { TradeTrustERC721 } from "@tradetrust/contracts";
import { expect } from ".";
import { deployTokenFixture, mintTokenFixture } from "./fixtures";
import { getTestUsers, TestUsers } from "./utils";
import { RoleConstants } from "../src/common/constants";

const { loadFixture } = waffle;

describe("TradeTrustERC721 Access Control Behaviour", async () => {
  let users: TestUsers;
  let registryContract: TradeTrustERC721;

  let userAdmin: SignerWithAddress;
  let userMinter: SignerWithAddress;
  let userRestorer: SignerWithAddress;
  let userAccepter: SignerWithAddress;

  let registryContractAsAdmin: TradeTrustERC721;
  let registryContractAsMinter: TradeTrustERC721;
  let registryContractAsRestorer: TradeTrustERC721;
  let registryContractAsAccepter: TradeTrustERC721;
  let registryContractAsNoRole: TradeTrustERC721;

  let tokenId: string;

  beforeEach(async () => {
    users = await getTestUsers();

    registryContract = await loadFixture(
      deployTokenFixture<TradeTrustERC721>({
        tokenContractName: "TradeTrustERC721",
        tokenName: "The Great Shipping Company",
        tokenInitials: "GSC",
        deployer: users.carrier,
      })
    );

    userAdmin = users.carrier;
    userMinter = users.others[users.others.length - 1];
    userRestorer = users.others[users.others.length - 2];
    userAccepter = users.others[users.others.length - 3];

    registryContractAsAdmin = registryContract.connect(userAdmin);

    await Promise.all([
      registryContractAsAdmin.grantRole(RoleConstants.minterRole, userMinter.address),
      registryContractAsAdmin.grantRole(RoleConstants.restorerRole, userRestorer.address),
      registryContractAsAdmin.grantRole(RoleConstants.accepterRole, userAccepter.address),
    ]);

    registryContractAsMinter = registryContract.connect(userMinter);
    registryContractAsRestorer = registryContract.connect(userRestorer);
    registryContractAsAccepter = registryContract.connect(userAccepter);
    registryContractAsNoRole = registryContract.connect(users.beneficiary);

    tokenId = faker.datatype.hexaDecimal(64);
  });

  it("should support access control interfaces", async () => {
    const res = await registryContract.supportsInterface("0x7965db0b");

    expect(res).to.be.true;
  });

  describe("Initial Setup", () => {
    it("should add deployer with admin role", async () => {
      const res = await registryContract.hasRole(RoleConstants.defaultAdmin, users.carrier.address);

      expect(res).to.be.true;
    });

    it("should add deployer with minter role", async () => {
      const res = await registryContract.hasRole(RoleConstants.minterRole, users.carrier.address);

      expect(res).to.be.true;
    });

    it("should add deployer with restorer role", async () => {
      const res = await registryContract.hasRole(RoleConstants.restorerRole, users.carrier.address);

      expect(res).to.be.true;
    });

    it("should add deployer with accepter role", async () => {
      const res = await registryContract.hasRole(RoleConstants.accepterRole, users.carrier.address);

      expect(res).to.be.true;
    });
  });

  describe("Role Admin", () => {
    let fakeMinterAdminRole: string;

    beforeEach(async () => {
      fakeMinterAdminRole = ethers.utils.id("FAKE_MINTER_ADMIN_ROLE");
    });

    it("should allow admin to set role admin", async () => {
      await registryContractAsAdmin.setRoleAdmin(RoleConstants.minterRole, fakeMinterAdminRole);

      const res = await registryContract.getRoleAdmin(RoleConstants.minterRole);

      expect(res).to.equal(fakeMinterAdminRole);
    });

    it("should not allow a non-admin to set role admin", async () => {
      const tx = registryContractAsMinter.setRoleAdmin(RoleConstants.minterRole, fakeMinterAdminRole);

      await expect(tx).to.be.revertedWith("RegistryAccess: caller does not have the Admin role");
    });
  });

  describe("Minter Role", () => {
    it("should allow a minter to mint new tokens", async () => {
      const tx = registryContractAsMinter.mintTitle(users.beneficiary.address, users.holder.address, tokenId);

      await expect(tx).to.not.be.reverted;
    });

    it("should not allow a non-minter to mint new tokens", async () => {
      const tx = registryContractAsNoRole.mintTitle(users.beneficiary.address, users.holder.address, tokenId);

      await expect(tx).to.be.revertedWith("RegistryAccess: caller does not have the Minter role");
    });
  });

  describe("Restorer Role", () => {
    beforeEach(async () => {
      const titleEscrowContract = (
        await loadFixture(
          mintTokenFixture({
            token: registryContractAsMinter,
            beneficiary: users.beneficiary,
            holder: users.beneficiary,
            tokenId,
          })
        )
      ).titleEscrow;
      await titleEscrowContract.connect(users.beneficiary).surrender();
    });

    it("should allow a restorer to restore tokens", async () => {
      const tx = registryContractAsRestorer.restoreTitle(tokenId);

      await expect(tx).to.not.be.reverted;
    });

    it("should not allow a non-restorer to restore tokens", async () => {
      const tx = registryContractAsNoRole.restoreTitle(tokenId);

      await expect(tx).to.be.revertedWith("RegistryAccess: caller does not have the Restorer role");
    });
  });

  describe("Accepter Role", () => {
    beforeEach(async () => {
      const titleEscrowContract = (
        await loadFixture(
          mintTokenFixture({
            token: registryContractAsMinter,
            beneficiary: users.beneficiary,
            holder: users.beneficiary,
            tokenId,
          })
        )
      ).titleEscrow;
      await titleEscrowContract.connect(users.beneficiary).surrender();
    });

    it("should allow an accepter to burn tokens", async () => {
      const tx = registryContractAsAccepter.destroyToken(tokenId);

      await expect(tx).to.not.be.reverted;
    });

    it("should not allow a non-accepter to burn tokens", async () => {
      const tx = registryContractAsNoRole.destroyToken(tokenId);

      await expect(tx).to.be.revertedWith("RegistryAccess: caller does not have the Accepter role");
    });
  });
});
