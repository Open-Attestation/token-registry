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
  try {
    await hre.run("verify:verify", {
      address,
      constructorArguments: constructorArgsParams,
      contract,
    });
  } catch (err: any) {
    if ((err.message as string).indexOf("Reason: Already Verified") === -1) {
      throw err;
    }
  } finally {
    console.log(`[Status] Verified contract at ${address}`);
  }
};
