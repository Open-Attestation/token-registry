// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "./IChildToken.sol";
import "../../common/TradeTrustERC721Base.sol";
import "../../access/ChainManagerRole.sol";

contract TradeTrustERC721Child is ChainManagerRole, IChildToken, TradeTrustERC721Base  {
  constructor(string memory name, string memory symbol) TradeTrustERC721Base(name, symbol) {}

  function deposit(
    address depositor,
    uint256 tokenId,
    bytes memory /* depositData */
  ) external virtual override onlyChainManager {
    _mintTitle(depositor, depositor, tokenId);
  }

  function withdraw(
    address, /* withdrawer */
    uint256 tokenId,
    bytes memory /* withdrawData */
  ) external virtual override onlyChainManager {
    require(_isApprovedOrOwner(_msgSender(), tokenId), "TradeTrustERC721Child: Caller is not owner nor approved");

    _burn(tokenId);
  }

  function supportsInterface(bytes4 interfaceId) public view virtual override(TradeTrustERC721Base, ChainManagerRole) returns (bool) {
    return super.supportsInterface(interfaceId) || ChainManagerRole.supportsInterface(interfaceId);
  }
}
