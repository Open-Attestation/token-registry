// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "./IChildToken.sol";
import "../../common/TradeTrustERC721Mintable.sol";
import "../../access/ChainManagerRole.sol";

contract TradeTrustERC721ChildMintable is ChainManagerRole, IChildToken, TradeTrustERC721Mintable  {
  mapping(uint256 => bool) internal _withdrawnTokens;

  constructor(string memory name, string memory symbol) TradeTrustERC721Mintable(name, symbol) {}

  function mintTitle(
    address beneficiary,
    address holder,
    uint256 tokenId
  ) public virtual override onlyMinter returns (address) {
    require(!_withdrawnTokens[tokenId], "TradeTrustERC721Child: Token is on root chain");

    return _mintTitle(beneficiary, holder, tokenId);
  }

  function mint(address to, uint256 tokenId) public virtual override onlyMinter returns (bool) {
    require(!_withdrawnTokens[tokenId], "TradeTrustERC721Child: Token is on root chain");

    return super.mint(to, tokenId);
  }

  function deposit(
    address depositor,
    uint256 tokenId,
    bytes memory depositData
  ) external virtual override onlyChainManager {
    _withdrawnTokens[tokenId] = false;
    _mintTitle(depositor, depositor, tokenId);
  }

  function withdraw(
    address withdrawer,
    uint256 tokenId,
    bytes memory withdrawData
  ) external virtual override onlyChainManager {
    require(
      _isApprovedOrOwner(_msgSender(), tokenId),
      "TradeTrustERC721ChildMintable: Caller is not owner nor approved"
    );

    _withdrawnTokens[tokenId] = true;
    _burn(tokenId);
  }

  function supportsInterface(bytes4 interfaceId) public view virtual override(TradeTrustERC721Mintable, ChainManagerRole) returns (bool) {
    return super.supportsInterface(interfaceId) || ChainManagerRole.supportsInterface(interfaceId);
  }
}
