// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "./token/SBTUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "./access/RegistryAccess.sol";
import "./interfaces/ITradeTrustERC721.sol";
import "./interfaces/ITitleEscrow.sol";
import "./interfaces/ITitleEscrowFactory.sol";
import "./interfaces/TradeTrustTokenErrors.sol";

abstract contract TradeTrustERC721Base is
  RegistryAccess,
  PausableUpgradeable,
SBTUpgradeable,
  TradeTrustTokenErrors,
  ITradeTrustERC721
{
  address internal constant BURN_ADDRESS = 0x000000000000000000000000000000000000dEaD;

  function __TradeTrustERC721Base_init(
    string memory name,
    string memory symbol,
    address admin
  ) internal onlyInitializing {
    __SBT_init(name, symbol);
    __Pausable_init();
    __RegistryAccess_init(admin);
  }

  function supportsInterface(bytes4 interfaceId)
    public
    view
    virtual
    override(SBTUpgradeable, IERC165Upgradeable, RegistryAccess)
    returns (bool)
  {
    return
      interfaceId == type(ITradeTrustERC721).interfaceId ||
      SBTUpgradeable.supportsInterface(interfaceId) ||
      RegistryAccess.supportsInterface(interfaceId);
  }

  function onERC721Received(
    address, /* _operator */
    address, /* _from */
    uint256, /* _tokenId */
    bytes memory /* _data */
  ) public pure override returns (bytes4) {
    return IERC721Receiver.onERC721Received.selector;
  }

  function burn(uint256 tokenId) external override whenNotPaused onlyRole(ACCEPTER_ROLE) {
    address titleEscrow = titleEscrowFactory().getAddress(address(this), tokenId);
    ITitleEscrow(titleEscrow).shred();

    // Burning token to 0xdead instead to show a differentiate state as address(0) is used for unminted tokens
    _registryTransferTo(BURN_ADDRESS, tokenId);
  }

  function mint(
    address beneficiary,
    address holder,
    uint256 tokenId
  ) public virtual override whenNotPaused onlyRole(MINTER_ROLE) returns (address) {
    if (_exists(tokenId)) {
      revert TokenExists();
    }

    return _mintTitle(beneficiary, holder, tokenId);
  }

  function restore(uint256 tokenId) external override whenNotPaused onlyRole(RESTORER_ROLE) returns (address) {
    if (!_exists(tokenId)) {
      revert InvalidTokenId();
    }
    if (ownerOf(tokenId) != address(this)) {
      revert TokenNotSurrendered();
    }

    address titleEscrow = titleEscrowFactory().getAddress(address(this), tokenId);
    _registryTransferTo(titleEscrow, tokenId);

    return titleEscrow;
  }

  function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
    _pause();
  }

  function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
    _unpause();
  }

  function _beforeTokenTransfer(
    address from,
    address to,
    uint256 tokenId
  ) internal virtual override whenNotPaused {
    if (to == BURN_ADDRESS && ownerOf(tokenId) != address(this)) {
      revert TokenNotSurrendered();
    }
    super._beforeTokenTransfer(from, to, tokenId);
  }

  function _mintTitle(
    address beneficiary,
    address holder,
    uint256 tokenId
  ) internal virtual returns (address) {
    address newTitleEscrow = titleEscrowFactory().create(tokenId);
    _safeMint(newTitleEscrow, tokenId, abi.encode(beneficiary, holder));

    return newTitleEscrow;
  }

  function _registryTransferTo(address to, uint256 tokenId) internal {
    this.transferFrom(address(this), to, tokenId);
  }

  function genesis() public view virtual override returns (uint256);

  function titleEscrowFactory() public view virtual override returns (ITitleEscrowFactory);
}
