import { task } from "hardhat/config";
import { deployChildChainManager } from "./utils/deploy-child-chain-manager";
import { AddressConstants } from "../src/common/constants";
import { getNetworkEnv } from "./utils/helpers";
import { verifyContract } from "./utils/verify-contract";

task("deploy:chain-manager:child")
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

      await hre.run("deploy:chain-manager:grant-role", {
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

      return chainManager;
    } catch (err) {
      console.error(err);
      return undefined;
    }
  });
