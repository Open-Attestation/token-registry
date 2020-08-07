pragma solidity ^0.5.16;

/// @title Title Escrow for Transferable Records
interface ITitleEscrow {
  /// @dev This emits when the escrow contract receives an ERC721 token.
  event TitleReceived(address indexed _tokenRegistry, address indexed _from, uint256 indexed _id);

  /// @dev This emits when the ownership is transferred out of the escrow contract.
  event TitleCeded(address indexed _tokenRegistry, address indexed _to, uint256 indexed _id);

  /// @dev This emits when the beneficiary approves new owner for non-title escrow transfer.
  event TransferOwnerApproval(uint256 indexed _tokenid, address indexed _from, address indexed _to);

  /// @dev This emits when the beneficiary approves new beneficiary and holder for the next title escrow.
  event TransferTitleEscrowApproval(address indexed newBeneficiary, address indexed newHolder);

  /// @notice Handle the receipt of an NFT
  /// @param operator The address which called `safeTransferFrom` function
  /// @param from The address which previously owned the token
  /// @param tokenId The NFT identifier which is being transferred
  /// @param data Additional data with no specified format
  /// @return `bytes4(keccak256("onERC721Received(address,address,uint256,bytes)"))`
  /// unless throwing
  function onERC721Received(address operator, address from, uint256 tokenId, bytes calldata data)
    external
    returns (bytes4);

  /// @notice Handle the change of holdership by current holder
  /// @param newHolder The address of the new holder
  function changeHolder(address newHolder) external;

  /// @notice Used by beneficiary to approve an EOA or smart contract to be the next owner for the token
  /// @param newOwner The address of the new holder
  function approveNewOwner(address newOwner) external;

  /// @notice Handle the token transfer by the holder after beneficiary's endorsement
  /// @param newBeneficiary The address of the new holder
  function transferTo(address newBeneficiary) external;

  /// @notice Public getter to access the approved owner if any
  function approvedOwner() external;

  /// @notice Public getter to access the approved beneficiary if any
  function approvedBeneficiary() external;

  /// @notice Public getter to access the approved holder if any
  function approvedHolder() external;

  /// @notice Public getter to access the beneficiary of the Title. The beneficiary is the legal owner of the Title.
  function beneficiary() external returns (address);

  /// @notice Public getter to access the holder of the Title, who is equivalent to holdership of a physical Title
  function holder() external returns (address);

  /// @notice Status of the TitleEscrow contract, which can be {Uninitialised, InUse, Exited}
  function status() external;

  /// @notice ERC165 supportsInterface
  function supportsInterface(bytes4) external view returns (bool);

  ///@notice TokenRegistry which this TitleEscrow is registered to accept tokens from
  function tokenRegistry() external returns (address);

  /// @notice Used by holder to transfer token to a newly created title escrow contract
  /// @param newBeneficiary The address of the new beneficiary
  /// @param newHolder The address of the new holder
  function transferToNewEscrow(address newBeneficiary, address newHolder) external;

  /// @notice Used by beneficiary to approve new beneficiary and holder to be next owners for the token
  /// @param newBeneficiary The address of the new beneficiary
  /// @param newHolder The address of the new holder
  function approveNewTransferTargets(address newBeneficiary, address newHolder) external;
}

contract CalculateSelector {
  function calculateSelector() public pure returns (bytes4) {
    ITitleEscrow i;
    return
      i.onERC721Received.selector ^
      i.changeHolder.selector ^
      i.approveNewOwner.selector ^
      i.transferTo.selector ^
      i.approvedOwner.selector ^
      i.approvedBeneficiary.selector ^
      i.approvedHolder.selector ^
      i.beneficiary.selector ^
      i.holder.selector ^
      i.status.selector ^
      i.tokenRegistry.selector ^
      i.transferToNewEscrow.selector ^
      i.approveNewTransferTargets.selector;
  }
}
