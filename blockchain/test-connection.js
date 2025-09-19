require('dotenv').config({ path: '.env' });
const { Web3 } = require('web3');

async function testGanacheConnection() {
    console.log('🔗 Testing Ganache Connection...');
    
    try {
        const ganacheUrl = process.env.GANACHE_URL || 'http://127.0.0.1:7545';
        console.log(`📡 Connecting to: ${ganacheUrl}`);
        
        const web3 = new Web3(ganacheUrl);
        
        // Test connection
        const accounts = await web3.eth.getAccounts();
        console.log(`✅ Connected! Found ${accounts.length} accounts`);
        
        // Check balances
        for (let i = 0; i < Math.min(3, accounts.length); i++) {
            const balance = await web3.eth.getBalance(accounts[i]);
            const ethBalance = web3.utils.fromWei(balance, 'ether');
            console.log(`   Account ${i + 1}: ${accounts[i]} (${ethBalance} ETH)`);
        }
        
        // Test network info
        const networkId = await web3.eth.net.getId();
        const gasPrice = await web3.eth.getGasPrice();
        
        console.log(`🌐 Network ID: ${networkId}`);
        console.log(`⛽ Gas Price: ${web3.utils.fromWei(gasPrice, 'gwei')} Gwei`);
        
        console.log('\n✅ All tests passed! Ganache is ready for blockchain deployment.');
        
    } catch (error) {
        console.error('❌ Connection failed:', error.message);
        console.error('\n🔧 Troubleshooting steps:');
        console.error('   1. Ensure Ganache Windows app is running');
        console.error('   2. Check that server is on 127.0.0.1:7545');
        console.error('   3. Verify no firewall is blocking port 7545');
        console.error('   4. Make sure at least one account has ETH balance');
        process.exit(1);
    }
}

testGanacheConnection();