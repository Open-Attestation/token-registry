// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "./IChildToken.sol";
import "../../common/TradeTrustERC721Base.sol";

contract TradeTrustERC721Child is TradeTrustERC721Base, IChildToken {
  constructor(string memory name, string memory symbol) TradeTrustERC721Base(name, symbol) {}

  function deposit(
    address depositor,
    uint256 tokenId,
    bytes memory /* depositData */
  ) external virtual override onlyRole(CHAIN_MANAGER_ROLE) {
    _mintTitle(depositor, depositor, tokenId);
  }

  function withdraw(
    address /* withdrawer */,
    uint256 tokenId,
    bytes memory /* withdrawData */
  ) external virtual override onlyRole(CHAIN_MANAGER_ROLE) {
    require(_isApprovedOrOwner(_msgSender(), tokenId), "TradeTrustERC721Child: Caller is not owner nor approved");

    _burn(tokenId);
  }
}
