pragma solidity ^0.5.11;

import "./ERC721.sol";
import "./ITitleEscrow.sol";

contract HasNamedBeneficiary is Context {
  address public beneficiary;

  constructor(address _beneficiary) internal {
    beneficiary = _beneficiary;
  }

  modifier onlyBeneficiary() {
    require(isBeneficiary(), "HasNamedBeneficiary: only the beneficiary may invoke a transfer");
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
  event TransferEndorsed(uint256 indexed _tokenid, address indexed _from, address indexed _to);

  enum StatusTypes {Uninitialised, InUse, Exited}
  ERC721 public tokenRegistry;
  uint256 public _tokenId;
  address public approvedTransferTarget = address(0);
  StatusTypes public status = StatusTypes.Uninitialised;
  bytes4 private constant _INTERFACE_ID_TITLEESCROW = 0xad3fae94;

  //TODO: change ERC721 to address so that external contracts don't need to import ERC721 to use this
  constructor(ERC721 _tokenRegistry, address _beneficiary, address _holder)
    public
    HasNamedBeneficiary(_beneficiary)
    HasHolder(_holder)
  {
    tokenRegistry = ERC721(_tokenRegistry);
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

  modifier isHoldingToken() {
    require(_tokenId != uint256(0), "TitleEscrow: Contract is not holding a token");
    require(status == StatusTypes.InUse, "TitleEscrow: Contract is not in use");
    require(tokenRegistry.ownerOf(_tokenId) == address(this), "TitleEscrow: Contract is not the owner of token");
    _;
  }

  function endorseTransfer(address newBeneficiary) public isHoldingToken onlyBeneficiary {
    emit TransferEndorsed(_tokenId, beneficiary, newBeneficiary);
    approvedTransferTarget = newBeneficiary;
  }

  function transferTo(address newBeneficiary) public isHoldingToken onlyHolder {
    require(newBeneficiary != address(0), "TitleEscrow: Transferring to 0x0 is not allowed");
    if (holder != beneficiary) {
      require(
        newBeneficiary == approvedTransferTarget,
        "TitleEscrow: Transfer target has not been endorsed by beneficiary"
      );
    }
    status = StatusTypes.Exited;
    emit TitleCeded(address(tokenRegistry), newBeneficiary, _tokenId);
    tokenRegistry.safeTransferFrom(address(this), address(newBeneficiary), _tokenId);
  }
}
