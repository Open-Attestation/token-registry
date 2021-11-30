import { task } from "hardhat/config";
import { deployRootChainManager } from "./helpers/deploy-root-chain-manager";
import { AddressConstants } from "../src/common/constants";
import { getNetworkEnv } from "./utils";
import { verifyContract } from "./helpers/verify-contract";
import { TASK_DEPLOY_CHAIN_MANAGER_GRANT_ROLE, TASK_DEPLOY_CHAIN_MANAGER_ROOT } from "./task-names";

task(TASK_DEPLOY_CHAIN_MANAGER_ROOT)
  .setDescription("Deploys the root chain manager")
  .addParam(
    "checkPointManager",
    "Address of Checkpoint Manager",
    AddressConstants.polygon[getNetworkEnv()].checkPointManager
  )
  .addParam("fxRoot", "Address of FxRoot", AddressConstants.polygon[getNetworkEnv()].fxRoot)
  .addParam("token", "Address of Root Token")
  .addFlag("verify", "Verify on Etherscan")
  .setAction(async ({ checkPointManager, fxRoot, token, verify }, hre) => {
    const { ethers } = hre;
    try {
      const [deployer] = await ethers.getSigners();
      const chainManager = await deployRootChainManager({
        constructorParams: {
          rootToken: token,
          fxRoot,
          checkPointManager,
        },
        hre,
        deployer,
      });

      await hre.run(TASK_DEPLOY_CHAIN_MANAGER_GRANT_ROLE, {
        token,
        chainManager: chainManager.address,
        rootChain: true,
      });

      if (verify) {
        await verifyContract({
          address: chainManager.address,
          constructorArgsParams: [checkPointManager, fxRoot, token],
          hre,
        });
      }

      console.log(`[Status] Completed deploying root chain manager`);

      return chainManager;
    } catch (err) {
      console.log(`[Status] Failed to deploy root chain manager`);
      console.error(err);
      return undefined;
    }
  });
