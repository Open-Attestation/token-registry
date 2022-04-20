import { task } from "hardhat/config";
import { TradeTrustERC721Impl } from "@tradetrust/contracts";
import { verifyContract } from "./helpers/verify-contract";
import { TASK_DEPLOY_TOKEN_IMPL } from "./task-names";
import { wait } from "./helpers/wait";
import { deployContract } from "./helpers/deploy-contract";

task(TASK_DEPLOY_TOKEN_IMPL)
  .setDescription("Deploys the token implementation contract")
  .addFlag("verify", "Verify on Etherscan")
  .setAction(async ({ verify }, hre) => {
    const { ethers } = hre;
    try {
      const [deployer] = await ethers.getSigners();
      const deployerAddress = await deployer.getAddress();

      console.log(`[Deployer] ${deployerAddress}`);

      const registryImplContract = await deployContract<TradeTrustERC721Impl>({
        params: [],
        contractName: "TradeTrustERC721Impl",
        hre,
      });

      if (verify) {
        console.log("[Status] Waiting to verify (about a minute)...");
        await wait(60000);
        console.log("[Status] Start verification");

        await verifyContract({
          address: registryImplContract.address,
          constructorArgsParams: [],
          contract: "contracts/TradeTrustERC721Impl.sol:TradeTrustERC721Impl",
          hre,
        });
      }

      console.log(`[Status] ✅ Completed deploying token implementation at ${registryImplContract.address}`);
    } catch (err: any) {
      console.log("[Status] ❌ An error occurred while deploying token implementation");
      console.error(err.error?.message ?? err.message);
    }
  });
