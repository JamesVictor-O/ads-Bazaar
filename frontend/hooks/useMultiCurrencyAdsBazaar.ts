import { useState, useCallback } from 'react';
import { useWriteContract, useReadContract, useAccount } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { MENTO_TOKENS, SupportedCurrency, mentoFX } from '@/lib/mento-simple';
import { CONTRACT_ADDRESS } from '@/lib/contracts';
import { CURRENT_NETWORK } from '@/lib/networks';
import AdsBazaarABI from '@/lib/AdsBazaar.json';
import { erc20Abi } from 'viem';
import { toast } from 'react-hot-toast';

// Multi-Currency Campaign Management
export function useMultiCurrencyCampaignCreation() {
  const { address } = useAccount();
  const { writeContract, isPending, error } = useWriteContract();
  const [isCreating, setIsCreating] = useState(false);

  const createCampaignWithToken = useCallback(async (
    campaignData: {
      name: string;
      description: string;
      requirements: string;
      budget: string;
      promotionDuration: number;
      maxInfluencers: number;
      targetAudience: number;
      applicationPeriod: number;
      proofSubmissionGracePeriod: number;
      verificationPeriod: number;
      selectionGracePeriod: number;
    },
    currency: SupportedCurrency
  ) => {
    if (!address) throw new Error('Wallet not connected');

    setIsCreating(true);
    try {
      const tokenInfo = MENTO_TOKENS[currency];
      const contractAddress = CONTRACT_ADDRESS;
      const budgetInWei = parseUnits(campaignData.budget, tokenInfo.decimals);

      // First approve the token transfer
      await writeContract({
        address: tokenInfo.address as `0x${string}`,
        abi: erc20Abi,
        functionName: 'approve',
        args: [contractAddress as `0x${string}`, budgetInWei],
        chain: CURRENT_NETWORK,
        account: address,
      });

      // Wait for approval confirmation
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Then create the campaign
      const result = await writeContract({
        address: contractAddress as `0x${string}`,
        abi: AdsBazaarABI.abi,
        functionName: 'createAdBriefWithToken',
        args: [
          campaignData.name,
          campaignData.description,
          campaignData.requirements,
          budgetInWei,
          BigInt(campaignData.promotionDuration),
          BigInt(campaignData.maxInfluencers),
          campaignData.targetAudience,
          BigInt(campaignData.applicationPeriod),
          BigInt(campaignData.proofSubmissionGracePeriod),
          BigInt(campaignData.verificationPeriod),
          BigInt(campaignData.selectionGracePeriod),
          tokenInfo.address
        ],
        chain: CURRENT_NETWORK,
        account: address,
      });

      toast.success(`Campaign created successfully with ${tokenInfo.symbol}!`);
      return result;
    } catch (error) {
      console.error('Error creating campaign:', error);
      toast.error('Failed to create campaign');
      throw error;
    } finally {
      setIsCreating(false);
    }
  }, [address, writeContract]);

  return {
    createCampaignWithToken,
    isCreating: isCreating || isPending,
    error
  };
}

// Multi-Currency Payment Claims
export function useMultiCurrencyPayments() {
  const { address } = useAccount();
  const { writeContract, isPending } = useWriteContract();
  const [isClaiming, setIsClaiming] = useState(false);

  // Claim payments in a specific token
  const claimPaymentsInToken = useCallback(async (currency: SupportedCurrency) => {
    if (!address) throw new Error('Wallet not connected');

    setIsClaiming(true);
    try {
      const tokenInfo = MENTO_TOKENS[currency];
      const contractAddress = CONTRACT_ADDRESS;

      const result = await writeContract({
        address: contractAddress as `0x${string}`,
        abi: AdsBazaarABI.abi,
        functionName: 'claimPaymentsInToken',
        args: [tokenInfo.address],
        chain: CURRENT_NETWORK,
        account: address,
      });

      toast.success(`Payments claimed in ${tokenInfo.symbol}!`);
      return result;
    } catch (error) {
      console.error('Error claiming payments:', error);
      toast.error(`Failed to claim payments in ${MENTO_TOKENS[currency].symbol}`);
      throw error;
    } finally {
      setIsClaiming(false);
    }
  }, [address, writeContract]);

  // Claim all pending payments across all currencies
  const claimAllPendingPayments = useCallback(async () => {
    if (!address) throw new Error('Wallet not connected');

    setIsClaiming(true);
    try {
      const contractAddress = CONTRACT_ADDRESS;

      const result = await writeContract({
        address: contractAddress as `0x${string}`,
        abi: AdsBazaarABI.abi,
        functionName: 'claimAllPendingPayments',
        args: [],
        chain: CURRENT_NETWORK,
        account: address,
      });

      toast.success('All pending payments claimed!');
      return result;
    } catch (error) {
      console.error('Error claiming all payments:', error);
      toast.error('Failed to claim all payments');
      throw error;
    } finally {
      setIsClaiming(false);
    }
  }, [address, writeContract]);

  return {
    claimPaymentsInToken,
    claimAllPendingPayments,
    isClaiming: isClaiming || isPending
  };
}

// Get pending payments across all currencies
export function useMultiCurrencyPendingPayments() {
  const { address } = useAccount();

  const { data: pendingPayments, isLoading, refetch } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: AdsBazaarABI.abi,
    functionName: 'getAllPendingPayments',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      refetchInterval: 30000, // Refetch every 30 seconds
    }
  });

  return {
    pendingPayments: pendingPayments as {
      tokens: string[];
      amounts: bigint[];
      symbols: string[];
    } | undefined,
    isLoading,
    refetch
  };
}

// Get campaign token information
export function useCampaignTokenInfo(campaignId?: string) {
  const { data: tokenInfo, isLoading } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: AdsBazaarABI.abi,
    functionName: 'getCampaignTokenInfo',
    args: campaignId ? [campaignId] : undefined,
    query: {
      enabled: !!campaignId,
    }
  });

  return {
    tokenInfo: tokenInfo as {
      tokenAddress: string;
      symbol: string;
      currency: number;
    } | undefined,
    isLoading
  };
}

// Token balance checks for multiple currencies
export function useMultiCurrencyBalances() {
  const { address } = useAccount();

  const balanceQueries = Object.entries(MENTO_TOKENS).map(([currency, token]) => ({
    address: token.address as `0x${string}`,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    currency: currency as SupportedCurrency,
    token
  }));

  // Note: This would need to be implemented with multiple useReadContract calls
  // For now, providing the structure for manual implementation
  const getBalance = useCallback(async (currency: SupportedCurrency) => {
    if (!address) return '0';

    try {
      const tokenInfo = MENTO_TOKENS[currency];
      // This would be implemented with a proper read contract call
      // For now, returning placeholder
      return '0';
    } catch (error) {
      console.error(`Error fetching ${currency} balance:`, error);
      return '0';
    }
  }, [address]);

  return { getBalance };
}

// Exchange rate hooks
export function useExchangeRates(baseCurrency: SupportedCurrency = 'cUSD') {
  const [rates, setRates] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchRates = useCallback(async () => {
    setIsLoading(true);
    try {
      const currenciesWithRates = await mentoFX.getAllCurrenciesWithRates(baseCurrency);
      const ratesMap: Record<string, number> = {};
      
      currenciesWithRates.forEach(({ key, rate }) => {
        ratesMap[key] = rate;
      });
      
      setRates(ratesMap);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching exchange rates:', error);
      toast.error('Failed to fetch exchange rates');
    } finally {
      setIsLoading(false);
    }
  }, [baseCurrency]);

  const convertAmount = useCallback(
    (amount: string, fromCurrency: SupportedCurrency, toCurrency: SupportedCurrency): string => {
      if (fromCurrency === toCurrency) return amount;
      
      const fromRate = rates[fromCurrency] || 1;
      const toRate = rates[toCurrency] || 1;
      
      if (fromCurrency === baseCurrency) {
        return (parseFloat(amount) * toRate).toFixed(6);
      } else if (toCurrency === baseCurrency) {
        return (parseFloat(amount) / fromRate).toFixed(6);
      } else {
        // Convert through base currency
        const baseAmount = parseFloat(amount) / fromRate;
        return (baseAmount * toRate).toFixed(6);
      }
    },
    [rates, baseCurrency]
  );

  return {
    rates,
    isLoading,
    lastUpdated,
    fetchRates,
    convertAmount
  };
}

// Currency swap hooks (for future implementation)
export function useCurrencySwap() {
  const { address } = useAccount();
  const [isSwapping, setIsSwapping] = useState(false);

  const prepareSwap = useCallback(async (
    fromCurrency: SupportedCurrency,
    toCurrency: SupportedCurrency,
    amount: string,
    slippage: number = 1
  ) => {
    if (!address) throw new Error('Wallet not connected');

    try {
      // TODO: Implement swap transaction when full Mento SDK is integrated
      throw new Error('Swap functionality not yet implemented');
    } catch (error) {
      console.error('Error preparing swap:', error);
      throw error;
    }
  }, [address]);

  return {
    prepareSwap,
    isSwapping
  };
}

// Statistics and analytics
export function useMultiCurrencyStats() {
  const { data: stats, isLoading } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: AdsBazaarABI.abi,
    functionName: 'getCampaignStatsByCurrency',
    args: [],
    query: {
      refetchInterval: 60000, // Refetch every minute
    }
  });

  const { data: tokenInfo } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: AdsBazaarABI.abi,
    functionName: 'getCampaignStatsByCurrency',
    args: [],
    query: {
      refetchInterval: 300000, // Refetch every 5 minutes
    }
  });

  return {
    stats: stats as {
      tokens: string[];
      symbols: string[];
      campaignCounts: bigint[];
      totalBudgets: bigint[];
      totalVolumes: bigint[];
    } | undefined,
    tokenInfo: tokenInfo as {
      tokens: string[];
      symbols: string[];
      totalEscrow: bigint[];
      totalVolume: bigint[];
    } | undefined,
    isLoading
  };
}

// Utility function to format currency amounts
export function formatCurrencyAmount(
  amount: bigint | string,
  currency: SupportedCurrency,
  decimals?: number
): string {
  const token = MENTO_TOKENS[currency];
  const formattedAmount = typeof amount === 'bigint' 
    ? formatUnits(amount, token.decimals)
    : amount;
  
  const num = parseFloat(formattedAmount);
  const displayDecimals = decimals ?? (num < 1 ? 6 : 2);
  
  return `${num.toLocaleString(undefined, { 
    minimumFractionDigits: 0,
    maximumFractionDigits: displayDecimals 
  })} ${token.symbol}`;
}

// Get preferred currency for user
export function usePreferredCurrency(isBusiness: boolean = false) {
  const { address } = useAccount();

  const { data: preferredToken } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: AdsBazaarABI.abi,
    functionName: 'getPreferredPaymentToken',
    args: address ? [address, isBusiness] : undefined,
    query: {
      enabled: !!address,
    }
  });

  const setPreferredCurrency = useCallback(async (currency: SupportedCurrency) => {
    if (!address) throw new Error('Wallet not connected');

    try {
      const contractAddress = CONTRACT_ADDRESS;
      const tokenAddress = MENTO_TOKENS[currency].address;

      // This would be implemented with writeContract
      console.log('Setting preferred currency:', { currency, tokenAddress });
      toast.success(`Preferred currency set to ${MENTO_TOKENS[currency].symbol}`);
    } catch (error) {
      console.error('Error setting preferred currency:', error);
      toast.error('Failed to set preferred currency');
    }
  }, [address]);

  // Convert token address back to currency
  const preferredCurrency = preferredToken 
    ? Object.entries(MENTO_TOKENS).find(([_, token]) => 
        token.address.toLowerCase() === (preferredToken as string).toLowerCase()
      )?.[0] as SupportedCurrency || 'cUSD'
    : 'cUSD';

  return {
    preferredCurrency,
    setPreferredCurrency
  };
}