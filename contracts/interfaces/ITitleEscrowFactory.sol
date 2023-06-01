// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

interface ITitleEscrowFactory {
  event TitleEscrowCreated(address indexed titleEscrow, address indexed tokenRegistry, uint256 indexed tokenId);

  function implementation() external view returns (address);

  /**
   * @notice Creates a new clone of the TitleEscrow contract and initializes it with the sender's address and the provided token ID.
   * @dev The function will revert if it is called by an EOA.
   * @param tokenId The ID of the token.
   * @return The address of the newly created TitleEscrow contract.
   */
  function create(uint256 tokenId) external returns (address);

  /**
   * @notice Returns the address of a TitleEscrow contract that would be created with the provided token registry address and token ID.
   * @param tokenRegistry The address of the token registry.
   * @param tokenId The ID of the token.
   * @return The address of the TitleEscrow contract.
   */
  function getAddress(address tokenRegistry, uint256 tokenId) external view returns (address);
}
