// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

interface TitleEscrowErrors {
  error CallerNotBeneficiary();

  error CallerNotHolder();

  error TitleEscrowNotHoldingToken();

  error RegistryContractPaused();

  error InactiveTitleEscrow();

  error UnknownReceivingTokenId(uint256 tokenId);

  error UnknownRegistry(address registry);

  error EmptyReceivingData();

  error InvalidTokenTransferToZeroAddressOwners(address beneficiary, address holder);

  error TargetNomineeAlreadyBeneficiary();

  error NomineeAlreadyNominated();

  error InvalidTransferToZeroAddress();

  error TargetBeneficiaryNomineeNotNominated();

  error RecipientAlreadyHolder();

  error TokenNotSurrendered();
}
