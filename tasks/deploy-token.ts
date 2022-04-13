import { task } from "hardhat/config";
import { TradeTrustERC721 } from "@tradetrust/contracts";
import { deployToken } from "./helpers/deploy-token";
import { verifyContract } from "./helpers/verify-contract";
import { TASK_DEPLOY_TOKEN } from "./task-names";

const wait = async (durationMs: number) => new Promise((resolve) => setTimeout(async () => resolve(true), durationMs));

task(TASK_DEPLOY_TOKEN)
  .setDescription("Deploys the TradeTrustERC721 token and, optionally, Title Escrow factory if not provided.")
  .addParam("name", "Name of the token")
  .addParam("symbol", "Symbol of token")
  .addFlag("verify", "Verify on Etherscan")
  .addOptionalParam("factory", "Address of Title Escrow factory contract (Optional)")
  .setAction(async ({ name, symbol, verify, factory }, hre) => {
    const { ethers } = hre;
    try {
      const [deployer] = await ethers.getSigners();
      const deployerAddress = await deployer.getAddress();
      let factoryAddress = factory;
      let deployedNewFactory = false;

      console.log(`[Deployer] ${deployerAddress}`);

      if (!factoryAddress) {
        console.log("[Status] No factory address provided, will deploy Title Escrow factory");
        const titleEscrowFacFactory = await ethers.getContractFactory("TitleEscrowFactory");
        const titleEscrowFactoryContract = await titleEscrowFacFactory.connect(deployer).deploy();
        const factoryDeployTx = titleEscrowFactoryContract.deployTransaction;
        console.log(`[Transaction - TitleEscrowFactory] Pending ${factoryDeployTx.hash}`);
        await titleEscrowFactoryContract.deployed();
        deployedNewFactory = true;
        factoryAddress = titleEscrowFactoryContract.address;
        console.log(`[Address - TitleEscrowFactory] Deployed to ${factoryAddress}`);
      } else {
        console.log(`[Status] Using ${factoryAddress} as Title Escrow factory`);
      }

      const contractName = "TradeTrustERC721";
      const token: TradeTrustERC721 = await deployToken({
        constructorParams: { name, symbol, factoryAddress },
        hre,
        contractName,
        deployer,
      });

      if (verify) {
        console.log("[Status] Waiting to verify (about a minute)...");
        await wait(60000);
        console.log("[Status] Start verification");

        if (deployedNewFactory) {
          await verifyContract({
            address: factoryAddress,
            constructorArgsParams: [],
            contract: "contracts/TitleEscrowFactory.sol:TitleEscrowFactory",
            hre,
          });
        }
        await verifyContract({
          address: token.address,
          constructorArgsParams: [name, symbol, factoryAddress],
          contract: "contracts/TradeTrustERC721.sol:TradeTrustERC721",
          hre,
        });
      }

      console.log("[Status] Completed deploying token");
    } catch (err: any) {
      console.log("[Status] An error occurred while deploying token");
      console.error(err.message);
    }
  });
