/* eslint-disable camelcase */
import { ethers } from "hardhat";
import { loadFixture } from "ethereum-waffle";
import { ChainManagerRoleMock } from "@tradetrust/contracts";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { TestUsers } from "../fixtures/deploy-token.fixture";
import { expect } from "..";
import { getTestUsers } from "../utils";

describe("ChainManagerRole", () => {
  let users: TestUsers;
  let contract: ChainManagerRoleMock;

  beforeEach(async () => {
    users = await getTestUsers();

    contract = await loadFixture(async () => {
      const factory = await ethers.getContractFactory("ChainManagerRoleMock");
      return (await factory.connect(users.carrier).deploy()) as ChainManagerRoleMock;
    });
  });

  describe("When verifying chain manager role", () => {
    let chainManagerSigner: SignerWithAddress;
    let nonChainManagerSigner: SignerWithAddress;

    beforeEach(async () => {
      [chainManagerSigner, nonChainManagerSigner] = users.others;
      await contract.connect(users.carrier).addChainManager(chainManagerSigner.address);
    });

    describe("When onlyChainManager is applied", () => {
      it("should revert if caller does not have chain manager role", async () => {
        const tx = contract.connect(nonChainManagerSigner).testModifierFunction();

        await expect(tx).to.be.revertedWith("ChainManagerRole: caller is not a chain manager");
      });

      it("should transact successfully if caller has chain manager role", async () => {
        const tx = contract.connect(chainManagerSigner).testModifierFunction();

        await expect(tx).to.not.be.reverted;
      });
    });

    describe("When checking role of an account", () => {
      it("should return true if address has role", async () => {
        const res = await contract.isChainManager(chainManagerSigner.address);

        expect(res).to.be.true;
      });

      it("should return false if address does not have role", async () => {
        const res = await contract.isChainManager(nonChainManagerSigner.address);

        expect(res).to.be.false;
      });
    });
  });

  describe("When managing role", () => {
    let targetSigner: SignerWithAddress;

    beforeEach(async () => {
      [targetSigner] = users.others;
    });

    it("should add address to role", async () => {
      await contract.connect(users.carrier).addChainManager(targetSigner.address);

      const res = await contract.isChainManager(targetSigner.address);
      expect(res).to.be.true;
    });

    it("should emit ChainManagerAdded event when role is added to address", async () => {
      const tx = contract.connect(users.carrier).addChainManager(targetSigner.address);

      await expect(tx).to.emit(contract, "ChainManagerAdded").withArgs(targetSigner.address);
    });

    it("should revoke role from address", async () => {
      await contract.connect(users.carrier).addChainManager(targetSigner.address);

      await contract.connect(users.carrier).revokeChainManger(targetSigner.address);

      const res = await contract.isChainManager(targetSigner.address);
      expect(res).to.be.false;
    });

    it("should emit ChainManagerRemoved event when role is removed from address", async () => {
      const tx = contract.connect(users.carrier).revokeChainManger(targetSigner.address);

      await expect(tx).to.emit(contract, "ChainManagerRemoved").withArgs(targetSigner.address);
    });
  });
});
