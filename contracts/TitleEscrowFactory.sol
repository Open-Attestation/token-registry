// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/proxy/Clones.sol";
import "./TitleEscrow.sol";
import "./interfaces/ITitleEscrowFactory.sol";

contract TitleEscrowFactory is ITitleEscrowFactory {
  address public override implementation;

  constructor() {
    implementation = address(new TitleEscrow());
    TitleEscrow(implementation).initialize(address(0), address(0), address(0), 0x00);
  }

  function create(
    address beneficiary,
    address holder,
    uint256 tokenId
  ) external override returns (address) {
    bytes32 salt = keccak256(abi.encodePacked(msg.sender, tokenId));
    address titleEscrow = Clones.cloneDeterministic(implementation, salt);
    TitleEscrow(titleEscrow).initialize(msg.sender, beneficiary, holder, tokenId);

    emit TitleEscrowCreated(titleEscrow, msg.sender, tokenId, beneficiary, holder);

    return titleEscrow;
  }

  function getAddress(address tokenRegistry, uint256 tokenId) external view override returns (address) {
    return Clones.predictDeterministicAddress(implementation, keccak256(abi.encodePacked(tokenRegistry, tokenId)));
  }
}
