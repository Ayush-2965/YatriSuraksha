// Simple Police Contract Test
import Web3 from 'web3';

const GANACHE_URL = 'http://127.0.0.1:7545';
const CONTRACT_ADDRESS = '0x57c25fA7AB9F87cEAF924d4387C2C1caeF21D1CE';

// Minimal ABI to test basic connection
const MINIMAL_ABI = [
  {
    "inputs": [],
    "name": "owner",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
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

async function testBasicConnection() {
  try {
    console.log('🔧 Testing basic blockchain connection...');
    
    // Connect to Ganache
    const web3 = new Web3(GANACHE_URL);
    
    // Test connection
    const networkId = await web3.eth.net.getId();
    console.log('✅ Connected to network:', networkId);
    
    // Get accounts
    const accounts = await web3.eth.getAccounts();
    console.log('✅ Available accounts:', accounts.length);
    console.log('👤 First account:', accounts[0]);
    
    // Test contract with minimal ABI
    const contract = new web3.eth.Contract(MINIMAL_ABI, CONTRACT_ADDRESS);
    
    console.log('🔍 Testing contract calls...');
    
    // Test owner call (should work)
    try {
      const owner = await contract.methods.owner().call();
      console.log('✅ Contract owner:', owner);
    } catch (ownerError) {
      console.error('❌ Owner call failed:', ownerError.message);
      return;
    }
    
    // Test getTotalTourists call (should work)
    try {
      const totalTourists = await contract.methods.getTotalTourists().call();
      console.log('✅ Total tourists:', totalTourists);
    } catch (totalError) {
      console.error('❌ GetTotalTourists call failed:', totalError.message);
      return;
    }
    
    console.log('🎉 Basic contract connection successful!');
    console.log('📋 Contract is responding to calls correctly');
    
  } catch (error) {
    console.error('❌ Basic connection test failed:', error);
    console.log('🔧 Make sure Ganache is running and the contract is deployed');
  }
}

testBasicConnection();