import { HardhatRuntimeEnvironment } from "hardhat/types";
import { Contract } from "ethers";

export const deployContract = async <TContract extends Contract>({
  params,
  contractName,
  hre,
}: {
  params: any[];
  contractName: string;
  hre: HardhatRuntimeEnvironment;
}): Promise<TContract> => {
  const { ethers } = hre;
  const [deployer] = await ethers.getSigners();

  const contractFactory = await ethers.getContractFactory(contractName);
  const contract = (await contractFactory.connect(deployer).deploy(...params)) as TContract;

  const tx = contract.deployTransaction;
  console.log(`[Transaction] Pending ${tx.hash}`);

  await contract.deployed();
  console.log(`[Address] Deployed to ${contract.address}`);

  return contract;
};
