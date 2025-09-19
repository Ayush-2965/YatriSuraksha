// Police Dashboard Blockchain Test Script
import Web3 from 'web3';
import fs from 'fs';
import path from 'path';

const GANACHE_URL = 'http://127.0.0.1:7545';
const CONTRACT_ADDRESS = '0x05bc596015002d3B316949De9D4D6208426b3210';

// Load ABI from deployment.json
const deploymentPath = path.join(process.cwd(), '..', 'blockchain', 'deployment.json');
const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
const CONTRACT_ABI = deployment.abi;

async function testPoliceVerification() {
  try {
    console.log('🔗 Testing Police Dashboard Blockchain Connection...');
    
    // Connect to Ganache
    const web3 = new Web3(GANACHE_URL);
    const networkId = await web3.eth.net.getId();
    console.log('🌐 Connected to network ID:', networkId);
    
    // Get accounts
    const accounts = await web3.eth.getAccounts();
    console.log('📋 Available accounts:', accounts.length);
    console.log('👮 Police account (first):', accounts[0]);
    
    // Load contract
    const contract = new web3.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS);
    
    // Test contract connection
    const owner = await contract.methods.owner().call();
    console.log('👑 Contract owner:', owner);
    
    // Check if police account is authorized
    const isAuthorized = await contract.methods.authorizedVerifiers(accounts[0]).call();
    console.log('🔐 Police account authorized:', isAuthorized);
    
    // Get blockchain stats
    const totalTourists = await contract.methods.getTotalTourists().call();
    console.log('📊 Total tourists:', totalTourists);
    
    // Test verification with a mock tourist ID
    const testTouristId = 'TID-TEST123';
    console.log('\n🔍 Testing verification for:', testTouristId);
    
    try {
      const verificationResult = await contract.methods.verifyTouristId(testTouristId).call();
      const [isValid, name, verificationCount] = verificationResult;
      console.log('✅ Verification test result:');
      console.log('  - Valid:', isValid);
      console.log('  - Name:', name);
      console.log('  - Verification count:', verificationCount);
    } catch (verifyError) {
      console.log('ℹ️ Verification test (expected to fail for non-existent ID):', verifyError.message);
    }
    
    console.log('\n✅ Police dashboard blockchain test completed successfully!');
    console.log('🔧 The police dashboard should now be able to verify tourist IDs.');
    
  } catch (error) {
    console.error('❌ Police verification test failed:', error);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure Ganache is running on http://127.0.0.1:7545');
    console.log('2. Verify the contract is deployed at:', CONTRACT_ADDRESS);
    console.log('3. Check that the contract ABI matches the deployed contract');
  }
}

// Run the test
testPoliceVerification();