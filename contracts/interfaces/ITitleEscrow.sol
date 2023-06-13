// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";

/**
 * @title ITitleEscrow
 * @notice Interface for TitleEscrow contract. The TitleEscrow contract represents a title escrow for transferable records.
 * @dev Inherits from IERC721Receiver.
 */
interface ITitleEscrow is IERC721Receiver {
  event TokenReceived(
    address indexed beneficiary,
    address indexed holder,
    bool indexed isMinting,
    address registry,
    uint256 tokenId
  );
  event Nomination(address indexed prevNominee, address indexed nominee, address registry, uint256 tokenId);
  event BeneficiaryTransfer(
    address indexed fromBeneficiary,
    address indexed toBeneficiary,
    address registry,
    uint256 tokenId
  );
  event HolderTransfer(address indexed fromHolder, address indexed toHolder, address registry, uint256 tokenId);
  event Surrender(address indexed surrenderer, address registry, uint256 tokenId);
  event Shred(address registry, uint256 tokenId);

  /**
   * @notice Allows the beneficiary to nominate a new beneficiary
   * @dev The nominated beneficiary will need to be transferred by the holder to become the actual beneficiary
   * @param nominee The address of the nominee
   */
  function nominate(address nominee) external;

  /**
   * @notice Allows the holder to transfer the beneficiary role to the nominated beneficiary or to themselves
   * @param nominee The address of the new beneficiary
   */
  function transferBeneficiary(address nominee) external;

  /**
   * @notice Allows the holder to transfer their role to another address
   * @param newHolder The address of the new holder
   */
  function transferHolder(address newHolder) external;

  /**
   * @notice Allows for the simultaneous transfer of both beneficiary and holder roles
   * @param nominee The address of the new beneficiary
   * @param newHolder The address of the new holder
   */
  function transferOwners(address nominee, address newHolder) external;

  function beneficiary() external view returns (address);

  function holder() external view returns (address);

  function active() external view returns (bool);

  function nominee() external view returns (address);

  function registry() external view returns (address);

  function tokenId() external view returns (uint256);

  /**
   * @notice Check if the TitleEscrow is currently holding a token
   * @return A boolean indicating whether the contract is holding a token
   */
  function isHoldingToken() external returns (bool);

  /**
   * @notice Allows the beneficiary and holder to surrender the token back to the registry
   */
  function surrender() external;

  /**
   * @notice Allows the registry to shred the TitleEscrow by marking it as inactive and reset the beneficiary and holder addresses
   */
  function shred() external;
}
