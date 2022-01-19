import { TradeTrustERC721Base } from "@tradetrust/contracts";
import { subtask } from "hardhat/config";
import { RoleConstants } from "../src/common/constants";
import { TASK_DEPLOY_CHAIN_MANAGER_GRANT_ROLE } from "./task-names";

subtask(TASK_DEPLOY_CHAIN_MANAGER_GRANT_ROLE)
  .setDescription("Grants chain manager role to chain managers")
  .addParam("token", "Address of token")
  .addParam("chainManager", "Address of chain manager")
  .addFlag("rootChain", "Flag that this is on the root chain")
  .setAction(async ({ token, chainManager, rootChain }, hre) => {
    const { ethers } = hre;

    try {
      const rootChildName = rootChain ? "root" : "child";
      const [deployer] = await ethers.getSigners();

      const tokenContract = (await ethers.getContractAt(
        "TradeTrustERC721Base",
        token,
        deployer
      )) as unknown as TradeTrustERC721Base;
      console.log(`[Status] Granting role on ${rootChildName} chain manager...`);
      const tx = await tokenContract.grantRole(RoleConstants.chainManager, chainManager);
      console.log(`[Transaction] Pending ${tx.hash}...`);
      await tx.wait();
      console.log(`[Status] Granted role to ${rootChildName} chain manager`);
    } catch (err) {
      console.log(`[Status] Failed to grant role to chain manager`);
      console.error(err);
    }
  });
