// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

interface ITradeTrustTokenRestorable {
  /**
   * @dev Restore a surrendered token.
   * @param tokenId The ID of the token to restore.
   * @return The address of the TitleEscrow contract.
   */
  function restore(uint256 tokenId) external returns (address);
}
