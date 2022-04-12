[![CircleCI](https://circleci.com/gh/Open-Attestation/token-registry/tree/master.svg?style=svg)](https://circleci.com/gh/Open-Attestation/token-registry/tree/master)
[![codecov](https://codecov.io/gh/Open-Attestation/token-registry/branch/master/graph/badge.svg?token=Y4R9SWXATG)](https://codecov.io/gh/Open-Attestation/token-registry)

# Token Registry

The [Token Registry](https://github.com/Open-Attestation/token-registry) repository contains both the smart contract
code for token registry (in `/contracts`) as well as the node package for using this library (in `/src`).

> ⚠️ **Beta Notice**
>
> Welcome to the beta branch of Token Registry! This branch is still in active development. Please expect bugs and breaking changes. Be warned but be brave!💪
>
> Please report any issues or suggestions [here](https://github.com/Open-Attestation/token-registry/issues).

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [Deployment](#deployment)
  - [Token Contract](#token-contract)
  - [Network Configuration](#network-configuration)
  - [Verification](#verification)
- [Development](#development)
- [Setup](#setup)
- [Configuration](#configuration)
- [Subgraph](#subgraph)
- [Notes](#notes)

## Installation

```sh
npm i @govtechsg/token-registry
```

---

## Usage

To use the package, you will need to provide your own
Web3 [provider](https://docs.ethers.io/v5/api/providers/api-providers/)
or [signer](https://docs.ethers.io/v5/api/signer/#Wallet) (if you are writing to the blockchain).

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

For list of available functions on TitleEscrow simply check the type definitions as they are automatically generated
using typechain.

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

Hardhat is used to manage the contract development environment and deployment. This repository provides a couple of
Hardhat tasks to simplify the deployment process.

## Token Contract

Deploying the token contract.

```
Usage: hardhat [GLOBAL OPTIONS] deploy:token --factory <STRING> --name <STRING> --symbol <STRING> [--verify]

OPTIONS:

  --factory  	Address of Title Escrow factory contract (Optional)
  --network     Name of network
  --name    	Name of the token
  --symbol  	Symbol of token
  --verify  	Verify on Etherscan
  
deploy:token: Deploys the TradeTrustERC721 token and, optionally, Title Escrow factory if not provided.
```

> 💡 Remember to supply the`--network` argument with the name of the network you wish to deploy on.
> See [Network Configuration](#network-configuration) section for more info on the list of network names.

> 💡 Tip: Note that the `--factory` argument is optional. If not provided, a Title Factory contract will be deployed alongside the token contract.
> You can reuse a Title Escrow Factory that you have previously deployed by passing its address to the `--factory` argument to save on deployment fees.

#### Example 1

```
npx hardhat deploy:token --network mumbai --name "The Great Shipping Co." --symbol GSC --verify
```

This will deploy the token with the name _The Great Shipping Co._ under the symbol _GSC_ on the Polygon _mumbai_
network. The contract will also be _verified_ on Etherscan. A Title Escrow factory will also be deployed.

#### Example 2

```
npx hardhat deploy:token --network mainnet --name "The Great Shipping Co." --symbol GSC --factory 0xfac7
```

This will deploy the token with the name _The Great Shipping Co._ under the symbol _GSC_ on the Ethereum _mainnet_
network. The token will be registered with an existing factory address of `0xfac7` and will not be verified.

## Network Configuration

Here's a list of network names currently pre-configured:

* `mainnet` (Ethereum)
* `ropsten`
* `rinkeby`
* `kovan`
* `goerli`
* `polygon` (Polygon Mainnet)
* `mumbai` (Polygon Mumbai)

> 💡 You can configure existing and add other networks you wish to deploy to in the `hardhat.config.ts` file.

## Verification

When verifying the contracts through either the Hardhat's verify plugin or passing the `--verify` flag to the deployment
tasks (which internally uses the same plugin), you will need to set `ETHERSCAN_API_KEY` in your environment to your
Etherscan API key.

# Development

This repository's development framework uses [HardHat](https://hardhat.org/getting-started/).

Tests are run using `npm run test`, more development tasks can be found in the package.json scripts.

## Setup

```sh
npm install
npm lint
npm test
npx hardhat <command>
```

## Configuration

Create a `.env` file and add your own keys into it. You can rename from the sample file `.env.sample` or copy the
following into a new file:

```
# Infura
INFURA_APP_ID=

# API Keys
ETHERSCAN_API_KEY=
COINMARKETCAP_API_KEY=

# Deployer Private Key
DEPLOYER_PK=

# Mnemonic words
MNEMONIC=
```

Only either the `DEPLOYER_PK` or `MNEMONIC` is needed.

## Subgraph

Check out our [Token Registry Subgraph](https://github.com/Open-Attestation/token-registry-subgraph) Github repository
for more information on using and deploying your own subgraphs for the Token Registry contracts.

## Notes

* The contracts have not gone through formal audits yet. Please use them at your own discretion.
