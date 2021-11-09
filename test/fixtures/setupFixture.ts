import { HardhatRuntimeEnvironment } from "hardhat/types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { TradeTrustERC721 } from "@tradetrust/contracts";

export type TestUsers = {
  carrier: SignerWithAddress;
  beneficiary: SignerWithAddress;
  holder: SignerWithAddress;
  others: SignerWithAddress[];
};

export const setupFixture = (hre: HardhatRuntimeEnvironment) => async () => {
  const { ethers } = hre;
  const tradeTrustERC721Factory = await ethers.getContractFactory("TradeTrustERC721");
  const [carrier, beneficiary, holder, ...others] = await ethers.getSigners();
  const users: TestUsers = { carrier, beneficiary, holder, others };
  const token = (await tradeTrustERC721Factory.connect(users.carrier).deploy(
    "Shipping Company",
    "GSC"
  )) as TradeTrustERC721;

  return { token, users };
};
