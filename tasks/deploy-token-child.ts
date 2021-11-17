/* eslint-disable import/no-extraneous-dependencies */
import { TradeTrustERC721Base, TradeTrustERC721Child, TradeTrustERC721ChildMintable } from "@tradetrust/contracts";
import { subtask } from "hardhat/config";
import logger from "consola";
import { deployToken } from "./utils/deploy-token";

subtask("deploy:token:child")
  .setDescription("Deploys a mintable child token of TradeTrustERC721")
  .addParam("name", "Name of the token")
  .addParam("symbol", "Symbol of token")
  .addFlag("mintable", "Mintability of the token")
  .addFlag("verify", "Verify on Etherscan")
  .setAction(async ({ name, symbol, mintable, verify }, hre): Promise<TradeTrustERC721Base> => {
    const [deployer] = await hre.ethers.getSigners();
    let token: TradeTrustERC721Base;
    if (mintable) {
      const contractName = "TradeTrustERC721ChildMintable";
      token = await deployToken<TradeTrustERC721ChildMintable>({
        constructorParams: { name, symbol },
        hre,
        contractName,
        deployer,
      });
    } else {
      const contractName = "TradeTrustERC721Child";
      token = await deployToken<TradeTrustERC721Child>({
        constructorParams: { name, symbol },
        hre,
        contractName,
        deployer,
      });
    }

    if (verify) {
      logger.info("Verifying contract...");
      await hre.run("verify", {
        address: token.address,
        constructorArgsParams: [name, symbol],
      });
      logger.info("Done verifying contract!");
    }

    return token;
  });
