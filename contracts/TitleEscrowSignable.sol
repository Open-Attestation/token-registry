// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "./TitleEscrow.sol";
import "./utils/SigHelper.sol";

contract TitleEscrowSignable is SigHelper, TitleEscrow {
  string public constant name = "TradeTrust Title Escrow";

  // BeneficiaryTransfer(address beneficiary,address holder,address nominee,address registry,uint256 tokenId,uint256 deadline,uint256 nonce)
  bytes32 public constant BENEFICIARY_TRANSFER_TYPEHASH =
    0xdc8ea80c045a9b675c73cb328c225cc3f099d01bd9b7820947ac10cba8661cf1;

  struct BeneficiaryTransferEndorsement {
    // Transfer proposer
    address beneficiary;
    // Endorser
    address holder;
    // Endorsed nominee
    address nominee;
    address registry;
    uint256 tokenId;
    uint256 deadline;
    uint256 nonce;
  }

  event CancelBeneficiaryTransferEndorsement(bytes32 indexed hash, address indexed endorser, uint256 indexed tokenId);

  function initialize(address _registry, uint256 _tokenId) public virtual override initializer {
    __TitleEscrowSignable_init(_registry, _tokenId);
  }

  function __TitleEscrowSignable_init(address _registry, uint256 _tokenId) internal virtual onlyInitializing {
    super.__TitleEscrow_init(_registry, _tokenId);
    __SigHelper_init(name, "1");
  }

  function transferBeneficiaryWithSig(BeneficiaryTransferEndorsement memory endorsement, Sig memory sig)
    public
    virtual
    whenNotPaused
    whenActive
    onlyBeneficiary
    whenHoldingToken
  {
    require(endorsement.deadline >= block.timestamp, "TE: Expired");
    require(
      endorsement.nominee != address(0) &&
        endorsement.nominee != beneficiary &&
        endorsement.holder == holder &&
        endorsement.tokenId == tokenId &&
        endorsement.registry == registry,
      "TE: Invalid endorsement"
    );

    if (beneficiaryNominee != address(0)) {
      require(endorsement.nominee == beneficiaryNominee, "TE: Nominee mismatch");
    }

    require(endorsement.beneficiary == beneficiary, "TE: Beneficiary mismatch");
    require(_validateSig(_hash(endorsement), holder, sig), "TE: Invalid signature");

    ++nonces[holder];
    _setBeneficiary(endorsement.nominee);
  }

  function cancelBeneficiaryTransfer(BeneficiaryTransferEndorsement memory endorsement)
    public
    virtual
    whenNotPaused
    whenActive
  {
    require(msg.sender == endorsement.holder, "TE: Caller not endorser");

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
