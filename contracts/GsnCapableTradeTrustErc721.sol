// SPDX-License-Identifier: Apache-2.0

pragma solidity ^0.6.10;

import "@opengsn/gsn/contracts/BaseRelayRecipient.sol";
import "@opengsn/gsn/contracts/interfaces/IKnowForwarderAddress.sol";

import "./ERC721.sol";

contract GsnCapableTradeTrustERC721 is TradeTrustERC721, BaseRelayRecipient, IKnowForwarderAddress {
  address public paymaster;
  string public override versionRecipient = "2.0.0";

  bytes4 private constant _INTERFACE_ID_GSN_CAPABLE = 0x3ef85900;

  event PaymasterSet(address indexed target);

  constructor(
    string memory _name,
    string memory symbol,
    address _forwarder,
    address _paymaster
  ) public TradeTrustERC721(_name, symbol) {
    _registerInterface(_INTERFACE_ID_GSN_CAPABLE);
    setPaymaster(_paymaster);
    setTrustedForwarder(_forwarder);
  }

  function _msgSender() internal view override(Context, BaseRelayRecipient) returns (address payable) {
    return BaseRelayRecipient._msgSender();
  }

  function _msgData() internal view override(Context, BaseRelayRecipient) returns (bytes memory) {
    return BaseRelayRecipient._msgData();
  }

  function setPaymaster(address target) public onlyMinter {
    paymaster = target;
    emit PaymasterSet(target);
  }

  function getTrustedForwarder() external view override returns (address) {
    return trustedForwarder;
  }

  function setTrustedForwarder(address _forwarder) public onlyMinter {
    trustedForwarder = _forwarder;
  }
}

contract CalculateGsnCapableTradeTrustERC721Selector {
  function calculateSelector() public pure returns (bytes4) {
    GsnCapableTradeTrustERC721 i;
    return
      i.setPaymaster.selector ^
      i.getTrustedForwarder.selector ^
      i.setTrustedForwarder.selector;
  }
}
