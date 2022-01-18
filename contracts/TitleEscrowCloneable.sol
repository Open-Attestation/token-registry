// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "./access/HasNamedBeneficiaryInitializable.sol";
import "./access/HasHolderInitializable.sol";
import "./interfaces/ITitleEscrowCreator.sol";
import "./interfaces/ITitleEscrow.sol";
import "./lib/Initializable.sol";
import { ERC721, ERC165 } from "./lib/ERC721.sol";


contract TitleEscrowCloneable is Context, Initializable, ITitleEscrow, HasHolderInitializable, HasNamedBeneficiaryInitializable, ERC165  {
  // Documentation on how this smart contract works: https://docs.tradetrust.io/docs/overview/title-transfer

  ITitleEscrow.StatusTypes public override status;

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

  function _transferTo(address newOwner) internal {
    status = StatusTypes.Exited;
    emit TitleCeded(address(tokenRegistry), newOwner, _tokenId);
    tokenRegistry.safeTransferFrom(address(this), address(newOwner), _tokenId);
  }

  function surrender() external override isHoldingToken onlyBeneficiary onlyHolder {
    _transferTo(address(tokenRegistry));
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
