import { task, types } from "hardhat/config";
import { ChainType } from "../src/common/enum/chain-type.enum";
import "./deploy-token-root";
import "./deploy-token-child";

const TASK_DEPLOY_TOKEN = "deploy:token";

task(TASK_DEPLOY_TOKEN)
  .setDescription("Deploys the TradeTrustERC721 token")
  .addParam("name", "Name of the token")
  .addParam("symbol", "Symbol of token")
  .addOptionalParam("chain", "Chain ('ethereum' or 'polygon') to deploy token", "ethereum", types.string)
  .addFlag("mintable", "Mintability of the token")
  .addFlag("verify", "Verify on Etherscan")
  .setAction(async ({ name, symbol, mintable, verify, chain }, hre) => {
    try {
      const chainValues = ["ethereum", "polygon"];
      if (!chainValues.includes(chain)) {
        throw new Error("Unsupported chain type");
      }

      let taskName = "deploy:token:root";
      if (chain === ChainType.Polygon) {
        taskName = "deploy:token:child";
      }

      await hre.run(taskName, {
        name,
        symbol,
        mintable,
        verify,
      });

      console.log(`[Status] Completed deploying token`);
    } catch (err) {
      console.log(`[Status] Failed to deploy token`);
      console.error(err);
    }
  });
