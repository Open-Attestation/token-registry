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

  function initialize(address _registry, uint256 _tokenId) public initializer {
    registry = _registry;
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
    bytes calldata data
  ) external override whenNotPaused whenActive returns (bytes4) {
    require(tokenId == _tokenId, "TE: Invalid token");
    require(msg.sender == address(registry), "TE: Wrong registry");
    bool isMinting = false;
    if (beneficiary == address(0) || holder == address(0)) {
      require(data.length > 0, "TE: Empty data");
      (address _beneficiary, address _holder) = abi.decode(data, (address, address));
      _setBeneficiary(_beneficiary);
      _setHolder(_holder);
      isMinting = true;
    }

    emit TokenReceived(beneficiary, holder, isMinting, registry, tokenId);
    return bytes4(keccak256("onERC721Received(address,address,uint256,bytes)"));
  }

  function _nominateBeneficiary(address _beneficiaryNominee)
    internal
    whenNotPaused
    whenActive
    onlyBeneficiary
    whenHoldingToken
  {
    require(beneficiary != _beneficiaryNominee, "TE: Nominee is beneficiary");
    require(beneficiaryNominee != _beneficiaryNominee, "TE: Already beneficiary nominee");

    _setBeneficiaryNominee(_beneficiaryNominee);
  }

  function nominate(address _beneficiaryNominee) public override {
    _nominateBeneficiary(_beneficiaryNominee);
  }

  function transferBeneficiary(address _beneficiaryNominee)
    public
    override
    whenNotPaused
    whenActive
    onlyHolder
    whenHoldingToken
  {
    require(_beneficiaryNominee != address(0), "TE: Endorsing zero");
    require(beneficiary == holder || (beneficiaryNominee == _beneficiaryNominee), "TE: Recipient is non-nominee");

    _setBeneficiary(_beneficiaryNominee);
    beneficiaryNominee = address(0);
  }

  function transferHolder(address newHolder) public override whenNotPaused whenActive onlyHolder whenHoldingToken {
    require(newHolder != address(0), "TE: Transfer to zero");
    require(holder != newHolder, "TE: Already holder");

    _setHolder(newHolder);
  }

  function _setBeneficiaryNominee(address newBeneficiaryNominee) internal {
    emit BeneficiaryNomination(beneficiaryNominee, newBeneficiaryNominee, registry, tokenId);

    beneficiaryNominee = newBeneficiaryNominee;
  }

  function _setBeneficiary(address newBeneficiary) internal {
    emit BeneficiaryTransfer(beneficiary, newBeneficiary, registry, tokenId);
    beneficiary = newBeneficiary;
  }

  function _setHolder(address newHolder) internal {
    emit HolderTransfer(holder, newHolder, registry, tokenId);
    holder = newHolder;
  }

  function transferOwners(address _beneficiaryNominee, address newHolder) external override {
    transferBeneficiary(_beneficiaryNominee);
    transferHolder(newHolder);
  }

  function surrender() external override whenNotPaused whenActive onlyBeneficiary onlyHolder whenHoldingToken {
    beneficiaryNominee = address(0);
    ITradeTrustERC721(registry).safeTransferFrom(address(this), registry, tokenId);

    emit Surrender(msg.sender, registry, tokenId);
  }

  function shred() external override whenNotPaused whenActive {
    require(!_isHoldingToken(), "TE: Not surrendered");
    require(msg.sender == registry, "TE: Invalid registry");

    _setBeneficiaryNominee(address(0));
    _setBeneficiary(address(0));
    _setHolder(address(0));
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
