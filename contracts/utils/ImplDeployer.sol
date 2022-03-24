// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/proxy/Clones.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ImplDeployer is Ownable {
  event Deployment(address indexed deployed, address indexed implementation, bytes params);

  mapping(address => bool) public implementations;

  function deploy(address implementation, bytes memory params) external returns (address) {
    require(implementations[implementation], "ImplDeployer: Not whitelisted");

    address deployed = Clones.clone(implementation);
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
