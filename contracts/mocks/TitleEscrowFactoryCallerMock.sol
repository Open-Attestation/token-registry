// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "../interfaces/ITitleEscrowFactory.sol";

contract TitleEscrowFactoryCallerMock {
  function callCreate(address titleEscrowFactory, uint256 tokenId) public {
    ITitleEscrowFactory(titleEscrowFactory).create(tokenId);
  }
}
