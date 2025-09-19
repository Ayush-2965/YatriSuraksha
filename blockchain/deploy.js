const fs = require('fs');
const path = require('path');
const { Web3 } = require('web3');
require('dotenv').config();

// Configuration
const GANACHE_URL = process.env.GANACHE_URL || 'http://127.0.0.1:7545';
const PRIVATE_KEY = process.env.PRIVATE_KEY;

if (!PRIVATE_KEY) {
    console.error('❌ PRIVATE_KEY not found in .env file');
    process.exit(1);
}

async function deployContract() {
    try {
        console.log('🔗 Connecting to Ganache at', GANACHE_URL);
        
        // Connect to Ganache
        const web3 = new Web3(GANACHE_URL);
        
        // Create account from private key
        const account = web3.eth.accounts.privateKeyToAccount(PRIVATE_KEY);
        web3.eth.accounts.wallet.add(account);
        web3.eth.defaultAccount = account.address;
        
        console.log('👤 Deploying from account:', account.address);
        
        // Check balance
        const balance = await web3.eth.getBalance(account.address);
        console.log('💰 Account balance:', web3.utils.fromWei(balance, 'ether'), 'ETH');
        
        if (balance === '0') {
            console.error('❌ Account has no ETH for deployment');
            throw new Error('Insufficient balance for deployment');
        }
        
        // Load compiled contract
        const contractPath = path.join(__dirname, 'artifacts/contracts/TouristIDRegistry.sol/TouristIDRegistry.json');
        
        if (!fs.existsSync(contractPath)) {
            console.error('❌ Compiled contract not found at:', contractPath);
            console.log('💡 Run "npm run compile" first to compile the contract');
            throw new Error('Contract not compiled');
        }
        
        const contractJson = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
        const contractABI = contractJson.abi;
        const contractBytecode = contractJson.bytecode;
        
        if (!contractBytecode || contractBytecode === '0x') {
            console.error('❌ Invalid contract bytecode');
            throw new Error('Contract compilation failed - no bytecode');
        }
        
        console.log('📄 Using compiled contract with', contractABI.length, 'ABI items');
        
        // Deploy contract
        console.log('🚀 Starting contract deployment...');
        
        const deployContract = new web3.eth.Contract(contractABI);
        const deployTx = deployContract.deploy({
            data: contractBytecode
        });
        
        // Estimate gas for deployment
        let gasEstimate;
        try {
            gasEstimate = await deployTx.estimateGas({ from: account.address });
            console.log('⛽ Estimated gas:', gasEstimate);
            // Convert BigInt to number
            gasEstimate = Number(gasEstimate);
        } catch (error) {
            console.warn('⚠️ Could not estimate gas, using Ganache default: 6721975');
            gasEstimate = 6721975; // Ganache default
        }
        
        // Deploy contract (let Ganache handle gas price)
        const deployedContract = await deployTx.send({
            from: account.address,
            gas: Math.min(gasEstimate * 2, 6721975) // Use Ganache's block gas limit
        });
        
        console.log('✅ Contract deployed successfully!');
        console.log('📄 Contract address:', deployedContract.options.address);
        
        // Update .env file with contract address
        const envPath = path.join(__dirname, '.env');
        let envContent = fs.readFileSync(envPath, 'utf8');
        
        envContent = envContent.replace(
            /CONTRACT_ADDRESS=.*/,
            `CONTRACT_ADDRESS=${deployedContract.options.address}`
        );
        
        fs.writeFileSync(envPath, envContent);
        console.log('📝 Updated .env file with contract address');
        
        // Save deployment info
        const deploymentInfo = {
            contractAddress: deployedContract.options.address,
            abi: contractABI,
            deployer: account.address,
            network: 'ganache',
            networkUrl: GANACHE_URL,
            deployedAt: new Date().toISOString(),
            gasUsed: deployedContract.gasUsed || 'Unknown'
        };
        
        fs.writeFileSync(
            path.join(__dirname, 'deployment.json'),
            JSON.stringify(deploymentInfo, null, 2)
        );
        
        console.log('💾 Deployment info saved to deployment.json');
        
        return deploymentInfo;
        
    } catch (error) {
        console.error('❌ Deployment failed:', error.message);
        throw error;
    }
}

if (require.main === module) {
    deployContract()
        .then(() => {
            console.log('\n🎉 Deployment completed successfully!');
            console.log('💡 Next steps:');
            console.log('   1. Update your main app with the contract address');
            console.log('   2. Start testing tourist ID generation');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 Deployment failed:', error.message);
            console.log('\n🔧 Make sure Ganache is running on:', GANACHE_URL);
            process.exit(1);
        });
}

module.exports = { deployContract };