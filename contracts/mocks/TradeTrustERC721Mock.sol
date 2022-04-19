// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "../TradeTrustERC721.sol";

contract TradeTrustERC721Mock is TradeTrustERC721 {
  constructor(
    string memory name,
    string memory symbol,
    address escrowFactory
  ) TradeTrustERC721(name, symbol, escrowFactory) {}

  function mintInternal(address to, uint256 tokenId) public virtual onlyRole(MINTER_ROLE) returns (bool) {
    _safeMint(to, tokenId);
    return true;
  }

  function burnInternal(uint256 tokenId) public virtual {
    _burn(tokenId);
  }
}
