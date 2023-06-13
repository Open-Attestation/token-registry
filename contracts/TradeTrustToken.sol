// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "./base/TradeTrustTokenBase.sol";

/**
 * @title TradeTrustToken
 */
contract TradeTrustToken is TradeTrustTokenBase {
  address internal immutable _titleEscrowFactory;
  uint256 internal immutable _genesis;

  /**
   * @notice Creates a new TradeTrustToken contract.
   * @param name The name of the token.
   * @param symbol The symbol of the token.
   * @param titleEscrowFactory_ The address of the TitleEscrowFactory contract.
   */
  constructor(
    string memory name,
    string memory symbol,
    address titleEscrowFactory_
  ) {
    _genesis = block.number;
    _titleEscrowFactory = titleEscrowFactory_;
    initialize(name, symbol, _msgSender());
  }

  /**
   * @notice Initializes the TradeTrustToken with the provided name, symbol, and admin address.
   * @param name The name of the token.
   * @param symbol The symbol of the token.
   * @param admin The address of the admin.
   */
  function initialize(
    string memory name,
    string memory symbol,
    address admin
  ) internal initializer {
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
