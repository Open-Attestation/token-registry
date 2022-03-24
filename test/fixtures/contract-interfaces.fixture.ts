export const ContractInterfaces = {
  ITradeTrustERC721: [
    "genesis()",
    "titleEscrowFactory()",
    "burn(uint256)",
    "restore(uint256)",
    "mint(address,address,uint256)",
  ],
  ITitleEscrow: [
    "nominateBeneficiary(address)",
    "nominateHolder(address)",
    "nominate(address,address)",
    "endorseBeneficiary(address)",
    "endorseHolder(address)",
    "endorse(address,address)",
    "beneficiary()",
    "holder()",
    "active()",
    "nominatedBeneficiary()",
    "nominatedHolder()",
    "registry()",
    "tokenId()",
    "isHoldingToken()",
    "surrender()",
    "shred()",
  ],
  ITitleEscrowFactory: ["create(address,address,uint256)", "getAddress(address,uint256)"],
  AccessControl: [
    "hasRole(bytes32,address)",
    "getRoleAdmin(bytes32)",
    "grantRole(bytes32,address)",
    "revokeRole(bytes32,address)",
    "renounceRole(bytes32,address)",
  ],
  ERC721: [
    "balanceOf(address)",
    "ownerOf(uint256)",
    "approve(address,uint256)",
    "getApproved(uint256)",
    "setApprovalForAll(address,bool)",
    "isApprovedForAll(address,address)",
    "transferFrom(address,address,uint256)",
    "safeTransferFrom(address,address,uint256)",
    "safeTransferFrom(address,address,uint256,bytes)",
  ],
};
