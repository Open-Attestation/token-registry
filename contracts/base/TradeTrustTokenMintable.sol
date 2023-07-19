// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "./TradeTrustSBT.sol";
import "./RegistryAccess.sol";
import "../interfaces/ITradeTrustTokenMintable.sol";

/**
 * @title TradeTrustTokenMintable
 * @dev This contract defines the mint functionality for the TradeTrustToken.
 */
abstract contract TradeTrustTokenMintable is TradeTrustSBT, RegistryAccess, ITradeTrustTokenMintable {
  /**
   * @dev See {ERC165Upgradeable-supportsInterface}.
   */
  function supportsInterface(
    bytes4 interfaceId
  ) public view virtual override(TradeTrustSBT, RegistryAccess) returns (bool) {
    return interfaceId == type(ITradeTrustTokenMintable).interfaceId || super.supportsInterface(interfaceId);
  }

  /**
   * @dev See {ITradeTrustTokenMintable-mint}.
   */
  function mint(
    address beneficiary,
    address holder,
    uint256 tokenId
  ) external virtual override whenNotPaused onlyRole(MINTER_ROLE) returns (address) {
    return _mintTitle(beneficiary, holder, tokenId);
  }

  /**
   * @dev Internal function to mint a TradeTrust token.
   * @param beneficiary The beneficiary of the token.
   * @param holder The holder of the token.
   * @param tokenId The ID of the token to mint.
   * @return The address of the corresponding TitleEscrow.
   */
  function _mintTitle(address beneficiary, address holder, uint256 tokenId) internal virtual returns (address) {
    if (_exists(tokenId)) {
      revert TokenExists();
    }

    address newTitleEscrow = titleEscrowFactory().create(tokenId);
    _safeMint(newTitleEscrow, tokenId, abi.encode(beneficiary, holder));

    return newTitleEscrow;
  }
}
