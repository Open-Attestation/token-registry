// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/proxy/ClonesUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

contract TDocDeployer is OwnableUpgradeable, UUPSUpgradeable {
  event Deployment(
    address indexed deployed,
    address indexed implementation,
    address indexed titleEscrowFactory,
    bytes params
  );

  // mapping: implementation => title escrow factory
  mapping(address => address) public implementations;

  constructor() initializer {}

  function initialize() external initializer {
    __Ownable_init();
  }

  function _authorizeUpgrade(address) internal view override onlyOwner {}

  function deploy(address implementation, bytes memory params) external returns (address) {
    address titleEscrowFactory = implementations[implementation];
    require(titleEscrowFactory != address(0), "TDocDeployer: Not whitelisted");

    address deployed = ClonesUpgradeable.clone(implementation);
    bytes memory payload = abi.encodeWithSignature("initialize(bytes,address)", params, titleEscrowFactory);
    (bool success, ) = address(deployed).call(payload);
    require(success, "TDocDeployer: Init fail");

    emit Deployment(deployed, implementation, titleEscrowFactory, params);
    return deployed;
  }

  function addImplementation(address implementation, address titleEscrowFactory) external onlyOwner {
    require(implementations[implementation] == address(0), "TDocDeployer: Already added");
    implementations[implementation] = titleEscrowFactory;
  }

  function removeImplementation(address implementation) external onlyOwner {
    delete implementations[implementation];
  }
}
