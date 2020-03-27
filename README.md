# Token Registry

This repository contains both the smart contract code for token registry (in `/contracts`) as well as the node package for using this library (in `/src`).

## Installing Package

```sh
npm i @govtechsg/token-registry
```

## Package Usage

To use the package, you will need to provide your own Web3 [provider](https://docs.ethers.io/ethers.js/html/api-providers.html) or [signer](https://docs.ethers.io/ethers.js/html/api-wallet.html) (if you are writing to the blockchain).

### TradeTrustERC721

Deploying new TradeTrustERC721

```ts
import {TradeTrustERC721Factory} from "@govtechsg/token-registry";

const factory = new TradeTrustERC721Factory(signer1);
const tokenRegistry = await tokenRegistryFactory.deploy("MY_TOKEN_REGISTRY", "TKN");
```

Connecting to existing TradeTrustERC721 on Ethereum

```ts
import {TradeTrustERC721Factory} from "@govtechsg/token-registry";

const connectedRegistry = TradeTrustERC721Factory.connect(existingERC721Address, signer1);
```

List of available functions on TradeTrustERC721

The contract supports [all ERC721 methods](http://erc721.org/)

### TitleEscrow

Deploying new TitleEscrow

```ts
import {TitleEscrowFactory} from "@govtechsg/token-registry";

const factory = new TitleEscrowFactory(signer1);
const escrowInstance = await factory.deploy(tokenRegistry.address, account1, account2);
```

Connecting to existing TitleEscrow on Ethereum

```ts
import {TitleEscrowFactory} from "@govtechsg/token-registry";

const connectedEscrow = TitleEscrowFactory.connect(existingTitleEscrowAddress, signer1);
```

List of available functions on TitleEscrow

```text
_tokenId
approvedTransferTarget
beneficiary
holder
status
supportsInterface
tokenRegistry
changeHolder
endorseTransfer
transferTo
```

## Provider & Signer

Different ways to get provider or signer:

```ts
import {Wallet, providers, getDefaultProvider} from "ethers";

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
npm truffle <command>
```

## Notes

If you are using vscode, you may need to link the openzeppelin libraries. See https://github.com/juanfranblanco/vscode-solidity#openzeppelin
