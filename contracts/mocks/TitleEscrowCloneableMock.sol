// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "../TitleEscrowCloneable.sol";

contract TitleEscrowCloneableMock is TitleEscrowCloneable  {
  function transferTo(address newOwner) public isHoldingToken onlyHolder allowTransferOwner(newOwner) {
    _transferTo(newOwner);
  }
}
