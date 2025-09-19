import Web3 from 'web3';
import CryptoJS from 'crypto-js';

// Contract configuration from environment variables
const GANACHE_URL = import.meta.env.VITE_GANACHE_URL || 'http://127.0.0.1:7545';
const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || '';
const BLOCKCHAIN_ENABLED = import.meta.env.VITE_BLOCKCHAIN_ENABLED !== 'false';

// Complete Contract ABI including authorization functions
const CONTRACT_ABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [{"internalType": "address", "name": "_verifier", "type": "address"}],
    "name": "addAuthorizedVerifier",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "", "type": "address"}],
    "name": "authorizedVerifiers",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "string", "name": "_name", "type": "string"},
      {"internalType": "string", "name": "_mobile", "type": "string"},
      {"internalType": "string", "name": "_aadhaarHash", "type": "string"}
    ],
    "name": "registerTourist",
    "outputs": [{"internalType": "string", "name": "", "type": "string"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "string", "name": "_touristId", "type": "string"}],
    "name": "verifyTourist",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "string", "name": "_touristId", "type": "string"}],
    "name": "isTouristValid",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "string", "name": "_touristId", "type": "string"}],
    "name": "getTourist",
    "outputs": [
      {"internalType": "string", "name": "name", "type": "string"},
      {"internalType": "string", "name": "mobile", "type": "string"},
      {"internalType": "address", "name": "walletAddress", "type": "address"},
      {"internalType": "uint256", "name": "registrationTimestamp", "type": "uint256"},
      {"internalType": "bool", "name": "isActive", "type": "bool"},
      {"internalType": "uint256", "name": "verificationCount", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "string", "name": "_touristId", "type": "string"}],
    "name": "verifyTouristId",
    "outputs": [
      {"internalType": "bool", "name": "", "type": "bool"},
      {"internalType": "string", "name": "", "type": "string"},
      {"internalType": "uint256", "name": "", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getTotalTourists",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
];

class BlockchainService {
  constructor() {
    this.web3 = null;
    this.contract = null;
    this.account = null;
    this.isInitialized = false;
  }

  async initialize() {
    try {
      // Check if blockchain is enabled
      if (!BLOCKCHAIN_ENABLED) {
        console.log('⚠️ Blockchain disabled in environment');
        return false;
      }

      // Check if we're in a browser environment
      if (typeof window !== 'undefined' && window.ethereum) {
        // Use MetaMask or other Web3 provider
        this.web3 = new Web3(window.ethereum);
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const accounts = await this.web3.eth.getAccounts();
        this.account = accounts[0];
      } else {
        // Use Ganache for development
        this.web3 = new Web3(GANACHE_URL);
        // Use first Ganache account
        const accounts = await this.web3.eth.getAccounts();
        this.account = accounts[0];
      }

      if (!CONTRACT_ADDRESS) {
        console.warn('⚠️ Contract address not set. Please deploy the contract first.');
        return false;
      }

      // Load contract
      this.contract = new this.web3.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS);
      this.isInitialized = true;
      
      console.log('✅ Blockchain service initialized');
      console.log('🔗 Connected to:', GANACHE_URL);
      console.log('📄 Contract address:', CONTRACT_ADDRESS);
      console.log('📍 Connected account:', this.account);
      
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize blockchain service:', error);
      return false;
    }
  }

  // Generate tourist ID hash (matches smart contract logic)
  generateTouristIdHash(aadhaarNumber, userName, userMobile) {
    // Hash Aadhaar for privacy
    const aadhaarHash = CryptoJS.SHA256(aadhaarNumber).toString();
    
    // Combine all details
    const combinedData = `${aadhaarHash}${userName}${userMobile}`;
    
    // Generate final hash
    const finalHash = CryptoJS.SHA256(combinedData).toString();
    
    // Create tourist ID
    const touristId = `TID-${finalHash.substring(0, 12).toUpperCase()}`;
    
    return {
      touristId,
      aadhaarHash,
      dataHash: finalHash
    };
  }

  // Register tourist on blockchain
  async registerTourist(aadhaarNumber, userName, userMobile) {
    try {
      if (!this.isInitialized) {
        const initialized = await this.initialize();
        if (!initialized) {
          throw new Error('Blockchain service not available');
        }
      }

      console.log('🔗 Registering tourist on blockchain...');
      
      const { touristId, aadhaarHash } = this.generateTouristIdHash(aadhaarNumber, userName, userMobile);
      
      console.log('🆔 Generated Tourist ID:', touristId);
      console.log('📱 Mobile:', userMobile);
      console.log('🏷️ Name:', userName);

      // Estimate gas first
      let gasEstimate;
      try {
        gasEstimate = await this.contract.methods
          .registerTourist(userName, userMobile, aadhaarHash)
          .estimateGas({ from: this.account });
        console.log('⛽ Estimated gas:', gasEstimate);
      } catch (gasError) {
        console.warn('⚠️ Could not estimate gas, using default:', gasError.message);
        gasEstimate = 3000000; // Default gas limit
      }

      // Register tourist on blockchain
      const tx = await this.contract.methods
        .registerTourist(userName, userMobile, aadhaarHash)
        .send({
          from: this.account,
          gas: Math.min(Number(gasEstimate) * 2, 6000000) // Add buffer, cap at 6M
        });

      console.log('✅ Tourist registered on blockchain!');
      console.log('📄 Transaction hash:', tx.transactionHash);
      console.log('🔢 Block number:', tx.blockNumber);

      return {
        success: true,
        touristId,
        transactionHash: tx.transactionHash,
        blockNumber: tx.blockNumber,
        aadhaarHash
      };
    } catch (error) {
      console.error('❌ Failed to register tourist:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Verify tourist ID on blockchain
  async verifyTouristId(touristId) {
    try {
      if (!this.isInitialized) {
        const initialized = await this.initialize();
        if (!initialized) {
          throw new Error('Blockchain service not available');
        }
      }

      console.log('🔍 Verifying tourist ID on blockchain:', touristId);

      // Check if tourist exists and is active
      const isValid = await this.contract.methods
        .isTouristValid(touristId)
        .call();

      if (!isValid) {
        return {
          success: false,
          valid: false,
          message: 'Tourist ID not found or inactive'
        };
      }

      // Get tourist details
      const tourist = await this.contract.methods
        .getTourist(touristId)
        .call();

      // Record verification on blockchain (if called by authorized verifier)
      let verificationTx = null;
      try {
        console.log('🔐 Checking authorization and attempting verification...');
        
        // Check if the current account is authorized
        const isAuthorized = await this.contract.methods
          .authorizedVerifiers(this.account)
          .call();
          
        const contractOwner = await this.contract.methods.owner().call();
        const isOwner = this.account.toLowerCase() === contractOwner.toLowerCase();
        
        console.log('🔍 Authorization check:', {
          account: this.account,
          isAuthorized,
          isOwner,
          contractOwner
        });
        
        if (isAuthorized || isOwner) {
          console.log('✅ Account is authorized, recording verification...');
          
          const estimatedGas = await this.contract.methods
            .verifyTourist(touristId)
            .estimateGas({ from: this.account });
            
          const tx = await this.contract.methods
            .verifyTourist(touristId)
            .send({
              from: this.account,
              gas: Math.floor(estimatedGas * 1.2) // Add 20% buffer
            });
          verificationTx = tx.transactionHash;
          console.log('✅ Verification recorded on blockchain:', verificationTx);
        } else {
          console.warn('⚠️ Account is not authorized to record verification on blockchain');
          console.log('💡 Run the authorization script: authorize-blockchain.bat');
        }
      } catch (authError) {
        console.warn('⚠️ Could not record verification on blockchain:', authError.message);
        if (authError.message.includes('Not authorized')) {
          console.warn('⚠️ Account is not authorized to record verifications');
          console.log('💡 Run: authorize-blockchain.bat to authorize your account');
        } else if (authError.message.includes('stack underflow')) {
          console.warn('⚠️ Smart contract execution error - check contract deployment and ABI');
        }
        // Don't throw the error - continue with the verification result
      }

      return {
        success: true,
        valid: true,
        tourist: {
          name: tourist[0],
          mobile: tourist[1],
          registrationTimestamp: tourist[3],
          verificationCount: tourist[5]
        },
        verificationTx
      };
    } catch (error) {
      console.error('❌ Failed to verify tourist ID:', error);
      
      // Provide more specific error handling
      let errorMessage = error.message;
      if (error.message.includes('stack underflow')) {
        errorMessage = 'Smart contract execution error - possibly due to missing authorization or contract issue';
      } else if (error.message.includes('Tourist not found')) {
        errorMessage = 'Tourist ID not found on blockchain';
      }
      
      return {
        success: false,
        valid: false,
        error: errorMessage,
        blockchainError: true // Flag to indicate this is a blockchain-specific error
      };
    }
  }

  // Get blockchain statistics
  async getStatistics() {
    try {
      if (!this.isInitialized) {
        const initialized = await this.initialize();
        if (!initialized) {
          return { totalTourists: 0, blockchainEnabled: false };
        }
      }

      const totalTourists = await this.contract.methods
        .getTotalTourists()
        .call();

      return {
        totalTourists: parseInt(totalTourists),
        blockchainEnabled: true,
        contractAddress: CONTRACT_ADDRESS,
        network: GANACHE_URL
      };
    } catch (error) {
      console.error('❌ Failed to get blockchain statistics:', error);
      return { totalTourists: 0, blockchainEnabled: false };
    }
  }

  // Check if blockchain service is available
  isAvailable() {
    return BLOCKCHAIN_ENABLED && this.isInitialized;
  }
}

// Export singleton instance
const blockchainService = new BlockchainService();
export default blockchainService;