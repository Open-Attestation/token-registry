// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "../TitleEscrowFactory.sol";

interface ITradeTrustERC721 is IERC721Receiver, IERC721 {
  function titleEscrowFactory() external view returns (ITitleEscrowFactory);

  function destroyToken(uint256 tokenId) external;

  function restoreTitle(uint256 tokenId) external returns (address);

  function mintTitle(
    address beneficiary,
    address holder,
    uint256 tokenId
  ) external returns (address);
}
