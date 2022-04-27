// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "./TradeTrustERC721Base.sol";

contract TradeTrustERC721Impl is TradeTrustERC721Base {
  address internal _titleEscrowFactory;
  uint256 internal _genesis;

  constructor() initializer {}

  function initialize(bytes memory params, address titleEscrowFactory_) external initializer {
    (string memory name, string memory symbol, address admin) = abi.decode(params, (string, string, address));
    _genesis = block.number;
    _titleEscrowFactory = titleEscrowFactory_;
    __TradeTrustERC721Base_init(name, symbol, admin);
  }

  function titleEscrowFactory() public view override returns (ITitleEscrowFactory) {
    return ITitleEscrowFactory(_titleEscrowFactory);
  }

  function genesis() public view override returns (uint256) {
    return _genesis;
  }
}
