// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "../../../chains/polygon/TradeTrustERC721ChildTunnel.sol";

contract TradeTrustERC721ChildTunnelMock is TradeTrustERC721ChildTunnel {
  constructor(address _fxChild, address _childToken) TradeTrustERC721ChildTunnel(_fxChild, _childToken) {}

  function processMessageFromRootInternal(uint256 stateId, address rootMessageSender, bytes calldata data) public virtual {
    _processMessageFromRoot(stateId, rootMessageSender, data);
  }
}
