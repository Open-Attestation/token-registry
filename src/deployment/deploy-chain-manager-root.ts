/* eslint-disable import/no-extraneous-dependencies */
import { task } from "hardhat/config";
import { TradeTrustERC721Base } from "@tradetrust/contracts";
import logger from "consola";
import { deployRootChainManager } from "./utils/deploy-root-chain-manager";
import { AddressConstants, RoleConstants } from "../common/constants";
import { getNetworkEnv } from "./utils/helpers";

task("deploy:chain-manager:root")
  .setDescription("Deploys the root chain manager")
  .addParam(
    "checkPointManager",
    "Address of Checkpoint Manager",
    AddressConstants.polygon[getNetworkEnv()].checkPointManager
  )
  .addParam("fxRoot", "Address of FxRoot", AddressConstants.polygon[getNetworkEnv()].fxRoot)
  .addParam("rootToken", "Address of Root Token")
  .addFlag("verify", "Verify on Etherscan")
  .setAction(async ({ checkPointManager, fxRoot, rootToken, verify }, hre) => {
    const { ethers } = hre;
    const [deployer] = await ethers.getSigners();
    const chainManager = await deployRootChainManager({
      constructorParams: {
        rootToken,
        fxRoot,
        checkPointManager
      },
      hre,
      deployer
    });

    const token = (await ethers.getContractAt(
      "TradeTrustERC721Base",
      rootToken,
      deployer
    )) as unknown as TradeTrustERC721Base;
    const tx = await token.grantRole(RoleConstants.chainManager, chainManager.address);
    logger.info(`[${tx.hash}] Granting role on root token...`);
    await tx.wait();
    logger.success(`[${tx.hash}] Chain manager role granted on root token!`);

    if (verify) {
      logger.info("Verifying contract...");
      await hre.run("verify", {
        address: chainManager.address,
        constructorArgsParams: [checkPointManager, fxRoot, rootToken]
      });
      logger.info("Done verifying contract!");
    }

    return chainManager;
  });
