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

const { INFURA_API_KEY, MNEMONIC, DEPLOYER_PK, COINMARKETCAP_API_KEY, ETHERSCAN_API_KEY } = process.env;
const IS_TEST_ENV = process.env.NODE_ENV === "test";

if (!IS_TEST_ENV && !INFURA_API_KEY) {
  throw new Error("Infura key is not provided in env");
}

if (!IS_TEST_ENV && !DEPLOYER_PK && !MNEMONIC) {
  throw new Error("Provide at least either deployer private key or mnemonic in env");
}

const networkConfig: HttpNetworkUserConfig = {};
if (IS_TEST_ENV) {
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
    apiKey: ETHERSCAN_API_KEY,
  },
  networks: {
    /**
     * Ethereum
     */
    mainnet: {
      ...networkConfig,
      url: `https://mainnet.infura.io/v3/${INFURA_API_KEY}`,
    },
    ropsten: {
      ...networkConfig,
      url: `https://ropsten.infura.io/v3/${INFURA_API_KEY}`,
    },
    goerli: {
      ...networkConfig,
      url: `https://goerli.infura.io/v3/${INFURA_API_KEY}`,
    },
    rinkeby: {
      ...networkConfig,
      url: `https://rinkeby.infura.io/v3/${INFURA_API_KEY}`,
    },
    kovan: {
      ...networkConfig,
      url: `https://kovan.infura.io/v3/${INFURA_API_KEY}`,
    },
    /**
     * Polygon
     */
    polygon: {
      ...networkConfig,
      url: `https://polygon-mainnet.infura.io/v3/${INFURA_API_KEY}`,
    },
    mumbai: {
      ...networkConfig,
      url: `https://polygon-mumbai.infura.io/v3/${INFURA_API_KEY}`,
      // url: "https://matic-mumbai.chainstacklabs.com",
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
