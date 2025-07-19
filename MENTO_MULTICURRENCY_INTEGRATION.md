# 🌍 Mento Multi-Currency Integration for AdsBazaar

A comprehensive implementation of multi-currency support using all 6 Mento Protocol stablecoins (cUSD, cEUR, cREAL, cKES, eXOF, cNGN) for the AdsBazaar platform.

## 📋 Overview

This integration enables brands to create campaigns and pay influencers in any supported Mento stablecoin, providing true global currency support for the advertising platform.

### 🚀 Key Features

- **6 Supported Currencies**: cUSD, cEUR, cREAL, cKES, eXOF, cNGN
- **Real Mento Protocol Integration**: Live exchange rates and swap functionality
- **Multi-Currency Campaigns**: Create campaigns in any supported currency
- **Flexible Payment Claims**: Claim payments individually or in bulk
- **Currency Preferences**: Set preferred payment currencies
- **Real-time Exchange Rates**: Live rates from Mento Protocol with fallbacks
- **Backward Compatibility**: Existing cUSD campaigns continue to work

## 🏗️ Architecture

### Smart Contracts

#### Core Libraries
- `LibMultiCurrencyAdsBazaar.sol` - Multi-currency storage and utilities
- `LibAdsBazaar.sol` - Enhanced with multi-currency support (unchanged interface)

#### New Facets
- `MultiCurrencyPaymentFacet.sol` - Multi-currency payment claims and management
- `MultiCurrencyCampaignFacet.sol` - Campaign creation with any supported token

#### Enhanced Storage
```solidity
struct MultiCurrencyStorage {
    mapping(address => bool) supportedTokens;
    mapping(bytes32 => address) campaignTokens;
    mapping(address => mapping(address => uint256)) influencerPendingByToken;
    mapping(address => uint256) totalEscrowByToken;
    // ... additional multi-currency state
}
```

### Frontend Integration

#### Real Mento SDK Integration
- Replaced mock data with `@mento-protocol/mento-sdk`
- Live exchange rates and swap functionality
- Production-ready error handling and fallbacks

#### Enhanced Hooks
- `useMultiCurrencyCampaignCreation()` - Create campaigns with any token
- `useMultiCurrencyPayments()` - Claim payments in specific currencies
- `useMultiCurrencyPendingPayments()` - Track payments across all currencies
- `useExchangeRates()` - Real-time exchange rate management

## 🚀 Deployment Guide

### Prerequisites

1. **Environment Setup**
```bash
# Install dependencies
cd frontend && npm install @mento-protocol/mento-sdk
cd ../upgradeable-contract && npm install
```

2. **Environment Variables**
```bash
export PRIVATE_KEY="your_private_key"
export CELO_RPC_URL="https://forno.celo.org"
```

### Smart Contract Deployment

#### Step 1: Deploy Multi-Currency Diamond

```bash
cd upgradeable-contract
forge script script/DeployMultiCurrencyDiamond.s.sol --rpc-url $CELO_RPC_URL --broadcast --verify
```

This deploys:
- All existing AdsBazaar facets
- New `MultiCurrencyPaymentFacet`
- New `MultiCurrencyCampaignFacet`
- Initializes multi-currency support

#### Step 2: Update Frontend Configuration

Update `/frontend/lib/contracts.ts` with the new Diamond address:

```typescript
const CONTRACT_ADDRESSES = {
  42220: { // Celo Mainnet
    ADS_BAZAAR_MULTICURRENCY: "0xYOUR_NEW_DIAMOND_ADDRESS", // Update this
    // ... other addresses
  },
  44787: { // Alfajores
    ADS_BAZAAR_MULTICURRENCY: "0xYOUR_NEW_DIAMOND_ADDRESS", // Update this
    // ... other addresses
  }
};
```

#### Step 3: Update Contract ABIs

Copy the generated ABI from `/upgradeable-contract/combined-abi/AdsBazaarDiamond.json` to frontend contracts configuration.

### Frontend Deployment

```bash
cd frontend
npm run build
npm start
```

## 💰 Supported Currencies

| Currency | Symbol | Network | Contract Address |
|----------|--------|---------|------------------|
| Celo Dollar | cUSD | Mainnet | `0x765DE816845861e75A25fCA122bb6898B8B1282a` |
| Celo Euro | cEUR | Mainnet | `0xD8763CBa276a3738E6DE85b4b3bF5FDed6D6cA73` |
| Celo Brazilian Real | cREAL | Mainnet | `0xe8537a3d056DA446677B9E9d6c5dB704EaAb4787` |
| Celo Kenyan Shilling | cKES | Mainnet | `0x456a3D042C0DbD3db53D5489e98dFb038553B0d0` |
| CFA Franc | eXOF | Mainnet | `0x73F93dcc49cB8A239e2032663e9475dd5ef29A08` |
| Celo Nigerian Naira | cNGN | Mainnet | `0x17700282592D6917F6A73D0bF8AcCf4D578c131e` |

## 🔧 Usage Examples

### Creating Multi-Currency Campaigns

```typescript
import { useMultiCurrencyCampaignCreation } from '@/hooks/useMultiCurrencyAdsBazaar';

const { createCampaignWithToken } = useMultiCurrencyCampaignCreation();

// Create campaign with Nigerian Naira
await createCampaignWithToken(
  {
    name: "Lagos Fashion Week",
    description: "Promote local fashion brands",
    budget: "50000", // 50,000 cNGN
    // ... other campaign data
  },
  'cNGN'
);
```

### Claiming Multi-Currency Payments

```typescript
import { useMultiCurrencyPayments } from '@/hooks/useMultiCurrencyAdsBazaar';

const { claimPaymentsInToken, claimAllPendingPayments } = useMultiCurrencyPayments();

// Claim specific currency
await claimPaymentsInToken('cEUR');

// Claim all pending payments across all currencies
await claimAllPendingPayments();
```

### Real Exchange Rates

```typescript
import { mentoFX } from '@/lib/mento-integration';

// Get live exchange rate
const rate = await mentoFX.getExchangeRate('cNGN', 'cUSD');
console.log(`1 cNGN = ${rate} cUSD`);

// Convert amounts
const converted = await mentoFX.convertCurrency('1000', 'cNGN', 'cEUR');
console.log(`1000 cNGN = ${converted} cEUR`);
```

## 🌐 Regional Benefits

### 🇳🇬 Nigeria (cNGN)
- **Market Size**: 200M+ population, $440B economy
- **Local Relevance**: Campaigns in Naira increase engagement
- **Compliance**: Better regulatory standing than USD

### 🇰🇪 Kenya (cKES)
- **Mobile Integration**: Compatible with M-Pesa ecosystem
- **Local Banking**: Direct integration with Kenyan banks
- **Market Access**: East African hub for campaigns

### 🇧🇷 Brazil (cREAL)
- **Latin America**: Gateway to LATAM markets
- **Local Compliance**: Brazilian financial regulations
- **Large Market**: 215M+ Portuguese speakers

### 🇪🇺 Europe (cEUR)
- **GDPR Compliance**: European regulatory framework
- **Market Access**: 450M+ EU consumers
- **Currency Stability**: Euro-pegged stability

### 🌍 West Africa (eXOF)
- **Regional Currency**: 8 countries, 180M+ people
- **CFA Integration**: Established monetary union
- **Economic Growth**: Fastest-growing African region

## 🔄 Migration Strategy

### Phase 1: Parallel Deployment (Recommended)
1. Deploy new multi-currency Diamond
2. Run both contracts simultaneously
3. Gradually migrate campaigns to new contract
4. Retire old contract after full migration

### Phase 2: Direct Upgrade (Advanced)
1. Use Diamond Cut to add new facets to existing contract
2. Initialize multi-currency support
3. No migration needed, seamless upgrade

## 📊 Monitoring & Analytics

### Campaign Statistics by Currency
```typescript
const { stats } = useMultiCurrencyStats();

// Get campaign counts and volumes per currency
stats.tokens.forEach((token, index) => {
  console.log(`${stats.symbols[index]}: ${stats.campaignCounts[index]} campaigns`);
});
```

### Exchange Rate Monitoring
```typescript
// Track rate changes for analytics
const rates = await mentoFX.getAllCurrenciesWithRates('cUSD');
rates.forEach(({ symbol, rate, lastUpdated }) => {
  console.log(`${symbol}: ${rate} (updated: ${lastUpdated})`);
});
```

## 🛡️ Security Considerations

### Access Controls
- **Owner-only functions**: Multi-currency initialization
- **Token validation**: All operations validate supported tokens
- **Rate limiting**: Exchange rate calls are cached and rate-limited

### Error Handling
- **Fallback rates**: Static rates when Mento SDK fails
- **Transaction reverts**: Proper error messages for failed operations
- **Balance checks**: Validate sufficient token balances

## 🧪 Testing

### Unit Tests
```bash
cd upgradeable-contract
forge test --match-contract MultiCurrency
```

### Integration Tests
```bash
# Test with real Mento contracts on Alfajores
forge test --fork-url https://alfajores-forno.celo-testnet.org
```

### Frontend Tests
```bash
cd frontend
npm run test
```

## 🚨 Troubleshooting

### Common Issues

#### Exchange Rate Failures
```typescript
// Fallback mechanism built-in
const rate = await mentoFX.getExchangeRate('cNGN', 'cUSD');
// Automatically falls back to static rates if Mento SDK fails
```

#### Token Approval Issues
```typescript
// Always check and approve before campaign creation
const tokenAddress = MENTO_TOKENS[currency].address;
await approve(tokenAddress, campaignBudget);
```

#### Network Compatibility
```typescript
// Ensure using correct token addresses per network
const addresses = getMentoTokenAddresses(); // Automatically handles network
```

## 📈 Performance Optimizations

### Rate Caching
- Exchange rates cached for 30 seconds
- Batch rate fetching for multiple currencies
- Fallback to static rates on failures

### Frontend Optimizations
- Concurrent balance checks across tokens
- Lazy loading of currency components
- Optimized re-renders with useMemo/useCallback

### Smart Contract Gas Optimizations
- Diamond storage pattern minimizes gas costs
- Batch operations for multi-currency claims
- Efficient mapping structures

## 🔮 Future Enhancements

### Planned Features
1. **Automatic Currency Conversion**: Convert payments between currencies
2. **DeFi Integration**: Yield generation on escrowed funds
3. **Price Oracles**: Multiple oracle sources for rates
4. **Mobile Money Integration**: Direct bank/mobile money deposits

### Roadmap
- **Q2 2025**: Full multi-currency deployment
- **Q3 2025**: Fiat on/off ramps via FiatConnect
- **Q4 2025**: Advanced DeFi integrations

## 📞 Support

For deployment assistance or technical questions:
- **Technical Issues**: Check troubleshooting section
- **Integration Help**: Review usage examples
- **Emergency Support**: Contact platform administrators

## ✅ Deployment Checklist

- [ ] Smart contracts deployed and verified
- [ ] Frontend configuration updated
- [ ] All 6 currencies tested
- [ ] Exchange rates working
- [ ] Payment claims functional
- [ ] Campaign creation tested
- [ ] Analytics dashboard updated
- [ ] Documentation reviewed
- [ ] Security audit completed
- [ ] Performance testing passed

---

🎉 **Congratulations!** Your AdsBazaar platform now supports true global multi-currency campaigns with the power of Mento Protocol.