// SPDX-License-Identifier: Apache-2.0

pragma solidity ^0.6.10;

import "./ERC721.sol";
import "./TitleEscrow.sol";
import "./ITitleEscrowCreator.sol";

contract TitleEscrowCreator is ITitleEscrowCreator {
  event TitleEscrowDeployed(
    address indexed escrowAddress,
    address indexed tokenRegistry,
    address beneficiary,
    address holder
  );

  function deployNewTitleEscrow(
    address tokenRegistry,
    address beneficiary,
    address holder
  ) external override returns (address) {
    TitleEscrow newEscrow = new TitleEscrow(ERC721(tokenRegistry), beneficiary, holder, address(this));
    emit TitleEscrowDeployed(address(newEscrow), tokenRegistry, beneficiary, holder);
    return address(newEscrow);
  }
}
