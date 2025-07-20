# 🌍 Multi-Currency AdsBazaar Integration Guide

## Overview

Your AdsBazaar platform now supports **6 Mento stablecoins** on Celo network through a diamond proxy contract. This guide shows how to use the new multicurrency features while maintaining full backward compatibility.

## 📋 Supported Currencies

| Currency | Symbol | Name | Flag | Decimals |
|----------|--------|------|------|----------|
| `cUSD` | cUSD | Celo Dollar | 🇺🇸 | 18 |
| `cEUR` | cEUR | Celo Euro | 🇪🇺 | 18 |
| `cREAL` | cREAL | Celo Brazilian Real | 🇧🇷 | 18 |
| `cKES` | cKES | Celo Kenyan Shilling | 🇰🇪 | 18 |
| `eXOF` | eXOF | CFA Franc | 🌍 | 18 |
| `cNGN` | cNGN | Celo Nigerian Naira | 🇳🇬 | 18 |

## 🏗️ Contract Deployment

**Diamond Contract Address**: `0xe66b437DE9fbd724c59c635ABeB943f9d4c09677`

- **Network**: Celo Mainnet (Chain ID: 42220)
- **Architecture**: EIP-2535 Diamond Standard
- **Facets**: 13 deployed facets with multicurrency functionality

## 🔧 Frontend Integration

### 1. Creating Campaigns

#### New Multi-Currency Method
```typescript
import { useMultiCurrencyCampaignCreation } from '@/hooks/useMultiCurrencyAdsBazaar';

const { createCampaignWithToken, isCreating } = useMultiCurrencyCampaignCreation();

// Create campaign with any supported currency
await createCampaignWithToken(campaignData, 'cEUR'); // or 'cREAL', 'cKES', etc.
```

#### Backward Compatible Method
```typescript
import { useCreateBrief } from '@/hooks/useEnhancedAdsBazaar';

const { createBrief } = useCreateBrief();

// Still works exactly as before (defaults to cUSD)
await createBrief(name, description, /* ... other params */);

// OR specify currency explicitly for new tokens
await createBrief(name, description, /* ... other params */, 'cEUR');
```

### 2. Payment Claims

#### Claim Specific Currency
```typescript
import { useMultiCurrencyPayments } from '@/hooks/useMultiCurrencyAdsBazaar';

const { claimPaymentsInToken, claimAllPendingPayments } = useMultiCurrencyPayments();

// Claim payments in specific currency
await claimPaymentsInToken('cEUR');

// Claim ALL pending payments across all currencies
await claimAllPendingPayments();
```

#### Legacy Payment Claims (Still Works)
```typescript
import { useClaimPayments } from '@/hooks/useEnhancedAdsBazaar';

const { claimPayments } = useClaimPayments();

// Legacy method still works for cUSD
await claimPayments();

// Enhanced method with optional currency
await claimPayments('cEUR');
```

### 3. Viewing Pending Payments

```typescript
import { useMultiCurrencyPendingPayments } from '@/hooks/useMultiCurrencyAdsBazaar';

const { pendingPayments, isLoading } = useMultiCurrencyPendingPayments();

// pendingPayments contains:
// {
//   tokens: ['0x765DE816845861e75A25fCA122bb6898B8B1282a', ...],
//   amounts: [BigInt('1000000000000000000'), ...],
//   symbols: ['cUSD', 'cEUR', ...]
// }
```

### 4. Currency Preferences

```typescript
import { usePreferredCurrency } from '@/hooks/useMultiCurrencyAdsBazaar';

const { preferredCurrency, setPreferredCurrency } = usePreferredCurrency();

// Set user's preferred currency
await setPreferredCurrency('cEUR');
```

### 5. Exchange Rates & Conversion

```typescript
import { useExchangeRates } from '@/hooks/useMultiCurrencyAdsBazaar';
import { mentoFX } from '@/lib/mento-integration';

const { rates, convertAmount, fetchRates } = useExchangeRates('cUSD');

// Convert 100 cUSD to cEUR
const converted = convertAmount('100', 'cUSD', 'cEUR');

// Get real-time exchange rates from Mento Protocol
await fetchRates();
```

### 6. Platform Statistics

```typescript
import { useMultiCurrencyStats } from '@/hooks/useMultiCurrencyAdsBazaar';

const { stats, isLoading } = useMultiCurrencyStats();

// stats contains:
// {
//   tokens: ['0x765...', '0xD87...'],
//   symbols: ['cUSD', 'cEUR'],
//   campaignCounts: [BigInt('10'), BigInt('5')],
//   totalBudgets: [BigInt('50000...'), BigInt('30000...')],
//   totalVolumes: [BigInt('100000...'), BigInt('75000...')]
// }
```

## 🎯 Testing Your Integration

### 1. Use the Test Dashboard

Import the test component to verify functionality:

```typescript
import TestMultiCurrencyFrontend from './test-frontend-multicurrency';

// Add to your app for testing
<TestMultiCurrencyFrontend />
```

### 2. Manual Testing Steps

1. **Connect Wallet** to Celo network
2. **Create Campaign** with different currencies (cEUR, cREAL, etc.)
3. **Test Payment Claims** for specific currencies
4. **Verify Exchange Rates** are updating correctly
5. **Check Statistics** show multicurrency data

### 3. Contract Verification

Run the verification script:
```bash
node test-multicurrency.js
```

## 🔄 Migration from Legacy Contract

### For Existing Users
- **No changes required** - all existing functionality works exactly the same
- Legacy cUSD campaigns continue to work
- Payment claims for cUSD work as before

### For New Features
- Choose currency when creating campaigns
- Claim payments in specific currencies
- View multicurrency analytics
- Set currency preferences

## 🛠️ Implementation Examples

### Campaign Creation UI
```typescript
function CreateCampaignForm() {
  const [selectedCurrency, setSelectedCurrency] = useState<SupportedCurrency>('cUSD');
  const { createCampaignWithToken } = useMultiCurrencyCampaignCreation();
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      
      <select value={selectedCurrency} onChange={(e) => setSelectedCurrency(e.target.value)}>
        {Object.entries(MENTO_TOKENS).map(([key, token]) => (
          <option key={key} value={key}>
            {token.flag} {token.symbol} - {token.name}
          </option>
        ))}
      </select>
      
      <button onClick={() => createCampaignWithToken(campaignData, selectedCurrency)}>
        Create Campaign with {selectedCurrency}
      </button>
    </form>
  );
}
```

### Multi-Currency Payment Dashboard
```typescript
function PaymentDashboard() {
  const { pendingPayments } = useMultiCurrencyPendingPayments();
  const { claimPaymentsInToken, claimAllPendingPayments } = useMultiCurrencyPayments();
  
  return (
    <div>
      <h2>Pending Payments</h2>
      {pendingPayments?.tokens.map((token, index) => (
        <div key={token}>
          <span>{pendingPayments.symbols[index]}: {formatCurrencyAmount(pendingPayments.amounts[index], pendingPayments.symbols[index])}</span>
          <button onClick={() => claimPaymentsInToken(pendingPayments.symbols[index])}>
            Claim {pendingPayments.symbols[index]}
          </button>
        </div>
      ))}
      
      <button onClick={claimAllPendingPayments}>
        Claim All Currencies
      </button>
    </div>
  );
}
```

## 🚨 Important Notes

### Gas Considerations
- Multi-currency transactions may have slightly higher gas costs
- Approve token transfers before campaign creation
- Consider batching operations when possible

### Error Handling
```typescript
try {
  await createCampaignWithToken(data, currency);
} catch (error) {
  if (error.message.includes('insufficient allowance')) {
    // Handle approval needed
  } else if (error.message.includes('insufficient balance')) {
    // Handle insufficient balance
  }
  // Handle other errors
}
```

### Type Safety
All hooks and functions use TypeScript with proper typing:
```typescript
type SupportedCurrency = 'cUSD' | 'cEUR' | 'cREAL' | 'cKES' | 'eXOF' | 'cNGN';
```

## 📞 Support

- **Contract Issues**: Check diamond facets and function selectors
- **Frontend Issues**: Verify ABI includes multicurrency functions
- **Mento Integration**: Check Mento SDK connection and exchange rates

## 🎉 Next Steps

1. **Deploy to production** with confidence - backward compatibility ensures no breaking changes
2. **Enable multicurrency** features gradually
3. **Monitor analytics** across all supported currencies
4. **Add more Mento tokens** as they become available

---

**Ready to go global with AdsBazaar! 🌍💰**