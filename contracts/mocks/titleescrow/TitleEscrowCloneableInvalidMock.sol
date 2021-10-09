// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "../../TitleEscrowCloneable.sol";

contract TitleEscrowCloneableInvalidMock {

  ERC721 public tokenRegistry;
  uint256 public _tokenId;

  function initialize(
    address _tokenRegistry,
    address _beneficiary,
    address _holder,
    address _titleEscrowFactoryAddress
  ) public {
    tokenRegistry = ERC721(_tokenRegistry);
  }

  function onERC721Received(
    address operator,
    address from,
    uint256 tokenId,
    bytes calldata data
  ) external returns (bytes4) {
    _tokenId = tokenId;
    return bytes4(keccak256("onERC721Received(address,address,uint256,bytes)"));
  }

  function surrender() external {
    tokenRegistry.safeTransferFrom(address(this), address(tokenRegistry), _tokenId);
  }
}
