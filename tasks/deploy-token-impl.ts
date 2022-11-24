import { task } from "hardhat/config";
import { TradeTrustTokenImpl } from "@tradetrust/contracts";
import { verifyContract, wait, deployContract } from "./helpers";
import { TASK_DEPLOY_TOKEN_IMPL } from "./task-names";

task(TASK_DEPLOY_TOKEN_IMPL)
  .setDescription("Deploys the token implementation contract")
  .addFlag("verify", "Verify on Etherscan")
  .setAction(async ({ verify }, hre) => {
    const { ethers } = hre;
    try {
      const [deployer] = await ethers.getSigners();
      const deployerAddress = await deployer.getAddress();

      console.log(`[Deployer] ${deployerAddress}`);

      const registryImplContract = await deployContract<TradeTrustTokenImpl>({
        params: [],
        contractName: "TradeTrustTokenImpl",
        hre,
      });

      if (verify) {
        console.log("[Status] Waiting to verify (about a minute)...");
        await wait(60000);
        console.log("[Status] Start verification");

        await verifyContract({
          address: registryImplContract.address,
          constructorArgsParams: [],
          contract: "contracts/presets/TradeTrustTokenImpl.sol:TradeTrustTokenImpl",
          hre,
        });
      }

      console.log(`[Status] ✅ Completed deploying token implementation at ${registryImplContract.address}`);
    } catch (err: any) {
      console.log("[Status] ❌ An error occurred while deploying token implementation");
      console.error(err.error?.message ?? err.message);
    }
  });
