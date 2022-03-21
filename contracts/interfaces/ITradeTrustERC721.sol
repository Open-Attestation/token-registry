// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721ReceiverUpgradeable.sol";
import "./ITitleEscrowFactory.sol";

interface ITradeTrustERC721 is IERC721ReceiverUpgradeable, IERC721Upgradeable {
  function titleEscrowFactory() external view returns (ITitleEscrowFactory);

  function destroyToken(uint256 tokenId) external;

  function restoreTitle(uint256 tokenId) external returns (address);

  function mintTitle(
    address beneficiary,
    address holder,
    uint256 tokenId
  ) external returns (address);
}
