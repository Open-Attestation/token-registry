// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

interface IHasHolder {
  /// @notice Public getter to access the holder of the Title, who is equivalent to holdership of a physical Title
  function holder() external returns (address);

  event HolderChanged(address indexed previousHolder, address indexed newHolder);
}
