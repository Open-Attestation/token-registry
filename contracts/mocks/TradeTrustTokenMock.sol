// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "../TradeTrustToken.sol";

contract TradeTrustTokenMock is TradeTrustToken {
  constructor(
    string memory name,
    string memory symbol,
    address escrowFactory
  ) TradeTrustToken(name, symbol, escrowFactory) {}

  function mintInternal(address to, uint256 tokenId) public virtual onlyRole(MINTER_ROLE) returns (bool) {
    _safeMint(to, tokenId);
    return true;
  }

  function burnInternal(uint256 tokenId) public virtual {
    _burn(tokenId);
  }
}
