// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/utils/cryptography/ECDSAUpgradeable.sol";
import "../interfaces/SigHelperErrors.sol";

abstract contract SigHelper is SigHelperErrors {
  using ECDSAUpgradeable for bytes32;

  bytes32 public DOMAIN_SEPARATOR;
  mapping(address => uint256) public nonces;
  mapping(bytes32 => bool) public cancelled;

  struct Sig {
    bytes32 r;
    bytes32 s;
    uint8 v;
  }

  function __SigHelper_init(string memory name, string memory version) internal {
    DOMAIN_SEPARATOR = keccak256(
      abi.encode(
        keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
        keccak256(bytes(name)),
        keccak256(bytes(version)),
        block.chainid,
        address(this)
      )
    );
  }

  function _validateSig(
    bytes32 hash,
    address signer,
    Sig memory sig
  ) internal view virtual returns (bool) {
    if (cancelled[hash]) {
      revert SignatureAlreadyCancelled();
    }
    bytes32 digest = DOMAIN_SEPARATOR.toTypedDataHash(hash);
    address rSigner = digest.recover(abi.encodePacked(sig.r, sig.s, sig.v));
    return rSigner != address(0) && rSigner == signer;
  }

  function _cancelHash(bytes32 hash) internal virtual {
    if (cancelled[hash]) {
      revert SignatureAlreadyCancelled();
    }
    cancelled[hash] = true;
  }
}
