// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721ReceiverUpgradeable.sol";
import "./ISBTUpgradeable.sol";
import "./ITitleEscrowFactory.sol";

interface ITradeTrustSBT is IERC721ReceiverUpgradeable, ISBTUpgradeable {
  /**
   * @notice Returns the block number when the contract was created.
   * @return The block number of the contract's creation.
   */
  function genesis() external view returns (uint256);

  /**
   * @notice Returns the TitleEscrowFactory address associated with this contract.
   * @return The address of the TitleEscrowFactory contract.
   */
  function titleEscrowFactory() external view returns (ITitleEscrowFactory);
}
