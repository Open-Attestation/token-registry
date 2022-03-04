// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "../TradetrustERC721.sol";
import { ERC721Mintable } from "../lib/ERC721.sol";

contract TradeTrustERC721Mock is TradeTrustERC721 {

  constructor(string memory name, string memory symbol) TradeTrustERC721(name, symbol) {}

  /**
 * @dev Function to mint tokens.
   * @param to The address that will receive the minted token.
   * @param tokenId The token id to mint.
   * @return A boolean that indicates if the operation was successful.
   */
  function mint(address to, uint256 tokenId) public onlyMinter returns (bool) {
    _mint(to, tokenId);
    return true;
  }

  /**
   * @dev Function to safely mint tokens.
   * @param to The address that will receive the minted token.
   * @param tokenId The token id to mint.
   * @return A boolean that indicates if the operation was successful.
   */
  function safeMint(address to, uint256 tokenId) public onlyMinter returns (bool) {
    _safeMint(to, tokenId);
    return true;
  }
}
