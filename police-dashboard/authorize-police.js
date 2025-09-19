// Police Authorization Script
import Web3 from 'web3';

const GANACHE_URL = 'http://127.0.0.1:7545';
const CONTRACT_ADDRESS = '0x8CCc009471BB40032D65aB07d4dedDDF1D7312c6';

const CONTRACT_ABI = [
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
  }
];

async function authorizePoliceAccount() {
  try {
    console.log('🚔 Authorizing Police Account for Verification...');
    
    const web3 = new Web3(GANACHE_URL);
    const accounts = await web3.eth.getAccounts();
    
    const ownerAccount = accounts[0]; // Usually the first account is owner
    const policeAccount = accounts[1] || accounts[0]; // Use second account for police, or first if only one
    
    console.log('👑 Owner account:', ownerAccount);
    console.log('👮 Police account:', policeAccount);
    
    const contract = new web3.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS);
    
    // Check current owner
    const contractOwner = await contract.methods.owner().call();
    console.log('📋 Contract owner:', contractOwner);
    
    // Check if police account is already authorized
    const isAlreadyAuthorized = await contract.methods.authorizedVerifiers(policeAccount).call();
    console.log('🔐 Police account already authorized:', isAlreadyAuthorized);
    
    if (!isAlreadyAuthorized) {
      console.log('🔧 Authorizing police account...');
      
      // Add police account as authorized verifier
      const transaction = await contract.methods
        .addAuthorizedVerifier(policeAccount)
        .send({
          from: ownerAccount,
          gas: 100000
        });
      
      console.log('✅ Police account authorized successfully!');
      console.log('📝 Transaction hash:', transaction.transactionHash);
      
      // Verify authorization
      const isNowAuthorized = await contract.methods.authorizedVerifiers(policeAccount).call();
      console.log('🔐 Police account now authorized:', isNowAuthorized);
    } else {
      console.log('✅ Police account is already authorized for verification');
    }
    
    // Also authorize the owner account if it's different
    if (ownerAccount !== policeAccount) {
      const ownerAuthorized = await contract.methods.authorizedVerifiers(ownerAccount).call();
      if (!ownerAuthorized) {
        console.log('🔧 Authorizing owner account...');
        await contract.methods
          .addAuthorizedVerifier(ownerAccount)
          .send({
            from: ownerAccount,
            gas: 100000
          });
        console.log('✅ Owner account also authorized');
      }
    }
    
    console.log('\n🎉 Police authorization completed successfully!');
    console.log('👮 Police dashboard can now verify tourist IDs');
    
  } catch (error) {
    console.error('❌ Police authorization failed:', error);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure Ganache is running');
    console.log('2. Verify the contract address is correct');
    console.log('3. Ensure the first account is the contract owner');
  }
}

// Run the authorization
authorizePoliceAccount();