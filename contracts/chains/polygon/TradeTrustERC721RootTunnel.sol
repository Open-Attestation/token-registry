// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import {FxBaseRootTunnel} from "@maticnetwork/fx-portal/contracts/tunnel/FxBaseRootTunnel.sol";
import {IERC721Receiver, IERC721, IERC165} from "../../lib/ERC721.sol";
import "../../interfaces/ITradeTrustERC721Mintable.sol";

contract TradeTrustERC721RootTunnel is FxBaseRootTunnel, IERC721Receiver {
  event RootTokenDeposit(address indexed rootToken, address indexed depositor, uint256 tokenId);
  event RootTokenWithdrawal(address indexed rootToken, address indexed childToken, address indexed withdrawer, uint256 tokenId);

  address public rootToken;

  // TODO: Lock setFxRootTunnel to only minter
  constructor(
    address _checkPointManager,
    address _fxRoot,
    address _rootToken
  ) FxBaseRootTunnel(_checkPointManager, _fxRoot) {
    require(_rootToken != address(0), "TradeTrustERC721RootTunnel: Root token is zero address");
    rootToken = _rootToken;
  }

  function onERC721Received(
    address, /* operator */
    address, /* from */
    uint256, /* tokenId */
    bytes calldata /* data */
  ) external pure override returns (bytes4) {
    return this.onERC721Received.selector;
  }

  function deposit(uint256 tokenId, bytes memory data) public virtual {
    ITradeTrustERC721Mintable(rootToken).safeTransferFrom(msg.sender, address(this), tokenId, data);

    bytes memory message = abi.encode(rootToken, msg.sender, tokenId, data);
    _sendMessageToChild(message);
    emit RootTokenDeposit(rootToken, msg.sender, tokenId);
  }

  function _processMessageFromChild(bytes memory data) internal virtual override {
    (address childToken, address withdrawer, uint256 tokenId, bytes memory withdrawalData) = abi.decode(
      data,
      (address, address, uint256, bytes)
    );

    if (IERC165(rootToken).supportsInterface(type(ITradeTrustERC721Mintable).interfaceId)) {
      ITradeTrustERC721Mintable token = ITradeTrustERC721Mintable(rootToken);
      if (token.exists(tokenId)) {
        token.safeTransferFrom(address(this), withdrawer, tokenId, withdrawalData);
      } else {
        token.mintTitle(withdrawer, withdrawer, tokenId);
      }
    } else {
      IERC721(rootToken).safeTransferFrom(address(this), withdrawer, tokenId, withdrawalData);
    }

    emit RootTokenWithdrawal(rootToken, childToken, withdrawer, tokenId);
  }
}
