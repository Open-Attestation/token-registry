// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";

/// @title Title Escrow for Transferable Records
interface ITitleEscrow is IERC721Receiver {
  event TokenReceived(address indexed tokenRegistry, uint256 indexed tokenId);
  event BeneficiaryNomination(
    address indexed tokenRegistry,
    uint256 indexed tokenId,
    address indexed nominatedBeneficiary,
    address nominator
  );
  event HolderNomination(
    address indexed tokenRegistry,
    uint256 indexed tokenId,
    address indexed nominatedHolder,
    address nominator
  );
  event BeneficiaryEndorsement(
    address indexed tokenRegistry,
    uint256 indexed tokenId,
    address indexed endorsedBeneficiary,
    address endorser
  );
  event HolderEndorsement(
    address indexed tokenRegistry,
    uint256 indexed tokenId,
    address indexed endorsedHolder,
    address endorser
  );
  event Surrender(address indexed tokenRegistry, uint256 indexed tokenId, address surrenderer);
  event Shred(address indexed tokenRegistry, uint256 indexed tokenId);

  function nominateBeneficiary(address _nominatedBeneficiary) external;

  function nominateHolder(address _nominatedHolder) external;

  function nominate(address _nominatedBeneficiary, address _nominatedHolder) external;

  function endorseBeneficiary(address _nominatedBeneficiary) external;

  function endorseHolder(address _nominatedHolder) external;

  function endorse(address _nominatedBeneficiary, address _nominatedHolder) external;

  function beneficiary() external view returns (address);

  function holder() external view returns (address);

  function active() external view returns (bool);

  function nominatedBeneficiary() external view returns (address);

  function nominatedHolder() external view returns (address);

  function registry() external view returns (address);

  function tokenId() external view returns (uint256);

  function isHoldingToken() external returns (bool);

  function surrender() external;

  function shred() external;
}
