import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { ERC721ReceiverMock, SBTUpgradeableMock } from "@tradetrust/contracts";
import faker from "faker";
import { MockContract, smock } from "@defi-wonderland/smock";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers } from "hardhat";
import { ContractTransaction } from "ethers";
import { assert, expect } from "../index";
import { getTestUsers, TestUsers } from "../helpers";

describe("SBTUpgradeable", async () => {
  let users: TestUsers;

  let mockSbtContract: SBTUpgradeableMock;
  let erc721ReceiverContract: MockContract<ERC721ReceiverMock>;

  let deployer: SignerWithAddress;

  let tokenName: string;
  let tokenSymbol: string;

  let tokenId: string;

  let deployFixtureRunner: () => Promise<[SBTUpgradeableMock, MockContract<ERC721ReceiverMock>]>;

  // eslint-disable-next-line no-undef
  before(async () => {
    users = await getTestUsers();

    deployer = users.carrier;

    tokenName = "The Great Shipping Company";
    tokenSymbol = "GSC";

    deployFixtureRunner = async () => {
      const sbtUpgradeableFactory = await ethers.getContractFactory("SBTUpgradeableMock");
      const sbtUpgradeableFixture = (await sbtUpgradeableFactory
        .connect(deployer)
        .deploy(tokenName, tokenSymbol)) as SBTUpgradeableMock;

      const erc721ReceiverFixture = (await (
        await smock.mock("ERC721ReceiverMock", deployer)
      ).deploy()) as unknown as MockContract<ERC721ReceiverMock>;

      return [sbtUpgradeableFixture, erc721ReceiverFixture];
    };
  });

  beforeEach(async () => {
    tokenId = faker.datatype.hexaDecimal(64);
    [mockSbtContract, erc721ReceiverContract] = await loadFixture(deployFixtureRunner);
    mockSbtContract = mockSbtContract.connect(deployer);
  });

  describe("Initialisation", () => {
    it("should initialise the correct name", async () => {
      const name = await mockSbtContract.name();

      expect(name).to.equal(tokenName);
    });

    it("should initialise the correct symbol", async () => {
      const symbol = await mockSbtContract.symbol();

      expect(symbol).to.equal(tokenSymbol);
    });
  });

  describe("Token Behaviour", () => {
    describe("mint", () => {
      let recipient: string;

      beforeEach(async () => {
        recipient = ethers.utils.getAddress(faker.finance.ethereumAddress());
        await mockSbtContract.safeMintInternal(recipient, tokenId);
      });

      it("should mint a new token", async () => {
        const exists = await mockSbtContract.existsInternal(tokenId);

        expect(exists).to.be.true;
      });

      it("should mint with the correct owner", async () => {
        const owner = await mockSbtContract.ownerOf(tokenId);

        expect(owner).to.equal(recipient);
      });

      it("should revert when mint to zero address", async () => {
        const tx = mockSbtContract.safeMintInternal(ethers.constants.AddressZero, tokenId);

        expect(tx).to.be.revertedWith("ERC721: mint to the zero address");
      });

      it("should revert when token ID exists", async () => {
        const exists = await mockSbtContract.existsInternal(tokenId);
        assert.isOk(exists, "Token already exists");

        const tx = mockSbtContract.safeMintInternal(recipient, tokenId);

        await expect(tx).to.be.revertedWith("ERC721: token already minted");
      });

      it("should increase balance by one", async () => {
        const balance = await mockSbtContract.balanceOf(recipient);
        assert.isOk(balance.eq(1), "Balance should be 1");

        await mockSbtContract.safeMintInternal(recipient, faker.finance.ethereumAddress());
        const newBalance = await mockSbtContract.balanceOf(recipient);

        expect(newBalance.toNumber()).to.equal(2);
      });
    });

    describe("_safeMint", () => {
      beforeEach(async () => {
        erc721ReceiverContract.onERC721Received.reset();
      });

      it("should call onERC721Received with data", async () => {
        await mockSbtContract.safeMintWithDataInternal(erc721ReceiverContract.address, tokenId, "0x1234");

        expect(erc721ReceiverContract.onERC721Received).to.have.been.calledWith(
          deployer.address,
          ethers.constants.AddressZero,
          tokenId,
          "0x1234"
        );
      });

      it("should call onERC721Received without data", async () => {
        await mockSbtContract.safeMintInternal(erc721ReceiverContract.address, tokenId);

        expect(erc721ReceiverContract.onERC721Received).to.have.been.calledWith(
          deployer.address,
          ethers.constants.AddressZero,
          tokenId,
          "0x"
        );
      });

      it("should revert with standard reason when onERC721Received reverts without reason", async () => {
        erc721ReceiverContract.onERC721Received.reverts();

        const tx = mockSbtContract.safeMintInternal(erc721ReceiverContract.address, tokenId);

        await expect(tx).to.revertedWith("ERC721: transfer to non ERC721Receiver implementer");
      });

      it("should revert with same reason when onERC721Received reverts with reason", async () => {
        await erc721ReceiverContract.setErrorType(1);

        const tx = mockSbtContract.safeMintInternal(erc721ReceiverContract.address, tokenId);

        await expect(tx).to.revertedWith("ERC721ReceiverMock: reverting");
      });

      it("should revert when onERC721Received returns unexpected value", async () => {
        erc721ReceiverContract.onERC721Received.returns("0x1234");

        const tx = mockSbtContract.safeMintInternal(erc721ReceiverContract.address, tokenId);

        await expect(tx).to.reverted;
      });

      it("should revert when onERC721Received panics", async () => {
        await erc721ReceiverContract.setErrorType(3);

        const tx = mockSbtContract.safeMintInternal(erc721ReceiverContract.address, tokenId);

        await expect(tx).to.reverted;
      });
    });

    describe("balanceOf", () => {
      let recipient: string;

      beforeEach(async () => {
        recipient = ethers.utils.getAddress(faker.finance.ethereumAddress());
      });

      it("should return the amount of tokens by owner", async () => {
        await mockSbtContract.safeMintInternal(recipient, faker.finance.ethereumAddress());
        await mockSbtContract.safeMintInternal(recipient, faker.finance.ethereumAddress());
        const balance = await mockSbtContract.balanceOf(recipient);

        expect(balance.toNumber()).to.equal(2);
      });

      it("should return 0 when owner does not own any tokens", async () => {
        const balance = await mockSbtContract.balanceOf(recipient);

        expect(balance.toNumber()).to.equal(0);
      });

      it("should revert when querying the zero address", async () => {
        const tx = mockSbtContract.balanceOf(ethers.constants.AddressZero);

        await expect(tx).to.be.revertedWith("ERC721: balance query for the zero address");
      });
    });

    describe("_burn", () => {
      let recipient: string;
      let burnTx: ContractTransaction;

      beforeEach(async () => {
        recipient = ethers.utils.getAddress(faker.finance.ethereumAddress());
        await mockSbtContract.safeMintInternal(recipient, tokenId);
        await mockSbtContract.safeMintInternal(recipient, faker.datatype.hexaDecimal(64));

        const balance = await mockSbtContract.balanceOf(recipient);
        assert.isOk(balance.eq(2), "Balance should be 2");

        burnTx = await mockSbtContract.burn(tokenId);
      });
      it("should burn token to non-existent", async () => {
        const exists = await mockSbtContract.existsInternal(tokenId);

        expect(exists).to.be.false;
      });

      it("should decrease balance count", async () => {
        const balance = await mockSbtContract.balanceOf(recipient);

        expect(balance.toNumber()).to.equal(1);
      });

      it("should emit Transfer event", async () => {
        await expect(burnTx)
          .to.emit(mockSbtContract, "Transfer")
          .withArgs(recipient, ethers.constants.AddressZero, tokenId);
      });
    });

    describe("base URI", () => {
      it("should return empty baseURI by default", async () => {
        const baseURI = await mockSbtContract.baseURIInternal();

        expect(baseURI).to.equal("");
      });
    });

    describe("tokenURI", () => {
      it("should revert if token does not exist", async () => {
        const tx = mockSbtContract.tokenURI(tokenId);

        await expect(tx).to.be.revertedWith("ERC721Metadata: URI query for nonexistent token");
      });

      it("should return empty URI by default", async () => {
        await mockSbtContract.safeMintInternal(deployer.address, tokenId);

        const tokenURI = await mockSbtContract.tokenURI(tokenId);

        expect(tokenURI).to.equal("");
      });
    });

    describe("ownerOf", () => {
      it("should revert if owner is zero address", async () => {
        const tx = mockSbtContract.ownerOf(ethers.constants.AddressZero);

        await expect(tx).to.be.revertedWith("ERC721: owner query for nonexistent token");
      });
    });

    describe("transferFrom", () => {
      let recipient: SignerWithAddress;

      beforeEach(async () => {
        [recipient] = users.others;
        await mockSbtContract.safeMintInternal(recipient.address, tokenId);
      });

      it("should transfer with correct owner", async () => {
        await mockSbtContract.connect(recipient).transferFrom(recipient.address, deployer.address, tokenId);

        const owner = await mockSbtContract.ownerOf(tokenId);

        expect(owner).to.equal(deployer.address);
      });

      it("should revert if owner is incorrect", async () => {
        const tx = mockSbtContract.connect(recipient).transferFrom(users.others[1].address, deployer.address, tokenId);

        await expect(tx).to.be.revertedWith("ERC721: transfer from incorrect owner");
      });

      it("should revert if transfer to zero address", async () => {
        const tx = mockSbtContract
          .connect(recipient)
          .transferFrom(recipient.address, ethers.constants.AddressZero, tokenId);

        await expect(tx).to.be.revertedWith("ERC721: transfer to the zero address");
      });

      it("should revert when caller is not owner", async () => {
        const tx = mockSbtContract.connect(users.others[1]).transferFrom(recipient.address, deployer.address, tokenId);

        await expect(tx).to.be.revertedWith("ERC721: transfer caller is not owner nor approved");
      });

      it("should revert if token does not exist", async () => {
        const tx = mockSbtContract.transferFrom(deployer.address, deployer.address, faker.datatype.hexaDecimal(64));

        await expect(tx).to.be.revertedWith("ERC721: operator query for nonexistent token");
      });

      it("should revert when transferring to a non ERC721Receiver implementer", async () => {
        erc721ReceiverContract.onERC721Received.returns("0x1234");

        const tx = mockSbtContract
          .connect(recipient)
          .transferFrom(recipient.address, erc721ReceiverContract.address, tokenId);

        await expect(tx).to.be.reverted;
      });
    });
  });
});
