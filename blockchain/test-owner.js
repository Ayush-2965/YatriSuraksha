const fs = require('fs');

async function testOwnerCall() {
  console.log('🧪 Testing owner() function call...');
  
  try {
    const web3Module = require('web3');
    const Web3Class = web3Module.Web3 || web3Module;
    const web3 = new Web3Class('http://127.0.0.1:7545');
    
    const deployment = JSON.parse(fs.readFileSync('./deployment.json', 'utf8'));
    const contract = new web3.eth.Contract(deployment.abi, deployment.contractAddress);
    
    console.log('📞 Calling owner()...');
    const owner = await contract.methods.owner().call();
    console.log('✅ Success! Owner:', owner);
    
    console.log('📞 Calling authorizedVerifiers for first account...');
    const accounts = await web3.eth.getAccounts();
    const isAuth = await contract.methods.authorizedVerifiers(accounts[0]).call();
    console.log('✅ Success! Is authorized:', isAuth);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testOwnerCall();