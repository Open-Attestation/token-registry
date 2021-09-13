// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "./ERC721.sol";
import "./TitleEscrow.sol";
import "./ITitleEscrowCreator.sol";
import "./TitleEscrowCloneable.sol";

contract TitleEscrowCreator is ITitleEscrowCreator {
  function deployNewTitleEscrow(
    address tokenRegistry,
    address beneficiary,
    address holder
  ) external override returns (address) {
    TitleEscrow newEscrow = new TitleEscrow(tokenRegistry, beneficiary, holder, address(this));
    emit TitleEscrowDeployed(address(newEscrow), tokenRegistry, beneficiary, holder);
    return address(newEscrow);
  }
}

contract TitleEscrowCloner is ITitleEscrowCreator {
  address public  titleEscrowImplementation;

  constructor() { 
    titleEscrowImplementation = address(new TitleEscrowCloneable());
  }


  function deployNewTitleEscrow(
    address tokenRegistry,
    address beneficiary,
    address holder
  ) external override returns (address) {
    address clone = Clones.clone(titleEscrowImplementation);
    TitleEscrowCloneable(clone).initialize(tokenRegistry, beneficiary, holder, address(this));
    emit TitleEscrowDeployed(address(clone), tokenRegistry, beneficiary, holder);
    return address(clone);
    }
}

interface ITradeTrustERC721 is IERC721Receiver {
  // TODO: rename these to the appropriate names
  function destroyToken(uint256 _tokenId) external;

  function sendToNewTitleEscrow(
    address beneficiary,
    address holder,
    uint256 _tokenId
  ) external;

  function sendToken(address to, uint256 _tokenId) external;
}

contract TradeTrustERC721 is TitleEscrowCloner, ERC721Mintable, IERC721Receiver {
  event TokenBurnt(uint256 indexed tokenId);
  event TokenReceived(address indexed operator, address indexed from, uint256 indexed tokenId, bytes data);

  constructor(string memory name, string memory symbol) ERC721Mintable(name, symbol) { return; }

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

  function destroyToken(uint256 _tokenId) public onlyMinter {
    require(ownerOf(_tokenId) == address(this), "Cannot destroy token: Token not owned by token registry");
    // Burning token to 0xdead instead to show a differentiate state as address(0) is used for unminted tokens
    emit TokenBurnt(_tokenId);
    this.safeTransferFrom(ownerOf(_tokenId), 0x000000000000000000000000000000000000dEaD, _tokenId, "");
  }

  // TODO: modify this to mint a new token if it doesn't exist, and send a token if it is owned by address(this)
  // rationale for this is that we currently also have a need for a method that performs the action for
  // minting to a new title escrow directly, which has a large overlap with this function
  // make sure to write tests for this and check for access controls
  function sendToNewTitleEscrow(
    address beneficiary,
    address holder,
    uint256 _tokenId
  ) public onlyMinter {
    address newTitleEscrow = this.deployNewTitleEscrow(address(this), beneficiary, holder);
    this.safeTransferFrom(address(this), newTitleEscrow, _tokenId, "");
  }

  function sendToken(address to, uint256 _tokenId) public onlyMinter {
    require(ownerOf(_tokenId) == address(this), "Cannot send token: Token not owned by token registry");
    this.safeTransferFrom(ownerOf(_tokenId), to, _tokenId, "");
  }
}
