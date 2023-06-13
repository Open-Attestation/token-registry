// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "./TradeTrustSBT.sol";
import "./RegistryAccess.sol";

/**
 * @title TradeTrustTokenBaseURI
 * @dev This contract defines the base URI for the TradeTrustToken.
 */
abstract contract TradeTrustTokenBaseURI is TradeTrustSBT, RegistryAccess {
  /**
   * @dev Internal variable to store the base URI.
   */
  string private _baseStorageURI;

  /**
   * @dev See {ERC165Upgradeable-supportsInterface}.
   * @inheritdoc TradeTrustSBT
   */
  function supportsInterface(
    bytes4 interfaceId
  ) public view virtual override(TradeTrustSBT, RegistryAccess) returns (bool) {
    return super.supportsInterface(interfaceId);
  }

  /**
   * @dev Set the base URI.
   * @param baseURI The base URI to set.
   */
  function setBaseURI(string memory baseURI) external onlyRole(DEFAULT_ADMIN_ROLE) {
    _setBaseURI(baseURI);
  }

  function _setBaseURI(string memory baseURI) internal virtual {
    _baseStorageURI = baseURI;
  }

  /**
   * @dev See {SBTUpgradeable-_baseURI}.
   */
  function _baseURI() internal view virtual override returns (string memory) {
    return _baseStorageURI;
  }
}
