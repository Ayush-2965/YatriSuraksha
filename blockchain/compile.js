const fs = require('fs');
const path = require('path');
const solc = require('solc');

function compileContract() {
    console.log('📄 Compiling TouristIDRegistry.sol...');
    
    // Read the contract source
    const contractPath = path.join(__dirname, 'contracts', 'TouristIDRegistry.sol');
    const contractSource = fs.readFileSync(contractPath, 'utf8');
    
    // Prepare input for the compiler
    const input = {
        language: 'Solidity',
        sources: {
            'TouristIDRegistry.sol': {
                content: contractSource,
            },
        },
        settings: {
            outputSelection: {
                '*': {
                    '*': ['abi', 'evm.bytecode'],
                },
            },
            optimizer: {
                enabled: true,
                runs: 200,
            },
        },
    };
    
    // Compile the contract
    const compiled = JSON.parse(solc.compile(JSON.stringify(input)));

    if (compiled.errors) {
        console.log('⚠️ Compilation warnings/errors:');
        compiled.errors.forEach(error => {
            if (error.severity === 'error') {
                console.error('❌', error.formattedMessage);
                process.exit(1);
            } else {
                console.warn('⚠️', error.formattedMessage);
            }
        });
    }
    
    // Extract the compiled contract
    const contractData = compiled.contracts['TouristIDRegistry.sol']['TouristIDRegistry'];
    
    if (!contractData) {
        console.error('❌ Failed to compile contract');
        console.log('Available contracts:', Object.keys(compiled.contracts || {}));
        if (compiled.contracts) {
            Object.keys(compiled.contracts).forEach(file => {
                console.log(`  ${file}:`, Object.keys(compiled.contracts[file]));
            });
        }
        process.exit(1);
    }
    
    console.log('Debug: contractData keys:', Object.keys(contractData));
    
    const abi = contractData.abi;
    let bytecode = null;
    
    if (contractData.evm && contractData.evm.bytecode && contractData.evm.bytecode.object) {
        bytecode = contractData.evm.bytecode.object;
    } else if (contractData.bytecode) {
        if (typeof contractData.bytecode === 'string') {
            bytecode = contractData.bytecode;
        } else if (contractData.bytecode.object) {
            bytecode = contractData.bytecode.object;
        }
    }
    
    console.log('Debug: bytecode found:', !!bytecode);
    console.log('Debug: bytecode length:', bytecode ? bytecode.length : 0);
    
    if (!bytecode || bytecode.length === 0) {
        console.error('❌ No bytecode found in compiled contract');
        console.log('Debug: Full contractData structure keys:', Object.keys(contractData));
        if (contractData.evm) {
            console.log('Debug: EVM keys:', Object.keys(contractData.evm));
        }
        process.exit(1);
    }
    
    console.log('✅ Contract compiled successfully!');
    console.log(`📊 Bytecode size: ${bytecode.length / 2} bytes`);
    
    // Save compiled contract
    const compiledContract = {
        contractName: 'TouristIDRegistry',
        abi: abi,
        bytecode: '0x' + bytecode,
        compiledAt: new Date().toISOString()
    };
    
    fs.writeFileSync(
        path.join(__dirname, 'compiled-contract.json'),
        JSON.stringify(compiledContract, null, 2)
    );
    
    console.log('💾 Compiled contract saved to compiled-contract.json');
    
    return compiledContract;
}

module.exports = { compileContract };

// Run compilation if this file is executed directly
if (require.main === module) {
    compileContract();
}