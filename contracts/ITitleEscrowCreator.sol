// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

/// @title Title Escrow for Transferable Records
interface ITitleEscrowCreator {
  /// @notice Deploys an instance of a title escrow
  function deployNewTitleEscrow(
    address tokenRegistry,
    address beneficiary,
    address holder
  ) external returns (address);
}
