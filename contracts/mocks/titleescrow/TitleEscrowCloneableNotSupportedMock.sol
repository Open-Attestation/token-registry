// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "../../TitleEscrowCloneable.sol";

contract TitleEscrowCloneableNotSupportedMock is TitleEscrowCloneable {
  function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
    return false;
  }
}
