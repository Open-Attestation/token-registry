// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "../interfaces/ITitleEscrow.sol";
import "../lib/Initializable.sol";
import { Context } from "../lib/ERC721.sol";

abstract contract HasHolderInitializable is Context, IHasHolder, Initializable {
  address public override holder;

  function __initialize__holder(address _holder) internal {
    holder = _holder;
    emit HolderChanged(address(0), _holder);
  }

  modifier onlyHolder() {
    require(isHolder(), "HasHolder: only the holder may invoke this function");
    _;
  }

  function isHolder() internal view returns (bool) {
    return _msgSender() == holder;
  }

  function _changeHolder(address newHolder) internal {
    require(newHolder != address(0), "HasHolder: new holder is the zero address");
    emit HolderChanged(holder, newHolder);
    holder = newHolder;
  }
}
