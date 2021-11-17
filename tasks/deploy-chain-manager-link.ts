/* eslint-disable import/no-extraneous-dependencies */
import { task } from "hardhat/config";
import { TradeTrustERC721ChildTunnel, TradeTrustERC721RootTunnel } from "@tradetrust/contracts";
import logger from "consola";
import { HttpNetworkConfig } from "hardhat/src/types/config";

task("deploy:chain-manager:link")
  .setDescription("Links up the root and child chain managers")
  .addParam("rootChainManager", "Address of Root Chain Manager")
  .addParam("childChainManager", "Address of Root Chain Manager")
  .addParam("childNetwork", "Network name of child chain")
  .setAction(
    async (
      { rootChainManager: rootChainManagerAddress, childChainManager: childChainManagerAddress, childNetwork },
      hre
    ) => {
      const { ethers } = hre;
      const [deployer] = await ethers.getSigners();

      const childNetworkConfig = hre.config.networks[childNetwork] as HttpNetworkConfig;
      if (!childNetworkConfig || !childNetworkConfig.url) {
        logger.error(`Cannot find the network "${childNetwork}" in configuration`);
        return;
      }
      const childProvider = new ethers.providers.JsonRpcProvider(childNetworkConfig.url);
      const accs = await childProvider.listAccounts();
      const childDeployer = accs.length
        ? childProvider.getSigner(accs[0])
        : new ethers.Wallet((childNetworkConfig.accounts as string[])[0], childProvider);

      const rootChainManager = (await ethers.getContractAt(
        "TradeTrustERC721RootTunnel",
        rootChainManagerAddress,
        deployer
      )) as unknown as TradeTrustERC721RootTunnel;

      const childChainManager = (await ethers.getContractAt(
        "TradeTrustERC721ChildTunnel",
        childChainManagerAddress,
        childDeployer
      )) as unknown as TradeTrustERC721ChildTunnel;

      logger.info("Linking up chain managers...");
      const setRootTx = await rootChainManager.setFxChildTunnel(childChainManager.address);
      logger.info(`Linking root to child manager in ${setRootTx.hash}`);
      await setRootTx.wait();
      logger.success("Root chain manager linked!");
      const setChildTx = await childChainManager.setFxRootTunnel(rootChainManager.address);
      logger.info(`Linking child to root manager in ${setChildTx.hash}`);
      await setChildTx.wait();
      logger.success("Child chain manager linked!");
    }
  );
