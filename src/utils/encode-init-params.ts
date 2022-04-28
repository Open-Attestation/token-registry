import { ethers } from "ethers";

interface Params {
  name: string;
  symbol: string;
  titleEscrowFactory: string;
  deployer: string;
}

export const encodeInitParams = ({ name, symbol, titleEscrowFactory, deployer }: Params) => {
  return ethers.utils.defaultAbiCoder.encode(
    ["string", "string", "address", "address"],
    [name, symbol, titleEscrowFactory, deployer]
  );
};
