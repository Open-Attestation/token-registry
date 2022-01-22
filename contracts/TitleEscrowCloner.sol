// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "./interfaces/ITitleEscrowCreator.sol";
import "./TitleEscrowCloneable.sol";
import "./lib/Clones.sol";

contract TitleEscrowCloner is ITitleEscrowCreator {
  address public  titleEscrowImplementation;

  constructor() {
    titleEscrowImplementation = address(new TitleEscrowCloneable());
  }

  function _deployNewTitleEscrow(
    address tokenRegistry,
    address beneficiary,
    address holder
  ) internal returns (address) {
    address clone = Clones.clone(titleEscrowImplementation);
    TitleEscrowCloneable(clone).initialize(tokenRegistry, beneficiary, holder, address(this));
    emit TitleEscrowDeployed(address(clone), tokenRegistry, beneficiary, holder);
    return address(clone);
  }

  function deployNewTitleEscrow(
    address tokenRegistry,
    address beneficiary,
    address holder
  ) external override returns (address) {
    return _deployNewTitleEscrow(tokenRegistry, beneficiary, holder);
  }
}
