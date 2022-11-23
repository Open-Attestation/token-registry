// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "../TitleEscrow.sol";
import "../utils/SigHelper.sol";
import { BeneficiaryTransferEndorsement } from "../lib/TitleEscrowStructs.sol";
import "../interfaces/ITitleEscrowSignable.sol";
import "../interfaces/TitleEscrowSignableErrors.sol";

/// @notice This Title Escrow allows the holder to perform an off-chain endorsement of beneficiary transfers
/// @custom:experimental Note that this is currently an experimental feature. See readme for usage details.
contract TitleEscrowSignable is SigHelper, TitleEscrow, TitleEscrowSignableErrors, ITitleEscrowSignable {
  string public constant name = "TradeTrust Title Escrow";

  // BeneficiaryTransfer(address beneficiary,address holder,address nominee,address registry,uint256 tokenId,uint256 deadline,uint256 nonce)
  bytes32 public constant BENEFICIARY_TRANSFER_TYPEHASH =
    0xdc8ea80c045a9b675c73cb328c225cc3f099d01bd9b7820947ac10cba8661cf1;

  function initialize(address _registry, uint256 _tokenId) public virtual override initializer {
    __TitleEscrowSignable_init(_registry, _tokenId);
  }

  function __TitleEscrowSignable_init(address _registry, uint256 _tokenId) internal virtual onlyInitializing {
    super.__TitleEscrow_init(_registry, _tokenId);
    __SigHelper_init(name, "1");
  }

  function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
    return super.supportsInterface(interfaceId) || interfaceId == type(ITitleEscrowSignable).interfaceId;
  }

  function transferBeneficiaryWithSig(BeneficiaryTransferEndorsement memory endorsement, Sig memory sig)
    public
    virtual
    override
    whenNotPaused
    whenActive
    onlyBeneficiary
    whenHoldingToken
  {
    if (endorsement.deadline < block.timestamp) {
      revert SignatureExpired(block.timestamp);
    }
    if (
      endorsement.nominee == address(0) ||
      endorsement.nominee == beneficiary ||
      endorsement.holder != holder ||
      endorsement.tokenId != tokenId ||
      endorsement.registry != registry
    ) {
      revert InvalidEndorsement();
    }

    if (nominee != address(0)) {
      if (endorsement.nominee != nominee) {
        revert MismatchedEndorsedNomineeAndOnChainNominee(endorsement.nominee, nominee);
      }
    }

    if (endorsement.beneficiary != beneficiary) {
      revert MismatchedEndorsedBeneficiaryAndCurrentBeneficiary(endorsement.beneficiary, beneficiary);
    }
    if (!_validateSig(_hash(endorsement), holder, sig)) {
      revert InvalidSignature();
    }

    ++nonces[holder];
    _setBeneficiary(endorsement.nominee);
  }

  function cancelBeneficiaryTransfer(BeneficiaryTransferEndorsement memory endorsement)
    public
    virtual
    override
    whenNotPaused
    whenActive
  {
    if (msg.sender != endorsement.holder) {
      revert CallerNotEndorser();
    }

    bytes32 hash = _hash(endorsement);
    _cancelHash(hash);

    emit CancelBeneficiaryTransferEndorsement(hash, endorsement.holder, endorsement.tokenId);
  }

  function _hash(BeneficiaryTransferEndorsement memory endorsement) internal view returns (bytes32) {
    return
      keccak256(
        abi.encode(
          BENEFICIARY_TRANSFER_TYPEHASH,
          endorsement.beneficiary,
          endorsement.holder,
          endorsement.nominee,
          endorsement.registry,
          endorsement.tokenId,
          endorsement.deadline,
          nonces[endorsement.holder]
        )
      );
  }

  function _setHolder(address newHolder) internal virtual override {
    ++nonces[holder];
    super._setHolder(newHolder);
  }
}
