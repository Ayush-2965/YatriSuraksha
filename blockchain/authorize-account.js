const Web3 = require('web3');
const fs = require('fs');
require('dotenv').config();

// Complete ABI including authorization functions
const COMPLETE_CONTRACT_ABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "_verifier", "type": "address"}
    ],
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
  }
];

async function authorizeAccount() {
  try {
    console.log('🚀 Starting account authorization process...');
    
    // Read deployment info
    const deploymentPath = './deployment.json';
    if (!fs.existsSync(deploymentPath)) {
      throw new Error('deployment.json not found. Please deploy the contract first.');
    }
    
    const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
    console.log('📄 Contract Address:', deployment.contractAddress);
    console.log('👤 Deployer Address:', deployment.deployer);
    
    // Connect to blockchain
    const web3 = new Web3(deployment.networkUrl || 'http://127.0.0.1:7545');
    
    // Get available accounts
    const accounts = await web3.eth.getAccounts();
    console.log('💳 Available accounts:', accounts.length);
    
    if (accounts.length === 0) {
      throw new Error('No accounts available. Make sure Ganache is running.');
    }
    
    // Create contract instance with complete ABI
    const contract = new web3.eth.Contract(COMPLETE_CONTRACT_ABI, deployment.contractAddress);
    
    // Check contract owner
    let contractOwner;
    try {
      contractOwner = await contract.methods.owner().call();
      console.log('👑 Contract Owner:', contractOwner);
    } catch (error) {
      console.error('❌ Could not get contract owner:', error.message);
      return;
    }
    
    // Find the owner account in available accounts
    const ownerAccount = accounts.find(account => 
      account.toLowerCase() === contractOwner.toLowerCase()
    );
    
    if (!ownerAccount) {
      console.error('❌ Contract owner account not found in available accounts');
      console.log('Contract owner:', contractOwner);
      console.log('Available accounts:', accounts);
      console.log('');
      console.log('💡 Solution: Make sure you are using the same Ganache instance that was used to deploy the contract');
      return;
    }
    
    console.log('✅ Found owner account:', ownerAccount);
    
    // Get the first account (usually the main account) to authorize
    const accountToAuthorize = accounts[0];
    console.log('🔐 Account to authorize:', accountToAuthorize);
    
    // Check if already authorized
    try {
      const isAlreadyAuthorized = await contract.methods.authorizedVerifiers(accountToAuthorize).call();
      const isOwner = accountToAuthorize.toLowerCase() === contractOwner.toLowerCase();
      
      if (isAlreadyAuthorized || isOwner) {
        console.log('✅ Account is already authorized!');
        if (isOwner) {
          console.log('   (Account is the contract owner)');
        } else {
          console.log('   (Account is in authorized verifiers list)');
        }
        
        // Update deployment.json with complete ABI
        await updateDeploymentABI(deployment);
        return;
      }
    } catch (error) {
      console.log('⚠️ Could not check authorization status:', error.message);
    }
    
    // Authorize the account
    console.log('📝 Adding account to authorized verifiers...');
    
    try {
      const gasEstimate = await contract.methods
        .addAuthorizedVerifier(accountToAuthorize)
        .estimateGas({ from: ownerAccount });
      
      const tx = await contract.methods
        .addAuthorizedVerifier(accountToAuthorize)
        .send({
          from: ownerAccount,
          gas: Math.floor(gasEstimate * 1.2)
        });
      
      console.log('✅ Authorization successful!');
      console.log('📋 Transaction Hash:', tx.transactionHash);
      console.log('⛽ Gas Used:', tx.gasUsed);
      
      // Verify authorization
      const isNowAuthorized = await contract.methods.authorizedVerifiers(accountToAuthorize).call();
      console.log('🔍 Verification - Is authorized:', isNowAuthorized);
      
      // Update deployment.json with complete ABI
      await updateDeploymentABI(deployment);
      
    } catch (error) {
      console.error('❌ Authorization failed:', error.message);
      
      if (error.message.includes('Only owner can add verifiers')) {
        console.log('💡 Make sure you are using the contract owner account');
      }
    }
    
  } catch (error) {
    console.error('❌ Error during authorization:', error.message);
  }
}

async function updateDeploymentABI(deployment) {
  console.log('📝 Updating deployment.json with complete ABI...');
  
  const updatedDeployment = {
    ...deployment,
    abi: COMPLETE_CONTRACT_ABI,
    lastUpdated: new Date().toISOString()
  };
  
  fs.writeFileSync('./deployment.json', JSON.stringify(updatedDeployment, null, 2));
  console.log('✅ deployment.json updated with complete ABI');
}

// Run the script
if (require.main === module) {
  authorizeAccount()
    .then(() => {
      console.log('🎉 Authorization process completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Fatal error:', error.message);
      process.exit(1);
    });
}

module.exports = { authorizeAccount, COMPLETE_CONTRACT_ABI };