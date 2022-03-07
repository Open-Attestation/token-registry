// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/proxy/Clones.sol";
import "./TitleEscrowCloneable.sol";
import "./interfaces/ITitleEscrowFactory.sol";

contract TitleEscrowFactory is ITitleEscrowFactory {
  address public override implementation;

  constructor() {
    implementation = address(new TitleEscrowCloneable());
  }

  function create(
    address tokenRegistry,
    address beneficiary,
    address holder
  ) external override returns (address) {
    address clone = Clones.clone(implementation);
    TitleEscrowCloneable(clone).initialize(tokenRegistry, beneficiary, holder, address(this));

    emit TitleEscrowDeployed(address(clone), tokenRegistry, beneficiary, holder);

    return address(clone);
  }
}
