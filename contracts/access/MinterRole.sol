// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/access/AccessControlEnumerable.sol";

interface IMinterRole {
  function isMinter(address account) external view returns (bool);

  function addMinter(address account) external;

  function renounceMinter() external;
}

abstract contract MinterRole is Context, IMinterRole, AccessControlEnumerable {
  bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

  event MinterAdded(address indexed account);
  event MinterRemoved(address indexed account);

  constructor() {
    _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
    _setupRole(MINTER_ROLE, _msgSender());
  }

  function supportsInterface(bytes4 interfaceId) public view virtual override(AccessControlEnumerable) returns (bool) {
    return interfaceId == type(IMinterRole).interfaceId || AccessControlEnumerable.supportsInterface(interfaceId);
  }

  modifier onlyMinter() {
    require(isMinter(_msgSender()), "MinterRole: caller does not have the Minter role");
    _;
  }

  function isMinter(address account) public view override returns (bool) {
    return hasRole(MINTER_ROLE, account);
  }

  function addMinter(address account) public override {
    _addMinter(account);
  }

  function renounceMinter() public override {
    this.renounceRole(MINTER_ROLE, _msgSender());
  }

  function _addMinter(address account) internal {
    this.grantRole(MINTER_ROLE, account);
    emit MinterAdded(account);
  }

  function _removeMinter(address account) internal {
    this.revokeRole(MINTER_ROLE, account);
    emit MinterRemoved(account);
  }
}
