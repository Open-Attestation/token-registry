import { task } from "hardhat/config";
import { deployChildChainManager } from "./helpers/deploy-child-chain-manager";
import { AddressConstants } from "../src/common/constants";
import { getNetworkEnv } from "./utils";
import { verifyContract } from "./helpers/verify-contract";
import { TASK_DEPLOY_CHAIN_MANAGER_CHILD, TASK_DEPLOY_CHAIN_MANAGER_GRANT_ROLE } from "./task-names";

task(TASK_DEPLOY_CHAIN_MANAGER_CHILD)
  .setDescription("Deploys the child chain manager")
  .addParam("fxChild", "Address of FxChild", AddressConstants.polygon[getNetworkEnv()].fxChild)
  .addParam("token", "Address of Child Token")
  .addFlag("verify", "Verify on Etherscan")
  .setAction(async ({ fxChild, token, verify }, hre) => {
    const { ethers } = hre;
    try {
      const [deployer] = await ethers.getSigners();
      const chainManager = await deployChildChainManager({
        constructorParams: {
          childToken: token,
          fxChild,
        },
        hre,
        deployer,
      });

      await hre.run(TASK_DEPLOY_CHAIN_MANAGER_GRANT_ROLE, {
        token,
        chainManager: chainManager.address,
        rootChain: false,
      });

      if (verify) {
        await verifyContract({
          address: chainManager.address,
          constructorArgsParams: [fxChild, token],
          hre,
        });
      }

      console.log(`[Status] Completed deploying child chain manager`);

      return chainManager;
    } catch (err) {
      console.log(`[Status] Failed to deploy child chain manager`);
      console.error(err);
      return undefined;
    }
  });
