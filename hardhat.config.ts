import "@typechain/hardhat";
import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-waffle";
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
  networkConfig.accounts = ["0xbabe"];
} else if (DEPLOYER_PK) {
  networkConfig.accounts = [DEPLOYER_PK];
} else {
  networkConfig.accounts = {
    mnemonic: MNEMONIC!,
  };
}

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.4",
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
      mainnet: ETHERSCAN_API_KEY,
      ropsten: ETHERSCAN_API_KEY,
      goerli: ETHERSCAN_API_KEY,
      rinkeby: ETHERSCAN_API_KEY,
      kovan: ETHERSCAN_API_KEY,
      /**
       * Polygon
       */
      polygon: POLYGONSCAN_API_KEY,
      polygonMumbai: POLYGONSCAN_API_KEY,
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
    ropsten: {
      ...networkConfig,
      url: `https://ropsten.infura.io/v3/${INFURA_APP_ID}`,
    },
    goerli: {
      ...networkConfig,
      url: `https://goerli.infura.io/v3/${INFURA_APP_ID}`,
    },
    rinkeby: {
      ...networkConfig,
      url: `https://rinkeby.infura.io/v3/${INFURA_APP_ID}`,
    },
    kovan: {
      ...networkConfig,
      url: `https://kovan.infura.io/v3/${INFURA_APP_ID}`,
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
