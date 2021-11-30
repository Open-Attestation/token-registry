import { TradeTrustERC721, TradeTrustERC721Base, TradeTrustERC721RootMintable } from "@tradetrust/contracts";
import { subtask } from "hardhat/config";
import { deployToken } from "./helpers/deploy-token";
import { verifyContract } from "./helpers/verify-contract";
import { TASK_DEPLOY_TOKEN_ROOT } from "./task-names";

subtask(TASK_DEPLOY_TOKEN_ROOT)
  .setDescription("Deploys a mintable root token of TradeTrustERC721")
  .addParam("name", "Name of the token")
  .addParam("symbol", "Symbol of token")
  .addFlag("mintable", "Mintability of the token")
  .addFlag("verify", "Verify on Etherscan")
  .setAction(async ({ name, symbol, mintable, verify }, hre): Promise<TradeTrustERC721Base> => {
    const [deployer] = await hre.ethers.getSigners();
    let token: TradeTrustERC721Base;
    if (mintable) {
      const contractName = "TradeTrustERC721RootMintable";
      token = (await deployToken({
        constructorParams: { name, symbol },
        hre,
        contractName,
        deployer,
      })) as TradeTrustERC721RootMintable;
    } else {
      const contractName = "TradeTrustERC721";
      token = (await deployToken({
        constructorParams: { name, symbol },
        hre,
        contractName,
        deployer,
      })) as TradeTrustERC721;
    }

    if (verify) {
      await verifyContract({
        address: token.address,
        constructorArgsParams: [name, symbol],
        hre,
      });
    }

    return token;
  });
