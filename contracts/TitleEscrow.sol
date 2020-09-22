pragma solidity ^0.5.16;

import "./ERC721.sol";
import "./ITitleEscrow.sol";
import "./ITitleEscrowCreator.sol";

contract HasNamedBeneficiary is Context {
  address public beneficiary;

  constructor(address _beneficiary) internal {
    beneficiary = _beneficiary;
  }

  modifier onlyBeneficiary() {
    require(isBeneficiary(), "HasNamedBeneficiary: only the beneficiary may invoke this function");
    _;
  }

  function isBeneficiary() internal view returns (bool) {
    return _msgSender() == beneficiary;
  }
}

contract HasHolder is Context {
  address public holder;

  event HolderChanged(address indexed previousHolder, address indexed newHolder);
  constructor(address _holder) internal {
    holder = _holder;
    emit HolderChanged(address(0), _holder);
  }

  modifier onlyHolder() {
    require(isHolder(), "HasHolder: only the holder may invoke this function");
    _;
  }

  function isHolder() internal view returns (bool) {
    return _msgSender() == holder;
  }

  function _changeHolder(address newHolder) internal {
    require(newHolder != address(0), "HasHolder: new holder is the zero address");
    emit HolderChanged(holder, newHolder);
    holder = newHolder;
  }
}

contract TitleEscrow is Context, ITitleEscrow, HasNamedBeneficiary, HasHolder, ERC165 {
  event TitleReceived(address indexed _tokenRegistry, address indexed _from, uint256 indexed _id);
  event TitleCeded(address indexed _tokenRegistry, address indexed _to, uint256 indexed _id);
  event TransferOwnerApproval(uint256 indexed _tokenid, address indexed _from, address indexed _to);
  event TransferTitleEscrowApproval(address indexed newBeneficiary, address indexed newHolder);

  // ERC165: Interface for this contract, can be calculated by calculateSelector()
  // Only append new interface id for backward compatibility
  bytes4 private constant _INTERFACE_ID_TITLEESCROW = 0xdcce2211;

  enum StatusTypes {Uninitialised, InUse, Exited}
  StatusTypes public status = StatusTypes.Uninitialised;

  // Information on token held
  ERC721 public tokenRegistry;
  uint256 public _tokenId;

  // Factory to clone this title escrow
  ITitleEscrowCreator public titleEscrowFactory;

  // For exiting into title escrow contracts
  address public approvedBeneficiary;
  address public approvedHolder;

  // For exiting into non-title escrow contracts
  address public approvedOwner;

  //TODO: change ERC721 to address so that external contracts don't need to import ERC721 to use this
  constructor(ERC721 _tokenRegistry, address _beneficiary, address _holder, address _titleEscrowFactoryAddress)
    public
    HasNamedBeneficiary(_beneficiary)
    HasHolder(_holder)
  {
    tokenRegistry = ERC721(_tokenRegistry);
    titleEscrowFactory = ITitleEscrowCreator(_titleEscrowFactoryAddress);
    _registerInterface(_INTERFACE_ID_TITLEESCROW);
  }

  function onERC721Received(address operator, address from, uint256 tokenId, bytes calldata data)
    external
    returns (bytes4)
  {
    require(status == StatusTypes.Uninitialised, "TitleEscrow: Contract has been used before");
    require(
      _msgSender() == address(tokenRegistry),
      "TitleEscrow: Only tokens from predefined token registry can be accepted"
    );
    _tokenId = tokenId;
    emit TitleReceived(_msgSender(), from, _tokenId);
    status = StatusTypes.InUse;
    return bytes4(keccak256("onERC721Received(address,address,uint256,bytes)"));
  }

  function changeHolder(address newHolder) public isHoldingToken onlyHolder {
    _changeHolder(newHolder);
  }

  modifier allowTransferOwner(address newOwner) {
    require(newOwner != address(0), "TitleEscrow: Transferring to 0x0 is not allowed");
    if (holder != beneficiary) {
      require(newOwner == approvedOwner, "TitleEscrow: New owner has not been approved by beneficiary");
    }
    _;
  }

  modifier allowTransferTitleEscrow(address newBeneficiary, address newHolder) {
    require(newBeneficiary != address(0), "TitleEscrow: Transferring to 0x0 is not allowed");
    require(newHolder != address(0), "TitleEscrow: Transferring to 0x0 is not allowed");
    if (holder != beneficiary) {
      require(newBeneficiary == approvedBeneficiary, "TitleEscrow: Beneficiary has not been endorsed by beneficiary");
      require(newHolder == approvedHolder, "TitleEscrow: Holder has not been endorsed by beneficiary");
    }
    _;
  }

  modifier isHoldingToken() {
    require(_tokenId != uint256(0), "TitleEscrow: Contract is not holding a token");
    require(status == StatusTypes.InUse, "TitleEscrow: Contract is not in use");
    require(tokenRegistry.ownerOf(_tokenId) == address(this), "TitleEscrow: Contract is not the owner of token");
    _;
  }

  function approveNewOwner(address newOwner) public isHoldingToken onlyBeneficiary {
    emit TransferOwnerApproval(_tokenId, beneficiary, newOwner);
    approvedOwner = newOwner;
  }

  function _transferTo(address newOwner) private {
    status = StatusTypes.Exited;
    emit TitleCeded(address(tokenRegistry), newOwner, _tokenId);
    tokenRegistry.safeTransferFrom(address(this), address(newOwner), _tokenId);
  }

  function transferTo(address newOwner) public isHoldingToken onlyHolder allowTransferOwner(newOwner) {
    _transferTo(newOwner);
  }

  function transferToNewEscrow(address newBeneficiary, address newHolder)
    public
    isHoldingToken
    onlyHolder
    allowTransferTitleEscrow(newBeneficiary, newHolder)
  {
    address newTitleEscrowAddress = titleEscrowFactory.deployNewTitleEscrow(
      address(tokenRegistry),
      newBeneficiary,
      newHolder
    );
    _transferTo(newTitleEscrowAddress);
  }

  function approveNewTransferTargets(address newBeneficiary, address newHolder) public onlyBeneficiary isHoldingToken {
    require(newBeneficiary != address(0), "TitleEscrow: Transferring to 0x0 is not allowed");
    require(newHolder != address(0), "TitleEscrow: Transferring to 0x0 is not allowed");

    emit TransferTitleEscrowApproval(newBeneficiary, newHolder);

    approvedBeneficiary = newBeneficiary;
    approvedHolder = newHolder;

  }
}
