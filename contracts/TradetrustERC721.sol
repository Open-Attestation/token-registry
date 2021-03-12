pragma solidity ^0.5.16;

import "./ERC721.sol";
import "./TitleEscrow.sol";

// Everything above is imported from OpenZeppelin ERC721 implementation

contract TradeTrustERC721 is ERC721MintableFull, IERC721Receiver {
  event TokenBurnt(uint256 indexed tokenId);
  event TokenReceived(address indexed operator, address indexed from, uint256 indexed tokenId, bytes data);
  event TitleEscrowDeployed(
    address indexed escrowAddress,
    address indexed tokenRegistry,
    address beneficiary,
    address holder
  );
  // event Test(address indexed who);

  // ERC165: Interface for this contract, can be calculated by calculateTradeTrustERC721Selector()
  // Only append new interface id for backward compatibility
  bytes4 private constant _INTERFACE_ID_TRADETRUST_ERC721 = 0xde500ce7;

  constructor(string memory name, string memory symbol) public ERC721MintableFull(name, symbol) {
    // register the supported interface to conform to TradeTrustERC721 via ERC165
    _registerInterface(_INTERFACE_ID_TRADETRUST_ERC721);
  }

  function onERC721Received(
    address _operator,
    address _from,
    uint256 _tokenId,
    bytes memory _data
  ) public returns (bytes4) {
    emit TokenReceived(_operator, _from, _tokenId, _data);
    return this.onERC721Received.selector;
  }

  modifier onlyHolder(uint256 _tokenId) {
    // find owner of tokenId and pass the address it inside "from"
    TitleEscrow currentTitleEscrow = TitleEscrow(ownerOf(_tokenId));
    // emit Test(address(currentTitleEscrow));
    // validate to see if msg.sender is holder here
    require(currentTitleEscrow.holder() == msg.sender, "TradeTrustERC721: only holder has permission.");
    _;
  }

  modifier allowTransferTitleEscrow(address newBeneficiary, address newHolder, uint256 _tokenId) {
    require(newBeneficiary != address(0), "TitleEscrow: Transferring to 0x0 is not allowed");
    require(newHolder != address(0), "TitleEscrow: Transferring to 0x0 is not allowed");
    TitleEscrow currentTitleEscrow = TitleEscrow(ownerOf(_tokenId));
    currentTitleEscrow.approvedBeneficiary;
    if (currentTitleEscrow.holder() != currentTitleEscrow.beneficiary()) {
      require(newBeneficiary == currentTitleEscrow.approvedBeneficiary(), "TitleEscrow: Beneficiary has not been endorsed by beneficiary");
      require(newHolder == currentTitleEscrow.approvedHolder(), "TitleEscrow: Holder has not been endorsed by beneficiary");
    }
    _;
  }

  function destroyToken(uint256 _tokenId) public onlyMinter {
    require(ownerOf(_tokenId) == address(this), "Cannot destroy token: Token not owned by token registry");
    // Burning token to 0xdead instead to show a differentiate state as address(0) is used for unminted tokens
    _safeTransferFrom(ownerOf(_tokenId), 0x000000000000000000000000000000000000dEaD, _tokenId, "");
    emit TokenBurnt(_tokenId);
  }

  function sendToken(address to, uint256 _tokenId) public onlyMinter {
    require(ownerOf(_tokenId) == address(this), "Cannot send token: Token not owned by token registry");
    _safeTransferFrom(ownerOf(_tokenId), to, _tokenId, "");
  }

  function deployNewTitleEscrow(address beneficiary, address holder) external returns (address) {
    TitleEscrow newTitleEscrow = new TitleEscrow(this, beneficiary, holder);
    emit TitleEscrowDeployed(address(newTitleEscrow), address(this), beneficiary, holder);
    // return newTitleEscrow;
    return address(newTitleEscrow);
  }

  function transferToNewTitleEscrow(
    address newBeneficiary,
    address newHolder,
    uint256 _tokenId
  ) public
    onlyHolder(_tokenId)
    allowTransferTitleEscrow(newBeneficiary, newHolder, _tokenId)
    returns (address)
  {
    address newTitleEscrowAddress = this.deployNewTitleEscrow(newBeneficiary, newHolder);
    // // find owner of tokenId and pass the address it inside "from"
    // TitleEscrow currentTitleEscrow = TitleEscrow(ownerOf(_tokenId));
    // // emit Test(address(currentTitleEscrow));
    // // validate to see if msg.sender is holder here
    // require(currentTitleEscrow.holder() == msg.sender, "TradeTrustERC721: only holder has permission.");
    _transferFrom(ownerOf(_tokenId), newTitleEscrowAddress, _tokenId);

  }

}

// contract TradeTrustERC721WithTitleEscrow is TradeTrustERC721 {
  // event TitleEscrowDeployed(
  //   address indexed escrowAddress,
  //   address indexed tokenRegistry,
  //   address beneficiary,
  //   address holder
  // );
  // constructor(string memory name, string memory symbol) public TradeTrustERC721(name, symbol) {}

  // function deployNewTitleEscrow(address beneficiary, address holder) external returns (address) {
  //   TitleEscrow newTitleEscrow = new TitleEscrow(this, beneficiary, holder);
  //   emit TitleEscrowDeployed(address(newTitleEscrow), address(this), beneficiary, holder);
  //   return address(newTitleEscrow);
  // }

  // function transferToNewTitleEscrow(
  //   address newBeneficiary,
  //   address newHolder,
  //   uint256 _tokenId
  // ) public
  // {
  //   address newTitleEscrowAddress = this.deployNewTitleEscrow(newBeneficiary, newHolder);
  //   safeTransferFrom(address(this), newTitleEscrowAddress, _tokenId);
  // }
// }

contract calculateTradeTrustERC721Selector {
  function calculateSelector() public pure returns (bytes4) {
    TradeTrustERC721 i;
    return i.onERC721Received.selector ^ i.destroyToken.selector ^ i.sendToken.selector ^ i.deployNewTitleEscrow.selector ^ i.transferToNewTitleEscrow.selector;
  }
}
