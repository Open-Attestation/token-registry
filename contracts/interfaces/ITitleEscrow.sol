// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import "../access/IHasHolder.sol";
import "../access/IHasBeneficiary.sol";

/// @title Title Escrow for Transferable Records
interface ITitleEscrow is IHasHolder, IHasBeneficiary, IERC165, IERC721Receiver {
  enum StatusTypes {
    Uninitialised,
    InUse,
    Exited
  }

  /// @dev This emits when the escrow contract receives an ERC721 token.
  event TitleReceived(address indexed _tokenRegistry, address indexed _from, uint256 indexed _id);

  /// @dev This emits when the ownership is transferred out of the escrow contract.
  event TitleCeded(address indexed _tokenRegistry, address indexed _to, uint256 indexed _id);

  /// @dev This emits when the beneficiary approves new owner for non-title escrow transfer.
  event TransferOwnerApproval(uint256 indexed _tokenid, address indexed _from, address indexed _to);

  /// @dev This emits when the beneficiary approves new beneficiary and holder for the next title escrow.
  event TransferTitleEscrowApproval(address indexed newBeneficiary, address indexed newHolder);

  /// @dev Emits when a token is surrendered to token registry
  event Surrender(address indexed tokenRegistry, uint256 indexed tokenId, address indexed beneficiaryAndHolder);

  /// @notice Handle the receipt of an NFT
  /// @param operator The address which called `safeTransferFrom` function
  /// @param from The address which previously owned the token
  /// @param tokenId The NFT identifier which is being transferred
  /// @param data Additional data with no specified format
  /// @return `bytes4(keccak256("onERC721Received(address,address,uint256,bytes)"))`
  /// unless throwing
  function onERC721Received(
    address operator,
    address from,
    uint256 tokenId,
    bytes calldata data
  ) external override returns (bytes4);

  /// @notice Handle the change of holdership by current holder
  /// @param newHolder The address of the new holder
  function changeHolder(address newHolder) external;

  /// @notice Surrender token back to registry
  function surrender() external;

  /// @notice Public getter to access the approved beneficiary if any
  function approvedBeneficiary() external returns (address);

  /// @notice Public getter to access the approved holder if any
  function approvedHolder() external returns (address);

  /// @notice Status of the TitleEscrow contract, which can be {Uninitialised, InUse, Exited}
  function status() external returns (StatusTypes);

  ///@notice TokenRegistry which this TitleEscrow is registered to accept tokens from
  function tokenRegistry() external returns (ERC721);

  /// @notice Used by holder to transfer token to a newly created title escrow contract
  /// @param newBeneficiary The address of the new beneficiary
  /// @param newHolder The address of the new holder
  function transferToNewEscrow(address newBeneficiary, address newHolder) external;

  /// @notice Used by beneficiary to approve new beneficiary and holder to be next owners for the token
  /// @param newBeneficiary The address of the new beneficiary
  /// @param newHolder The address of the new holder
  function approveNewTransferTargets(address newBeneficiary, address newHolder) external;
}
