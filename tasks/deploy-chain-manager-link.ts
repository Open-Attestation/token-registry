import { task } from "hardhat/config";
import { TradeTrustERC721ChildTunnel, TradeTrustERC721RootTunnel } from "@tradetrust/contracts";
import { HttpNetworkConfig } from "hardhat/src/types/config";
import { TASK_DEPLOY_CHAIN_MANAGER_LINK } from "./task-names";

task(TASK_DEPLOY_CHAIN_MANAGER_LINK)
  .setDescription("Links up the root and child chain managers")
  .addParam("rootCm", "Address of Root Chain Manager")
  .addParam("childCm", "Address of Root Chain Manager")
  .addParam("childNetwork", "Network name of child chain")
  .setAction(async ({ rootCm: rootChainManagerAddress, childCm: childChainManagerAddress, childNetwork }, hre) => {
    try {
      const { ethers } = hre;
      const [deployer] = await ethers.getSigners();

      const childNetworkConfig = hre.config.networks[childNetwork] as HttpNetworkConfig;
      if (!childNetworkConfig || !childNetworkConfig.url) {
        throw new Error(`Failed to link root/child chain managers: Cannot find the network "${childNetwork}"`);
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

      const setRootTx = await rootChainManager.setFxChildTunnel(childChainManager.address);
      console.log(`[Transaction][RootChainManager] ${setRootTx.hash}`);
      const setChildTx = await childChainManager.setFxRootTunnel(rootChainManager.address);
      console.log(`[Transaction][ChildChainManager] ${setChildTx.hash}`);

      await Promise.all([setRootTx.wait(), setChildTx.wait()]);
      console.log(`[Status] Chain managers linking completed`);
    } catch (err) {
      console.log(`[Status] Failed to link chain managers`);
      console.error(err);
    }
  });
