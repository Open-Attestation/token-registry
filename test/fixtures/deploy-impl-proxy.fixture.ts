import { Contract, ethers } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

export const deployImplProxy =
  <T extends Contract>({ implementation, deployer }: { implementation: Contract; deployer: SignerWithAddress }) =>
  async (): Promise<T> => {
    return (await new ethers.ContractFactory(
      implementation.interface,
      `0x3d602d80600a3d3981f3363d3d373d3d3d363d73${implementation.address.substring(2)}5af43d82803e903d91602b57fd5bf3`,
      deployer
    ).deploy()) as unknown as T;
  };
