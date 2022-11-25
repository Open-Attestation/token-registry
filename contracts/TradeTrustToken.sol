// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "./base/TradeTrustTokenBase.sol";

contract TradeTrustToken is TradeTrustTokenBase {
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
    address admin
  ) internal initializer {
    __TradeTrustTokenBase_init(name, symbol, admin);
  }

  function titleEscrowFactory() public view override returns (ITitleEscrowFactory) {
    return ITitleEscrowFactory(_titleEscrowFactory);
  }

  function genesis() public view override returns (uint256) {
    return _genesis;
  }
}
