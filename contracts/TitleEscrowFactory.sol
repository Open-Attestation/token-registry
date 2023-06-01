// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/proxy/Clones.sol";
import "./TitleEscrow.sol";
import "./interfaces/ITitleEscrowFactory.sol";
import "./interfaces/TitleEscrowFactoryErrors.sol";

/**
 * @title TitleEscrowFactory
 */
contract TitleEscrowFactory is ITitleEscrowFactory, TitleEscrowFactoryErrors {
  address public override implementation;

  /**
   * @notice Creates a new TitleEscrowFactory contract.
   * @dev Sets `implementation` with the address of a newly created TitleEscrow contract.
   */
  constructor() {
    implementation = address(new TitleEscrow());
  }

  /**
   * @dev See {ITitleEscrowFactory-create}.
   */
  function create(uint256 tokenId) external override returns (address) {
    if (tx.origin == msg.sender) {
      revert CreateCallerNotContract();
    }
    bytes32 salt = keccak256(abi.encodePacked(msg.sender, tokenId));
    address titleEscrow = Clones.cloneDeterministic(implementation, salt);
    TitleEscrow(titleEscrow).initialize(msg.sender, tokenId);

    emit TitleEscrowCreated(titleEscrow, msg.sender, tokenId);

    return titleEscrow;
  }

  /**
   * @dev See {ITitleEscrowFactory-getAddress}.
   */
  function getAddress(address tokenRegistry, uint256 tokenId) external view override returns (address) {
    return Clones.predictDeterministicAddress(implementation, keccak256(abi.encodePacked(tokenRegistry, tokenId)));
  }
}
