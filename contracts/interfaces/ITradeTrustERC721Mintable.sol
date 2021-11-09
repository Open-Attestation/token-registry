// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import {IERC721} from "../lib/ERC721.sol";

interface ITradeTrustERC721Mintable is IERC721 {
  // TODO: Streamline the mint functions
  function mintTitle(
    address beneficiary,
    address holder,
    uint256 tokenId
  ) external returns (address);

  function mint(address to, uint256 tokenId) external returns (bool);

  function exists(uint256 tokenId) external view returns (bool);
}
