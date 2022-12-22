// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "./TradeTrustSBT.sol";
import "./RegistryAccess.sol";

abstract contract TradeTrustTokenBaseURI is TradeTrustSBT, RegistryAccess {
  string private _baseStorageURI;

  function supportsInterface(bytes4 interfaceId)
    public
    view
    virtual
    override(TradeTrustSBT, RegistryAccess)
    returns (bool)
  {
    return super.supportsInterface(interfaceId);
  }

  function setBaseURI(string memory baseURI) external onlyRole(DEFAULT_ADMIN_ROLE) {
    _setBaseURI(baseURI);
  }

  function _setBaseURI(string memory baseURI) internal virtual {
    _baseStorageURI = baseURI;
  }

  function _baseURI() internal view virtual override returns (string memory) {
    return _baseStorageURI;
  }
}
