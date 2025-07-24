/**
 * CICO (Cash In Cash Out) Provider Integrations
 * Connects to Kotani Pay (Africa) and Alchemy Pay (Global) for fiat-to-stablecoin conversion
 */

export interface CICOProvider {
  id: string;
  name: string;
  description: string;
  regions: string[];
  supportedCurrencies: string[];
  supportedMethods: PaymentMethod[];
  fees: {
    percentage: number;
    minimum: number;
    maximum: number;
  };
  limits: {
    daily: number;
    monthly: number;
    minimum: number;
    maximum: number;
  };
  processingTime: string;
  kycRequired: boolean;
  apiEndpoint: string;
  testMode: boolean;
}

export interface PaymentMethod {
  id: string;
  type: 'bank_transfer' | 'mobile_money' | 'card' | 'sepa';
  name: string;
  description: string;
  icon: string;
  currencies: string[];
  processingTime: string;
}

export interface FiatPurchaseRequest {
  amount: number;
  currency: string;
  paymentMethod: string;
  walletAddress: string;
  userEmail?: string;
  userPhone?: string;
  reference?: string;
}

export interface FiatPurchaseResponse {
  success: boolean;
  transactionId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  paymentInstructions?: PaymentInstructions;
  estimatedCompletionTime?: string;
  error?: string;
}

export interface PaymentInstructions {
  type: string;
  accountNumber?: string;
  bankName?: string;
  phoneNumber?: string;
  reference: string;
  amount: number;
  currency: string;
  qrCode?: string;
  deepLink?: string;
}

// Kotani Pay - African Mobile Money & Banking
export const KOTANI_PAY: CICOProvider = {
  id: 'kotani_pay',
  name: 'Kotani Pay',
  description: 'African mobile money and banking integration',
  regions: ['Nigeria', 'Kenya', 'Ghana', 'Uganda', 'Rwanda'],
  supportedCurrencies: ['NGN', 'KES', 'GHS', 'UGX', 'RWF'],
  supportedMethods: [
    {
      id: 'bank_transfer_ngn',
      type: 'bank_transfer',
      name: 'Nigerian Bank Transfer',
      description: 'Direct bank transfer from Nigerian banks',
      icon: '🏦',
      currencies: ['NGN'],
      processingTime: '2-10 minutes'
    },
    {
      id: 'mpesa_kes',
      type: 'mobile_money',
      name: 'M-Pesa',
      description: 'Kenya M-Pesa mobile money',
      icon: '📱',
      currencies: ['KES'],
      processingTime: '1-5 minutes'
    },
    {
      id: 'mtn_mobile_money',
      type: 'mobile_money',
      name: 'MTN Mobile Money',
      description: 'MTN Mobile Money across Africa',
      icon: '📱',
      currencies: ['GHS', 'UGX', 'RWF'],
      processingTime: '2-10 minutes'
    },
    {
      id: 'airtel_money',
      type: 'mobile_money',
      name: 'Airtel Money',
      description: 'Airtel Money mobile payments',
      icon: '📱',
      currencies: ['KES', 'UGX', 'RWF'],
      processingTime: '2-10 minutes'
    }
  ],
  fees: {
    percentage: 2.5,
    minimum: 1,
    maximum: 50
  },
  limits: {
    daily: 100000,
    monthly: 500000,
    minimum: 10,
    maximum: 50000
  },
  processingTime: '1-10 minutes',
  kycRequired: true,
  apiEndpoint: 'https://api.kotanipay.com/v1',
  testMode: process.env.NODE_ENV !== 'production'
};

// Alchemy Pay - Global Cards & SEPA
export const ALCHEMY_PAY: CICOProvider = {
  id: 'alchemy_pay',
  name: 'Alchemy Pay',
  description: 'Global card payments and SEPA transfers',
  regions: ['Europe', 'North America', 'Asia', 'Global'],
  supportedCurrencies: ['EUR', 'USD', 'GBP', 'JPY', 'AUD', 'CAD'],
  supportedMethods: [
    {
      id: 'sepa_transfer',
      type: 'sepa',
      name: 'SEPA Bank Transfer',
      description: 'European bank transfers',
      icon: '🏦',
      currencies: ['EUR'],
      processingTime: '10-30 minutes'
    },
    {
      id: 'credit_card',
      type: 'card',
      name: 'Credit/Debit Card',
      description: 'Visa, Mastercard, American Express',
      icon: '💳',
      currencies: ['EUR', 'USD', 'GBP', 'JPY', 'AUD', 'CAD'],
      processingTime: '1-5 minutes'
    },
    {
      id: 'wire_transfer',
      type: 'bank_transfer',
      name: 'Wire Transfer',
      description: 'International wire transfers',
      icon: '🏦',
      currencies: ['USD', 'EUR', 'GBP'],
      processingTime: '30-60 minutes'
    }
  ],
  fees: {
    percentage: 3.5,
    minimum: 2,
    maximum: 100
  },
  limits: {
    daily: 50000,
    monthly: 200000,
    minimum: 20,
    maximum: 25000
  },
  processingTime: '1-60 minutes',
  kycRequired: true,
  apiEndpoint: 'https://api.alchemypay.org/v1',
  testMode: process.env.NODE_ENV !== 'production'
};

// Provider registry
export const CICO_PROVIDERS: Record<string, CICOProvider> = {
  kotani_pay: KOTANI_PAY,
  alchemy_pay: ALCHEMY_PAY
};

// Currency to provider mapping
export const CURRENCY_PROVIDERS: Record<string, string[]> = {
  NGN: ['kotani_pay'],
  KES: ['kotani_pay'],
  GHS: ['kotani_pay'],
  UGX: ['kotani_pay'],
  RWF: ['kotani_pay'],
  EUR: ['alchemy_pay'],
  USD: ['alchemy_pay'],
  GBP: ['alchemy_pay'],
  JPY: ['alchemy_pay'],
  AUD: ['alchemy_pay'],
  CAD: ['alchemy_pay']
};

// Mento token mapping
export const FIAT_TO_MENTO_MAPPING: Record<string, string> = {
  NGN: 'cNGN',
  KES: 'cKES',
  EUR: 'cEUR',
  USD: 'cUSD',
  BRL: 'cREAL',
  XOF: 'eXOF'
};

/**
 * Get available providers for a currency
 */
export function getProvidersForCurrency(currency: string): CICOProvider[] {
  const providerIds = CURRENCY_PROVIDERS[currency] || [];
  return providerIds.map(id => CICO_PROVIDERS[id]).filter(Boolean);
}

/**
 * Get payment methods for a currency
 */
export function getPaymentMethodsForCurrency(currency: string): PaymentMethod[] {
  const providers = getProvidersForCurrency(currency);
  const methods: PaymentMethod[] = [];
  
  providers.forEach(provider => {
    provider.supportedMethods.forEach(method => {
      if (method.currencies.includes(currency)) {
        methods.push(method);
      }
    });
  });
  
  return methods;
}

/**
 * Calculate fees for a purchase
 */
export function calculateFees(amount: number, currency: string, providerId?: string): {
  providerFee: number;
  networkFee: number;
  totalFee: number;
  amountAfterFees: number;
} {
  const providers = providerId 
    ? [CICO_PROVIDERS[providerId]] 
    : getProvidersForCurrency(currency);
  
  if (providers.length === 0) {
    throw new Error(`No providers available for currency: ${currency}`);
  }
  
  const provider = providers[0]; // Use first available provider
  const providerFee = Math.max(
    (amount * provider.fees.percentage) / 100,
    provider.fees.minimum
  );
  const networkFee = 0.5; // Celo network fee (minimal)
  const totalFee = providerFee + networkFee;
  
  return {
    providerFee,
    networkFee,
    totalFee,
    amountAfterFees: amount - totalFee
  };
}

/**
 * Initiate fiat purchase (mock implementation for demo)
 */
export async function initiateFiatPurchase(request: FiatPurchaseRequest): Promise<FiatPurchaseResponse> {
  // This is a mock implementation for demo purposes
  // In production, this would integrate with actual provider APIs
  
  const providers = getProvidersForCurrency(request.currency);
  if (providers.length === 0) {
    return {
      success: false,
      transactionId: '',
      status: 'failed',
      error: `Currency ${request.currency} not supported`
    };
  }
  
  const provider = providers[0];
  const paymentMethod = provider.supportedMethods.find(m => 
    m.id === request.paymentMethod && m.currencies.includes(request.currency)
  );
  
  if (!paymentMethod) {
    return {
      success: false,
      transactionId: '',
      status: 'failed',
      error: `Payment method ${request.paymentMethod} not supported for ${request.currency}`
    };
  }
  
  // Generate mock transaction ID
  const transactionId = `${provider.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Generate payment instructions based on method type
  let paymentInstructions: PaymentInstructions;
  
  if (paymentMethod.type === 'bank_transfer' && request.currency === 'NGN') {
    paymentInstructions = {
      type: 'bank_transfer',
      bankName: 'Kotani Pay - First Bank Nigeria',
      accountNumber: '3087654321',
      reference: `ADB-${Date.now().toString().slice(-6)}`,
      amount: request.amount,
      currency: request.currency
    };
  } else if (paymentMethod.type === 'mobile_money' && request.currency === 'KES') {
    paymentInstructions = {
      type: 'mobile_money',
      phoneNumber: '254700123456',
      reference: `MP-${Date.now().toString().slice(-6)}`,
      amount: request.amount,
      currency: request.currency
    };
  } else if (paymentMethod.type === 'sepa' && request.currency === 'EUR') {
    paymentInstructions = {
      type: 'sepa',
      bankName: 'Alchemy Pay IBAN',
      accountNumber: 'DE89370400440532013000',
      reference: `EUR-${Date.now().toString().slice(-6)}`,
      amount: request.amount,
      currency: request.currency
    };
  } else {
    paymentInstructions = {
      type: 'card',
      reference: `CARD-${Date.now().toString().slice(-6)}`,
      amount: request.amount,
      currency: request.currency
    };
  }
  
  return {
    success: true,
    transactionId,
    status: 'pending',
    paymentInstructions,
    estimatedCompletionTime: paymentMethod.processingTime
  };
}

/**
 * Check transaction status (mock implementation)
 */
export async function checkTransactionStatus(transactionId: string): Promise<{
  status: 'pending' | 'processing' | 'completed' | 'failed';
  tokensMinted?: number;
  tokenAddress?: string;
  txHash?: string;
}> {
  // Mock implementation - in production this would check actual provider APIs
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        status: 'completed',
        tokensMinted: 95.5, // Amount after fees
        tokenAddress: '0x17700282592D6917F6A73D0bF8AcCf4D578c131e', // cNGN example
        txHash: `0x${Math.random().toString(16).slice(2, 66)}`
      });
    }, 2000);
  });
}

/**
 * Get supported regions
 */
export function getSupportedRegions(): string[] {
  const regions = new Set<string>();
  Object.values(CICO_PROVIDERS).forEach(provider => {
    provider.regions.forEach(region => regions.add(region));
  });
  return Array.from(regions);
}

/**
 * Get all supported fiat currencies
 */
export function getSupportedFiatCurrencies(): string[] {
  const currencies = new Set<string>();
  Object.values(CICO_PROVIDERS).forEach(provider => {
    provider.supportedCurrencies.forEach(currency => currencies.add(currency));
  });
  return Array.from(currencies);
}

/**
 * Validate purchase limits
 */
export function validatePurchaseAmount(amount: number, currency: string): {
  isValid: boolean;
  error?: string;
  suggestion?: string;
} {
  const providers = getProvidersForCurrency(currency);
  if (providers.length === 0) {
    return {
      isValid: false,
      error: `Currency ${currency} not supported`
    };
  }
  
  const provider = providers[0];
  
  if (amount < provider.limits.minimum) {
    return {
      isValid: false,
      error: `Amount too low. Minimum: ${provider.limits.minimum} ${currency}`,
      suggestion: `Try ${provider.limits.minimum} ${currency} or more`
    };
  }
  
  if (amount > provider.limits.maximum) {
    return {
      isValid: false,
      error: `Amount too high. Maximum: ${provider.limits.maximum} ${currency}`,
      suggestion: `Try ${provider.limits.maximum} ${currency} or less`
    };
  }
  
  return { isValid: true };
}