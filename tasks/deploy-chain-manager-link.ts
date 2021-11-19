import { task } from "hardhat/config";
import { TradeTrustERC721ChildTunnel, TradeTrustERC721RootTunnel } from "@tradetrust/contracts";
import { HttpNetworkConfig } from "hardhat/src/types/config";
import { StatusManager } from "./utils/status-manager/status-manager";

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
      const rootStatus = StatusManager.create();
      const childStatus = StatusManager.create();
      rootStatus.add(`Linking up root to child chain manager...`);
      childStatus.add(`Linking up child to root chain manager...`);

      try {
        const { ethers } = hre;
        const [deployer] = await ethers.getSigners();

        const childNetworkConfig = hre.config.networks[childNetwork] as HttpNetworkConfig;
        if (!childNetworkConfig || !childNetworkConfig.url) {
          childStatus.fail(`Failed to link root/child chain managers: Cannot find the network "${childNetwork}"`);
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

        const setRootTx = await rootChainManager.setFxChildTunnel(childChainManager.address);
        rootStatus.update(`Pending link root to child chain manager ${setRootTx.hash}...`);
        const setChildTx = await childChainManager.setFxRootTunnel(rootChainManager.address);
        childStatus.update(`Pending link child to root chain manager ${setChildTx.hash}...`);

        await Promise.all([setRootTx.wait(), setChildTx.wait()]);

        rootStatus.succeed("Chain managers linked up");
        childStatus.remove();
      } catch (err) {
        rootStatus.fail(`Failed to link chain managers: ${err}`);
        childStatus.remove();
        console.error(err);
      }
    }
  );
