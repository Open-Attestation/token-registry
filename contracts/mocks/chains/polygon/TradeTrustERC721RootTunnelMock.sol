// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "../../../chains/polygon/TradeTrustERC721RootTunnel.sol";

contract TradeTrustERC721RootTunnelMock is TradeTrustERC721RootTunnel {
  constructor(address _checkPointManager, address _fxRoot, address _rootToken)
    TradeTrustERC721RootTunnel(_checkPointManager, _fxRoot, _rootToken) {}

  function processMessageFromChildInternal(bytes memory message) public virtual {
    _processMessageFromChild(message);
  }
}
