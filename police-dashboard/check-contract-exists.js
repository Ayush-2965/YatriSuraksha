// Contract Existence Checker
import Web3 from 'web3';

const GANACHE_URL = 'http://127.0.0.1:7545';
const CONTRACT_ADDRESS = '0x57c25fA7AB9F87cEAF924d4387C2C1caeF21D1CE';

async function checkContractExists() {
  try {
    console.log('🔍 Checking if contract exists...');
    
    const web3 = new Web3(GANACHE_URL);
    
    // Check if there's code at the contract address
    const code = await web3.eth.getCode(CONTRACT_ADDRESS);
    console.log('📄 Contract code length:', code.length);
    console.log('📄 Contract code preview:', code.substring(0, 100) + '...');
    
    if (code === '0x' || code.length <= 2) {
      console.log('❌ No contract found at this address!');
      console.log('🔧 The contract may not be deployed or the address is wrong');
      
      // Get all accounts and check their code
      const accounts = await web3.eth.getAccounts();
      console.log('\n🔍 Checking recent transactions for contract deployments...');
      
      for (let i = 0; i < Math.min(accounts.length, 3); i++) {
        const account = accounts[i];
        const balance = await web3.eth.getBalance(account);
        const nonce = await web3.eth.getTransactionCount(account);
        console.log(`Account ${i}: ${account}`);
        console.log(`  Balance: ${web3.utils.fromWei(balance, 'ether')} ETH`);
        console.log(`  Nonce: ${nonce}`);
      }
      
    } else {
      console.log('✅ Contract exists at the address');
      console.log('🔧 The issue might be with the ABI or function signatures');
    }
    
  } catch (error) {
    console.error('❌ Error checking contract:', error.message);
  }
}

checkContractExists();