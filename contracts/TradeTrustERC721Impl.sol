// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "./TradeTrustERC721Base.sol";

contract TradeTrustERC721Impl is TradeTrustERC721Base {
  function initialize(bytes memory params) public {
    (string memory name, string memory symbol, address titleEscrowFactory, address deployer) = abi.decode(
      params,
      (string, string, address, address)
    );
    __TradeTrustERC721Base_init(name, symbol, titleEscrowFactory, deployer);
  }
}
