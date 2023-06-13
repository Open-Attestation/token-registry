// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "../base/TradeTrustTokenBase.sol";

/**
 * @title TradeTrustTokenStandard
 */
contract TradeTrustTokenStandard is TradeTrustTokenBase {
  address internal _titleEscrowFactory;
  uint256 internal _genesis;

  constructor() initializer {}

  /**
   * @dev Initialize the contract.
   * @param params The initialisation parameters.
   */
  function initialize(bytes memory params) external initializer {
    (bytes memory _params, address titleEscrowFactory_) = abi.decode(params, (bytes, address));
    (string memory name, string memory symbol, address admin) = abi.decode(_params, (string, string, address));
    _genesis = block.number;
    _titleEscrowFactory = titleEscrowFactory_;
    __TradeTrustTokenBase_init(name, symbol, admin);
  }

  /**
   * @dev See {ITradeTrustSBT-titleEscrowFactory}.
   */
  function titleEscrowFactory() public view override returns (ITitleEscrowFactory) {
    return ITitleEscrowFactory(_titleEscrowFactory);
  }

  /**
   * @dev See {ITradeTrustSBT-genesis}.
   */
  function genesis() public view override returns (uint256) {
    return _genesis;
  }
}
