// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract TouristIDRegistry {
    struct Tourist {
        string touristId;
        string name;
        string mobile;
        string aadhaarHash;     // Hashed Aadhaar number for privacy
        address walletAddress;
        uint256 registrationTimestamp;
        bool isActive;
        uint256 verificationCount;  // Track how many times this ID was verified
    }
    
    // Mappings
    mapping(string => Tourist) public tourists;
    mapping(address => string) public addressToTouristId;
    mapping(string => bool) public verifiedTourists; // Quick lookup for verified IDs
    
    // Arrays for enumeration
    string[] public allTouristIds;
    
    // Admin/Police addresses (for verification purposes)
    mapping(address => bool) public authorizedVerifiers;
    address public owner;
    
    // Events
    event TouristRegistered(string indexed touristId, string name, address walletAddress);
    event TouristVerified(string indexed touristId, address verifiedBy, uint256 timestamp);
    
    // Modifiers
    modifier onlyActiveTourist(string memory _touristId) {
        require(tourists[_touristId].isActive, "Tourist not found or inactive");
        _;
    }
    
    constructor() {
        owner = msg.sender;
        authorizedVerifiers[msg.sender] = true;
    }
    
    modifier onlyAuthorized() {
        require(authorizedVerifiers[msg.sender] || msg.sender == owner, "Not authorized");
        _;
    }
    
    // Function to add authorized verifiers (police/admin)
    function addAuthorizedVerifier(address _verifier) external {
        require(msg.sender == owner, "Only owner can add verifiers");
        authorizedVerifiers[_verifier] = true;
    }
    
    // Generate Tourist ID from user details
    function generateTouristId(
        string memory _name,
        string memory _mobile,
        string memory _aadhaarHash
    ) public pure returns (string memory) {
        return string(abi.encodePacked(
            "TID-",
            substring(toHexString(uint256(keccak256(abi.encodePacked(_aadhaarHash, _name, _mobile)))), 0, 12)
        ));
    }
    
    // Register a new tourist
    function registerTourist(
        string memory _name,
        string memory _mobile,
        string memory _aadhaarHash
    ) external returns (string memory) {
        string memory touristId = generateTouristId(_name, _mobile, _aadhaarHash);
        
        require(!tourists[touristId].isActive, "Tourist already registered");
        
        tourists[touristId] = Tourist({
            touristId: touristId,
            name: _name,
            mobile: _mobile,
            aadhaarHash: _aadhaarHash,
            walletAddress: msg.sender,
            registrationTimestamp: block.timestamp,
            isActive: true,
            verificationCount: 0
        });
        
        addressToTouristId[msg.sender] = touristId;
        allTouristIds.push(touristId);
        
        emit TouristRegistered(touristId, _name, msg.sender);
        return touristId;
    }
    
    // Verify tourist ID (by police/authorized personnel)
    function verifyTourist(string memory _touristId) external onlyAuthorized returns (bool) {
        require(tourists[_touristId].isActive, "Tourist not found or inactive");
        
        // Increment verification count
        tourists[_touristId].verificationCount++;
        verifiedTourists[_touristId] = true;
        
        emit TouristVerified(_touristId, msg.sender, block.timestamp);
        return true;
    }
    
    // Check if tourist ID exists and is active
    function isTouristValid(string memory _touristId) external view returns (bool) {
        return tourists[_touristId].isActive;
    }
    
    // Get tourist details for verification
    function getTourist(string memory _touristId) external view returns (
        string memory name,
        string memory mobile,
        address walletAddress,
        uint256 registrationTimestamp,
        bool isActive,
        uint256 verificationCount
    ) {
        Tourist memory tourist = tourists[_touristId];
        return (
            tourist.name,
            tourist.mobile,
            tourist.walletAddress,
            tourist.registrationTimestamp,
            tourist.isActive,
            tourist.verificationCount
        );
    }
    
    // Get tourist ID by wallet address
    function getTouristIdByAddress(address _address) external view returns (string memory) {
        return addressToTouristId[_address];
    }
    
    // Get tourist by wallet address
    function getTouristByAddress(address _address) external view returns (string memory) {
        return addressToTouristId[_address];
    }
    
    // Verify if tourist ID exists and is valid (simplified version)
    function verifyTouristId(string memory _touristId) external view returns (bool, string memory, uint256) {
        Tourist memory tourist = tourists[_touristId];
        return (
            tourist.isActive,
            tourist.name,
            tourist.verificationCount
        );
    }
    
    // Get total number of registered tourists
    function getTotalTourists() external view returns (uint256) {
        return allTouristIds.length;
    }
    
    // Get all tourist IDs (for admin purposes)
    function getAllTouristIds() external view returns (string[] memory) {
        return allTouristIds;
    }
    
    // Utility functions
    function toHexString(uint256 value) internal pure returns (string memory) {
        bytes memory buffer = new bytes(64);
        for (uint256 i = 63; i > 0; --i) {
            buffer[i] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
    
    function substring(string memory str, uint startIndex, uint endIndex) internal pure returns (string memory) {
        bytes memory strBytes = bytes(str);
        bytes memory result = new bytes(endIndex - startIndex);
        for (uint i = startIndex; i < endIndex; i++) {
            result[i - startIndex] = strBytes[i];
        }
        return string(result);
    }
    
    // Emergency functions
    function deactivateTourist(string memory _touristId) external onlyAuthorized {
        tourists[_touristId].isActive = false;
    }
    
    function reactivateTourist(string memory _touristId) external onlyAuthorized {
        tourists[_touristId].isActive = true;
    }
}