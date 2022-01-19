//// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import {Context, AccessControlEnumerable} from "../lib/ERC721.sol";
import "./IChainManagerRole.sol";

abstract contract ChainManagerRole is Context, IChainManagerRole, AccessControlEnumerable {
  bytes32 public constant CHAIN_MANAGER_ROLE = keccak256("CHAIN_MANAGER_ROLE");

  event ChainManagerAdded(address indexed account);
  event ChainManagerRemoved(address indexed account);

  constructor() {}

  function supportsInterface(bytes4 interfaceId) public view virtual override(AccessControlEnumerable) returns (bool) {
    return interfaceId == type(IChainManagerRole).interfaceId || AccessControlEnumerable.supportsInterface(interfaceId);
  }

  modifier onlyChainManager() {
    require(isChainManager(_msgSender()), "ChainManagerRole: caller is not a chain manager");
    _;
  }

  function isChainManager(address account) public view override returns (bool) {
    return hasRole(CHAIN_MANAGER_ROLE, account);
  }

  function addChainManager(address account) public override {
    _addChainManager(account);
  }

  function revokeChainManger(address account) public override {
    _removeChainManager(account);
  }

  function _addChainManager(address account) internal {
    grantRole(CHAIN_MANAGER_ROLE, account);
    emit ChainManagerAdded(account);
  }

  function _removeChainManager(address account) internal {
    revokeRole(CHAIN_MANAGER_ROLE, account);
    emit ChainManagerRemoved(account);
  }
}
