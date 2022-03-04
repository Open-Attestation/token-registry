// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "./TitleEscrowCloneable.sol";
import "./TitleEscrowCloner.sol";
import "./interfaces/ITitleEscrowCreator.sol";
import "./interfaces/ITitleEscrow.sol";
import "./interfaces/ITradeTrustERC721.sol";
import { ERC721, IERC721Receiver, MinterRole } from "./lib/ERC721.sol";

contract TradeTrustERC721 is ERC721, MinterRole, TitleEscrowCloner, IERC721Receiver {
  event TokenBurnt(uint256 indexed tokenId);
  event TokenReceived(address indexed operator, address indexed from, uint256 indexed tokenId, bytes data);

  constructor(string memory name, string memory symbol) ERC721(name, symbol) {return;}

  function supportsInterface(bytes4 interfaceId) public view virtual override(ERC721, MinterRole) returns (bool) {
    return
    interfaceId == type(ITitleEscrowCreator).interfaceId ||
    interfaceId == type(ITradeTrustERC721).interfaceId ||
    MinterRole.supportsInterface(interfaceId) ||
    ERC721.supportsInterface(interfaceId);
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

    // Burning token to 0xdead instead to show a differentiate state as address(0) is used for unminted tokens
    emit TokenBurnt(tokenId);
    _registrySafeTransformFrom(ownerOf(tokenId), 0x000000000000000000000000000000000000dEaD, tokenId);
  }

  function restoreTitle(
    address beneficiary,
    address holder,
    uint256 tokenId
  ) external onlyMinter returns (address) {
    require(_exists(tokenId), "TokenRegistry: Token does not exist");
    require(ownerOf(tokenId) == address(this), "TokenRegistry: Token is not owned by registry");

    address newTitleEscrow = _deployNewTitleEscrow(address(this), beneficiary, holder);
    _registrySafeTransformFrom(address(this), newTitleEscrow, tokenId);

    return newTitleEscrow;
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
