// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "./ERC721.sol";
import "./ITitleEscrowCreator.sol";
import "./TitleEscrowCloneable.sol";

contract TitleEscrowCloner is ITitleEscrowCreator {
  address public  titleEscrowImplementation;

  constructor() {
    titleEscrowImplementation = address(new TitleEscrowCloneable());
  }

  function _deployNewTitleEscrow(
    address tokenRegistry,
    address beneficiary,
    address holder
  ) internal returns (address) {
    address clone = Clones.clone(titleEscrowImplementation);
    TitleEscrowCloneable(clone).initialize(tokenRegistry, beneficiary, holder, address(this));
    emit TitleEscrowDeployed(address(clone), tokenRegistry, beneficiary, holder);
    return address(clone);
  }

  function deployNewTitleEscrow(
    address tokenRegistry,
    address beneficiary,
    address holder
  ) external override returns (address) {
    return _deployNewTitleEscrow(tokenRegistry, beneficiary, holder);
  }
}

interface ITradeTrustERC721 is IERC721Receiver {
  // TODO: rename these to the appropriate names
  function acceptSurrender(
    uint256 _tokenId
  ) external;

  function sendToNewTitleEscrow(
    address beneficiary,
    address holder,
    uint256 _tokenId
  ) external;

  function restoreTitle(
    address beneficiary,
    address holder,
    uint256 _tokenId
  ) external returns (address);

  function mintTitle(
    address beneficiary,
    address holder,
    uint256 _tokenId
  ) external returns (address);

  function transferTitle(
    address to, uint256 _tokenId
  ) external;
}

contract TradeTrustERC721 is TitleEscrowCloner, ERC721Mintable, IERC721Receiver {
  event TokenBurnt(uint256 indexed tokenId);
  event TokenReceived(address indexed operator, address indexed from, uint256 indexed tokenId, bytes data);

  bytes4 public tempInterfaceId;

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

  function _burnToken(uint256 _tokenId) internal onlyMinter {
    // Burning token to 0xdead instead to show a differentiate state as address(0) is used for unminted tokens
    emit TokenBurnt(_tokenId);
    this.safeTransferFrom(ownerOf(_tokenId), 0x000000000000000000000000000000000000dEaD, _tokenId, "");
  }

  function acceptSurrender(uint256 tokenId) external onlyMinter {
    require(ownerOf(tokenId) == address(this), "TokenRegistry: Token has not been surrendered");
    _burnToken(tokenId);
  }

  // TODO: modify this to mint a new token if it doesn't exist, and send a token if it is owned by address(this)
  // rationale for this is that we currently also have a need for a method that performs the action for
  // minting to a new title escrow directly, which has a large overlap with this function
  // make sure to write tests for this and check for access controls
  // Question: Should we combine the 2 actions into a single function or split them into their own functions instead?
  function sendToNewTitleEscrow(
    address beneficiary,
    address holder,
    uint256 _tokenId
  ) public onlyMinter {
    if (_exists(_tokenId)) {
      require(ownerOf(_tokenId) == address(this), "TokenRegistry: Token is not owned by registry");

      address newTitleEscrow = _deployNewTitleEscrow(address(this), beneficiary, holder);
      this.safeTransferFrom(address(this), newTitleEscrow, _tokenId, "");
    } else {
      address newTitleEscrow = _deployNewTitleEscrow(address(this), beneficiary, holder);
      _safeMint(newTitleEscrow, _tokenId);
    }
  }

  function restoreTitle(
    address beneficiary,
    address holder,
    uint256 tokenId
  ) external onlyMinter returns (address) {
    require(_exists(tokenId), "TokenRegistry: Token does not exist for transfer");
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
    require(!_exists(tokenId), "Cannot mint title: Token already exists");

    address newTitleEscrow = _deployNewTitleEscrow(address(this), beneficiary, holder);
    _safeMint(newTitleEscrow, tokenId);

    return newTitleEscrow;
  }

  function transferTitle(
    address to,
    uint256 _tokenId
  ) public onlyMinter {
    require(ownerOf(_tokenId) == address(this), "TokenRegistry: Token not owned by token registry");
    _registrySafeTransformFrom(address(this), to, _tokenId);
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
