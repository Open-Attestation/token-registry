// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/proxy/Clones.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./TradeTrustERC721Impl.sol";

contract RegistryDeployer is Ownable {
  event RegistryCreated(address indexed registry, address indexed implementation, bytes params);

  mapping(address => bool) public implementations;

  function create(address implementation, bytes memory params) external returns (address) {
    require(implementations[implementation], "RegistryDeployer: Not whitelisted");

    address registry = Clones.clone(implementation);
    TradeTrustERC721Impl(registry).initialize(params);

    emit RegistryCreated(registry, implementation, params);

    return registry;
  }

  function addImplementation(address implementation) external onlyOwner {
    require(!implementations[implementation], "RegistryDeployer: Already added");
    implementations[implementation] = true;
  }

  function removeImplementation(address implementation) external onlyOwner {
    delete implementations[implementation];
  }
}
