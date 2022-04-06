// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/proxy/ClonesUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

contract ImplDeployer is OwnableUpgradeable, UUPSUpgradeable {
  event Deployment(address indexed deployed, address indexed implementation, bytes params);

  mapping(address => bool) public implementations;

  constructor() initializer {}

  function initialize() external initializer {
    __Ownable_init();
  }

  function _authorizeUpgrade(address) internal override onlyOwner {}

  function deploy(address implementation, bytes memory params) external returns (address) {
    require(implementations[implementation], "ImplDeployer: Not whitelisted");

    address deployed = ClonesUpgradeable.clone(implementation);
    bytes memory payload = abi.encodeWithSignature("initialize(bytes)", params);
    (bool success, ) = address(deployed).call(payload);
    require(success, "ImplDeployer: Init fail");

    emit Deployment(deployed, implementation, params);
    return deployed;
  }

  function addImpl(address implementation) external onlyOwner {
    require(!implementations[implementation], "ImplDeployer: Already added");
    implementations[implementation] = true;
  }

  function removeImpl(address implementation) external onlyOwner {
    delete implementations[implementation];
  }
}
