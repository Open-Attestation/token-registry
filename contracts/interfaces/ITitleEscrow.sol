// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";

/// @title Title Escrow for Transferable Records
interface ITitleEscrow is IERC721Receiver {
  event TokenReceived(address indexed tokenRegistry, uint256 indexed tokenId);
  event BeneficiaryNomination(
    address indexed prevNominee,
    address indexed nominee,
    address tokenRegistry,
    uint256 tokenId
  );
  event BeneficiaryTransfer(
    address indexed fromBeneficiary,
    address indexed toBeneficiary,
    address tokenRegistry,
    uint256 tokenId
  );
  event HolderTransfer(
    address indexed fromHolder,
    address indexed toHolder,
    address tokenRegistry,
    uint256 tokenId
  );
  event Surrender(address indexed surrenderer, address tokenRegistry, uint256 tokenId);
  event Shred(address tokenRegistry, uint256 tokenId);

  function nominate(address beneficiaryNominee) external;

  function transferBeneficiary(address beneficiaryNominee) external;

  function transferHolder(address newHolder) external;

  function transferOwners(address beneficiaryNominee, address newHolder) external;

  function beneficiary() external view returns (address);

  function holder() external view returns (address);

  function active() external view returns (bool);

  function beneficiaryNominee() external view returns (address);

  function registry() external view returns (address);

  function tokenId() external view returns (uint256);

  function isHoldingToken() external returns (bool);

  function surrender() external;

  function shred() external;
}
