// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "./TitleEscrowCloneableMock.sol";
import "../TitleEscrowCloner.sol";

contract TitleEscrowFactoryMock is TitleEscrowFactory {
  constructor() {
    implementation = address(new TitleEscrowCloneableMock());
  }
}
