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

  address public override nominatedBeneficiary;
  address public override nominatedHolder;

  bool public override active;

  constructor() {
    initialize(address(0), address(0), address(0), 0x00);
  }

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

  function nominateBeneficiary(address _nominatedBeneficiary)
    public
    override
    whenNotPaused
    onlyBeneficiary
    whenHoldingToken
    whenActive
  {
    require(beneficiary != _nominatedBeneficiary, "TE: Nominee is beneficiary");
    require(nominatedBeneficiary != _nominatedBeneficiary, "TE: Already beneficiary nominee");

    nominatedBeneficiary = _nominatedBeneficiary;

    emit BeneficiaryNomination(registry, tokenId, nominatedBeneficiary, msg.sender);
  }

  function nominateHolder(address _nominatedHolder)
    public
    override
    whenNotPaused
    onlyBeneficiary
    whenHoldingToken
    whenActive
  {
    require(holder != _nominatedHolder, "TE: Nominee is holder");
    require(nominatedHolder != _nominatedHolder, "TE: Already holder nominee");

    nominatedHolder = _nominatedHolder;

    emit HolderNomination(registry, tokenId, nominatedHolder, msg.sender);
  }

  function nominate(address _nominatedBeneficiary, address _nominatedHolder) public override {
    nominateBeneficiary(_nominatedBeneficiary);
    nominateHolder(_nominatedHolder);
  }

  function endorseBeneficiary(address _nominatedBeneficiary)
    public
    override
    whenNotPaused
    onlyHolder
    whenHoldingToken
    whenActive
  {
    require(_nominatedBeneficiary != address(0), "TE: Endorsing zero");
    require(beneficiary == holder || (nominatedBeneficiary == _nominatedBeneficiary), "TE: Endorse non-nominee");

    beneficiary = _nominatedBeneficiary;
    nominatedBeneficiary = address(0);

    emit BeneficiaryEndorsement(registry, tokenId, beneficiary, msg.sender);
  }

  function endorseHolder(address _nominatedHolder)
    public
    override
    whenNotPaused
    onlyHolder
    whenHoldingToken
    whenActive
  {
    require(_nominatedHolder != address(0), "TE: Endorsing zero");
    require(holder != _nominatedHolder, "TE: Endorsee already holder");
    if (nominatedHolder != address(0)) {
      require(beneficiary == holder || (nominatedHolder == _nominatedHolder), "TE: Endorse non-nominee");
    }

    holder = _nominatedHolder;
    nominatedHolder = address(0);

    emit HolderEndorsement(registry, tokenId, holder, msg.sender);
  }

  function endorse(address _nominatedBeneficiary, address _nominatedHolder) external override {
    endorseBeneficiary(_nominatedBeneficiary);
    endorseHolder(_nominatedHolder);
  }

  function surrender() external override onlyBeneficiary onlyHolder whenNotPaused whenHoldingToken whenActive {
    _resetNominees();
    ITradeTrustERC721(registry).safeTransferFrom(address(this), registry, tokenId);

    emit Surrender(registry, tokenId, msg.sender);
  }

  function shred() external override whenNotPaused whenActive {
    require(!_isHoldingToken(), "TE: Not surrendered");
    require(msg.sender == registry, "TE: Invalid registry");

    _resetNominees();
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

  function _resetNominees() internal {
    nominatedBeneficiary = address(0);
    nominatedHolder = address(0);
  }
}
