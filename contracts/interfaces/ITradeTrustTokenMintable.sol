// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

interface ITradeTrustTokenMintable {
  /**
   * @dev Mint a TradeTrust token.
   * @param beneficiary The beneficiary of the token.
   * @param holder The holder of the token.
   * @param tokenId The ID of the token to mint.
   * @return The address of the corresponding TitleEscrow.
   */
  function mint(
    address beneficiary,
    address holder,
    uint256 tokenId
  ) external returns (address);
}
