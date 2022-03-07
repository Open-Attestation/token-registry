// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "./access/RegistryAccess.sol";
import "./interfaces/ITitleEscrow.sol";
import "./interfaces/ITradeTrustERC721.sol";
import "./interfaces/ITitleEscrowFactory.sol";

contract TradeTrustERC721 is ITradeTrustERC721, RegistryAccess, Pausable, ERC721 {
  using Address for address;

  event TokenBurnt(uint256 indexed tokenId, address indexed titleEscrow, address indexed burner);
  event TokenReceived(address indexed operator, address indexed from, uint256 indexed tokenId, bytes data);
  event TokenRestored(uint256 indexed tokenId, address indexed newOwner);

  address internal constant BURN_ADDRESS = 0x000000000000000000000000000000000000dEaD;

  uint256 public genesisBlock;
  ITitleEscrowFactory public override titleEscrowFactory;

  constructor(
    string memory name,
    string memory symbol,
    address _titleEscrowFactory
  ) ERC721(name, symbol) {
    genesisBlock = block.number;
    titleEscrowFactory = ITitleEscrowFactory(_titleEscrowFactory);
  }

  function supportsInterface(bytes4 interfaceId)
    public
    view
    virtual
    override(ERC721, IERC165, RegistryAccess)
    returns (bool)
  {
    return
      interfaceId == type(ITradeTrustERC721).interfaceId ||
      ERC721.supportsInterface(interfaceId) ||
      RegistryAccess.supportsInterface(interfaceId);
  }

  function onERC721Received(
    address, /* _operator */
    address, /* _from */
    uint256, /* _tokenId */
    bytes memory /* _data */
  ) public pure override returns (bytes4) {
    //    address expectedOperator = titleEscrowFactory.getAddress(address(this), _tokenId);
    //    require(_operator == expectedOperator, "TitleEscrow: Unexpected operator");
    // TODO: Why event emit this event??
    //    emit TokenReceived(_operator, _from, _tokenId, _data);
    return IERC721Receiver.onERC721Received.selector;
  }

  /**
   * @dev Permanently burns a token and does not allow the same ID to be minted again.
   * This call is meant for a minter to accept a surrendered token. Token will be transferred to 0xdead address.
   *
   * Requirements:
   *
   * - the caller must be a `minter`.
   * - the token is surrendered
   *
   * Emits a {TokenBurnt} event.
   *
   * @param tokenId Token ID to be burnt
   */
  function destroyToken(uint256 tokenId) external override whenNotPaused onlyAccepter {
    address titleEscrow = titleEscrowFactory.getAddress(address(this), tokenId);

    ITitleEscrow(titleEscrow).shred();

    // Burning token to 0xdead instead to show a differentiate state as address(0) is used for unminted tokens
    _registryTransferTo(BURN_ADDRESS, tokenId);

    emit TokenBurnt(tokenId, titleEscrow, _msgSender());
  }

  function mintTitle(
    address beneficiary,
    address holder,
    uint256 tokenId
  ) public virtual override whenNotPaused onlyMinter returns (address) {
    require(!_exists(tokenId), "TokenRegistry: Token already exists");

    return _mintTitle(beneficiary, holder, tokenId);
  }

  function restoreTitle(uint256 tokenId) external override whenNotPaused onlyRestorer returns (address) {
    require(_exists(tokenId), "TokenRegistry: Token does not exist");
    require(isSurrendered(tokenId), "TokenRegistry: Token is not surrendered");
    require(ownerOf(tokenId) != BURN_ADDRESS, "TokenRegistry: Token is already burnt");

    address titleEscrow = titleEscrowFactory.getAddress(address(this), tokenId);
    //    require(escrowAddress.isContract(), "TokenRegistry: Escrow contract does not exist");

    _registryTransferTo(titleEscrow, tokenId);

    emit TokenRestored(tokenId, titleEscrow);

    return titleEscrow;
  }

  function isSurrendered(uint256 tokenId) public view returns (bool) {
    require(_exists(tokenId), "TokenRegistry: Token does not exist");
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
      require(isSurrendered(tokenId), "TokenRegistry: Token has not been surrendered");
    }
    super._beforeTokenTransfer(from, to, tokenId);
  }

  function _mintTitle(
    address beneficiary,
    address holder,
    uint256 tokenId
  ) internal virtual returns (address) {
    address newTitleEscrow = titleEscrowFactory.create(beneficiary, holder, tokenId);
    _safeMint(newTitleEscrow, tokenId);

    return newTitleEscrow;
  }

  function _registryTransferTo(address to, uint256 tokenId) internal {
    this.safeTransferFrom(address(this), to, tokenId, "");
  }
}
