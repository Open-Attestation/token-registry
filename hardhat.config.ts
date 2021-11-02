import "@typechain/hardhat";
import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-waffle";
import "hardhat-watcher";
import "hardhat-gas-reporter";
import "solidity-coverage";
import "@nomiclabs/hardhat-etherscan";
import { HardhatUserConfig } from "hardhat/types";
import "./src/deployment";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.4",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      },
      outputSelection: {
        "*": {
          "*": ["storageLayout"]
        }
      }
    }
  },
  typechain: {
    outDir: "src/contracts",
    alwaysGenerateOverloads: true
  },
  watcher: {
    test: {
      tasks: ["compile", "test"],
      files: ["./contracts", "./test"]
    }
  },
  gasReporter: {
    coinmarketcap: process.env.COINMARKETCAP_TOKEN,
    currency: "USD"
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY
  }
};

export default config;
