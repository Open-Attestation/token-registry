// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "../../../chains/polygon/TradeTrustERC721ChildMintable.sol";

contract TradeTrustERC721ChildMintableMock is TradeTrustERC721ChildMintable {
  constructor(string memory name, string memory symbol) TradeTrustERC721ChildMintable(name, symbol) {}

  function withdrawnTokensInternal(uint256 tokenId) public view returns (bool) {
    return _withdrawnTokens[tokenId];
  }
}
