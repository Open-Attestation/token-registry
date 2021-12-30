// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

interface IChildToken {
  function deposit(address depositor, uint tokenId, bytes memory depositData) external;

  function withdraw(address withdrawer, uint tokenId, bytes memory withdrawData) external;
}
