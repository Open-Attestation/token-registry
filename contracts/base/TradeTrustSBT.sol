// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "./SBTUpgradeable.sol";
import "../base/RegistryAccess.sol";
import "../base/Pausable.sol";
import "../interfaces/ITitleEscrow.sol";
import "../interfaces/ITitleEscrowFactory.sol";
import "../interfaces/TradeTrustTokenErrors.sol";
import "./TokenURIStorage.sol";
import "../interfaces/ITradeTrustSBT.sol";

abstract contract TradeTrustSBT is RegistryAccess, Pausable, TradeTrustTokenErrors, SBTUpgradeable, ITradeTrustSBT {
  function __TradeTrustSBT_init(
    string memory name,
    string memory symbol,
    address admin
  ) internal onlyInitializing {
    __SBT_init(name, symbol);
    __Pausable_init();
    __RegistryAccess_init(admin);
  }

  function supportsInterface(bytes4 interfaceId)
    public
    view
    virtual
    override(SBTUpgradeable, IERC165Upgradeable, AccessControlUpgradeable, RegistryAccess)
    returns (bool)
  {
    return SBTUpgradeable.supportsInterface(interfaceId) || RegistryAccess.supportsInterface(interfaceId);
  }

  function onERC721Received(
    address, /* _operator */
    address, /* _from */
    uint256, /* _tokenId */
    bytes memory /* _data */
  ) public pure override returns (bytes4) {
    return IERC721Receiver.onERC721Received.selector;
  }

  function _registryTransferTo(address to, uint256 tokenId) internal {
    this.transferFrom(address(this), to, tokenId);
  }

  function genesis() public view virtual override returns (uint256);

  function titleEscrowFactory() public view virtual override returns (ITitleEscrowFactory);
}
