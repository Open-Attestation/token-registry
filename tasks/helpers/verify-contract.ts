import { HardhatRuntimeEnvironment } from "hardhat/types";
import { StatusManager } from "../utils/status-manager/status-manager";

type Parameters = {
  hre: HardhatRuntimeEnvironment;
  address: string;
  constructorArgsParams: any[];
};

export const verifyContract = async ({ hre, address, constructorArgsParams }: Parameters) => {
  const status = StatusManager.create();

  try {
    status.add(`Verifying contract ${address}...`);
    await hre.run("verify", {
      address,
      constructorArgsParams,
    });
    status.succeed(`Verified contract at ${address}`);
  } catch (err) {
    status.fail(`Failed verifying contract: ${err}`);
    throw err;
  }
};
