// // SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

interface IChainManagerRole {
  function isChainManager(address account) external view returns (bool);

  function addChainManager(address account) external;

  function revokeChainManger(address account) external;
}
