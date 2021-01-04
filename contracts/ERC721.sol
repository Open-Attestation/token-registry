// SPDX-License-Identifier: Apache-2.0

pragma solidity ^0.6.10;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";

// File: contracts/access/Roles.sol

/*

 * @title Roles
 * @dev Library for managing addresses assigned to a Role.
 */
library Roles {
  struct Role {
    mapping(address => bool) bearer;
  }

  /**
     * @dev Give an account access to this role.
     */
  function add(Role storage role, address account) internal {
    require(!has(role, account), "Roles: account already has role");
    role.bearer[account] = true;
  }

  /**
     * @dev Remove an account's access to this role.
     */
  function remove(Role storage role, address account) internal {
    require(has(role, account), "Roles: account does not have role");
    role.bearer[account] = false;
  }

  /**
     * @dev Check if an account has this role.
     * @return bool
     */
  function has(Role storage role, address account) internal view returns (bool) {
    require(account != address(0), "Roles: account is the zero address");
    return role.bearer[account];
  }
}

// File: contracts/access/roles/MinterRole.sol

contract MinterRole is Context {
  using Roles for Roles.Role;

  event MinterAdded(address indexed account);
  event MinterRemoved(address indexed account);
  event Debug(address indexed account);

  Roles.Role private _minters;

  constructor() internal {
    _addMinter(_msgSender());
  }

  modifier onlyMinter() {
    require(isMinter(_msgSender()), "MinterRole: caller does not have the Minter role");
    _;
  }

  function isMinter(address account) public view returns (bool) {
    return _minters.has(account);
  }

  function addMinter(address account) public onlyMinter {
    _addMinter(account);
  }

  function renounceMinter() public {
    _removeMinter(_msgSender());
  }

  function _addMinter(address account) internal {
    _minters.add(account);
    emit MinterAdded(account);
  }

  function _removeMinter(address account) internal {
    _minters.remove(account);
    emit MinterRemoved(account);
  }
}

// File: contracts/token/ERC721/ERC721Mintable.sol

/**
 * @title ERC721Mintable
 * @dev ERC721 minting logic.
 */
contract ERC721Mintable is ERC721, MinterRole {
  constructor(string memory name, string memory symbol) public ERC721(name, symbol) {
    // solhint-disable-previous-line no-empty-blocks
  }
  /**
     * @dev Function to mint tokens.
     * @param to The address that will receive the minted token.
     * @param tokenId The token id to mint.
     * @return A boolean that indicates if the operation was successful.
     */
  function mint(address to, uint256 tokenId) public onlyMinter returns (bool) {
    _mint(to, tokenId);
    return true;
  }

  /**
     * @dev Function to safely mint tokens.
     * @param to The address that will receive the minted token.
     * @param tokenId The token id to mint.
     * @return A boolean that indicates if the operation was successful.
     */
  function safeMint(address to, uint256 tokenId) public onlyMinter returns (bool) {
    _safeMint(to, tokenId);
    return true;
  }

  /**
     * @dev Function to safely mint tokens.
     * @param to The address that will receive the minted token.
     * @param tokenId The token id to mint.
     * @param _data bytes data to send along with a safe transfer check.
     * @return A boolean that indicates if the operation was successful.
     */
  function safeMint(address to, uint256 tokenId, bytes memory _data) public onlyMinter returns (bool) {
    _safeMint(to, tokenId, _data);
    return true;
  }
}

// Everything above is imported from OpenZeppelin ERC721 implementation

contract TradeTrustERC721 is ERC721Mintable, IERC721Receiver {
  event TokenBurnt(uint256 indexed tokenId);
  event TokenReceived(address indexed operator, address indexed from, uint256 indexed tokenId, bytes data);

  // ERC165: Interface for this contract, can be calculated by calculateTradeTrustERC721Selector()
  // Only append new interface id for backward compatibility
  bytes4 private constant _INTERFACE_ID_TRADETRUST_ERC721 = 0xde500ce7;

  constructor(string memory name, string memory symbol) public ERC721Mintable(name, symbol) {
    // register the supported interface to conform to TradeTrustERC721 via ERC165
    _registerInterface(_INTERFACE_ID_TRADETRUST_ERC721);
  }

  function onERC721Received(address _operator, address _from, uint256 _tokenId, bytes memory _data)
    public
    override
    returns (bytes4)
  {
    emit TokenReceived(_operator, _from, _tokenId, _data);
    return this.onERC721Received.selector;
  }

  function destroyToken(uint256 _tokenId) public onlyMinter {
    require(ownerOf(_tokenId) == address(this), "Cannot destroy token: Token not owned by token registry");
    // Burning token to 0xdead instead to show a differentiate state as address(0) is used for unminted tokens
    _safeTransfer(ownerOf(_tokenId), 0x000000000000000000000000000000000000dEaD, _tokenId, "");
    emit TokenBurnt(_tokenId);
  }

  function sendToken(address to, uint256 _tokenId) public onlyMinter {
    require(ownerOf(_tokenId) == address(this), "Cannot send token: Token not owned by token registry");
    _safeTransfer(ownerOf(_tokenId), to, _tokenId, "");
  }

}

contract calculateTradeTrustERC721Selector {
  function calculateSelector() public pure returns (bytes4) {
    TradeTrustERC721 i;
    return i.onERC721Received.selector ^ i.destroyToken.selector ^ i.sendToken.selector;
  }
}
