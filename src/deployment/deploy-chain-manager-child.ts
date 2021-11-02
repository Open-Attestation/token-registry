/* eslint-disable import/no-extraneous-dependencies */
import logger from "consola";
import { task } from "hardhat/config";
import { TradeTrustERC721Base } from "@tradetrust/contracts";
import { deployChildChainManager } from "./utils/deploy-child-chain-manager";
import { AddressConstants, RoleConstants } from "../common/constants";
import { getNetworkEnv } from "./utils/helpers";

task("deploy:chain-manager:child")
  .setDescription("Deploys the child chain manager")
  .addParam("fxChild", "Address of FxChild", AddressConstants.polygon[getNetworkEnv()].fxChild)
  .addParam("childToken", "Address of Child Token")
  .addFlag("verify", "Verify on Etherscan")
  .setAction(async ({ fxChild, childToken, verify }, hre) => {
    const { ethers } = hre;
    const [deployer] = await ethers.getSigners();
    const chainManager = await deployChildChainManager({
      constructorParams: {
        childToken,
        fxChild
      },
      hre,
      deployer
    });

    const token = (await ethers.getContractAt(
      "TradeTrustERC721Base",
      childToken,
      deployer
    )) as unknown as TradeTrustERC721Base;
    const tx = await token.grantRole(RoleConstants.chainManager, chainManager.address);
    logger.info(`[${tx.hash}] Granting role on child token...`);
    await tx.wait();
    logger.success(`[${tx.hash}] Chain manager role granted on child token!`);

    if (verify) {
      logger.info("Verifying contract...");
      await hre.run("verify", {
        address: chainManager.address,
        constructorArgsParams: [fxChild, childToken]
      });
      logger.info("Done verifying contract!");
    }

    return chainManager;
  });
