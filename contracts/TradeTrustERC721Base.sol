// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "./access/RegistryAccess.sol";
import "./interfaces/ITradeTrustERC721.sol";
import "./interfaces/ITitleEscrow.sol";
import "./interfaces/ITitleEscrowFactory.sol";

abstract contract TradeTrustERC721Base is ITradeTrustERC721, RegistryAccess, PausableUpgradeable, ERC721Upgradeable {
  address internal constant BURN_ADDRESS = 0x000000000000000000000000000000000000dEaD;

  function __TradeTrustERC721Base_init(
    string memory name,
    string memory symbol,
    address admin
  ) internal onlyInitializing {
    __ERC721_init(name, symbol);
    __Pausable_init();
    __RegistryAccess_init(admin);
  }

  function supportsInterface(bytes4 interfaceId)
    public
    view
    virtual
    override(ERC721Upgradeable, IERC165Upgradeable, RegistryAccess)
    returns (bool)
  {
    return
      interfaceId == type(ITradeTrustERC721).interfaceId ||
      ERC721Upgradeable.supportsInterface(interfaceId) ||
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

  function burn(uint256 tokenId) external override whenNotPaused onlyAccepter {
    address titleEscrow = titleEscrowFactory().getAddress(address(this), tokenId);
    ITitleEscrow(titleEscrow).shred();

    // Burning token to 0xdead instead to show a differentiate state as address(0) is used for unminted tokens
    _registryTransferTo(BURN_ADDRESS, tokenId);
  }

  function mint(
    address beneficiary,
    address holder,
    uint256 tokenId
  ) public virtual override whenNotPaused onlyMinter returns (address) {
    require(!_exists(tokenId), "Registry: Token exists");

    return _mintTitle(beneficiary, holder, tokenId);
  }

  function restore(uint256 tokenId) external override whenNotPaused onlyRestorer returns (address) {
    require(_exists(tokenId), "Registry: Invalid token");
    require(isSurrendered(tokenId), "Registry: Not surrendered");
    require(ownerOf(tokenId) != BURN_ADDRESS, "Registry: Token burnt");

    address titleEscrow = titleEscrowFactory().getAddress(address(this), tokenId);
    _registryTransferTo(titleEscrow, tokenId);

    return titleEscrow;
  }

  function isSurrendered(uint256 tokenId) public view returns (bool) {
    require(_exists(tokenId), "Registry: Invalid token");
    address owner = ownerOf(tokenId);
    return owner == address(this) || owner == BURN_ADDRESS;
  }

  function pause() external onlyAdmin {
    _pause();
  }

  function unpause() external onlyAdmin {
    _unpause();
  }

  function _beforeTokenTransfer(
    address from,
    address to,
    uint256 tokenId
  ) internal virtual override whenNotPaused {
    if (to == BURN_ADDRESS) {
      require(isSurrendered(tokenId), "Registry: Token unsurrendered");
    }
    super._beforeTokenTransfer(from, to, tokenId);
  }

  function _mintTitle(
    address beneficiary,
    address holder,
    uint256 tokenId
  ) internal virtual returns (address) {
    address newTitleEscrow = titleEscrowFactory().create(beneficiary, holder, tokenId);
    _safeMint(newTitleEscrow, tokenId);

    return newTitleEscrow;
  }

  function _registryTransferTo(address to, uint256 tokenId) internal {
    this.safeTransferFrom(address(this), to, tokenId, "");
  }

  function genesis() public view virtual returns (uint256);

  function titleEscrowFactory() public view virtual returns (ITitleEscrowFactory);
}
