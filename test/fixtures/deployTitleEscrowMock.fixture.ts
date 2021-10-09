import { TitleEscrowCloneableMock, TradeTrustERC721 } from "@tradetrust/contracts";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers } from "hardhat";

export const deployTitleEscrowMockFixture =
  ({
    mockContractName,
    beneficiary,
    holder,
    token
  }: {
    mockContractName: string;
    beneficiary: SignerWithAddress;
    holder: SignerWithAddress;
    token: TradeTrustERC721;
  }) =>
  async () => {
    const titleEscrowNotSupportedMockFactory = await ethers.getContractFactory(mockContractName);
    const titleEscrowNotSupportedMock = (await titleEscrowNotSupportedMockFactory
      .connect(beneficiary)
      .deploy()) as TitleEscrowCloneableMock;
    await titleEscrowNotSupportedMock.initialize(
      token.address,
      beneficiary.address,
      holder.address,
      titleEscrowNotSupportedMock.address
    );

    return titleEscrowNotSupportedMock;
  };
