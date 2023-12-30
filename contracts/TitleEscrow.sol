// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/interfaces/IERC165.sol";
import "./interfaces/ITitleEscrow.sol";
import "./interfaces/ITradeTrustToken.sol";
import "./interfaces/TitleEscrowErrors.sol";

/**
 * @title TitleEscrow
 * @dev Title escrow contract for managing the beneficiaries and holders of a transferable record.
 */
contract TitleEscrow is Initializable, IERC165, TitleEscrowErrors, ITitleEscrow {
  address public override registry;
  uint256 public override tokenId;

  address public override beneficiary;
  address public override holder;
  address public override attorney;
  bool public attorneySet = false;  // This variable will track if the attorney has been set

  address public override nominee;

  bool public override active;
  mapping(address => uint256) private nonces;

  constructor() initializer {}

  /**
   * @dev Modifier to make a function callable only by the beneficiary.
   */
  modifier onlyBeneficiary() {
    if (msg.sender != beneficiary) {
      revert CallerNotBeneficiary();
    }
    _;
  }

  /**
   * @dev Modifier to make a function callable only by the holder.
   */
  modifier onlyHolder() {
    if (msg.sender != holder) {
      revert CallerNotHolder();
    }
    _;
  }

  /**
   * @dev Modifier to make a function callable only by an authorized attorney.
   */
  modifier onlyAttorney() {
    if (msg.sender != attorney) {
      revert CallerNotAttorney();
    }
    _;
  }

  // Modifier to ensure the function can only be called once
  modifier onlyOnceFirstAttorneySet() { 
    if(attorneySet) {
      revert FirstTimeAttorneyAlreadySet(attorney);
    }
    _;
  }

  modifier onlyHolderSigner(address signer) { 
    if(signer != holder) {
      revert SignerNotHolder(signer);
    }
    _;
  }

   modifier onlyBeneficiarySigner(address signer) { 
    if(signer != beneficiary) {
      revert SignerNotBeneficiary(signer);
    }
    _;
  }

  /**
   * @dev Modifier to ensure the contract is holding the token.
   */
  modifier whenHoldingToken() {
    if (!_isHoldingToken()) {
      revert TitleEscrowNotHoldingToken();
    }
    _;
  }

  /**
   * @dev Modifier to ensure the registry is not paused.
   */
  modifier whenNotPaused() {
    bool paused = Pausable(registry).paused();
    if (paused) {
      revert RegistryContractPaused();
    }
    _;
  }

  /**
   * @dev Modifier to ensure the title escrow is active.
   */
  modifier whenActive() {
    if (!active) {
      revert InactiveTitleEscrow();
    }
    _;
  }

  /**
   * @notice Initializes the TitleEscrow contract with the registry address and the tokenId
   * @param _registry The address of the registry
   * @param _tokenId The id of the token
   */
  function initialize(address _registry, uint256 _tokenId) public virtual initializer {
    __TitleEscrow_init(_registry, _tokenId);
  }

  /**
   * @notice Initializes the TitleEscrow contract with the registry address and the tokenId
   */
  function __TitleEscrow_init(address _registry, uint256 _tokenId) internal virtual onlyInitializing {
    registry = _registry;
    tokenId = _tokenId;
    active = true;
  }

  /**
   * @dev See {ERC165-supportsInterface}.
   */
  function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
    return interfaceId == type(ITitleEscrow).interfaceId;
  }

  /**
   * @dev See {IERC721Receiver-onERC721Received}.
   */
  function onERC721Received(
    address, /* operator */
    address, /* from */
    uint256 _tokenId,
    bytes calldata data
  ) external virtual override whenNotPaused whenActive returns (bytes4) {
    if (_tokenId != tokenId) {
      revert InvalidTokenId(_tokenId);
    }
    if (msg.sender != address(registry)) {
      revert InvalidRegistry(msg.sender);
    }
    bool isMinting = false;
    if (beneficiary == address(0) || holder == address(0)) {
      if (data.length == 0) {
        revert EmptyReceivingData();
      }
      (address _beneficiary, address _holder) = abi.decode(data, (address, address));
      if (_beneficiary == address(0) || _holder == address(0)) {
        revert InvalidTokenTransferToZeroAddressOwners(_beneficiary, _holder);
      }
      _setBeneficiary(_beneficiary);
      _setHolder(_holder);
      isMinting = true;
    }

    emit TokenReceived(beneficiary, holder, isMinting, registry, tokenId);
    return bytes4(keccak256("onERC721Received(address,address,uint256,bytes)"));
  }

  /**
   * @dev See {ITitleEscrow-nominate}.
   */
  function nominate(address _nominee)
    public
    virtual
    override
    whenNotPaused
    whenActive
    onlyBeneficiary
    whenHoldingToken
  {
    if (beneficiary == _nominee) {
      revert TargetNomineeAlreadyBeneficiary();
    }
    if (nominee == _nominee) {
      revert NomineeAlreadyNominated();
    }

    _setNominee(_nominee);
  }

  /**
   * @dev See {ITitleEscrow-nominateByAttorney}.
   */
  function nominateByAttorney(address _beneficiary, address _nominee, bytes memory data, bytes calldata signature, uint256 _nonce) 
    public
    virtual
    override
    whenNotPaused
    whenActive
    whenHoldingToken
    onlyAttorney
    onlyBeneficiarySigner(_beneficiary)
  {
    require(_beneficiary != address(0), "Invalid _beneficiary address");
    require(_nonce == nonces[_beneficiary], "Invalid nonce");
    nonces[_beneficiary]++;
    require(_nominee != address(0), "Invalid _nominee address");
    require(signature.length == 65, "Invalid signature length");
    require(_verifyApprover(_beneficiary, data, signature), "Signature verification failed");
    if (_beneficiary == _nominee) {
      revert TargetNomineeAlreadyBeneficiary();
    }
    if (nominee == _nominee) {
      revert NomineeAlreadyNominated();
    }

    _setNominee(_nominee);
  }

  /**
   * @dev See {ITitleEscrow-transferBeneficiary}.
   */
  function transferBeneficiary(address _nominee)
    public
    virtual
    override
    whenNotPaused
    whenActive
    onlyHolder
    whenHoldingToken
  {
    if (_nominee == address(0)) {
      revert InvalidTransferToZeroAddress();
    }
    if (!(beneficiary == holder || nominee == _nominee)) {
      revert InvalidNominee();
    }

    _setBeneficiary(_nominee);
  }

  /**
   * @dev See {ITitleEscrow-transferHolder}.
   */
  function transferHolder(address newHolder)
    public
    virtual
    override
    whenNotPaused
    whenActive
    onlyHolder
    whenHoldingToken
  {
    if (newHolder == address(0)) {
      revert InvalidTransferToZeroAddress();
    }
    if (holder == newHolder) {
      revert RecipientAlreadyHolder();
    }

    _setHolder(newHolder);
  }

  function transferHolderByAttorney(
    address currentHolder, 
    address newHolder, 
    bytes memory data, 
    bytes calldata signature,
    uint256 _nonce) 
    public 
    virtual
    override
    whenNotPaused
    whenActive
    whenHoldingToken
    onlyAttorney
    onlyHolderSigner(currentHolder)
  {
    require(currentHolder != address(0), "Invalid currentHolder address");
    require(_nonce == nonces[currentHolder], "Invalid nonce");
    nonces[currentHolder]++;
    require(newHolder != address(0), "Invalid newHolder address");
    require(currentHolder == holder, "Invalid newHolder address");
    require(signature.length == 65, "Invalid signature length");    
    require(_verifyApprover(currentHolder, data, signature), "Signature verification failed");

    _setHolder(newHolder);    
  }

  /**
   * @notice Allows the designated attorney to transfer beneficiary from old beneficiary to new beneficiary
   * @param currentBeneficiary The address of the old beneficiary
   * @param newBeneficiary The address of the new holder
   * @param data Data associated with the transfer.
   * @param signature The signature to verify the transfer.
  */
  function transferBeneficiaryByAttorney(
    address currentBeneficiary, 
    address newBeneficiary, 
    bytes memory data, 
    bytes calldata signature,
    uint256 _nonce) 
    public 
    virtual
    override
    whenNotPaused
    whenActive
    whenHoldingToken
    onlyAttorney
    onlyBeneficiarySigner(currentBeneficiary)
  {
    require(currentBeneficiary != address(0), "Invalid currentBeneficiary");
    require(_nonce == nonces[currentBeneficiary], "Invalid nonce");
    nonces[currentBeneficiary]++;
    require(newBeneficiary != address(0), "Invalid newBeneficiary address");
    require(currentBeneficiary == holder, "Invalid newBeneficiary address");
    require(signature.length == 65, "Invalid signature length");
    require(_verifyApprover(currentBeneficiary, data, signature), "Signature verification failed");

    _setBeneficiary(newBeneficiary);
  }

  /**
   * @dev See {ITitleEscrow-transferOwners}.
   */
  function transferOwners(address _nominee, address newHolder) external virtual override {
    transferBeneficiary(_nominee);
    transferHolder(newHolder);
  }

  /**
   * @dev See {ITitleEscrow-nonce}.
   */
  function nonce(address user)  external view override returns (uint256) {
    return  nonces[user];
  }

  /**
   * @dev See {ITitleEscrow-surrender}.
   */
  function surrender() external virtual override whenNotPaused whenActive onlyBeneficiary onlyHolder whenHoldingToken {
    _setNominee(address(0));
    ITradeTrustToken(registry).transferFrom(address(this), registry, tokenId);

    emit Surrender(msg.sender, registry, tokenId);
  }

  /**
   * @dev See {ITitleEscrow-surrenderByAttorney}.
   */
  function surrenderByAttorney(address _beneficiary, address _holder, bytes memory data, bytes calldata signature, uint256 _nonce) 
    external 
    virtual 
    override 
    whenNotPaused 
    whenActive 
    onlyAttorney
    onlyBeneficiarySigner(_beneficiary) 
    onlyHolderSigner(_holder)
    whenHoldingToken 
  {
    require(_beneficiary != address(0), "Invalid _beneficiary address");
    require(_holder != address(0), "Invalid _holder address");
    require(_nonce == nonces[_beneficiary], "Invalid nonce");
    nonces[_beneficiary]++;
    require(signature.length == 65, "Invalid signature length");
    require(_verifyApprover(_beneficiary, data, signature), "Signature verification failed");
    _setNominee(address(0));
    ITradeTrustToken(registry).transferFrom(address(this), registry, tokenId);

    emit Surrender(msg.sender, registry, tokenId);
  }

  /**
   * @dev See {ITitleEscrow-shred}.
   */
  function shred() external virtual override whenNotPaused whenActive {
    if (_isHoldingToken()) {
      revert TokenNotSurrendered();
    }
    if (msg.sender != registry) {
      revert InvalidRegistry(msg.sender);
    }

    _setBeneficiary(address(0));
    _setHolder(address(0));
    active = false;

    emit Shred(registry, tokenId);
  }

  /**
   * @dev See {ITitleEscrow-isHoldingToken}.
   */
  function isHoldingToken() external view override returns (bool) {
    return _isHoldingToken();
  }

  /**
   * @notice Internal function to check if the contract is holding a token
   * @return A boolean indicating whether the contract is holding a token
   */
  function _isHoldingToken() internal view returns (bool) {
    return ITradeTrustToken(registry).ownerOf(tokenId) == address(this);
  }

  /**
   * @notice Sets the nominee
   * @param newNominee The address of the new nominee
   */
  function _setNominee(address newNominee) internal virtual {
    emit Nomination(nominee, newNominee, registry, tokenId);
    nominee = newNominee;
  }

  /**
   * @notice Sets the beneficiary
   * @param newBeneficiary The address of the new beneficiary
   */
  function _setBeneficiary(address newBeneficiary) internal virtual {
    emit BeneficiaryTransfer(beneficiary, newBeneficiary, registry, tokenId);
    _setNominee(address(0));
    beneficiary = newBeneficiary;
  }

  /**
   * @notice Sets the holder
   * @param newHolder The address of the new holder
   */
  function _setHolder(address newHolder) internal virtual {
    emit HolderTransfer(holder, newHolder, registry, tokenId);
    holder = newHolder;
  }

  /**
     * @dev Verifies the transfer of holder using provided parameters and signature.
     * @param aprover The current holder's address.
     * @param data Data associated with the transfer.
     * @param signature The signature to verify the transfer.
     * @return A boolean indicating if the signature matches the current holder's address.
     * @notice This function is private and is intended for internal use within the contract.
    */
    function _verifyApprover(
        address aprover,
        bytes memory data,
        bytes memory signature
    ) private pure returns (bool) {
        bytes32 messageHash = getApprovalHash(data);
        bytes32 ethSignedMessageHash = getEthSignedMessageHash(messageHash);

        return recoverSigner(ethSignedMessageHash, signature) == aprover;
    }

    function recoverSigner(
        bytes32 _ethSignedMessageHash,
        bytes memory _signature
    ) private pure returns (address) {
        (bytes32 r, bytes32 s, uint8 v) = splitSignature(_signature);

        return ecrecover(_ethSignedMessageHash, v, r, s);
    }

    function splitSignature(
        bytes memory sig
    ) private pure returns (bytes32 r, bytes32 s, uint8 v) {
        require(sig.length == 65, "invalid signature length");

        assembly {
            /*
            First 32 bytes stores the length of the signature

            add(sig, 32) = pointer of sig + 32
            effectively, skips first 32 bytes of signature

            mload(p) loads next 32 bytes starting at the memory address p into memory
            */

            // first 32 bytes, after the length prefix
            r := mload(add(sig, 32))
            // second 32 bytes
            s := mload(add(sig, 64))
            // final byte (first byte of the next 32 bytes)
            v := byte(0, mload(add(sig, 96)))
        }

        // implicitly return (r, s, v)
    }

    function getEthSignedMessageHash(
        bytes32 _messageHash
    ) private pure returns (bytes32) {
        /*
        Signature is produced by signing a keccak256 hash with the following format:
        "\x19Ethereum Signed Message\n" + len(msg) + msg
        */
        return
            keccak256(
                abi.encodePacked("\x19Ethereum Signed Message:\n32", _messageHash)
            );
    }

  /**
     * @dev Computes and returns the hash of the transfer holder parameters.
     * @param data Data associated with the transfer.
     * @return A bytes32 hash representing the combination of input parameters.
     * @notice This function is public and pure, ensuring it doesn't modify or interact with the contract's state.
    */
    function getApprovalHash(
        bytes memory data
    ) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(data));
    }

    /**
     * @notice Changes the current attorney to a new address.
     * @param newAttorney The address of the new attorney.
    */
    function changeAttorney(address newAttorney) external onlyAttorney {
      require(newAttorney != address(0), "Invalid attorney address");
      require(newAttorney != attorney, "Same attorney addresses");

      attorney = newAttorney;
      
      // Emit an event or perform other actions as needed
      emit AttorneyChanged(attorney, newAttorney);
    }

    /**
     * @notice Set the current attorney to a new address.
     * @param newAttorney The address of the new attorney.
    */
    function setAttorney(address newAttorney) external onlyOnceFirstAttorneySet{
      attorney = newAttorney;
      attorneySet = true;  // Mark the attorney as set
      emit AttorneyChanged(attorney, newAttorney);
    }
}
