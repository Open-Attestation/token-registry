// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/interfaces/IERC165.sol";
import "./interfaces/ITitleEscrow.sol";
import "./interfaces/ITradeTrustERC721.sol";

contract TitleEscrow is IERC165, ITitleEscrow, Initializable {
  address public override registry;
  uint256 public override tokenId;

  address public override beneficiary;
  address public override holder;

  address public override beneficiaryNominee;

  bool public override active;

  constructor() initializer {}

  modifier onlyBeneficiary() {
    require(msg.sender == beneficiary, "TE: Not beneficiary");
    _;
  }

  modifier onlyHolder() {
    require(msg.sender == holder, "TE: Not holder");
    _;
  }

  modifier whenHoldingToken() {
    require(_isHoldingToken(), "TE: Not holding token");
    _;
  }

  modifier whenNotPaused() {
    bool paused = Pausable(registry).paused();
    require(!paused, "TE: Registry paused");
    _;
  }

  modifier whenActive() {
    require(active, "TE: Inactive");
    _;
  }

  function initialize(
    address _registry,
    address _beneficiary,
    address _holder,
    uint256 _tokenId
  ) public initializer {
    registry = _registry;
    beneficiary = _beneficiary;
    holder = _holder;
    tokenId = _tokenId;
    active = true;
  }

  function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
    return interfaceId == type(ITitleEscrow).interfaceId;
  }

  function onERC721Received(
    address, /* operator */
    address, /* from */
    uint256 _tokenId,
    bytes calldata /* data */
  ) external override whenNotPaused whenActive returns (bytes4) {
    require(tokenId == _tokenId, "TE: Invalid token");
    require(msg.sender == address(registry), "TE: Wrong registry");

    emit TokenReceived(registry, tokenId);
    return bytes4(keccak256("onERC721Received(address,address,uint256,bytes)"));
  }

  function _nominateBeneficiary(address _beneficiaryNominee)
    internal
    whenNotPaused
    onlyBeneficiary
    whenHoldingToken
    whenActive
  {
    require(beneficiary != _beneficiaryNominee, "TE: Nominee is beneficiary");
    require(beneficiaryNominee != _beneficiaryNominee, "TE: Already beneficiary nominee");

    beneficiaryNominee = _beneficiaryNominee;

    emit BeneficiaryNomination(registry, tokenId, beneficiaryNominee, msg.sender);
  }

  function nominate(address _beneficiaryNominee) public override {
    _nominateBeneficiary(_beneficiaryNominee);
  }

  function transferBeneficiary(address _beneficiaryNominee)
    public
    override
    whenNotPaused
    onlyHolder
    whenHoldingToken
    whenActive
  {
    require(_beneficiaryNominee != address(0), "TE: Endorsing zero");
    require(beneficiary == holder || (beneficiaryNominee == _beneficiaryNominee), "TE: Recipient is non-nominee");

    beneficiary = _beneficiaryNominee;
    beneficiaryNominee = address(0);

    emit BeneficiaryTransfer(registry, tokenId, beneficiary, msg.sender);
  }

  function transferOwners(address _beneficiaryNominee, address newHolder) external override {
    transferBeneficiary(_beneficiaryNominee);
    transferHolder(newHolder);
  }

  function transferHolder(address newHolder) public override whenNotPaused onlyHolder whenHoldingToken whenActive {
    require(newHolder != address(0), "TE: Transfer to zero");
    require(holder != newHolder, "TE: Already holder");

    holder = newHolder;

    emit HolderTransfer(registry, tokenId, holder, msg.sender);
  }

  function surrender() external override onlyBeneficiary onlyHolder whenNotPaused whenHoldingToken whenActive {
    beneficiaryNominee = address(0);
    ITradeTrustERC721(registry).safeTransferFrom(address(this), registry, tokenId);

    emit Surrender(registry, tokenId, msg.sender);
  }

  function shred() external override whenNotPaused whenActive {
    require(!_isHoldingToken(), "TE: Not surrendered");
    require(msg.sender == registry, "TE: Invalid registry");

    beneficiaryNominee = address(0);
    beneficiary = address(0);
    holder = address(0);
    active = false;

    emit Shred(registry, tokenId);
  }

  function isHoldingToken() external view override returns (bool) {
    return _isHoldingToken();
  }

  function _isHoldingToken() internal view returns (bool) {
    return ITradeTrustERC721(registry).ownerOf(tokenId) == address(this);
  }
}
