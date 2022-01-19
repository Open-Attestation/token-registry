// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "../../access/ChainManagerRole.sol";

contract ChainManagerRoleMock is ChainManagerRole {
  constructor() ChainManagerRole() {
    _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
  }

  function testModifierFunction() public view virtual onlyChainManager returns (bool) {
    return true;
  }
}
