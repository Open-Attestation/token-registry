// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";

/// @title Title Escrow for Transferable Records
interface ITitleEscrow is IERC721Receiver {
  event TokenReceived(address indexed tokenRegistry, uint256 indexed tokenId);
  event BeneficiaryNomination(
    address indexed tokenRegistry,
    uint256 indexed tokenId,
    address indexed beneficiaryNominee,
    address nominator
  );
  event BeneficiaryTransfer(
    address indexed tokenRegistry,
    uint256 indexed tokenId,
    address newHolder,
    address prevHolder
  );
  event HolderTransfer(
    address indexed tokenRegistry,
    uint256 indexed tokenId,
    address indexed endorsedHolder,
    address endorser
  );
  event Surrender(address indexed tokenRegistry, uint256 indexed tokenId, address surrenderer);
  event Shred(address indexed tokenRegistry, uint256 indexed tokenId);

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
