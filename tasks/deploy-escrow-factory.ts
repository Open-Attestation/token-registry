import { task } from "hardhat/config";
import { TitleEscrowFactory } from "@tradetrust/contracts";
import { verifyContract } from "./helpers/verify-contract";
import { TASK_DEPLOY_ESCROW_FACTORY } from "./task-names";
import { wait } from "./helpers/wait";
import { deployContract } from "./helpers/deploy-contract";

task(TASK_DEPLOY_ESCROW_FACTORY)
  .setDescription("Deploys a new Title Escrow factory")
  .addFlag("verify", "Verify on Etherscan")
  .setAction(async ({ verify }, hre) => {
    const { ethers } = hre;
    try {
      const [deployer] = await ethers.getSigners();
      const deployerAddress = await deployer.getAddress();

      console.log(`[Deployer] ${deployerAddress}`);

      const titleEscrowFactoryContract = await deployContract<TitleEscrowFactory>({
        params: [],
        contractName: "TitleEscrowFactory",
        hre,
      });
      const factoryDeployTx = titleEscrowFactoryContract.deployTransaction;
      console.log(`[Transaction] Pending ${factoryDeployTx.hash}`);
      await titleEscrowFactoryContract.deployed();
      const factoryAddress = titleEscrowFactoryContract.address;
      console.log(`[Status] Deployed to ${factoryAddress}`);

      if (verify) {
        console.log("[Status] Waiting to verify (about a minute)...");
        const [implAddr] = await Promise.all([titleEscrowFactoryContract.implementation(), wait(60000)]);
        console.log("[Status] Start verification");

        await verifyContract({
          address: implAddr,
          constructorArgsParams: [],
          contract: "contracts/TitleEscrow.sol:TitleEscrow",
          hre,
        });

        await verifyContract({
          address: factoryAddress,
          constructorArgsParams: [],
          contract: "contracts/TitleEscrowFactory.sol:TitleEscrowFactory",
          hre,
        });
      }

      console.log(`[Status] ✅ Completed deploying Title Escrow Factory at ${factoryAddress}`);
    } catch (err: any) {
      console.log("[Status] ❌ An error occurred while deploying Title Escrow Factory");
      console.error(err.error?.message ?? err.message);
    }
  });
