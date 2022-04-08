// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "../TitleEscrowCloneable.sol";

contract TitleEscrowCloneableMock is TitleEscrowCloneable {
  function transferToInternal(address newOwner) public isHoldingToken onlyHolder {
    _transferTo(newOwner);
  }
}
