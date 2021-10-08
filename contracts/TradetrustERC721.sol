// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "./TitleEscrowCloneable.sol";
import "./TitleEscrowCloner.sol";
import "./interfaces/ITitleEscrowCreator.sol";
import "./interfaces/ITitleEscrow.sol";
import "./interfaces/ITradeTrustERC721.sol";
import { ERC721Mintable, IERC721Receiver, Address } from "./lib/ERC721.sol";

contract TradeTrustERC721 is TitleEscrowCloner, ERC721Mintable, IERC721Receiver {
  using Address for address;

  event TokenBurnt(uint256 indexed tokenId);
  event TokenReceived(address indexed operator, address indexed from, uint256 indexed tokenId, bytes data);

  // Mapping from token ID to previously surrendered title escrow address
  mapping(uint => address) internal _surrenderedOwners;

  constructor(string memory name, string memory symbol) ERC721Mintable(name, symbol) {return;}

  function supportsInterface(bytes4 interfaceId) public view virtual override(ERC721Mintable) returns (bool) {
    return
    interfaceId == type(ITitleEscrowCreator).interfaceId ||
    interfaceId == type(ITradeTrustERC721).interfaceId ||
    ERC721Mintable.supportsInterface(interfaceId);
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

  function destroyToken(uint256 tokenId) external onlyMinter {
    require(ownerOf(tokenId) == address(this), "TokenRegistry: Token has not been surrendered");

    emit TokenBurnt(tokenId);

    // Burning token to 0xdead instead to show a differentiate state as address(0) is used for unminted tokens
    _registrySafeTransformFrom(ownerOf(tokenId), 0x000000000000000000000000000000000000dEaD, tokenId);

    // Remove the last surrendered token owner
    delete _surrenderedOwners[tokenId];
  }

  function restoreTitle(
    uint256 tokenId
  ) external onlyMinter returns (address) {
    address previousOwner = _surrenderedOwners[tokenId];
    require(_exists(tokenId), "TokenRegistry: Token does not exist");
    require(ownerOf(tokenId) == address(this) && previousOwner != address(0), "TokenRegistry: Token is not surrendered");

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
          revert("TokenRegistry: Receiving address is not a TitleEscrow implementer");
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

  function mintTitle(
    address beneficiary,
    address holder,
    uint256 tokenId
  ) external onlyMinter returns (address) {
    require(!_exists(tokenId), "TokenRegistry: Token already exists");

    address newTitleEscrow = _deployNewTitleEscrow(address(this), beneficiary, holder);
    _safeMint(newTitleEscrow, tokenId);

    return newTitleEscrow;
  }

  function isSurrendered(
    uint256 tokenId
  ) public view returns (bool) {
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
    if (to == 0x000000000000000000000000000000000000dEaD) {
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
