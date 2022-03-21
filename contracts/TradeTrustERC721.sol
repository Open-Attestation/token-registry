// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "./TradeTrustERC721Base.sol";

contract TradeTrustERC721 is TradeTrustERC721Base {
  constructor(
    string memory name,
    string memory symbol,
    address _titleEscrowFactory
  ) {
    __TradeTrustERC721Base_init(name, symbol, _titleEscrowFactory, _msgSender());
  }
}
