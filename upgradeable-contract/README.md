# AdsBazaar Diamond Deployment

## 🚀 Quick Deployment Guide

### Prerequisites
1. Private key with some CELO/ETH for gas
2. Self protocol scope (from Self SDK)

### Setup
1. Copy and edit environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your PRIVATE_KEY
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Deployment Commands

#### Option 1: Hardhat (Recommended)
```bash
# Deploy to Celo testnet (Alfajores)
npx hardhat run scripts/deploy.js --network alfajores

# Deploy to Celo mainnet
npx hardhat run scripts/deploy.js --network celo
```

#### Option 2: Forge (Alternative)
```bash
# Deploy to Celo testnet
forge script script/DeployDiamond.s.sol --rpc-url https://alfajores-forno.celo-testnet.org --broadcast

# Deploy to Celo mainnet
forge script script/DeployDiamond.s.sol --rpc-url https://forno.celo.org --broadcast
```

### Post-Deployment
1. Save the Diamond contract address from the deployment output
2. Use this address in your frontend - it supports all AdsBazaar functions
3. The contract is now upgradeable through diamond cuts

### Getting Test Tokens
For testnet deployment, get test tokens from:
- Celo Alfajores Faucet: https://faucet.celo.org/alfajores
- Test cUSD will be available after getting CELO

### Contract Verification
The contracts will be automatically verified if you provide ETHERSCAN_API_KEY in .env

### Upgrading
To add new facets or upgrade existing ones:
1. Deploy new facet contract
2. Use diamondCut function to add/replace/remove functions
3. Frontend automatically gets new functionality

## 📋 Expected Output
```
Diamond deployed: 0x1234567890123456789012345678901234567890
DiamondLoupeFacet deployed: 0x...
UserManagementFacet deployed: 0x...
...
=== DEPLOYMENT COMPLETE ===
Diamond Address: 0x1234567890123456789012345678901234567890
Use this address in your frontend!
```

## 🔧 Troubleshooting
- **Compilation errors**: Make sure all Solidity versions are configured
- **Gas issues**: Ensure you have enough CELO for gas fees
- **RPC errors**: Check your internet connection and RPC URLs
- **Self contracts**: Ensure Self contracts are properly installed in node_modules