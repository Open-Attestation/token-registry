import { task } from "hardhat/config";
import { TradeTrustERC721 } from "@tradetrust/contracts";
import { deployToken } from "./helpers/deploy-token";
import { verifyContract } from "./helpers/verify-contract";
import { TASK_DEPLOY_TOKEN } from "./task-names";

task(TASK_DEPLOY_TOKEN)
  .setDescription("Deploys the TradeTrustERC721 token")
  .addParam("name", "Name of the token")
  .addParam("symbol", "Symbol of token")
  .addFlag("verify", "Verify on Etherscan")
  .setAction(async ({ name, symbol, verify }, hre) => {
    try {
      const [deployer] = await hre.ethers.getSigners();

      const contractName = "TradeTrustERC721";
      const token: TradeTrustERC721 = await deployToken({
        constructorParams: { name, symbol },
        hre,
        contractName,
        deployer,
      });

      if (verify) {
        await verifyContract({
          address: token.address,
          constructorArgsParams: [name, symbol],
          hre,
        });
      }

      console.log(`[Status] Completed deploying token`);
    } catch (err) {
      console.log(`[Status] Failed to deploy token`);
      console.error(err);
    }
  });
