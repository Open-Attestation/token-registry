require("@nomiclabs/hardhat-waffle");
require("hardhat-watcher");
require("hardhat-typechain");
require("hardhat-gas-reporter");

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: {
    version: "0.8.4",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  typechain: {
    outDir: "src/contracts",
  },
  watcher: {
    test: {
      tasks: ["compile", "test"],
      files: ["./contracts", "./test"],
    },
  },
  gasReporter: {
    coinmarketcap: "e3dd106b-9644-45ac-8f61-98614b973bca",
    currency: "USD",
    gasPrice: 21,
  },
};
