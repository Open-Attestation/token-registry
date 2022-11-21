import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import faker from "faker";
import { TitleEscrow, TradeTrustToken } from "@tradetrust/contracts";
import { roleHash } from "../src/constants";
import { expect } from ".";
import { deployTokenFixture, mintTokenFixture } from "./fixtures";
import { getTestUsers, TestUsers, toAccessControlRevertMessage } from "./helpers";

describe("TradeTrustToken Access Control Behaviour", async () => {
  let users: TestUsers;
  let registryContract: TradeTrustToken;
  let titleEscrowContract: TitleEscrow;

  let userAdmin: SignerWithAddress;
  let userMinter: SignerWithAddress;
  let userRestorer: SignerWithAddress;
  let userAccepter: SignerWithAddress;

  let registryContractAsAdmin: TradeTrustToken;
  let registryContractAsMinter: TradeTrustToken;
  let registryContractAsRestorer: TradeTrustToken;
  let registryContractAsAccepter: TradeTrustToken;
  let registryContractAsNoRole: TradeTrustToken;

  let tokenId: string;

  let deployFixturesRunner: () => Promise<[TradeTrustToken, TitleEscrow]>;

  // eslint-disable-next-line no-undef
  before(async () => {
    users = await getTestUsers();

    userAdmin = users.carrier;
    userMinter = users.others[users.others.length - 1];
    userRestorer = users.others[users.others.length - 2];
    userAccepter = users.others[users.others.length - 3];

    tokenId = faker.datatype.hexaDecimal(64);

    deployFixturesRunner = async () => {
      const [, registryContractFixture] = await deployTokenFixture<TradeTrustToken>({
        tokenContractName: "TradeTrustToken",
        tokenName: "The Great Shipping Company",
        tokenInitials: "GSC",
        deployer: userAdmin,
      });

      const registryContractFixtureAsAdmin = registryContractFixture.connect(userAdmin);
      const registryContractFixtureAsMinter = registryContractFixture.connect(userMinter);

      await Promise.all([
        registryContractFixtureAsAdmin.grantRole(roleHash.MinterRole, userMinter.address),
        registryContractFixtureAsAdmin.grantRole(roleHash.RestorerRole, userRestorer.address),
        registryContractFixtureAsAdmin.grantRole(roleHash.AccepterRole, userAccepter.address),
      ]);

      const { titleEscrow: titleEscrowContractFixture } = await mintTokenFixture({
        token: registryContractFixtureAsMinter,
        beneficiary: users.beneficiary,
        holder: users.beneficiary,
        tokenId,
      });

      return [registryContractFixture, titleEscrowContractFixture];
    };
  });

  beforeEach(async () => {
    [registryContract, titleEscrowContract] = await loadFixture(deployFixturesRunner);

    registryContractAsAdmin = registryContract.connect(userAdmin);
    registryContractAsMinter = registryContract.connect(userMinter);
    registryContractAsRestorer = registryContract.connect(userRestorer);
    registryContractAsAccepter = registryContract.connect(userAccepter);
    registryContractAsNoRole = registryContract.connect(users.beneficiary);
  });

  it("should support access control interfaces", async () => {
    const res = await registryContract.supportsInterface("0x7965db0b");

    expect(res).to.be.true;
  });

  describe("Initial Setup", () => {
    it("should add deployer with admin role", async () => {
      const res = await registryContract.hasRole(roleHash.DefaultAdmin, users.carrier.address);

      expect(res).to.be.true;
    });

    it("should add deployer with minter role", async () => {
      const res = await registryContract.hasRole(roleHash.MinterRole, users.carrier.address);

      expect(res).to.be.true;
    });

    it("should add deployer with restorer role", async () => {
      const res = await registryContract.hasRole(roleHash.RestorerRole, users.carrier.address);

      expect(res).to.be.true;
    });

    it("should add deployer with accepter role", async () => {
      const res = await registryContract.hasRole(roleHash.AccepterRole, users.carrier.address);

      expect(res).to.be.true;
    });
  });

  describe("Role Admin", () => {
    let fakeMinterAdminRole: string;

    beforeEach(async () => {
      fakeMinterAdminRole = ethers.utils.id("FAKE_MINTER_ADMIN_ROLE");
    });

    it("should allow admin to set role admin", async () => {
      await registryContractAsAdmin.setRoleAdmin(roleHash.MinterRole, fakeMinterAdminRole);

      const res = await registryContract.getRoleAdmin(roleHash.MinterRole);

      expect(res).to.equal(fakeMinterAdminRole);
    });

    it("should not allow a non-admin to set role admin", async () => {
      const tx = registryContractAsMinter.setRoleAdmin(roleHash.MinterRole, fakeMinterAdminRole);

      await expect(tx).to.be.revertedWith(toAccessControlRevertMessage(userMinter.address, roleHash.DefaultAdmin));
    });
  });

  describe("Minter Role", () => {
    describe("Mint without token URI", () => {
      it("should allow a minter to mint new tokens", async () => {
        const newTokenId = faker.datatype.hexaDecimal(64);

        const tx = registryContractAsMinter.mint(users.beneficiary.address, users.holder.address, newTokenId);

        await expect(tx).to.not.be.reverted;
      });

      it("should not allow a non-minter to mint new tokens", async () => {
        const tx = registryContractAsNoRole.mint(users.beneficiary.address, users.holder.address, tokenId);

        await expect(tx).to.be.revertedWith(
          toAccessControlRevertMessage(users.beneficiary.address, roleHash.MinterRole)
        );
      });
    });
  });

  describe("Restorer Role", () => {
    beforeEach(async () => {
      await titleEscrowContract.connect(users.beneficiary).surrender();
    });

    it("should allow a restorer to restore tokens", async () => {
      const tx = registryContractAsRestorer.restore(tokenId);

      await expect(tx).to.not.be.reverted;
    });

    it("should not allow a non-restorer to restore tokens", async () => {
      const tx = registryContractAsNoRole.restore(tokenId);

      await expect(tx).to.be.revertedWith(
        toAccessControlRevertMessage(users.beneficiary.address, roleHash.RestorerRole)
      );
    });
  });

  describe("Accepter Role", () => {
    beforeEach(async () => {
      await titleEscrowContract.connect(users.beneficiary).surrender();
    });

    it("should allow an accepter to burn tokens", async () => {
      const tx = registryContractAsAccepter.burn(tokenId);

      await expect(tx).to.not.be.reverted;
    });

    it("should not allow a non-accepter to burn tokens", async () => {
      const tx = registryContractAsNoRole.burn(tokenId);

      await expect(tx).to.be.revertedWith(
        toAccessControlRevertMessage(users.beneficiary.address, roleHash.AccepterRole)
      );
    });
  });
});
