// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "./TradeTrustERC721Base.sol";

contract TradeTrustERC721 is TradeTrustERC721Base {
  address internal immutable _titleEscrowFactory;
  uint256 internal immutable _genesis;

  constructor(
    string memory name,
    string memory symbol,
    address titleEscrowFactory_
  ) {
    _genesis = block.number;
    _titleEscrowFactory = titleEscrowFactory_;
    initialize(name, symbol, _msgSender());
  }

  function initialize(
    string memory name,
    string memory symbol,
    address deployer
  ) internal initializer {
    __TradeTrustERC721Base_init(name, symbol, deployer);
  }

  function titleEscrowFactory() public view override returns (ITitleEscrowFactory) {
    return ITitleEscrowFactory(_titleEscrowFactory);
  }

  function genesis() public view override returns (uint256) {
    return _genesis;
  }
}
