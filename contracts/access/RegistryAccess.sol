// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";

abstract contract RegistryAccess is AccessControlUpgradeable {
  bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
  bytes32 public constant RESTORER_ROLE = keccak256("RESTORER_ROLE");
  bytes32 public constant ACCEPTER_ROLE = keccak256("ACCEPTER_ROLE");

  function __RegistryAccess_init(address admin) internal onlyInitializing {
    require(admin != address(0), "RegistryAccess: Deployer is zero");
    __AccessControl_init();
    _setupRole(DEFAULT_ADMIN_ROLE, admin);
    _setupRole(MINTER_ROLE, admin);
    _setupRole(RESTORER_ROLE, admin);
    _setupRole(ACCEPTER_ROLE, admin);
  }

  modifier onlyAdmin() {
    require(hasRole(DEFAULT_ADMIN_ROLE, _msgSender()), "RegistryAccess: caller does not have the Admin role");
    _;
  }

  modifier onlyMinter() {
    require(hasRole(MINTER_ROLE, _msgSender()), "RegistryAccess: caller does not have the Minter role");
    _;
  }

  modifier onlyRestorer() {
    require(hasRole(RESTORER_ROLE, _msgSender()), "RegistryAccess: caller does not have the Restorer role");
    _;
  }

  modifier onlyAccepter() {
    require(hasRole(ACCEPTER_ROLE, _msgSender()), "RegistryAccess: caller does not have the Accepter role");
    _;
  }

  function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
    return super.supportsInterface(interfaceId);
  }

  function setRoleAdmin(bytes32 role, bytes32 adminRole) public virtual onlyAdmin {
    _setRoleAdmin(role, adminRole);
  }
}
