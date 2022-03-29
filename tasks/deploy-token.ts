// noinspection ExceptionCaughtLocallyJS

import { task } from "hardhat/config";
import { ImplDeployer, TradeTrustERC721 } from "@tradetrust/contracts";
import { verifyContract } from "./helpers/verify-contract";
import { TASK_DEPLOY_TOKEN } from "./task-names";
import { ContractAddress } from "../src";
import { encodeInitParams, getEventFromTransaction, isSupportedTitleEscrowFactory } from "../src/utils";
import { wait } from "./helpers/wait";
import { deployContract } from "./helpers/deploy-contract";

task(TASK_DEPLOY_TOKEN)
  .setDescription("Deploys the TradeTrustERC721 token")
  .addParam("name", "Name of the token")
  .addParam("symbol", "Symbol of token")
  .addFlag("verify", "Verify on Etherscan")
  .addFlag("standalone", "Deploy as standalone token contract")
  .addOptionalParam("factory", "Address of Title Escrow factory (Optional)")
  .setAction(async ({ name, symbol, verify, factory, standalone }, hre) => {
    const { ethers, network } = hre;
    try {
      const [deployer] = await ethers.getSigners();
      const deployerAddress = await deployer.getAddress();
      const chainId = await deployer.getChainId();
      let factoryAddress = factory;
      let registryAddress: string;

      if (!chainId) {
        throw new Error(`Invalid chain ID: ${chainId}`);
      }

      console.log(`[Deployer] ${deployerAddress}`);

      if (!factoryAddress) {
        factoryAddress = ContractAddress.TitleEscrowFactory[chainId];
        if (!factoryAddress) {
          throw new Error(`Network ${network.name} currently is not supported. Supply a factory address.`);
        }
        console.log(`[Status] Using ${factoryAddress} as Title Escrow factory.`);
      }

      const supportedTitleEscrowFactory = await isSupportedTitleEscrowFactory(factoryAddress, ethers.provider);
      if (!supportedTitleEscrowFactory) {
        throw new Error(`Title Escrow Factory ${factoryAddress} is not supported.`);
      }
      console.log("[Status] Title Escrow Factory interface check is OK.");

      if (!standalone) {
        const deployerContractAddress = ContractAddress.Deployer[chainId];
        const implAddress = ContractAddress.TokenImplementation[chainId];
        if (!deployerContractAddress || !implAddress) {
          throw new Error(`Network ${network.name} currently is not supported. Use --standalone instead.`);
        }
        const deployerContract = (await ethers.getContractFactory("ImplDeployer")).attach(
          deployerContractAddress
        ) as ImplDeployer;
        const initParam = encodeInitParams({
          name,
          symbol,
          titleEscrowFactory: factoryAddress,
          deployer: deployerAddress,
        });
        const tx = await deployerContract.deploy(implAddress, initParam);
        console.log(`[Transaction] Pending ${tx.hash}`);
        await tx.wait();
        registryAddress = (
          await getEventFromTransaction(
            tx,
            ["event Deployment (address indexed deployed, address indexed implementation, bytes params)"],
            "Deployment"
          )
        ).deployed;
      } else {
        // Standalone deployment
        const contractName = "TradeTrustERC721";
        const token = await deployContract<TradeTrustERC721>({
          params: [name, symbol, factoryAddress],
          contractName,
          hre,
        });
        registryAddress = token.address;
      }

      if (verify && standalone) {
        console.log("[Status] Waiting to verify (about a minute)...");
        await wait(60000);
        console.log("[Status] Start verification");

        await verifyContract({
          address: registryAddress,
          constructorArgsParams: [name, symbol, factoryAddress],
          contract: "contracts/TradeTrustERC721.sol:TradeTrustERC721",
          hre,
        });
      } else {
        console.log("[Status] Skipped verification, already verified.");
      }

      console.log(`[Status] ✅ Completed deploying token contract at ${registryAddress}`);
    } catch (err: any) {
      console.log("[Status] ❌ An error occurred while deploying token");
      console.error(err.error?.message ?? err.message);
    }
  });
