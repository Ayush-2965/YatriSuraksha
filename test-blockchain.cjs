const { Web3 } = require('web3');
const fs = require('fs');
const path = require('path');

async function testBlockchainConnection() {
    console.log('🔗 Testing blockchain connection...');
    
    try {
        // Read deployment data
        const deploymentPath = path.join(__dirname, 'blockchain', 'deployment.json');
        if (!fs.existsSync(deploymentPath)) {
            throw new Error('deployment.json not found. Please deploy the contract first.');
        }
        
        const contractData = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
        console.log('📄 Contract address:', contractData.contractAddress);
        
        // Test connection to Ganache
        const web3 = new Web3('http://127.0.0.1:7545');
        
        // Test basic connection
        console.log('1. Testing basic connection...');
        const networkId = await web3.eth.net.getId();
        console.log(`✅ Connected to network ID: ${networkId}`);
        
        // Get accounts
        console.log('2. Getting accounts...');
        const accounts = await web3.eth.getAccounts();
        console.log(`✅ Found ${accounts.length} accounts`);
        if (accounts.length > 0) {
            console.log(`First account: ${accounts[0]}`);
        }
        
        // Test contract interaction
        console.log('3. Testing contract interaction...');
        
        // First check if contract exists
        const contractCode = await web3.eth.getCode(contractData.contractAddress);
        if (contractCode === '0x') {
            console.log('❌ No contract found at address. Contract may not be deployed.');
            return;
        }
        console.log('✅ Contract found at address');
        
        // Initialize contract
        const contract = new web3.eth.Contract(contractData.abi, contractData.contractAddress);
        
        // Test contract methods
        console.log('\n📊 Testing contract methods...');
        
        try {
            const totalTourists = await contract.methods.getTotalTourists().call();
            console.log('✅ Total tourists:', totalTourists);
        } catch (err) {
            console.error('❌ Error getting total tourists:', err.message);
        }
        
        try {
            const allIds = await contract.methods.getAllTouristIds().call();
            console.log('✅ All tourist IDs:', allIds);
            console.log('   Tourist IDs length:', allIds.length);
            
            if (allIds.length > 0) {
                const testId = allIds[0];
                console.log('\n🔍 Testing verification for ID:', testId);
                
                // Test verifyTouristId
                try {
                    const verifyResult = await contract.methods.verifyTouristId(testId).call();
                    console.log('✅ Verify result:', verifyResult);
                    console.log('   Type:', typeof verifyResult);
                    console.log('   Is array:', Array.isArray(verifyResult));
                    console.log('   Length:', Array.isArray(verifyResult) ? verifyResult.length : 'N/A');
                    
                    if (Array.isArray(verifyResult)) {
                        console.log('   Values:', verifyResult);
                        verifyResult.forEach((value, index) => {
                            console.log(`   [${index}]:`, value, `(${typeof value})`);
                        });
                    } else if (typeof verifyResult === 'object' && verifyResult !== null) {
                        console.log('   Object keys:', Object.keys(verifyResult));
                        console.log('   Object values:', Object.values(verifyResult));
                        for (const [key, value] of Object.entries(verifyResult)) {
                            console.log(`   ${key}:`, value, `(${typeof value})`);
                        }
                    }
                } catch (err) {
                    console.error('❌ Error in verifyTouristId:', err.message);
                    console.error('   Stack:', err.stack);
                }
                
                // Test getTourist
                try {
                    const touristDetails = await contract.methods.getTourist(testId).call();
                    console.log('\n✅ Tourist details:', touristDetails);
                    console.log('   Type:', typeof touristDetails);
                    console.log('   Is array:', Array.isArray(touristDetails));
                    console.log('   Length:', Array.isArray(touristDetails) ? touristDetails.length : 'N/A');
                    
                    if (Array.isArray(touristDetails)) {
                        console.log('   Values:', touristDetails);
                        touristDetails.forEach((value, index) => {
                            console.log(`   [${index}]:`, value, `(${typeof value})`);
                        });
                    } else if (typeof touristDetails === 'object' && touristDetails !== null) {
                        console.log('   Object keys:', Object.keys(touristDetails));
                        console.log('   Object values:', Object.values(touristDetails));
                        for (const [key, value] of Object.entries(touristDetails)) {
                            console.log(`   ${key}:`, value, `(${typeof value})`);
                        }
                    }
                } catch (err) {
                    console.error('❌ Error in getTourist:', err.message);
                    console.error('   Stack:', err.stack);
                }
            } else {
                console.log('⚠️ No tourists found to test verification');
                console.log('   You may need to register a tourist first through the main app');
            }
        } catch (err) {
            console.error('❌ Error getting tourist IDs:', err.message);
            console.error('   Stack:', err.stack);
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error('Stack:', error.stack);
    }
}

// Run the test
testBlockchainConnection();