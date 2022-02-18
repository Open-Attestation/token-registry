// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "./TradeTrustERC721Base.sol";
import "./interfaces/ITradeTrustERC721Mintable.sol";

abstract contract TradeTrustERC721Mintable is TradeTrustERC721Base, ITradeTrustERC721Mintable {
  constructor(string memory name, string memory symbol) TradeTrustERC721Base(name, symbol) {}

  function mintTitle(
    address beneficiary,
    address holder,
    uint256 tokenId
  ) public virtual override onlyMinter returns (address) {
    require(!_exists(tokenId), "TradeTrustERC721Mintable: Token already exists");

    return _mintTitle(beneficiary, holder, tokenId);
  }

  function mint(address to, uint256 tokenId) public virtual override onlyMinter returns (bool) {
    _safeMint(to, tokenId);
    return true;
  }

  function exists(uint256 tokenId) external view override returns (bool) {
    return _exists(tokenId);
  }

  function supportsInterface(bytes4 interfaceId) public view virtual override(TradeTrustERC721Base, IERC165) returns (bool) {
    return super.supportsInterface(interfaceId) || interfaceId == type(ITradeTrustERC721Mintable).interfaceId;
  }
}
