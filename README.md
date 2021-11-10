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
