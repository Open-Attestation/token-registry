import { randomBytes } from "crypto";
import "@typechain/hardhat";
import "@nomiclabs/hardhat-ethers";
import "@nomicfoundation/hardhat-chai-matchers";
import "hardhat-watcher";
import "hardhat-gas-reporter";
import "solidity-coverage";
import "@nomiclabs/hardhat-etherscan";
import dotenv from "dotenv";
import { HardhatUserConfig, HttpNetworkUserConfig } from "hardhat/types";
import "./tasks";

dotenv.config();

const { INFURA_APP_ID, MNEMONIC, DEPLOYER_PK, COINMARKETCAP_API_KEY, ETHERSCAN_API_KEY, POLYGONSCAN_API_KEY } =
  process.env;
const IS_CI_ENV = process.env.NODE_ENV === "ci";

if (!IS_CI_ENV && !INFURA_APP_ID) {
  throw new Error("Infura key is not provided in env");
}

if (!IS_CI_ENV && !DEPLOYER_PK && !MNEMONIC) {
  throw new Error("Provide at least either deployer private key or mnemonic in env");
}

const networkConfig: HttpNetworkUserConfig = {};
if (IS_CI_ENV) {
  networkConfig.accounts = [`0x${randomBytes(32).toString("hex")}`];
} else if (DEPLOYER_PK) {
  networkConfig.accounts = [DEPLOYER_PK];
} else {
  networkConfig.accounts = {
    mnemonic: MNEMONIC!,
  };
}

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.9",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      outputSelection: {
        "*": {
          "*": ["storageLayout"],
        },
      },
    },
  },
  typechain: {
    outDir: "src/contracts",
    alwaysGenerateOverloads: true,
  },
  watcher: {
    test: {
      tasks: ["compile", "test"],
      files: ["./contracts", "./test"],
    },
  },
  gasReporter: {
    coinmarketcap: COINMARKETCAP_API_KEY,
    currency: "USD",
  },
  etherscan: {
    apiKey: {
      /**
       * Ethereum
       */
      mainnet: ETHERSCAN_API_KEY!,
      /**
       * Polygon
       */
      polygon: POLYGONSCAN_API_KEY!,
      polygonMumbai: POLYGONSCAN_API_KEY!,
    },
  },
  networks: {
    /**
     * Ethereum
     */
    mainnet: {
      ...networkConfig,
      url: `https://mainnet.infura.io/v3/${INFURA_APP_ID}`,
    },
    sepolia: {
      ...networkConfig,
      url: "https://rpc.sepolia.org",
    },
    xdc: {
      ...networkConfig,
      url: "https://erpc.xinfin.network",
    },
    xdcapothem: {
      ...networkConfig,
      url: "https://erpc.apothem.network",
    },
    hederamainnet: {
      ...networkConfig,
      url: "https://mainnet.hashio.io/api",
    },
    hederatestnet: {
      ...networkConfig,
      url: "https://testnet.hashio.io/api",
    },
    /**
     * Polygon
     */
    polygon: {
      ...networkConfig,
      url: "https://polygon-rpc.com",
      // Uncomment line below if using Infura
      // url: `https://polygon-mainnet.infura.io/v3/${INFURA_APP_ID}`,
    },
    mumbai: {
      ...networkConfig,
      url: "https://matic-mumbai.chainstacklabs.com",
      // Uncomment line below if using Infura
      // url: `https://polygon-mumbai.infura.io/v3/${INFURA_APP_ID}`,
    },
    /**
     * Development
     */
    hardhat: {
      allowUnlimitedContractSize: true,
    },
    localhost: {
      ...networkConfig,
      accounts: "remote",
      url: "http://127.0.0.1:8545",
    },
  },
};

export default config;
