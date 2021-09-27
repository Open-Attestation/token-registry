pragma solidity ^0.5.16;

/// @title Title Escrow for Transferable Records
interface ITitleEscrowCreator {
  /// @notice Deploys an instance of a title escrow
  function deployNewTitleEscrow(address tokenRegistry, address beneficiary, address holder) external returns (address);
}
