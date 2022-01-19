// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "../TitleEscrowCloner.sol";
import "./TitleEscrowCloneableMock.sol";

contract TitleEscrowClonerMock is TitleEscrowCloner {

  constructor() {
    titleEscrowImplementation = address(new TitleEscrowCloneableMock());
  }
}
