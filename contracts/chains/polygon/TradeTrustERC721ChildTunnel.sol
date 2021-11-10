// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import {FxBaseChildTunnel} from "../../lib/tunnels/FxBaseChildTunnel.sol";
import {IERC721Receiver, IERC721} from "../../lib/ERC721.sol";
import "./IChildToken.sol";

contract TradeTrustERC721ChildTunnel is Ownable, IERC721Receiver, FxBaseChildTunnel {
  event ChildTokenDeposit(
    address indexed rootToken,
    address indexed childToken,
    address indexed depositor,
    uint256 tokenId
  );
  event ChildTokenWithdrawal(address indexed childToken, address indexed withdrawer, uint256 tokenId);

  address public childToken;

  constructor(address _fxChild, address _childToken) FxBaseChildTunnel(_fxChild) {
    require(_childToken != address(0), "TradeTrustERC721ChildTunnel: Child token is zero address");

    childToken = _childToken;
  }

  function onERC721Received(
    address, /* operator */
    address, /* from */
    uint256, /* tokenId */
    bytes calldata /* data */
  ) external pure override returns (bytes4) {
    return this.onERC721Received.selector;
  }

  function setFxRootTunnel(address _fxRootTunnel) public override onlyOwner {
    super.setFxRootTunnel(_fxRootTunnel);
  }

  function _processMessageFromRoot(
    uint256, /* stateId */
    address sender,
    bytes memory data
  ) internal override validateSender(sender) {
    (address rootToken, address depositor, uint256 tokenId, bytes memory depositData) = abi.decode(
      data,
      (address, address, uint256, bytes)
    );

    IChildToken(childToken).deposit(depositor, tokenId, "");

    emit ChildTokenDeposit(rootToken, childToken, depositor, tokenId);
  }

  function withdraw(uint256 tokenId, bytes calldata data) external {
    require(msg.sender == IERC721(childToken).ownerOf(tokenId), "TradeTrustERC721ChildTunnel: Caller is not an owner");

    IChildToken(childToken).withdraw(msg.sender, tokenId, "");

    _sendMessageToRoot(abi.encode(address(childToken), msg.sender, tokenId, data));

    emit ChildTokenWithdrawal(childToken, msg.sender, tokenId);
  }
}
