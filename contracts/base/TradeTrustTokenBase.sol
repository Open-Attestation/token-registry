// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "./TradeTrustTokenBurnable.sol";
import "./TradeTrustTokenMintable.sol";
import "./TradeTrustTokenRestorable.sol";
import "../interfaces/ITradeTrustToken.sol";

abstract contract TradeTrustTokenBase is TradeTrustTokenRestorable, TradeTrustTokenMintable, TradeTrustTokenBurnable {
  function __TradeTrustTokenBase_init(
    string memory name,
    string memory symbol,
    address admin
  ) internal onlyInitializing {
    __TradeTrustSBT_init(name, symbol, admin);
  }

  function _baseURI() internal view virtual override(TokenURIStorage, SBTUpgradeable) returns (string memory) {
    return super._baseURI();
  }

  function _beforeTokenTransfer(
    address from,
    address to,
    uint256 tokenId
  ) internal virtual override(TradeTrustTokenBurnable, SBTUpgradeable) whenNotPaused {
    super._beforeTokenTransfer(from, to, tokenId);
  }

  function tokenURI(uint256 tokenId)
    public
    view
    virtual
    override(TokenURIStorage, SBTUpgradeable)
    returns (string memory)
  {
    return super.tokenURI(tokenId);
  }

  function supportsInterface(bytes4 interfaceId)
    public
    view
    virtual
    override(TradeTrustTokenRestorable, TradeTrustTokenMintable, TradeTrustTokenBurnable)
    returns (bool)
  {
    return
      interfaceId == type(ITradeTrustToken).interfaceId ||
      TradeTrustTokenRestorable.supportsInterface(interfaceId) ||
      TradeTrustTokenMintable.supportsInterface(interfaceId) ||
      TradeTrustTokenBurnable.supportsInterface(interfaceId);
  }
}
