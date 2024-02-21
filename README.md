<h1 align="center">
  <p align="center">Token Registry</p>
  <a href="https://tradetrust.io"><img src="https://github.com/Open-Attestation/token-registry/blob/master/docs/images/tt-logo.png" alt="TradeTrust Token Registry" /></a>
</h1>

<p align="center">
    <a href="https://tradetrust.io">TradeTrust</a> Electronic Bill of Lading (eBL)
</p>

<p align="center"> 
  <a href="https://circleci.com/gh/Open-Attestation/token-registry/tree/master" alt="Circle CI"><img src="https://img.shields.io/circleci/build/github/Open-Attestation/token-registry/master" /></a>
  <a href="https://codecov.io/gh/Open-Attestation/token-registry" alt="Code Coverage"><img src="https://codecov.io/gh/Open-Attestation/token-registry/branch/master/graph/badge.svg?token=Y4R9SWXATG" /></a>
  <a href="https://www.npmjs.com/package/@govtechsg/token-registry" alt="NPM"><img src="https://img.shields.io/npm/dw/@govtechsg/token-registry" /></a>
  <img src="https://img.shields.io/github/license/open-attestation/token-registry" />
</p>

The Electronic Bill of Lading (eBL) is a digital document which you can use to prove the ownership of goods. It is a standardized document accepted by all major shipping lines and customs authorities. 

The [Token Registry](https://github.com/Open-Attestation/token-registry) repository contains the following:

* The smart contract code for token registry in the `/contracts` folder
* The node package for using this library in the `/src` folder

## Table of Contents



- [Installation](#installation)
- [Usage](#usage)
  - [TradeTrustToken](#tradetrusttoken)
  - [Title Escrow](#title-escrow)
  - [Title Escrow signable (experimental)](#title-escrow-signable-experimental)
  - [Provider & signer](#provider--signer)
  - [Roles and access](#roles-and-access)
- [Deployment](#deployment)
  - [Quick start](#quick-start)
  - [Advanced usage](#advanced-usage)
    - [Token contract](#token-contract)
      - [Standalone contract](#standalone-contract)
      - [Using an existing Title Escrow factory](#using-an-existing-title-escrow-factory)
    - [Title Escrow factory](#title-escrow-factory)
      - [Deploying a new Title Escrow factory](#deploying-a-new-title-escrow-factory)
  - [Verification](#verification)
  - [Network configuration](#network-configuration)
- [Configuration](#configuration)
- [Development](#development)
  - [Scripts](#scripts)
- [Subgraph](#subgraph)
- [Additional information](#additional-information)

## Installation

To install Token Registry on your machine, run the command below:

```sh
npm install --save @govtechsg/token-registry
```

---

## Usage

Provide one of the following depending on your purpose: 

* To use the package, provide your own
Web3 [provider](https://docs.ethers.io/v5/api/providers/api-providers/)

* To write to the blockchain, provide the [signer](https://docs.ethers.io/v5/api/signer/#Wallet) that exposes the [Typechain (Ethers)](https://github.com/dethcrypto/TypeChain/tree/master/packages/target-ethers-v5) bindings for the contracts

### TradeTrustToken

The `TradeTrustToken` is a Soulbound Token (SBT) tied to the Title Escrow. The SBT implementation is loosely based on OpenZeppelin's implementation of the [ERC721](http://erc721.org/) standard.

In this case, an SBT is used because the token is largely restricted to its designated Title Escrow contracts, while it can be transferred to the registry.

See issue [#108](https://github.com/Open-Attestation/token-registry/issues/108) for more details.

#### Connecting to an existing token registry
The following is a code example that connects to a token registry:

```ts
import { TradeTrustToken__factory } from "@govtechsg/token-registry/contracts";

const connectedRegistry = TradeTrustToken__factory.connect(tokenRegistryAddress, signer);
```

#### Issuing a document

The following is a code example that issues a document:

```ts
await connectedRegistry.mint(beneficiaryAddress, holderAddress, tokenId);
```

#### Restoring a document

The following is a code example that restores a document:

```ts
await connectedRegistry.restore(tokenId);
```

#### Accepting or burning a document

The following is a code example that burns a document:

```ts
await connectedRegistry.burn(tokenId);
```

### Title Escrow

Using the Title Escrow contract, you can manage and represent the ownership of a token between a beneficiary and holder. During minting, the Token Registry will create and assign a Title Escrow as the owner of that token.
The actual owners will use the Title Escrow contract to perform their ownership operations.

#### Connecting to a Title Escrow
The following is a code example that connects to a Title Escrow:

```ts
import { TitleEscrow__factory } from "@govtechsg/token-registry/contracts";

const connectedEscrow = TitleEscrow__factory.connect(existingTitleEscrowAddress, signer);
```

#### Transfer of the beneficiary or holder

To transfer the beneficiary and holder within the Title Escrow, use the following methods:

```solidity
function transferBeneficiary(address beneficiaryNominee) external;

function transferHolder(address newHolder) external;

function transferOwners(address beneficiaryNominee, address newHolder) external;

function nominate(address beneficiaryNominee) external;

```

* The `transferBeneficiary` transfers only the beneficiary and `transferHolder` transfers only the holder.

* To transfer both the beneficiary and holder in a single transaction, use `transferOwners`. 

* Transfer of the beneficiary will require a nomination through the `nominate` method.

#### Surrendering or burning a document

To surrender or burn a document use the `surrender` method in the Title Escrow:

```solidity
function surrender() external;

```

The following shows a code example:

```ts
await connectedEscrow.surrender();
```

#### Accessing the current owners

You can retrieve the addresses of the current owners from the `beneficiary`, `holder`, and `nominee` methods.

The following shows a code example:

```ts
const currentBeneficiary = await connectedEscrow.beneficiary();

const currentHolder = await connectedEscrow.holder();

const nominatedBeneficiary = await connectedEscrow.nominee();
```

### Title Escrow signable (experimental)

This is similar to the [Title Escrow](#title-escrow) with the additional support for off-chain nomination and the endorsement of beneficiary nominees: 
* The on-chain nominee will take precedence. 
* The current beneficiary will initiate the transfer transaction with the endorsement.

With this feature, you can save on gas fees for cases where frequent nominations and endorsements occur between the owners.

Currently, this is not the default Title Escrow. To use this version of the Title Escrow, you need to make some changes to the `TitleEscrowFactory.sol` file before deployment by following these steps in the code example:

```solidity
// Step 1. Import the TitleEscrowSignable contract

import "./TitleEscrowSignable.sol";

contract TitleEscrowFactory is ITitleEscrowFactory {
  // ...

  constructor() {
    // Step 2. Look for this line in the constructor

    implementation = address(new TitleEscrow());

    // Step 3. Replace the line in Step 2 with the following line:

    implementation = address(new TitleEscrowSignable());
  }

  // ...
}

```

>**Note:** This is currently an experimental feature. Implementers need to set up a "book-keeping" backend for the signed data.

### Provider & signer

The following code examples shows different ways to get the provider or the signer:

```ts
import { Wallet, providers, getDefaultProvider } from "ethers";

// Providers
const mainnetProvider = getDefaultProvider();
const metamaskProvider = new providers.Web3Provider(web3.currentProvider); // Will change network automatically

// Signer
const signerFromPrivateKey = new Wallet("YOUR-PRIVATE-KEY-HERE", provider);
const signerFromEncryptedJson = Wallet.fromEncryptedJson(json, password);
signerFromEncryptedJson.connect(provider);
const signerFromMnemonic = Wallet.fromMnemonic("MNEMONIC-HERE");
signerFromMnemonic.connect(provider);
```

### Roles and access

Using roles, you can grant the users to access only certain functions. Currently, here are the designated roles for the different key operations.

| Role           | Access                              |
| -------------- | ----------------------------------- |
| `DefaultAdmin` | Able to perform all operations      |
| `MinterRole`   | Able to mint new tokens             |
| `AccepterRole` | Able to accept a surrendered token  |
| `RestorerRole` | Able to restore a surrendered token |


The admin user can grant a trusted user multiple roles to perform different operations.

To grant roles to the users or revoke roles from them, the admin user can call the following functions:

#### Granting a role to a user

Only the default admin or the role admin will be able to call this function:
<!--Flag: according to the table above, there is no "role admin".-->

```ts
import { constants } from "@govtechsg/token-registry";

await tokenRegistry.grantRole(constants.roleHash.MinterRole, "0xbabe");
```

#### Revoking a role from a user

Only the default admin or the role admin will be able to call this function:

```ts
import { constants } from "@govtechsg/token-registry";

await tokenRegistry.revokeRole(constants.roleHash.AccepterRole, "0xbabe");
```

#### Setting a role admin

The standard setup does not change the user's role into a role admin, so that the user does not need to deploy or pay the gas more than what's needed.

For a more complex setup, you can add the admin roles to the designated roles.

Only the default admin will be able to call this function:

```ts
import { constants } from "@govtechsg/token-registry";
const { roleHash } = constants;

await tokenRegistry.setRoleAdmin(roleHash.MinterRole, roleHash.MinterAdminRole);
await tokenRegistry.setRoleAdmin(roleHash.RestorerRole, roleHash.RestorerAdminRole);
await tokenRegistry.setRoleAdmin(roleHash.AccepterRole, roleHash.AccepterAdminRole);
```

# Deployment

With Hardhat, you can manage the contract development environment and deployment. This repository provides a couple of Hardhat tasks to simplify the deployment process.

Starting from V4, the token registry includes an easy and cost-effective way to deploy the contracts and meanwhile keep the options available for advanced users to set up the contracts in a preferable way.

>**Note:** Before deployment, ensure that you have set up your configuration file. See the [Configuration](#configuration) section for more details. The deployer (configured in your `.env` file) will be the default admin.

## Quick start

To quickly deploy contracts with ease, you need to supply your token name and symbol to the command:

```
npx hardhat deploy:token --network mumbai --name "The Great Shipping Co." --symbol GSC
```

The above is the easiest and most cost-effective method to deploy. Currently, this is supported on Ethereum, Sepolia, Polygon, and Polygon Mumbai. The deployed contract will inherit all the standard functionalities from the Token Registry's on-chain contracts. This saves deployment costs and makes the process more convenient for users and integrators.

>**Note:** Remember to supply the`--network` argument with the name of the network on which you want to deploy. See the [Network configuration](#network-configuration) section for more information on the list of network names.

## Advanced usage

For experienced users who want more control over their setup (or have extra fund to spend), a few other options and commands are provided.

>**Important:** Depending on your use case, the gas costs might be higher than the method described in [Quick start](#quick-start).

### Token contract

The following command deploys the token contract.

```
Usage: hardhat [GLOBAL OPTIONS] deploy:token --factory <STRING> --name <STRING> [--standalone] --symbol <STRING> [--verify]

OPTIONS:

  --factory   	Address of Title Escrow factory (Optional)
  --name      	Name of the token
  --standalone	Deploy as standalone token contract
  --symbol    	Symbol of token
  --verify    	Verify on Etherscan

deploy:token: Deploys the TradeTrust token
```

>**Note:** 
> * The `--factory` argument is optional. If not provided, the task will use the default Title Escrow Factory. 
> * You can also reuse a  previously deployed Title Escrow factory by passing its address to the `--factory` argument.

#### Standalone contract

To deploy your own modified version or your own copy of the token contract, use the `--standalone` flag:

```
npx hardhat deploy:token --network mumbai --name "The Great Shipping Co." --symbol GSC --verify --standalone
```

The above command will deploy a _full token contract_ with the name _The Great Shipping Co._ under the symbol _GSC_ on the Polygon _mumbai_ network using the default Title Escrow factory. The contract will also be _verified_ on Etherscan.

#### Using an existing Title Escrow factory

To use an existing or your own version of Title Escrow factory, you can supply its address to the `—factory` argument. This option only works with the `--standalone` flag.

```
npx hardhat deploy:token --network polygon --name "The Great Shipping Co." --symbol GSC --factory 0xfac70
```

The above command will deploy a "cheap" token contract with the name _The Great Shipping Co._ under the symbol _GSC_ on the _Polygon Mainnet_ network using an existing Title Escrow factory at `0xfac70`.

### Title Escrow factory

The command below deploys the Title Escrow factory.

```
Usage: hardhat [GLOBAL OPTIONS] deploy:factory [--verify]

OPTIONS:

  --verify	Verify on Etherscan

deploy:factory: Deploys a new Title Escrow factory
```

#### Deploying a new Title Escrow factory

To deploy your own modified version or your own copy of the Title Escrow factory, use this command:

```
npx hardhat deploy:factory --network rinkeby
```

The above command will deploy a new Title Escrow factory on the _Rinkeby_ network without verifying the contract.
To verify the contract, pass in the `--verify` flag.

## Verification

When verifying the contracts through either the Hardhat's verify plugin or passing the `--verify` flag to the deployment tasks, which internally uses the same plugin, you need to include your correct API key. Depending on the network, add the key into your `.env` configuration. See the [Configuration](#configuration) section for more information.

- For Ethereum, set `ETHERSCAN_API_KEY`
- For Polygon, set `POLYGONSCAN_API_KEY`

## Network configuration

The table below shows the network names that are currently pre-configured:

| Network ID | Name                     | Network      | Type       |
| ---------- | ------------------------ | ------------ | ---------- |
| `1`        | Ethereum Mainnet         | `mainnet`    | Production |
| `11155111` | Ethereum Testnet Sepolia | `sepolia`    | Test       |
| `137`      | Polygon Mainnet          | `polygon`    | Production |
| `80001`    | Polygon Testnet Mumbai   | `mumbai`     | Test       |
| `50`       | XDC Network              | `xdc`        | Production |
| `51`       | XDC Apothem Network      | `xdcapothem` | Test       |


>**Note:** You can configure the existing networks and add others to which you want to deploy in the `hardhat.config.ts` file.

## Configuration

Create a `.env` file and add your own keys into it. You can rename it from the sample file `.env.sample` or copy the
following code into a new file:

```
# Infura
INFURA_APP_ID=

# API Keys
ETHERSCAN_API_KEY=
POLYGONSCAN_API_KEY=
COINMARKETCAP_API_KEY=

# Deployer Private Key
DEPLOYER_PK=

# Mnemonic words
MNEMONIC=
```

Only one of the following is needed: 
* `DEPLOYER_PK` 
* `MNEMONIC`

# Development

This repository's development framework uses [Hardhat](https://hardhat.org/getting-started/).

You can run the tests using `npm run test` and find more development tasks in the `package.json` scripts.

### Scripts

You can install dependencies, test your project, check source code, and build your project with the commands below:

```sh
npm install
npm test
npm run lint
npm run build
```

For more information on the commands below, see the [Deployment](#deployment) section:
```sh
npx hardhat deploy:token
npx hardhat deploy:factory
npx hardhat deploy:token:impl
```

## Subgraph

Check out the [Token Registry Subgraph GitHub repository](https://github.com/Open-Attestation/token-registry-subgraph)
for more information on using and deploying your own subgraphs for the Token Registry contracts.

## Additional information

The contracts have not gone through formal audits. Use them at your own discretion.
