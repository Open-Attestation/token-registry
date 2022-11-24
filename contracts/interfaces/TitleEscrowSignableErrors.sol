// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

interface TitleEscrowSignableErrors {
  error SignatureExpired(uint256 currentTimestamp);

  error InvalidSignature();

  error InvalidEndorsement();

  error MismatchedEndorsedNomineeAndOnChainNominee(address endorsedNominee, address onChainNominee);

  error MismatchedEndorsedBeneficiaryAndCurrentBeneficiary(address endorsedBeneficiary, address currentBeneficiary);

  error CallerNotEndorser();
}
