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

  event TokenBurnt(uint256 indexed tokenId);
  event TokenReceived(address indexed operator, address indexed from, uint256 indexed tokenId, bytes data);
  event TokenRestored(uint256 indexed tokenId, address indexed newOwner);

  address internal constant BURN_ADDRESS = 0x000000000000000000000000000000000000dEaD;

  ITitleEscrowFactory public override titleEscrowFactory;

  // Mapping from token ID to previously surrendered title escrow address
  mapping(uint256 => address) internal _surrenderedOwners;

  constructor(
    string memory name,
    string memory symbol,
    address _titleEscrowFactory
  ) ERC721(name, symbol) {
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
    address _operator,
    address _from,
    uint256 _tokenId,
    bytes memory _data
  ) public override returns (bytes4) {
    emit TokenReceived(_operator, _from, _tokenId, _data);
    return this.onERC721Received.selector;
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
    emit TokenBurnt(tokenId);

    // Burning token to 0xdead instead to show a differentiate state as address(0) is used for unminted tokens
    _registrySafeTransformFrom(ownerOf(tokenId), BURN_ADDRESS, tokenId);

    // Remove the last surrendered token owner
    delete _surrenderedOwners[tokenId];
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

    address previousOwner = _surrenderedOwners[tokenId];

    // Remove the last surrendered token owner
    delete _surrenderedOwners[tokenId];

    address beneficiary = address(0);
    address holder = address(0);

    if (previousOwner.isContract()) {
      try IERC165(previousOwner).supportsInterface(type(ITitleEscrow).interfaceId) returns (bool retval) {
        require(retval, "TokenRegistry: Previous owner is an unsupported Title Escrow");

        ITitleEscrow titleEscrow = ITitleEscrow(previousOwner);
        beneficiary = titleEscrow.beneficiary();
        holder = titleEscrow.holder();
      } catch (bytes memory reason) {
        if (reason.length == 0) {
          revert("TokenRegistry: Previous owner is not a TitleEscrow implementer");
        } else {
          assembly {
            revert(add(32, reason), mload(reason))
          }
        }
      }
    } else {
      beneficiary = previousOwner;
      holder = previousOwner;
    }
    address newTitleEscrow = titleEscrowFactory.create(address(this), beneficiary, holder);
    _registrySafeTransformFrom(address(this), newTitleEscrow, tokenId);

    emit TokenRestored(tokenId, newTitleEscrow);

    return ownerOf(tokenId);
  }

  function isSurrendered(uint256 tokenId) public view returns (bool) {
    if (_exists(tokenId)) {
      address owner = ownerOf(tokenId);
      return (owner == address(this) && _surrenderedOwners[tokenId] != address(0)) || owner == BURN_ADDRESS;
    }
    return false;
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
      require(isSurrendered(tokenId), "TokenRegistry: Token has not been surrendered for burning");
    } else {
      require(!isSurrendered(tokenId), "TokenRegistry: Token has already been surrendered");
      if (to == address(this)) {
        // Surrendering, hence, store the current owner
        _surrenderedOwners[tokenId] = from;
      }
    }
    super._beforeTokenTransfer(from, to, tokenId);
  }

  function _mintTitle(
    address beneficiary,
    address holder,
    uint256 tokenId
  ) internal virtual returns (address) {
    address newTitleEscrow = titleEscrowFactory.create(address(this), beneficiary, holder);
    _safeMint(newTitleEscrow, tokenId);

    return newTitleEscrow;
  }

  function _registrySafeTransformFrom(
    address from,
    address to,
    uint256 tokenId
  ) internal {
    this.safeTransferFrom(from, to, tokenId, "");
  }
}
