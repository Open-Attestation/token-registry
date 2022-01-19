// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "../../common/TradeTrustERC721Mintable.sol";
import "../../access/ChainManagerRole.sol";

contract TradeTrustERC721RootMintable is ChainManagerRole, TradeTrustERC721Mintable {
  constructor(string memory name, string memory symbol) TradeTrustERC721Mintable(name, symbol) {}

  function mintTitle(
    address beneficiary,
    address holder,
    uint256 tokenId
  ) public virtual override onlyChainManager returns (address) {
    return _mintTitle(beneficiary, holder, tokenId);
  }

  function mint(address to, uint256 tokenId) public virtual override onlyChainManager returns (bool) {
    _safeMint(to, tokenId);
    return true;
  }

  function supportsInterface(bytes4 interfaceId) public view virtual override(TradeTrustERC721Mintable, ChainManagerRole) returns (bool) {
    return super.supportsInterface(interfaceId) || ChainManagerRole.supportsInterface(interfaceId);
  }
}
