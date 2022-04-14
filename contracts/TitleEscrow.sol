// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
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

  modifier onlyBeneficiary() {
    require(msg.sender == beneficiary, "TitleEscrow: Caller is not beneficiary");
    _;
  }

  modifier onlyHolder() {
    require(msg.sender == holder, "TitleEscrow: Caller is not holder");
    _;
  }

  modifier whenHoldingToken() {
    require(_isHoldingToken(), "TitleEscrow: Not holding token");
    _;
  }

  modifier whenNotPaused() {
    bool paused = Pausable(registry).paused();
    require(!paused, "TitleEscrow: Token Registry is paused");
    _;
  }

  modifier whenActive() {
    require(active, "TitleEscrow: Inactive");
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
    require(tokenId == _tokenId, "TitleEscrow: Unable to accept token");
    require(msg.sender == address(registry), "TitleEscrow: Only tokens from predefined token registry can be accepted");

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
    require(beneficiary != _nominatedBeneficiary, "TitleEscrow: Nominee is already beneficiary");
    require(nominatedBeneficiary != _nominatedBeneficiary, "TitleEscrow: Beneficiary nominee is already nominated");

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
    require(holder != _nominatedHolder, "TitleEscrow: Nominee is already holder");
    require(nominatedHolder != _nominatedHolder, "TitleEscrow: Holder nominee is already nominated");

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
    require(_nominatedBeneficiary != address(0), "TitleEscrow: Cannot endorse address");
    require(
      beneficiary == holder || (nominatedBeneficiary == _nominatedBeneficiary),
      "TitleEscrow: Cannot endorse non-nominee"
    );

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
    require(_nominatedHolder != address(0), "TitleEscrow: Cannot endorse address");
    require(holder != _nominatedHolder, "TitleEscrow: Endorsee is already holder");
    if (nominatedHolder != address(0)) {
      require(
        beneficiary == holder || (nominatedHolder == _nominatedHolder),
        "TitleEscrow: Cannot endorse non-nominee"
      );
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
    require(!_isHoldingToken(), "TitleEscrow: Not surrendered yet");
    require(msg.sender == registry, "TitleEscrow: Caller is not registry");

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
