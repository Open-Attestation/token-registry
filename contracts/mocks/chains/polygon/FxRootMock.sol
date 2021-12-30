// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import { FxRoot } from "@maticnetwork/fx-portal/contracts/FxRoot.sol";

contract FxRootMock is FxRoot {
  constructor(address _stateSender) FxRoot(_stateSender) {}
}
