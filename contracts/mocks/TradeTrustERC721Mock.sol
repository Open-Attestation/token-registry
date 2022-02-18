// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "../TradeTrustERC721.sol";

contract TradeTrustERC721Mock is TradeTrustERC721 {

  constructor(string memory name, string memory symbol) TradeTrustERC721(name, symbol) {}

  function surrenderedOwnersInternal(
    uint256 tokenId
  ) public view returns (address) {
    return _surrenderedOwners[tokenId];
  }

  function burnInternal(uint256 tokenId) public virtual {
    _burn(tokenId);
  }
}
