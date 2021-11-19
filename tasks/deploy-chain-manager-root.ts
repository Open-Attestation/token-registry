import { task } from "hardhat/config";
import { deployRootChainManager } from "./utils/deploy-root-chain-manager";
import { AddressConstants } from "../src/common/constants";
import { getNetworkEnv } from "./utils/helpers";
import { verifyContract } from "./utils/verify-contract";

task("deploy:chain-manager:root")
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

      await hre.run("deploy:chain-manager:grant-role", {
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

      return chainManager;
    } catch (err) {
      console.error(err);
      return undefined;
    }
  });
