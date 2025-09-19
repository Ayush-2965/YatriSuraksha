import { Web3 } from 'web3';
import CryptoJS from 'crypto-js';

// Contract configuration from environment variables
const GANACHE_URL = import.meta.env.VITE_GANACHE_URL || 'http://127.0.0.1:7545';
const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || '0x05bc596015002d3B316949De9D4D6208426b3210';
const BLOCKCHAIN_ENABLED = import.meta.env.VITE_BLOCKCHAIN_ENABLED === 'true';

// Complete Contract ABI from deployment.json - exact match with deployed contract
const CONTRACT_ABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "string",
        "name": "touristId",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "name",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "walletAddress",
        "type": "address"
      }
    ],
    "name": "TouristRegistered",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "string",
        "name": "touristId",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "verifiedBy",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "name": "TouristVerified",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_verifier",
        "type": "address"
      }
    ],
    "name": "addAuthorizedVerifier",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "addressToTouristId",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "allTouristIds",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "authorizedVerifiers",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_touristId",
        "type": "string"
      }
    ],
    "name": "deactivateTourist",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_name",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_mobile",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_aadhaarHash",
        "type": "string"
      }
    ],
    "name": "generateTouristId",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "pure",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getAllTouristIds",
    "outputs": [
      {
        "internalType": "string[]",
        "name": "",
        "type": "string[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getTotalTourists",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_touristId",
        "type": "string"
      }
    ],
    "name": "getTourist",
    "outputs": [
      {
        "internalType": "string",
        "name": "name",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "mobile",
        "type": "string"
      },
      {
        "internalType": "address",
        "name": "walletAddress",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "registrationTimestamp",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "isActive",
        "type": "bool"
      },
      {
        "internalType": "uint256",
        "name": "verificationCount",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_address",
        "type": "address"
      }
    ],
    "name": "getTouristByAddress",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_address",
        "type": "address"
      }
    ],
    "name": "getTouristIdByAddress",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_touristId",
        "type": "string"
      }
    ],
    "name": "isTouristValid",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_touristId",
        "type": "string"
      }
    ],
    "name": "reactivateTourist",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_name",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_mobile",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_aadhaarHash",
        "type": "string"
      }
    ],
    "name": "registerTourist",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "name": "tourists",
    "outputs": [
      {
        "internalType": "string",
        "name": "touristId",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "name",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "mobile",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "aadhaarHash",
        "type": "string"
      },
      {
        "internalType": "address",
        "name": "walletAddress",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "registrationTimestamp",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "isActive",
        "type": "bool"
      },
      {
        "internalType": "uint256",
        "name": "verificationCount",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "name": "verifiedTourists",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_touristId",
        "type": "string"
      }
    ],
    "name": "verifyTourist",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_touristId",
        "type": "string"
      }
    ],
    "name": "verifyTouristId",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      },
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
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
        console.log('⚠️ Blockchain disabled in configuration');
        return false;
      }

      console.log('🔗 Connecting to blockchain at:', GANACHE_URL);
      console.log('📄 Contract address:', CONTRACT_ADDRESS);

      // Use Ganache for police dashboard (development environment)
      this.web3 = new Web3(GANACHE_URL);
      
      // Test connection first
      const networkId = await this.web3.eth.net.getId();
      console.log('🌐 Connected to network ID:', networkId);
      
      // Use first Ganache account
      const accounts = await this.web3.eth.getAccounts();
      if (accounts.length === 0) {
        throw new Error('No accounts available');
      }
      this.account = accounts[0];

      // Load contract with complete ABI
      this.contract = new this.web3.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS);
      
      // Check if account is authorized for verification
      try {
        const isAuthorized = await this.contract.methods.authorizedVerifiers(this.account).call();
        if (!isAuthorized) {
          console.warn('⚠️ Account not authorized for verification:', this.account);
          // Try to authorize using owner account (for development)
          await this.authorizeAccount();
        } else {
          console.log('✅ Account is authorized for verification');
        }
      } catch (error) {
        console.warn('⚠️ Authorization check failed:', error.message);
      }
      
      this.isInitialized = true;
      console.log('✅ Police dashboard blockchain service initialized');
      console.log('📍 Connected account:', this.account);
      
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize blockchain service:', error.message);
      console.log('ℹ️ Police dashboard will work in database-only mode');
      return false;
    }
  }

  // Authorize current account for verification (development helper)
  async authorizeAccount() {
    try {
      const owner = await this.contract.methods.owner().call();
      console.log('📋 Contract owner:', owner);
      
      if (this.account.toLowerCase() === owner.toLowerCase()) {
        console.log('👑 Using owner account, adding self as authorized verifier');
        await this.contract.methods.addAuthorizedVerifier(this.account)
          .send({ from: this.account, gas: 100000 });
        console.log('✅ Successfully authorized account for verification');
      } else {
        console.log('⚠️ Need to authorize account manually - not owner');
      }
    } catch (error) {
      console.error('❌ Failed to authorize account:', error.message);
    }
  }

  // Verify tourist ID
  async verifyTouristId(touristId) {
    try {
      if (!this.isInitialized) {
        console.log('🔄 Blockchain service not initialized, initializing...');
        const initialized = await this.initialize();
        if (!initialized) {
          throw new Error('Blockchain service unavailable');
        }
      }

      console.log('🔍 Verifying tourist ID:', touristId);

      // Validate input first
      if (!touristId || touristId.trim() === '') {
        throw new Error('Tourist ID cannot be empty');
      }

      const cleanTouristId = touristId.trim();
      console.log('🧹 Clean tourist ID:', cleanTouristId);

      // Use the improved verification method
      console.log('📞 Calling contract verifyTouristId method...');
      const result = await this.contract.methods
        .verifyTouristId(cleanTouristId)
        .call();

      console.log('📋 Raw verification result:', result);
      console.log('📋 Result type:', typeof result);
      console.log('📋 Is array:', Array.isArray(result));
      console.log('📋 Object keys:', Object.keys(result));
      console.log('📋 Object values:', Object.values(result));
      console.log('📋 result[0]:', result['0']);
      console.log('📋 result[1]:', result['1']);
      console.log('📋 result[2]:', result['2']);

      // Check if result is valid before processing
      if (result === undefined || result === null) {
        console.error('❌ Contract returned null/undefined result - tourist may not exist');
        return {
          success: true,
          isValid: false,
          message: 'Tourist ID not found on blockchain'
        };
      }

      // Handle different possible return formats from Web3.js
      let isValid, touristName, verificationCount;
      
      if (typeof result === 'object' && result !== null) {
        // Web3.js v4 returns object format with both numeric and named keys
        // Use strict equality checks to handle boolean false values properly
        isValid = Object.prototype.hasOwnProperty.call(result, '0') ? result['0'] : result.isActive;
        touristName = Object.prototype.hasOwnProperty.call(result, '1') ? result['1'] : result.name;
        verificationCount = Object.prototype.hasOwnProperty.call(result, '2') ? result['2'] : result.verificationCount;
      } else if (Array.isArray(result)) {
        if (result.length < 3) {
          throw new Error('Contract returned incomplete data array');
        }
        [isValid, touristName, verificationCount] = result;
      } else if (typeof result === 'boolean') {
        // Handle simple boolean return (some contracts might return just validity)
        isValid = result;
        touristName = 'Unknown';
        verificationCount = 0;
      } else {
        throw new Error(`Unexpected result format from smart contract: ${typeof result}`);
      }

      console.log('📊 Parsed verification result:', { isValid, touristName, verificationCount });

      if (isValid) {
        // Get detailed tourist information
        const touristDetails = await this.contract.methods
          .getTourist(touristId)
          .call();

        console.log('📋 Raw tourist details:', touristDetails);
        console.log('📋 Details type:', typeof touristDetails);
        console.log('📋 Details is array:', Array.isArray(touristDetails));

        // Check if touristDetails is valid before processing
        if (touristDetails === undefined || touristDetails === null) {
          throw new Error('Contract returned null/undefined tourist details');
        }

        // Handle different possible return formats from Web3.js
        let name, mobile, walletAddress, registrationTimestamp, isActive, verificationCountFromDetails;
        
        if (typeof touristDetails === 'object' && touristDetails !== null) {
          // Web3.js v4 returns object format with both numeric and named keys
          name = touristDetails['0'] || touristDetails.name;
          mobile = touristDetails['1'] || touristDetails.mobile;
          walletAddress = touristDetails['2'] || touristDetails.walletAddress;
          registrationTimestamp = touristDetails['3'] || touristDetails.registrationTimestamp;
          isActive = touristDetails['4'] || touristDetails.isActive;
          verificationCountFromDetails = touristDetails['5'] || touristDetails.verificationCount;
        } else if (Array.isArray(touristDetails)) {
          if (touristDetails.length < 6) {
            throw new Error('Contract returned incomplete tourist details array');
          }
          [name, mobile, walletAddress, registrationTimestamp, isActive, verificationCountFromDetails] = touristDetails;
        } else {
          throw new Error(`Unexpected tourist details format from smart contract: ${typeof touristDetails}`);
        }

        console.log('📊 Parsed tourist details:', { 
          name, mobile, walletAddress, registrationTimestamp, isActive, verificationCountFromDetails 
        });

        // Convert BigInt values to regular numbers for JSON serialization
        const timestampNumber = typeof registrationTimestamp === 'bigint' 
          ? Number(registrationTimestamp) 
          : parseInt(registrationTimestamp);
        const verificationCountNumber = typeof (verificationCount || verificationCountFromDetails) === 'bigint'
          ? Number(verificationCount || verificationCountFromDetails)
          : parseInt(verificationCount || verificationCountFromDetails);

        return {
          success: true,
          isValid: true,
          touristData: {
            touristId,
            name: name || touristName,
            mobile,
            walletAddress,
            registrationDate: new Date(timestampNumber * 1000),
            isActive,
            totalTours: 0, // Tours are managed in Appwrite database, not on blockchain
            verificationCount: verificationCountNumber,
            onBlockchain: true
          }
        };
      } else {
        return {
          success: true,
          isValid: false,
          message: 'Tourist ID not found on blockchain'
        };
      }
    } catch (error) {
      console.error('❌ Failed to verify tourist ID:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Police verification
  async markTouristAsVerified(touristId) {
    try {
      if (!this.isInitialized) {
        const initialized = await this.initialize();
        if (!initialized) {
          throw new Error('Blockchain service unavailable');
        }
      }

      // Check authorization before verifying
      const isAuthorized = await this.contract.methods.authorizedVerifiers(this.account).call();
      if (!isAuthorized) {
        throw new Error(`Account ${this.account} is not authorized to verify tourists. Please contact admin.`);
      }

      console.log('🔐 Marking tourist as verified:', touristId);

      const transaction = await this.contract.methods
        .verifyTourist(touristId)
        .send({
          from: this.account,
          gas: 200000
        });

      console.log('✅ Tourist verified successfully');
      return {
        success: true,
        transactionHash: transaction.transactionHash,
        verifiedBy: this.account
      };
    } catch (error) {
      console.error('❌ Failed to verify tourist:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get blockchain statistics
  async getStatistics() {
    try {
      if (!this.isInitialized) {
        const initialized = await this.initialize();
        if (!initialized) {
          return {
            success: false,
            error: 'Blockchain service unavailable'
          };
        }
      }

      const totalTourists = await this.contract.methods.getTotalTourists().call();
      // Note: deployed contract doesn't have getTotalTours function
      const totalTours = 0; // Tours are managed in Appwrite database

      return {
        success: true,
        totalTourists: parseInt(totalTourists),
        totalTours: parseInt(totalTours),
        contractAddress: CONTRACT_ADDRESS,
        network: 'Ganache (Local)',
        accountAddress: this.account
      };
    } catch (error) {
      console.error('❌ Failed to get statistics:', error);
      return {
        success: false,
        error: error.message,
        totalTourists: 0,
        totalTours: 0
      };
    }
  }
}

// Export singleton instance
const blockchainService = new BlockchainService();
export default blockchainService;