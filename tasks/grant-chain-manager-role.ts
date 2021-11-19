import { TradeTrustERC721Base } from "@tradetrust/contracts";
import { subtask } from "hardhat/config";
import { RoleConstants } from "../src/common/constants";
import { StatusManager } from "./utils/status-manager/status-manager";

subtask("deploy:chain-manager:grant-role")
  .setDescription("Grants chain manager role to chain managers")
  .addParam("token", "Address of token")
  .addParam("chainManager", "Address of chain manager")
  .addFlag("rootChain", "Flag that this is on the root chain")
  .setAction(async ({ token, chainManager, rootChain }, hre) => {
    const { ethers } = hre;
    const status = StatusManager.create();

    try {
      const rootChildName = rootChain ? "root" : "child";
      const [deployer] = await ethers.getSigners();

      const tokenContract = (await ethers.getContractAt(
        "TradeTrustERC721Base",
        token,
        deployer
      )) as unknown as TradeTrustERC721Base;
      status.add(`Granting role on ${rootChildName} chain manager...`);
      const tx = await tokenContract.grantRole(RoleConstants.chainManager, chainManager);
      status.update(`Pending role transaction ${tx.hash}...`);
      await tx.wait();
      status.succeed(`Granted role to ${rootChildName} chain manager in ${tx.hash}`);
      return tx;
    } catch (err) {
      status.fail(`Failed granting role: ${err}`);
      throw err;
    }
  });
