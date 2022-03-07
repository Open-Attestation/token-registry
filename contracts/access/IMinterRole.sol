// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

interface IMinterRole {
  function isMinter(address account) external view returns (bool);

  function addMinter(address account) external;

  function renounceMinter() external;
}
