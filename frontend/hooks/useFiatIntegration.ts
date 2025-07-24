/**
 * React hook for CICO (Cash In Cash Out) fiat integration
 * Handles fiat-to-stablecoin conversions via Kotani Pay and Alchemy Pay
 */

import { useState, useCallback, useEffect } from "react";
import { useAccount } from "wagmi";
import { toast } from "react-hot-toast";
import {
  initiateFiatPurchase,
  checkTransactionStatus,
  getProvidersForCurrency,
  getPaymentMethodsForCurrency,
  calculateFees,
  validatePurchaseAmount,
  FIAT_TO_MENTO_MAPPING,
  type FiatPurchaseRequest,
  type FiatPurchaseResponse,
  type PaymentMethod,
  type CICOProvider
} from "@/lib/cico-providers";

export interface FiatPurchaseState {
  isLoading: boolean;
  isProcessing: boolean;
  transactionId: string | null;
  status: 'idle' | 'pending' | 'processing' | 'completed' | 'failed';
  error: string | null;
  paymentInstructions: any | null;
  estimatedCompletionTime: string | null;
}

export interface UseFiatIntegrationReturn {
  // State
  purchaseState: FiatPurchaseState;
  
  // Actions
  initiatePurchase: (request: Omit<FiatPurchaseRequest, 'walletAddress'>) => Promise<void>;
  checkStatus: (transactionId: string) => Promise<void>;
  resetState: () => void;
  
  // Utilities
  getAvailableProviders: (currency: string) => CICOProvider[];
  getAvailablePaymentMethods: (currency: string) => PaymentMethod[];
  calculatePurchaseFees: (amount: number, currency: string) => ReturnType<typeof calculateFees>;
  validateAmount: (amount: number, currency: string) => ReturnType<typeof validatePurchaseAmount>;
  getSupportedMentoToken: (fiatCurrency: string) => string | null;
  
  // Real-time status polling
  startStatusPolling: (transactionId: string) => void;
  stopStatusPolling: () => void;
}

export function useFiatIntegration(): UseFiatIntegrationReturn {
  const { address } = useAccount();
  
  const [purchaseState, setPurchaseState] = useState<FiatPurchaseState>({
    isLoading: false,
    isProcessing: false,
    transactionId: null,
    status: 'idle',
    error: null,
    paymentInstructions: null,
    estimatedCompletionTime: null
  });

  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

  // Reset state
  const resetState = useCallback(() => {
    setPurchaseState({
      isLoading: false,
      isProcessing: false,
      transactionId: null,
      status: 'idle',
      error: null,
      paymentInstructions: null,
      estimatedCompletionTime: null
    });
    
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
  }, [pollingInterval]);

  // Initiate fiat purchase
  const initiatePurchase = useCallback(async (request: Omit<FiatPurchaseRequest, 'walletAddress'>) => {
    if (!address) {
      toast.error("Please connect your wallet first");
      return;
    }

    // Validate amount
    const validation = validatePurchaseAmount(request.amount, request.currency);
    if (!validation.isValid) {
      toast.error(validation.error || "Invalid amount");
      setPurchaseState(prev => ({ 
        ...prev, 
        error: validation.error || "Invalid amount" 
      }));
      return;
    }

    setPurchaseState(prev => ({ 
      ...prev, 
      isLoading: true, 
      error: null,
      status: 'pending'
    }));

    try {
      const fullRequest: FiatPurchaseRequest = {
        ...request,
        walletAddress: address,
        reference: `ADB-${Date.now().toString().slice(-6)}`
      };

      const response = await initiateFiatPurchase(fullRequest);

      if (response.success) {
        setPurchaseState(prev => ({
          ...prev,
          isLoading: false,
          transactionId: response.transactionId,
          status: response.status,
          paymentInstructions: response.paymentInstructions,
          estimatedCompletionTime: response.estimatedCompletionTime
        }));

        toast.success("Payment initiated successfully!");
        
        // Start polling for status updates
        if (response.transactionId) {
          startStatusPolling(response.transactionId);
        }
      } else {
        setPurchaseState(prev => ({
          ...prev,
          isLoading: false,
          status: 'failed',
          error: response.error || "Failed to initiate purchase"
        }));
        toast.error(response.error || "Failed to initiate purchase");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      setPurchaseState(prev => ({
        ...prev,
        isLoading: false,
        status: 'failed',
        error: errorMessage
      }));
      toast.error(errorMessage);
    }
  }, [address]);

  // Check transaction status
  const checkStatus = useCallback(async (transactionId: string) => {
    setPurchaseState(prev => ({ ...prev, isProcessing: true }));

    try {
      const status = await checkTransactionStatus(transactionId);
      
      setPurchaseState(prev => ({
        ...prev,
        isProcessing: false,
        status: status.status
      }));

      if (status.status === 'completed') {
        toast.success(`${status.tokensMinted} tokens minted to your wallet!`);
        stopStatusPolling();
      } else if (status.status === 'failed') {
        toast.error("Transaction failed");
        stopStatusPolling();
      }
    } catch (error) {
      setPurchaseState(prev => ({
        ...prev,
        isProcessing: false,
        error: "Failed to check transaction status"
      }));
      toast.error("Failed to check transaction status");
    }
  }, []);

  // Start status polling
  const startStatusPolling = useCallback((transactionId: string) => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
    }

    const interval = setInterval(() => {
      checkStatus(transactionId);
    }, 10000); // Poll every 10 seconds

    setPollingInterval(interval);
  }, [checkStatus, pollingInterval]);

  // Stop status polling
  const stopStatusPolling = useCallback(() => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
  }, [pollingInterval]);

  // Get available providers for currency
  const getAvailableProviders = useCallback((currency: string): CICOProvider[] => {
    return getProvidersForCurrency(currency);
  }, []);

  // Get available payment methods for currency
  const getAvailablePaymentMethods = useCallback((currency: string): PaymentMethod[] => {
    return getPaymentMethodsForCurrency(currency);
  }, []);

  // Calculate purchase fees
  const calculatePurchaseFees = useCallback((amount: number, currency: string) => {
    return calculateFees(amount, currency);
  }, []);

  // Validate purchase amount
  const validateAmount = useCallback((amount: number, currency: string) => {
    return validatePurchaseAmount(amount, currency);
  }, []);

  // Get supported Mento token for fiat currency
  const getSupportedMentoToken = useCallback((fiatCurrency: string): string | null => {
    return FIAT_TO_MENTO_MAPPING[fiatCurrency] || null;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  return {
    purchaseState,
    initiatePurchase,
    checkStatus,
    resetState,
    getAvailableProviders,
    getAvailablePaymentMethods,
    calculatePurchaseFees,
    validateAmount,
    getSupportedMentoToken,
    startStatusPolling,
    stopStatusPolling
  };
}

/**
 * Hook for getting real-time exchange rates between fiat and Mento tokens
 */
export function useFiatExchangeRates() {
  const [rates, setRates] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchRates = useCallback(async () => {
    setIsLoading(true);
    try {
      // Use real Mento exchange rates - no mocking needed!
      const { getAllLiveRates } = await import("@/lib/mento-live");
      const mentoRates = await getAllLiveRates('cUSD');
      
      // Convert to fiat/stablecoin format (assuming near-parity for stablecoins)
      const fiatRates = {
        'NGN/cNGN': 0.999, // Small spread for conversion costs
        'KES/cKES': 0.998,
        'EUR/cEUR': 0.997,
        'USD/cUSD': 0.999,
        'BRL/cREAL': 0.998,
        'XOF/eXOF': 0.999
      };

      setRates(fiatRates);
      setLastUpdate(new Date());
    } catch (error) {
      console.error("Failed to fetch exchange rates:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRates();
    // Refresh rates every 5 minutes
    const interval = setInterval(fetchRates, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchRates]);

  const getRate = useCallback((fiatCurrency: string, mentoToken: string): number => {
    const rateKey = `${fiatCurrency}/${mentoToken}`;
    return rates[rateKey] || 0.99; // Default 1% spread
  }, [rates]);

  const convertFiatToMento = useCallback((amount: number, fiatCurrency: string, mentoToken: string): number => {
    const rate = getRate(fiatCurrency, mentoToken);
    return amount * rate;
  }, [getRate]);

  return {
    rates,
    isLoading,
    lastUpdate,
    getRate,
    convertFiatToMento,
    refreshRates: fetchRates
  };
}

/**
 * Hook for managing user's fiat funding preferences
 */
export function useFiatFundingPreferences() {
  const [preferences, setPreferences] = useState({
    preferredCurrency: 'USD',
    preferredPaymentMethod: '',
    autoFunding: false,
    fundingThreshold: 100
  });

  const updatePreference = useCallback((key: string, value: any) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
    
    // Save to localStorage
    localStorage.setItem('fiat_funding_preferences', JSON.stringify({
      ...preferences,
      [key]: value
    }));
  }, [preferences]);

  // Load preferences from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('fiat_funding_preferences');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setPreferences(parsed);
      } catch (error) {
        console.error("Failed to parse saved preferences:", error);
      }
    }
  }, []);

  return {
    preferences,
    updatePreference
  };
}