import { HardhatRuntimeEnvironment } from "hardhat/types";

type Parameters = {
  hre: HardhatRuntimeEnvironment;
  address: string;
  constructorArgsParams: any[];
  contract?: string;
};

export const verifyContract = async ({ hre, address, constructorArgsParams, contract }: Parameters) => {
  if (["localhost", "hardhat"].includes(hre.network.name)) {
    console.log(`[Status] Skipped verifying contract ${address} on local`);
    return;
  }
  console.log(`[Status] Verifying contract ${address}...`);
  await hre.run("verify", {
    address,
    constructorArgsParams,
    contract,
  });
  console.log(`[Status] Verified contract at ${address}`);
};
