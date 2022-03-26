import { ethers, waffle } from "hardhat";
import faker from "faker";
import { TradeTrustERC721Impl } from "@tradetrust/contracts";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ContractTransaction } from "ethers";
import { expect } from ".";
import { getTestUsers, TestUsers } from "./helpers";
import { deployTradeTrustERC721ImplFixture } from "./fixtures";
import { encodeInitParams } from "../src/utils";
import { deployImplProxy } from "./fixtures/deploy-impl-proxy.fixture";
import { AddressConstants, RoleConstants } from "../src/common";

const { loadFixture } = waffle;

describe("TradeTrustERC721Impl", async () => {
  let users: TestUsers;
  let implContract: TradeTrustERC721Impl;
  let registryImplContract: TradeTrustERC721Impl;

  let registryName: string;
  let registrySymbol: string;
  let fakeTitleEscrowFactory: string;

  let deployer: SignerWithAddress;
  let initialiserSigner: SignerWithAddress;

  beforeEach(async () => {
    users = await getTestUsers();
    deployer = users.carrier;
    initialiserSigner = users.others[faker.datatype.number(users.others.length - 1)];

    registryName = "The Great Shipping Company";
    registrySymbol = "GSC";
    fakeTitleEscrowFactory = ethers.utils.getAddress(faker.finance.ethereumAddress());

    implContract = await loadFixture(deployTradeTrustERC721ImplFixture({ deployer }));
    registryImplContract = await loadFixture(
      deployImplProxy<TradeTrustERC721Impl>({
        implementation: implContract,
        deployer: users.carrier,
      })
    );
  });

  describe("Contract Creation", () => {
    let initTx: ContractTransaction;
    let initParams: string;

    beforeEach(async () => {
      initParams = encodeInitParams({
        name: registryName,
        symbol: registrySymbol,
        titleEscrowFactory: fakeTitleEscrowFactory,
        deployer: users.carrier.address,
      });

      initTx = await registryImplContract.connect(initialiserSigner).initialize(initParams);
    });

    it("should initialise implementation", async () => {
      const tx = implContract.initialize(initParams);

      expect(tx).to.be.revertedWith("Initializable: contract is already initialized");
    });

    it("should not set deployer as admin", async () => {
      const res = await implContract.hasRole(RoleConstants.DefaultAdmin, users.carrier.address);

      await expect(res).to.be.false;
    });

    it("should return titleEscrowFactory address", async () => {
      const res = await registryImplContract.titleEscrowFactory();

      expect(res).to.equal(fakeTitleEscrowFactory);
    });

    it("should return the initialisation block as genesis", async () => {
      const res = await registryImplContract.genesis();

      expect(res).to.equal(initTx.blockNumber);
    });
  });

  describe("Initialisation", () => {
    it("should revert if deployer is zero address", async () => {
      const initParams = encodeInitParams({
        name: registryName,
        symbol: registrySymbol,
        titleEscrowFactory: fakeTitleEscrowFactory,
        deployer: AddressConstants.Zero,
      });

      const tx = registryImplContract.connect(initialiserSigner).initialize(initParams);

      await expect(tx).to.be.revertedWith("RegAcc: No admin");
    });

    describe("Initialised values", () => {
      let initParams: string;
      let registryAdmin: SignerWithAddress;

      beforeEach(async () => {
        registryAdmin = users.beneficiary;
        initParams = encodeInitParams({
          name: registryName,
          symbol: registrySymbol,
          titleEscrowFactory: fakeTitleEscrowFactory,
          deployer: registryAdmin.address,
        });

        await registryImplContract.connect(initialiserSigner).initialize(initParams);
      });

      it("should initialise token name", async () => {
        const res = await registryImplContract.name();

        expect(res).to.equal(registryName);
      });

      it("should initialise token symbol", async () => {
        const res = await registryImplContract.symbol();

        expect(res).to.equal(registrySymbol);
      });

      it("should initialise title escrow factory", async () => {
        const res = await registryImplContract.titleEscrowFactory();

        expect(res).to.equal(fakeTitleEscrowFactory);
      });

      it("should initialise deployer account as admin", async () => {
        const res = await registryImplContract.hasRole(RoleConstants.DefaultAdmin, registryAdmin.address);

        expect(res).to.be.true;
      });

      it("should not set initialiser as admin", async () => {
        const res = await registryImplContract.hasRole(RoleConstants.DefaultAdmin, initialiserSigner.address);

        expect(res).to.be.false;
      });

      it("should not set deployer as admin", async () => {
        const res = await registryImplContract.hasRole(RoleConstants.DefaultAdmin, deployer.address);

        expect(res).to.be.false;
      });
    });
  });
});
