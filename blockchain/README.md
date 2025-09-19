# YatriSuraksha Blockchain Integration

## Overview
This module integrates blockchain technology for immutable tourist ID generation and verification using local Ganache.

## Prerequisites
1. **Ganache Windows App** - Download from [trufflesuite.com/ganache](https://trufflesuite.com/ganache/)
2. **Node.js** - Version 16 or higher
3. **Git** - For version control

## Quick Setup

### 1. Install Ganache
- Download and install Ganache Windows app
- Launch Ganache and create a new workspace
- Set RPC Server to `HTTP://127.0.0.1:7545`
- Note down at least one account's private key

### 2. Configure Environment
```bash
# Run the automated setup script
setup-ganache.bat
```

### 3. Manual Configuration (if needed)
1. Copy your Ganache private key
2. Update `blockchain/.env`:
   ```
   GANACHE_URL=http://127.0.0.1:7545
   PRIVATE_KEY=0x[your-private-key-here]
   ```

## Smart Contract Architecture

### TouristIDRegistry.sol
Main smart contract handling:
- Tourist registration with blockchain ID
- Tour creation and management
- Tourist ID verification
- Police verification logging

### Key Functions
- `registerTourist()` - Creates blockchain tourist ID
- `createTour()` - Records tour on blockchain
- `verifyTouristId()` - Validates tourist identity
- `getTourist()` - Retrieves tourist data

## Web3 Integration

### blockchainService.js
Service layer connecting frontend to blockchain:
- Automatic Ganache connection
- Contract interaction methods
- Error handling and fallbacks
- Environment-based configuration

## Usage Examples

### Generate Tourist ID
```javascript
import { blockchainService } from './blockchainService.js';

const touristId = await blockchainService.registerTourist({
    name: "John Doe",
    aadhaarHash: "hashed_aadhaar_data",
    location: "Mumbai"
});
```

### Verify Tourist ID
```javascript
const isValid = await blockchainService.verifyTouristId("tourist_id_123");
```

## Police Dashboard Integration
- Real-time blockchain verification
- Tourist ID validation
- Verification history tracking
- Statistics and analytics

## File Structure
```
blockchain/
├── contracts/
│   └── TouristIDRegistry.sol    # Main smart contract
├── scripts/
│   ├── deploy.js               # Deployment script
│   └── test-connection.js      # Ganache connection test
├── .env                        # Local environment config
├── .env.example               # Environment template
├── package.json               # Node.js dependencies
└── README.md                  # This file
```

## Environment Variables

### Blockchain Deployment (.env)
```
GANACHE_URL=http://127.0.0.1:7545
PRIVATE_KEY=0x[ganache-account-private-key]
GAS_LIMIT=6721975
GAS_PRICE=20000000000
CONTRACT_ADDRESS=[deployed-contract-address]
```

### Main App (.env)
```
VITE_GANACHE_URL=http://127.0.0.1:7545
VITE_CONTRACT_ADDRESS=[deployed-contract-address]
VITE_BLOCKCHAIN_ENABLED=true
```

## Testing

### Test Ganache Connection
```bash
cd blockchain
node test-connection.js
```

### Deploy Contract
```bash
cd blockchain
node deploy.js
```

## Troubleshooting

### Common Issues

#### 1. Cannot connect to Ganache
- Ensure Ganache Windows app is running
- Check port 7545 is not blocked by firewall
- Verify RPC server settings in Ganache

#### 2. Deployment fails
- Check private key format (must start with 0x)
- Ensure account has sufficient ETH balance
- Verify gas settings in .env file

#### 3. Contract interaction errors
- Confirm contract is deployed (check deployment.json)
- Verify contract address in environment variables
- Check network connection to Ganache

### Gas Settings
- **Gas Limit**: 6,721,975 (Ganache default)
- **Gas Price**: 20 Gwei (20,000,000,000 wei)

## Security Considerations
- Private keys are stored locally in .env files
- Aadhaar data is hashed using SHA256 before blockchain storage
- Tourist data privacy is maintained through cryptographic hashing
- Local blockchain ensures data sovereignty

## Development Workflow
1. Start Ganache Windows app
2. Run `setup-ganache.bat` for initial setup
3. Develop and test features
4. Deploy to production blockchain when ready

## Support
For blockchain-related issues:
1. Check Ganache console for error messages
2. Verify environment configuration
3. Test connection using `test-connection.js`
4. Review deployment logs in console