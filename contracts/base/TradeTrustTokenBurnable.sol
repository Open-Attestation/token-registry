// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "./TokenURIStorage.sol";
import "../interfaces/ITradeTrustTokenBurnable.sol";

abstract contract TradeTrustTokenBurnable is TokenURIStorage, ITradeTrustTokenBurnable {
  address internal constant BURN_ADDRESS = 0x000000000000000000000000000000000000dEaD;

  function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
    return interfaceId == type(ITradeTrustTokenBurnable).interfaceId || super.supportsInterface(interfaceId);
  }

  function burn(uint256 tokenId) external virtual override whenNotPaused onlyRole(ACCEPTER_ROLE) {
    _burnTitle(tokenId);
  }

  function _burnTitle(uint256 tokenId) internal virtual whenNotPaused onlyRole(ACCEPTER_ROLE) {
    address titleEscrow = titleEscrowFactory().getAddress(address(this), tokenId);
    ITitleEscrow(titleEscrow).shred();

    // Burning token to 0xdead instead to show a differentiate state as address(0) is used for unminted tokens
    _registryTransferTo(BURN_ADDRESS, tokenId);

    if (bytes(_tokenURIs[tokenId]).length != 0) {
      delete _tokenURIs[tokenId];
    }
  }

  function _beforeTokenTransfer(
    address from,
    address to,
    uint256 tokenId
  ) internal virtual override {
    if (to == BURN_ADDRESS && ownerOf(tokenId) != address(this)) {
      revert TokenNotSurrendered();
    }
    super._beforeTokenTransfer(from, to, tokenId);
  }
}
