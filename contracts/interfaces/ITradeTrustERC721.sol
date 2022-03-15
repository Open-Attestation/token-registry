// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";

interface ITradeTrustERC721 is IERC721Receiver {
  function destroyToken(
    uint256 _tokenId
  ) external;

  function restoreTitle(
    address beneficiary,
    address holder,
    uint256 _tokenId
  ) external returns (address);

  function mintTitle(
    address beneficiary,
    address holder,
    uint256 _tokenId
  ) external returns (address);
}
