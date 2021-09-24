// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

interface IHasBeneficiary {
  /// @notice Public getter to access the beneficiary of the Title. The beneficiary is the legal owner of the Title.
  function beneficiary() external returns (address);
}
