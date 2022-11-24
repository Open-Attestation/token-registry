// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "../utils/SigHelper.sol";

contract SigHelperMock is SigHelper {
  constructor(string memory name) {
    __SigHelper_init(name, "1");
  }

  function __SigHelper_initInternal(string memory name, string memory version) public {
    super.__SigHelper_init(name, version);
  }

  function validateSigInternal(
    bytes32 hash,
    address signer,
    Sig memory sig
  ) public view returns (bool) {
    return super._validateSig(hash, signer, sig);
  }

  function cancelHashInternal(bytes32 hash) public {
    super._cancelHash(hash);
  }
}
