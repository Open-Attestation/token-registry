// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "../../common/TradeTrustERC721Mintable.sol";

contract TradeTrustERC721 is TradeTrustERC721Mintable {
  constructor(string memory name, string memory symbol) TradeTrustERC721Mintable(name, symbol) {}
}
