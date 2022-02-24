// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "./TitleEscrowCloneable.sol";
import "./TitleEscrowCloner.sol";
import "./interfaces/ITitleEscrowCreator.sol";
import "./interfaces/ITitleEscrow.sol";
import "./interfaces/ITradeTrustERC721.sol";
import {ERC721Mintable, IERC721Receiver, Address, ERC721, MinterRole} from "./lib/ERC721.sol";

abstract contract TradeTrustERC721Base is MinterRole, TitleEscrowCloner, IERC721Receiver, ERC721 {
  using Address for address;

  event TokenBurnt(uint256 indexed tokenId);
  event TokenReceived(address indexed operator, address indexed from, uint256 indexed tokenId, bytes data);

  address internal constant BURN_ADDRESS = 0x000000000000000000000000000000000000dEaD;

  // Mapping from token ID to previously surrendered title escrow address
  mapping(uint256 => address) internal _surrenderedOwners;

  constructor(string memory name, string memory symbol) ERC721(name, symbol) {
    return;
  }

  function supportsInterface(bytes4 interfaceId) public view virtual override(ERC721, MinterRole) returns (bool) {
    return
      interfaceId == type(ITitleEscrowCreator).interfaceId ||
      interfaceId == type(ITradeTrustERC721).interfaceId ||
      ERC721.supportsInterface(interfaceId) ||
      MinterRole.supportsInterface(interfaceId);
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
  function destroyToken(uint256 tokenId) external onlyRole(DEFAULT_ADMIN_ROLE) {
    emit TokenBurnt(tokenId);

    // Burning token to 0xdead instead to show a differentiate state as address(0) is used for unminted tokens
    _registrySafeTransformFrom(ownerOf(tokenId), BURN_ADDRESS, tokenId);

    // Remove the last surrendered token owner
    delete _surrenderedOwners[tokenId];
  }

  function restoreTitle(uint256 tokenId) external onlyRole(DEFAULT_ADMIN_ROLE) returns (address) {
    address previousOwner = _surrenderedOwners[tokenId];
    require(_exists(tokenId), "TokenRegistry: Token does not exist");
    require(isSurrendered(tokenId), "TokenRegistry: Token is not surrendered");

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
    address newTitleEscrow = _deployNewTitleEscrow(address(this), beneficiary, holder);
    _registrySafeTransformFrom(address(this), newTitleEscrow, tokenId);

    return ownerOf(tokenId);
  }

  function isSurrendered(uint256 tokenId) public view returns (bool) {
    if (_exists(tokenId)) {
      return ownerOf(tokenId) == address(this) && _surrenderedOwners[tokenId] != address(0);
    }
    return false;
  }

  function _beforeTokenTransfer(
    address from,
    address to,
    uint256 tokenId
  ) internal virtual override {
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
    address newTitleEscrow = _deployNewTitleEscrow(address(this), beneficiary, holder);
    _safeMint(newTitleEscrow, tokenId);

    return newTitleEscrow;
  }

  function _registrySafeTransformFrom(
    address from,
    address to,
    uint256 tokenId
  ) internal {
    _registrySafeTransformFrom(from, to, tokenId, "");
  }

  function _registrySafeTransformFrom(
    address from,
    address to,
    uint256 tokenId,
    bytes memory data
  ) internal {
    this.safeTransferFrom(from, to, tokenId, data);
  }
}