// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";

contract ERC721ReceiverMock is IERC721Receiver {
  enum Error {
    None,
    RevertWithMessage,
    RevertWithoutMessage,
    Panic
  }

  Error private _error;

  function setErrorType(Error error) external {
    _error = error;
  }

  function onERC721Received(
    address, /* operator */
    address, /* from */
    uint256, /* tokenId */
    bytes memory /* data */
  ) public view override returns (bytes4) {
    if (_error == Error.RevertWithMessage) {
      revert("ERC721ReceiverMock: reverting");
    } else if (_error == Error.RevertWithoutMessage) {
      revert();
    } else if (_error == Error.Panic) {
      uint256 a = uint256(0) / uint256(0);
      a;
    }

    return IERC721Receiver.onERC721Received.selector;
  }
}
