// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "../utils/SigHelper.sol";
import "./ITitleEscrow.sol";
import { BeneficiaryTransferEndorsement } from "../lib/TitleEscrowStructs.sol";

interface ITitleEscrowSignable is ITitleEscrow {
  event CancelBeneficiaryTransferEndorsement(bytes32 indexed hash, address indexed endorser, uint256 indexed tokenId);

  function transferBeneficiaryWithSig(BeneficiaryTransferEndorsement memory endorsement, SigHelper.Sig memory sig)
    external;

  function cancelBeneficiaryTransfer(BeneficiaryTransferEndorsement memory endorsement) external;
}
