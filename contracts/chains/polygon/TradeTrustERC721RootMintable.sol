// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "../../common/TradeTrustERC721Mintable.sol";

contract TradeTrustERC721RootMintable is TradeTrustERC721Mintable {
  constructor(string memory name, string memory symbol) TradeTrustERC721Mintable(name, symbol) {}

  function mintTitle(
    address beneficiary,
    address holder,
    uint256 tokenId
  ) public virtual override onlyRole(CHAIN_MANAGER_ROLE) returns (address) {
    return _mintTitle(beneficiary, holder, tokenId);
  }

  function mint(address to, uint256 tokenId) public virtual override onlyRole(CHAIN_MANAGER_ROLE) returns (bool) {
    _safeMint(to, tokenId);
    return true;
  }
}
