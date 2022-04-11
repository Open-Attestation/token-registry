// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

interface ITitleEscrowFactory {
  event TitleEscrowDeployed(
    address indexed escrowAddress,
    address indexed tokenRegistry,
    address beneficiary,
    address holder
  );

  function implementation() external view returns (address);

  function create(
    address tokenRegistry,
    address beneficiary,
    address holder
  ) external returns (address);
}
