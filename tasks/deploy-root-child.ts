/* eslint-disable import/no-extraneous-dependencies */
import {
  TradeTrustERC721Base,
  TradeTrustERC721Child,
  TradeTrustERC721ChildMintable,
  TradeTrustERC721RootTunnel,
} from "@tradetrust/contracts";
import { task } from "hardhat/config";
import logger from "consola";
import { HttpNetworkConfig } from "hardhat/src/types/config";
import { deployToken } from "./helpers/deploy-token";
import { deployChildChainManager } from "./helpers/deploy-child-chain-manager";
import { RoleConstants } from "../src/common/constants";

task("deploy:complete")
  .setDescription("Deploys root token and its chain manager")
  .addOptionalParam("checkPointManager", "Address of Checkpoint Manager", "0x2890bA17EfE978480615e330ecB65333b880928e")
  .addOptionalParam("fxRoot", "Address of FxRoot", "0x3d1d3E34f7fB6D26245E6640E1c50710eFFf15bA")
  .addOptionalParam("fxChild", "Address of FxRoot", "0xCf73231F28B7331BBe3124B907840A94851f9f11")
  .addParam("name", "Name of the token")
  .addParam("symbol", "Symbol of token")
  .addFlag("mintable", "Mintability of the token")
  .addParam("childNetwork", "Network of child chain")
  .setAction(async ({ checkPointManager, fxRoot, fxChild, name, symbol, mintable, childNetwork }, hre) => {
    const { ethers } = hre;
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

    const rootToken = (await hre.run("deploy:token:root", {
      name,
      symbol,
      mintable,
    })) as TradeTrustERC721Base;

    const rootChainManager = (await hre.run("deploy:chain-manager:root", {
      checkPointManager,
      fxRoot,
      rootToken: rootToken.address,
    })) as TradeTrustERC721RootTunnel;

    const rootRoleTx = await rootToken.grantRole(RoleConstants.chainManager, rootChainManager.address);
    logger.info(`Granting root chain manager role in transaction ${rootRoleTx.hash}`);
    await rootRoleTx.wait();
    logger.success(`Success! Granted ${rootChainManager.address} root chain manager role!`);

    let childToken: TradeTrustERC721Base;
    if (mintable) {
      const contractName = "TradeTrustERC721ChildMintable";
      childToken = await deployToken<TradeTrustERC721ChildMintable>({
        constructorParams: { name, symbol },
        hre,
        contractName,
        deployer: childDeployer,
      });
    } else {
      const contractName = "TradeTrustERC721Child";
      childToken = await deployToken<TradeTrustERC721Child>({
        constructorParams: { name, symbol },
        hre,
        contractName,
        deployer: childDeployer,
      });
    }

    const childChainManager = await deployChildChainManager({
      constructorParams: {
        childToken: childToken.address,
        fxChild,
      },
      hre,
      deployer: childDeployer,
    });

    const childRoleTx = await childToken.grantRole(RoleConstants.chainManager, childChainManager.address);
    logger.info(`Granting child chain manager role in transaction ${childRoleTx.hash}`);
    await childRoleTx.wait();
    logger.success(`Success! Granted ${childChainManager.address} child chain manager role!`);

    logger.info("Linking up chain managers...");
    const setRootTx = await rootChainManager.setFxChildTunnel(childChainManager.address);
    logger.success(`Linking root to child manager in ${setRootTx.hash}`);
    const setChildTx = await childChainManager.setFxRootTunnel(rootChainManager.address);
    logger.success(`Linking child to root manager in ${setChildTx.hash}`);
    await setRootTx.wait();
    await setChildTx.wait();
    logger.success("Successfully linked chain managers!");

    // const { network } = hre;
    //
    // if (network.name === "hardhat" || network.name === "localhost") return;
    // if (hre.config.etherscan.apiKey) {
    //   logger.info("Verifying root chain contracts...");
    //   await hre.run("verify", {
    //     address: rootToken.address,
    //     constructorArgsParams: [taskArgs.name, taskArgs.symbol]
    //   });
    //   logger.success("Done verifying root chain contracts!");
    //
    //   const { etherscanNetworks } = hre.config;
    //   if (etherscanNetworks && etherscanNetworks[taskArgs.childNetwork]) {
    //     logger.info("Verifying root contracts...");
    //     // eslint-disable-next-line no-param-reassign
    //     hre.config.etherscan.apiKey = etherscanNetworks[taskArgs.childNetwork].apiKey;
    //     console.log("=====hre.config.etherscan.apiKey::", hre.config.etherscan.apiKey);
    //     await hre.run("verify", {
    //       address: childToken.address,
    //       constructorArgsParams: [taskArgs.name, taskArgs.symbol]
    //     });
    //     logger.success("Done verifying child chain contracts!");
    //   }
    // }
  });
