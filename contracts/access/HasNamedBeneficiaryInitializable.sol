// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "../interfaces/ITitleEscrow.sol";

abstract contract HasNamedBeneficiaryInitializable is Context, IHasBeneficiary, Initializable {
  address public override beneficiary;

  function __initialize__beneficiary(address _beneficiary) internal {
    beneficiary = _beneficiary;
  }

  modifier onlyBeneficiary() {
    require(isBeneficiary(), "HasNamedBeneficiary: only the beneficiary may invoke this function");
    _;
  }

  function isBeneficiary() internal view returns (bool) {
    return _msgSender() == beneficiary;
  }
}
