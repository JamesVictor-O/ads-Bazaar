export const MENTO_TOKENS = {
  cUSD: {
    address: '0x765DE816845861e75A25fCA122bb6898B8B1282a',
    symbol: 'cUSD',
    name: 'Celo Dollar',
    decimals: 18,
    flag: '🇺🇸'
  },
  cEUR: {
    address: '0xD8763CBa276a3738E6DE85b4b3bF5FDed6D6cA73',
    symbol: 'cEUR', 
    name: 'Celo Euro',
    decimals: 18,
    flag: '🇪🇺'
  },
  cREAL: {
    address: '0xe8537a3d056DA446677B9E9d6c5dB704EaAb4787',
    symbol: 'cREAL',
    name: 'Celo Brazilian Real',
    decimals: 18,
    flag: '🇧🇷'
  },
  cKES: {
    address: '0x456a3D042C0DbD3db53D5489e98dFb038553B0d0',
    symbol: 'cKES',
    name: 'Celo Kenyan Shilling', 
    decimals: 18,
    flag: '🇰🇪'
  },
  eXOF: {
    address: '0x73F93dcc49cB8A239e2032663e9475dd5ef29A08',
    symbol: 'eXOF',
    name: 'CFA Franc',
    decimals: 18,
    flag: '🌍'
  },
  cNGN: {
    address: '0x17700282592D6917F6A73D0bF8AcCf4D578c131e',
    symbol: 'cNGN',
    name: 'Celo Nigerian Naira',
    decimals: 18,
    flag: '🇳🇬'
  }
} as const;

export type SupportedCurrency = keyof typeof MENTO_TOKENS;

// Simple utility functions
export const formatCurrencyAmount = (amount: string | number, currency: SupportedCurrency): string => {
  const token = MENTO_TOKENS[currency];
  return `${parseFloat(amount.toString()).toLocaleString()} ${token.symbol}`;
};

export const getCurrencyDisplayName = (currency: SupportedCurrency): string => {
  const token = MENTO_TOKENS[currency];
  return `${token.flag} ${token.name} (${token.symbol})`;
};

// Simple mock service for build
export const mentoFX = {
  async getExchangeRate(from: SupportedCurrency, to: SupportedCurrency): Promise<number> {
    if (from === to) return 1;
    // Mock rates for build
    return 1.2;
  },
  
  async convertCurrency(amount: string, from: SupportedCurrency, to: SupportedCurrency): Promise<string> {
    if (from === to) return amount;
    const rate = await this.getExchangeRate(from, to);
    return (parseFloat(amount) * rate).toFixed(6);
  },

  async getAllCurrenciesWithRates(baseCurrency: SupportedCurrency = 'cUSD') {
    return Object.entries(MENTO_TOKENS).map(([key, token]) => ({
      ...token,
      key: key as SupportedCurrency,
      rate: 1.0, // Mock rate
      rateDisplay: `1 ${MENTO_TOKENS[baseCurrency].symbol} = 1.00 ${token.symbol}`,
      lastUpdated: new Date().toISOString()
    }));
  },

  async getSwapTransaction() {
    return {
      to: '0x0000000000000000000000000000000000000000',
      data: '0x',
      value: BigInt(0)
    };
  }
};