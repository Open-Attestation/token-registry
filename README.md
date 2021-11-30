[![CircleCI](https://circleci.com/gh/Open-Attestation/token-registry/tree/master.svg?style=svg)](https://circleci.com/gh/Open-Attestation/token-registry/tree/master)
[![codecov](https://codecov.io/gh/Open-Attestation/token-registry/branch/master/graph/badge.svg?token=Y4R9SWXATG)](https://codecov.io/gh/Open-Attestation/token-registry)

# Token Registry

The [Token Registry](https://github.com/Open-Attestation/token-registry) repository contains both the smart contract code for token registry (in `/contracts`) as well as the node package for using this library (in `/src`).

## Installation

```sh
npm i @govtechsg/token-registry
```

---

## Usage

To use the package, you will need to provide your own Web3 [provider](https://docs.ethers.io/v5/api/providers/api-providers/) or [signer](https://docs.ethers.io/v5/api/signer/#Wallet) (if you are writing to the blockchain).

### TradeTrustERC721

#### Deploy new token registry

```ts
import { TradeTrustERC721Factory } from "@govtechsg/token-registry";

const factory = new TradeTrustERC721Factory(signer1);
const tokenRegistry = await tokenRegistryFactory.deploy("MY_TOKEN_REGISTRY", "TKN");
```

#### Connect to existing token registry

```ts
import { TradeTrustERC721Factory } from "@govtechsg/token-registry";

const connectedRegistry = TradeTrustERC721Factory.connect(existingERC721Address, signer1);
```

#### List of available functions

The contract supports [all ERC721 methods](http://erc721.org/)

### TitleEscrow

The TradeTrustErc721 Token Registry will clone a new TitleEscrow internally when minting or restoring titles.

#### Minting Title Escrow

```ts
import { TradeTrustERC721Factory } from "@govtechsg/token-registry";

const connectedRegistry = TradeTrustERC721Factory.connect(existingERC721Address, signer);
const tx = await connectedRegistry.mintTitle(beneficiaryAddress, holderAddress, tokenId);
```

#### Restoring Title Escrow

```ts
import { TradeTrustERC721Factory } from "@govtechsg/token-registry";

const connectedRegistry = TradeTrustERC721Factory.connect(existingERC721Address, signer);
const tx = await connectedRegistry.restoreTitle(beneficiaryAddress, holderAddress, existingTokenId);
```

#### Connect to Title Escrow

```ts
import { TitleEscrowFactory } from "@govtechsg/token-registry";

const connectedEscrow = TitleEscrowFactory.connect(existingTitleEscrowAddress, signer1);
```

For list of available functions on TitleEscrow simply check the type definitions as they are automatically generated using typechain.

### Provider & Signer

Different ways to get provider or signer:

```ts
import { Wallet, providers, getDefaultProvider } from "ethers";

// Providers
const mainnetProvider = getDefaultProvider();
const ropstenProvider = getDefaultProvider("ropsten");
const metamaskProvider = new providers.Web3Provider(web3.currentProvider); // Will change network automatically

// Signer
const signerFromPrivateKey = new Wallet("YOUR-PRIVATE-KEY-HERE", provider);
const signerFromEncryptedJson = Wallet.fromEncryptedJson(json, password);
signerFromEncryptedJson.connect(provider);
const signerFromMnemonic = Wallet.fromMnemonic("MNEMONIC-HERE");
signerFromMnemonic.connect(provider);
```

# Deployment
Hardhat is used to manage the contract development environment and deployment.
This repository provides a couple of Hardhat tasks to simplify the deployment process.

Instead of combining the deployment of the token contracts and chain managers into a single Hardhat task, the deployment is split into smaller tasks so that any one of these individual tasks can be run on its own when needed.
For instance, one may prefer to deploy the token contracts without the chain managers first.

> 💡 The configurations of the network and accounts are in `hardhat.config.ts`.
> The deployer will be the first account of the network.

## Token Contract
Deploying the token contract.
```
Usage: hardhat [GLOBAL OPTIONS] deploy:token [--chain <STRING>] [--mintable] --name <STRING> --symbol <STRING> [--verify]

OPTIONS:

  --chain   	Chain ('ethereum' or 'polygon') to deploy token (default: "ethereum")
  --mintable	Mintability of the token
  --name    	Name of the token
  --symbol  	Symbol of token
  --verify  	Verify on Etherscan
  
deploy:token: Deploys the TradeTrustERC721 token  
```
> 💡 Note that the `--chain` argument is optional. If not provided, the default chain will always be the root chain, `ethereum`.
> The `--mintable` and `--verify` flags are optional.

> 💡 The `--mintable` flag specifies whether a token is mintable on L2, for example, Polygon.
> If the intention is to mint the tokens on L1, the `--mintable` flag is not necessary.

#### Example
```
npx hardhat deploy:token --name "The Great Shipping Co." --symbol GSC --chain polygon --network mumbai --mintable --verify
```
This uses the _mintable_ contract meant for the _Polygon_ chain and deploys it to the Polygon's _Mumbai_ network. The token will be deployed with the name _The Great Shipping Co._ under the symbol _GSC_.
The contract source will also be _verified_ on Etherscan.

## Chain Managers
The Chain Managers can be deployed and used to bridge the tokens between Ethereum and Polygon. They are, however, optional if there is no intention to transfer the tokens between the layers.
The deployment of the Chain Managers mainly involves 3 steps.

### Step 1. Deploy Root Chain Manager on Ethereum
```
Usage: hardhat [GLOBAL OPTIONS] deploy:chain-manager:root [--check-point-manager <STRING>] [--fx-root <STRING>] --token <STRING> [--verify]

OPTIONS:

  --check-point-manager	Address of Checkpoint Manager (default: "0x2890bA17EfE978480615e330ecB65333b880928e")
  --fx-root            	Address of FxRoot (default: "0x3d1d3E34f7fB6D26245E6640E1c50710eFFf15bA")
  --token               Address of Root Token
  --verify             	Verify on Etherscan

deploy:chain-manager:root: Deploys the root chain manager
```
> 💡 The `--check-point-manager` and `--fx-root` parameters are optional.
> The default value of these parameters will refer to the addresses on the mainnet if the env variable value of `NODE_ENV` is `production`. Otherwise, the default values will refer to the addresses on the testnet.

#### Example
```
npx hardhat deploy:chain-manager:root --network goerli --token 0xRootTokenAddress --verify
```
This example will deploy the _root chain manager_ on the Ethereum _Goerli_ network meant for the root token address `0xRootTokenAddress`.
The root chain manager will also be _verified_ on Etherscan.

### Step 2. Deploy Child Chain Manager on Polygon
```
Usage: hardhat [GLOBAL OPTIONS] deploy:chain-manager:child --token <STRING> [--fx-child <STRING>] [--verify]

OPTIONS:

  --token       Address of Child Token
  --fx-child   	Address of FxChild (default: "0xCf73231F28B7331BBe3124B907840A94851f9f11")
  --verify     	Verify on Etherscan

deploy:chain-manager:child: Deploys the child chain manager
```
> 💡 The `--fx-child` parameter is optional.
> Its default value refers to the addresses on the mainnet if the env variable value of `NODE_ENV` is `production`. Otherwise, the default value will refer to the address on the testnet.

#### Example
```
npx hardhat deploy:chain-manager:child --network mumbai --token 0xChildTokenAddress --verify
```
This example will deploy the _child chain manager_ on the Polygon _Mumbai_ network meant for the child token address `0xChildTokenAddress`.
The child chain manager will also be _verified_ on Etherscan.

### Step 3. Link up the Root and Child Chain Managers
```
Usage: hardhat [GLOBAL OPTIONS] deploy:chain-manager:link --child-chain-manager <STRING> --child-network <STRING> --root-chain-manager <STRING>

OPTIONS:

  --child-chain-manager	Address of Root Chain Manager
  --child-network      	Network name of child chain
  --root-chain-manager 	Address of Root Chain Manager

deploy:chain-manager:link: Links up the root and child chain managers
```
> 💡 The `--child-network` should be supplied with the name of the child network where the child chain manager is deployed on.
> The root network has to be supplied to Hardhat's `--network`. See below for an example.

#### Example
```
npx hardhat deploy:chain-manager:link --network goerli --child-network mumbai --root-chain-manager 0xRootChainManagerAddress --child-chain-manager 0xChildChainManagerAddress
```
This example will link up the root chain manager located at `0xRootChainManagerAddress` on the Ethereum _Goerli_ network to the child chain manager located at `0xChildChainManagerAddress` on the Polygon _Mumbai_ network. Notice that the name of the child network is provided to `--child-network`.

## Verification
When verifying the contracts through either the Hardhat's verify plugin or passing the `--verify` flag to the deployment tasks (which internally uses the same plugin), you will need to set `ETHERSCAN_API_KEY` in your environment to your Etherscan API key.

# Development
This repository's development framework uses (HardHat)[https://hardhat.org/getting-started/].

Tests are run using `npm run test`, more development tasks can be found in the package.json scripts.

## Setup

```sh
npm install
npm lint
npm test
npx hardhat <command>
```

## Development

This repository's development framework uses [HardHat](https://hardhat.org/getting-started/).

Tests are run using `npm run test`, more development tasks can be found in the package.json scripts.
