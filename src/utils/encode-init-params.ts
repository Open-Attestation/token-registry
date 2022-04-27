import { ethers } from "ethers";

interface Params {
  name: string;
  symbol: string;
  deployer: string;
}

export const encodeInitParams = ({ name, symbol, deployer }: Params) => {
  return ethers.utils.defaultAbiCoder.encode(["string", "string", "address"], [name, symbol, deployer]);
};
