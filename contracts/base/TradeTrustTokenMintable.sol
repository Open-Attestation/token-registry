// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "./TokenURIStorage.sol";
import "../interfaces/ITradeTrustTokenMintable.sol";

abstract contract TradeTrustTokenMintable is TokenURIStorage, ITradeTrustTokenMintable {
  function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
    return interfaceId == type(ITradeTrustTokenMintable).interfaceId || super.supportsInterface(interfaceId);
  }

  function mint(
    address beneficiary,
    address holder,
    uint256 tokenId
  ) external virtual override whenNotPaused onlyRole(MINTER_ROLE) returns (address) {
    return _mintTitle(beneficiary, holder, tokenId, "");
  }

  function mintWithUri(
    address beneficiary,
    address holder,
    uint256 tokenId,
    string memory tokenUri
  ) external virtual override whenNotPaused onlyRole(MINTER_ROLE) returns (address) {
    return _mintTitle(beneficiary, holder, tokenId, tokenUri);
  }

  function _mintTitle(
    address beneficiary,
    address holder,
    uint256 tokenId,
    string memory tokenUri
  ) internal virtual returns (address) {
    if (_exists(tokenId)) {
      revert TokenExists();
    }

    address newTitleEscrow = titleEscrowFactory().create(tokenId);
    _safeMint(newTitleEscrow, tokenId, abi.encode(beneficiary, holder));

    _setTokenURI(tokenId, tokenUri);

    return newTitleEscrow;
  }
}
