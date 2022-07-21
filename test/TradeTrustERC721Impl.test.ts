import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import faker from "faker";
import { TradeTrustERC721Impl } from "@tradetrust/contracts";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ContractTransaction } from "ethers";
import { expect } from ".";
import { deployTradeTrustERC721ImplFixture } from "./fixtures";
import { encodeInitParams } from "../src/utils";
import { deployImplProxy } from "./fixtures/deploy-impl-proxy.fixture";
import { defaultAddress, roleHash } from "../src/constants";
import { getTestUsers, TestUsers } from "./helpers";

describe("TradeTrustERC721Impl", async () => {
  let users: TestUsers;
  let implContract: TradeTrustERC721Impl;
  let registryImplContract: TradeTrustERC721Impl;

  let registryName: string;
  let registrySymbol: string;
  let fakeTitleEscrowFactory: string;

  let deployer: SignerWithAddress;
  let initialiserSigner: SignerWithAddress;

  let deployFixturesRunner: () => Promise<[TradeTrustERC721Impl, TradeTrustERC721Impl]>;

  // eslint-disable-next-line no-undef
  before(async () => {
    users = await getTestUsers();
    deployer = users.carrier;
    initialiserSigner = users.others[faker.datatype.number(users.others.length - 1)];

    registryName = "The Great Shipping Company";
    registrySymbol = "GSC";

    deployFixturesRunner = async () => {
      const implContractFixture = await deployTradeTrustERC721ImplFixture({ deployer });

      const registryWithProxyContractFixture = await deployImplProxy<TradeTrustERC721Impl>({
        implementation: implContractFixture,
        deployer: users.carrier,
      });

      return [implContractFixture, registryWithProxyContractFixture];
    };
  });

  beforeEach(async () => {
    fakeTitleEscrowFactory = ethers.utils.getAddress(faker.finance.ethereumAddress());

    [implContract, registryImplContract] = await loadFixture(deployFixturesRunner);
  });

  describe("Contract Creation", () => {
    let initTx: ContractTransaction;
    let initParams: string;

    beforeEach(async () => {
      // eslint-disable-next-line no-use-before-define
      initParams = encodeInitParamsWithFactory({
        name: registryName,
        symbol: registrySymbol,
        deployer: users.carrier.address,
        titleEscrowFactory: fakeTitleEscrowFactory,
      });

      initTx = await registryImplContract.connect(initialiserSigner).initialize(initParams);
    });

    it("should initialise implementation", async () => {
      const tx = implContract.initialize(initParams);

      expect(tx).to.be.revertedWith("Initializable: contract is already initialized");
    });

    it("should not set deployer as admin", async () => {
      const res = await implContract.hasRole(roleHash.DefaultAdmin, users.carrier.address);

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
      // eslint-disable-next-line no-use-before-define
      const initParams = encodeInitParamsWithFactory({
        name: registryName,
        symbol: registrySymbol,
        deployer: defaultAddress.Zero,
        titleEscrowFactory: fakeTitleEscrowFactory,
      });

      const tx = registryImplContract.connect(initialiserSigner).initialize(initParams);

      await expect(tx).to.be.revertedWithCustomError(registryImplContract, "InvalidAdminAddress");
    });

    describe("Initialised values", () => {
      let initParams: string;
      let registryAdmin: SignerWithAddress;

      beforeEach(async () => {
        registryAdmin = users.beneficiary;
        // eslint-disable-next-line no-use-before-define
        initParams = encodeInitParamsWithFactory({
          name: registryName,
          symbol: registrySymbol,
          deployer: registryAdmin.address,
          titleEscrowFactory: fakeTitleEscrowFactory,
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
        const res = await registryImplContract.hasRole(roleHash.DefaultAdmin, registryAdmin.address);

        expect(res).to.be.true;
      });

      it("should not set initialiser as admin", async () => {
        const res = await registryImplContract.hasRole(roleHash.DefaultAdmin, initialiserSigner.address);

        expect(res).to.be.false;
      });

      it("should not set deployer as admin", async () => {
        const res = await registryImplContract.hasRole(roleHash.DefaultAdmin, deployer.address);

        expect(res).to.be.false;
      });
    });
  });
});

const encodeInitParamsWithFactory = ({
  name,
  symbol,
  deployer,
  titleEscrowFactory,
}: {
  name: string;
  symbol: string;
  deployer: string;
  titleEscrowFactory: string;
}) =>
  ethers.utils.defaultAbiCoder.encode(
    ["bytes", "address"],
    [
      encodeInitParams({
        name,
        symbol,
        deployer,
      }),
      titleEscrowFactory,
    ]
  );
