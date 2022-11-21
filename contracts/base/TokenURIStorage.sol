// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "./TradeTrustSBT.sol";

abstract contract TokenURIStorage is TradeTrustSBT {
  string private _baseStorageURI;

  using StringsUpgradeable for uint256;

  // Optional mapping for token URIs
  mapping(uint256 => string) internal _tokenURIs;

  function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
    require(_exists(tokenId), "ERC721URIStorage: URI query for nonexistent token");

    string memory _tokenURI = _tokenURIs[tokenId];
    string memory base = _baseURI();

    // If there is no base URI, return the token URI.
    if (bytes(base).length == 0) {
      return _tokenURI;
    }
    // If both are set, concatenate the baseURI and tokenURI (via abi.encodePacked).
    if (bytes(_tokenURI).length > 0) {
      return string(abi.encodePacked(base, _tokenURI));
    }

    return super.tokenURI(tokenId);
  }

  function _baseURI() internal view virtual override returns (string memory) {
    return _baseStorageURI;
  }

  function setBaseURI(string memory baseURI) external onlyRole(DEFAULT_ADMIN_ROLE) {
    _setBaseURI(baseURI);
  }

  function _setBaseURI(string memory baseURI) internal virtual {
    _baseStorageURI = baseURI;
  }

  function _setTokenURI(uint256 tokenId, string memory _tokenURI) internal virtual {
    require(_exists(tokenId), "ERC721URIStorage: URI set of nonexistent token");
    _tokenURIs[tokenId] = _tokenURI;
  }
}
