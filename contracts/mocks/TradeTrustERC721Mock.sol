// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "../TradetrustERC721.sol";

contract TradeTrustERC721Mock is TradeTrustERC721 {

  constructor(string memory name, string memory symbol) TradeTrustERC721(name, symbol) {}

  function getSurrenderedOwner(
    uint256 tokenId
  ) public view returns (address) {
    return _surrenderedOwners[tokenId];
  }
}
