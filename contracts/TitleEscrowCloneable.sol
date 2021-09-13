// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "./Initializable.sol";
import "./Clones.sol";
import "./ITitleEscrow.sol";
import "./ITitleEscrowCreator.sol";
import "./ERC721.sol";

abstract contract HasNamedBeneficiaryInitializable is Context, IHasBeneficiary, Initializable {
  address public override beneficiary;

    function __initialize__beneficiary(address _beneficiary) internal {
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

abstract contract HasHolderInitializable is Context, IHasHolder, Initializable {
  address public override holder;

  function __initialize__holder(address _holder) internal {
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


contract TitleEscrowCloneable is Context, Initializable, ITitleEscrow, HasHolderInitializable, HasNamedBeneficiaryInitializable, ERC165  {
  // Documentation on how this smart contract works: https://docs.tradetrust.io/docs/overview/title-transfer

  StatusTypes public override status;

  // Information on token held
  ERC721 public override tokenRegistry;
  uint256 public _tokenId;

  // Factory to clone this title escrow
  ITitleEscrowCreator public titleEscrowFactory;

  // For exiting into title escrow contracts
  address public override approvedBeneficiary;
  address public override approvedHolder;

  // For exiting into non-title escrow contracts
  address public override approvedOwner;

  function initialize(
    address _tokenRegistry,
    address _beneficiary,
    address _holder,
    address _titleEscrowFactoryAddress
  ) public initializer {
      __initialize__holder(_holder);
      __initialize__beneficiary(_beneficiary);
    tokenRegistry = ERC721(_tokenRegistry);
    titleEscrowFactory = ITitleEscrowCreator(_titleEscrowFactoryAddress);
    status  = StatusTypes.Uninitialised;
  }

  function supportsInterface(bytes4 interfaceId) public view virtual override(ERC165, IERC165) returns (bool) {
    return interfaceId == type(ITitleEscrow).interfaceId;
  }

  function onERC721Received(
    address operator,
    address from,
    uint256 tokenId,
    bytes calldata data
  ) external override returns (bytes4) {
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

  function changeHolder(address newHolder) public override isHoldingToken onlyHolder {
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

  function approveNewOwner(address newOwner) public override isHoldingToken onlyBeneficiary {
    emit TransferOwnerApproval(_tokenId, beneficiary, newOwner);
    approvedOwner = newOwner;
  }

  function _transferTo(address newOwner) private {
    status = StatusTypes.Exited;
    emit TitleCeded(address(tokenRegistry), newOwner, _tokenId);
    tokenRegistry.safeTransferFrom(address(this), address(newOwner), _tokenId);
  }

  function transferTo(address newOwner) public override isHoldingToken onlyHolder allowTransferOwner(newOwner) {
    _transferTo(newOwner);
  }

  function transferToNewEscrow(address newBeneficiary, address newHolder)
    public
    override
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

  function approveNewTransferTargets(address newBeneficiary, address newHolder)
    public
    override
    onlyBeneficiary
    isHoldingToken
  {
    require(newBeneficiary != address(0), "TitleEscrow: Transferring to 0x0 is not allowed");
    require(newHolder != address(0), "TitleEscrow: Transferring to 0x0 is not allowed");

    emit TransferTitleEscrowApproval(newBeneficiary, newHolder);

    approvedBeneficiary = newBeneficiary;
    approvedHolder = newHolder;
  }
}
