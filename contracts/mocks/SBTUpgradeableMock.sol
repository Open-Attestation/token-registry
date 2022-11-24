// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "../base/SBTUpgradeable.sol";

contract SBTUpgradeableMock is SBTUpgradeable {
  constructor(string memory name, string memory symbol) initializer {
    __SBT_init(name, symbol);
  }

  function baseURIInternal() public view returns (string memory) {
    return _baseURI();
  }

  function existsInternal(uint256 tokenId) public view returns (bool) {
    return _exists(tokenId);
  }

  function safeMintInternal(address to, uint256 tokenId) public {
    _safeMint(to, tokenId);
  }

  function safeMintWithDataInternal(
    address to,
    uint256 tokenId,
    bytes memory data
  ) public {
    _safeMint(to, tokenId, data);
  }

  function burn(uint256 tokenId) public {
    _burn(tokenId);
  }
}
