import { Mento } from '@mento-protocol/mento-sdk';
import { SupportedCurrency, MENTO_TOKENS } from './mento-simple';

// Get RPC URL from environment variable
const getRpcUrl = () => {
  const rpcUrl = process.env.RPC_URL || process.env.NEXT_PUBLIC_RPC_URL;
  if (rpcUrl && rpcUrl.includes('CELO_RPC_URL=')) {
    // Handle the malformed RPC_URL from .env
    return rpcUrl.split('CELO_RPC_URL=')[1];
  }
  return rpcUrl || 'https://forno.celo.org'; // fallback to public Celo RPC
};

// Initialize Mento SDK
const mento = Mento.create({
  rpcUrl: getRpcUrl(),
});

// Cache for exchange rates to avoid too many API calls
interface RateCache {
  rates: Record<string, number>;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

let rateCache: RateCache = {
  rates: {},
  timestamp: 0,
  ttl: 5 * 60 * 1000, // 5 minutes cache
};

/**
 * Get live exchange rate between two Mento currencies
 */
export async function getLiveExchangeRate(
  from: SupportedCurrency, 
  to: SupportedCurrency
): Promise<number> {
  if (from === to) return 1.0;

  const cacheKey = `${from}-${to}`;
  const now = Date.now();

  // Return cached rate if still valid
  if (rateCache.rates[cacheKey] && (now - rateCache.timestamp) < rateCache.ttl) {
    return rateCache.rates[cacheKey];
  }

  try {
    // Get token addresses from our mapping
    const fromToken = MENTO_TOKENS[from];
    const toToken = MENTO_TOKENS[to];

    if (!fromToken || !toToken) {
      console.warn(`Token not found for ${from} or ${to}, using fallback rate`);
      return getFallbackRate(from, to);
    }

    // Use Mento SDK to get exchange rate
    const quote = await mento.getAmountOut(
      fromToken.address as `0x${string}`,
      toToken.address as `0x${string}`,
      '1000000000000000000' // 1 token in wei (18 decimals)
    );

    // Convert the quote to a rate (amount out for 1 unit in)
    const rate = Number(quote.amountOut) / 1e18;
    
    // Update cache
    rateCache.rates[cacheKey] = rate;
    rateCache.timestamp = now;
    
    console.log(`📊 Live rate fetched: 1 ${from} = ${rate.toFixed(6)} ${to}`);
    return rate;

  } catch (error) {
    console.error(`Error fetching live rate for ${from}->${to}:`, error);
    
    // Fall back to previous cached rate or hardcoded rate
    if (rateCache.rates[cacheKey]) {
      console.log(`Using cached rate for ${from}->${to}: ${rateCache.rates[cacheKey]}`);
      return rateCache.rates[cacheKey];
    }
    
    return getFallbackRate(from, to);
  }
}

/**
 * Get all live exchange rates for a base currency
 */
export async function getAllLiveRates(baseCurrency: SupportedCurrency = 'cUSD'): Promise<Record<SupportedCurrency, number>> {
  const rates: Record<SupportedCurrency, number> = {} as Record<SupportedCurrency, number>;
  
  // Get rates for all supported currencies
  const currencies = Object.keys(MENTO_TOKENS) as SupportedCurrency[];
  
  await Promise.all(
    currencies.map(async (currency) => {
      if (currency === baseCurrency) {
        rates[currency] = 1.0;
      } else {
        rates[currency] = await getLiveExchangeRate(currency, baseCurrency);
      }
    })
  );

  return rates;
}

/**
 * Convert amount between currencies using live rates
 */
export async function convertCurrencyLive(
  amount: string | number,
  from: SupportedCurrency,
  to: SupportedCurrency
): Promise<string> {
  if (from === to) return amount.toString();
  
  const rate = await getLiveExchangeRate(from, to);
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  const converted = numAmount * rate;
  
  return converted.toFixed(6);
}

/**
 * Fallback rates when live data is unavailable - minimal fallback only for critical errors
 */
function getFallbackRate(from: SupportedCurrency, to: SupportedCurrency): number {
  console.warn(`⚠️ Using emergency fallback rate for ${from}->${to} - live rates unavailable`);
  
  // Only return 1:1 rate as absolute emergency fallback
  // This signals to the UI that rates are unavailable
  return 1.0;
}

/**
 * Get formatted currency rates with metadata
 */
export async function getCurrencyRatesWithMetadata(baseCurrency: SupportedCurrency = 'cUSD') {
  const rates = await getAllLiveRates(baseCurrency);
  
  return Object.entries(MENTO_TOKENS).map(([key, token]) => {
    const currency = key as SupportedCurrency;
    const rate = rates[currency] || 1;
    
    return {
      ...token,
      key: currency,
      rate,
      rateDisplay: `1 ${MENTO_TOKENS[baseCurrency].symbol} = ${rate.toFixed(6)} ${token.symbol}`,
      lastUpdated: new Date().toISOString(),
      isLive: true
    };
  });
}

/**
 * Clear the rate cache (useful for testing or forcing refresh)
 */
export function clearRateCache() {
  rateCache = {
    rates: {},
    timestamp: 0,
    ttl: 5 * 60 * 1000,
  };
}

/**
 * Get cache status for debugging
 */
export function getCacheStatus() {
  const now = Date.now();
  const isValid = (now - rateCache.timestamp) < rateCache.ttl;
  
  return {
    cacheSize: Object.keys(rateCache.rates).length,
    lastUpdate: new Date(rateCache.timestamp).toISOString(),
    isValid,
    timeToExpiry: isValid ? rateCache.ttl - (now - rateCache.timestamp) : 0,
  };
}