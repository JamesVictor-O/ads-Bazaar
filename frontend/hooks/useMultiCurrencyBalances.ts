/**
 * Hook for managing multi-currency wallet balances with real-time updates
 */

import { useState, useEffect, useCallback } from "react";
import { useAccount, useBalance, useBlockNumber } from "wagmi";
import { MENTO_TOKENS, SupportedCurrency } from "@/lib/mento-simple";
import { getLiveExchangeRate } from "@/lib/mento-live";

export interface TokenBalance {
  token: SupportedCurrency;
  symbol: string;
  balance: string;
  balanceFormatted: string;
  usdValue: number;
  address: string;
  decimals: number;
  isLoading: boolean;
  error?: string;
}

export interface MultiCurrencyBalanceState {
  balances: TokenBalance[];
  totalUsdValue: number;
  isLoading: boolean;
  lastUpdated: Date | null;
  refreshing: boolean;
}

export function useMultiCurrencyBalances() {
  const { address, isConnected } = useAccount();
  const { data: blockNumber } = useBlockNumber({ watch: true });
  
  const [balanceState, setBalanceState] = useState<MultiCurrencyBalanceState>({
    balances: [],
    totalUsdValue: 0,
    isLoading: false,
    lastUpdated: null,
    refreshing: false
  });

  // Individual balance hooks for each Mento token
  const { data: cUSDBalance, isLoading: cUSDLoading, refetch: refetchCUSD } = useBalance({
    address,
    token: MENTO_TOKENS.cUSD.address as `0x${string}`,
    query: {
      enabled: isConnected && !!address,
    }
  });

  const { data: cEURBalance, isLoading: cEURLoading, refetch: refetchCEUR } = useBalance({
    address,
    token: MENTO_TOKENS.cEUR.address as `0x${string}`,
    query: {
      enabled: isConnected && !!address,
    }
  });

  const { data: cNGNBalance, isLoading: cNGNLoading, refetch: refetchCNGN } = useBalance({
    address,
    token: MENTO_TOKENS.cNGN.address as `0x${string}`,
    query: {
      enabled: isConnected && !!address,
    }
  });

  const { data: cKESBalance, isLoading: cKESLoading, refetch: refetchCKES } = useBalance({
    address,
    token: MENTO_TOKENS.cKES.address as `0x${string}`,
    query: {
      enabled: isConnected && !!address,
    }
  });

  const { data: eXOFBalance, isLoading: eXOFLoading, refetch: refetchEXOF } = useBalance({
    address,
    token: MENTO_TOKENS.eXOF.address as `0x${string}`,
    query: {
      enabled: isConnected && !!address,
    }
  });

  const { data: cREALBalance, isLoading: cREALLoading, refetch: refetchCREAL } = useBalance({
    address,
    token: MENTO_TOKENS.cREAL.address as `0x${string}`,
    query: {
      enabled: isConnected && !!address,
    }
  });

  // Get USD value using live Mento exchange rates - no mocking needed!
  const getUSDValue = useCallback(async (token: SupportedCurrency, balance: string): Promise<number> => {
    if (token === 'cUSD') return parseFloat(balance);
    
    try {
      const rate = await getLiveExchangeRate(token, 'cUSD');
      return parseFloat(balance) * rate;
    } catch (error) {
      console.warn(`Failed to get live rate for ${token}:`, error);
      // Return 0 to indicate rate unavailable rather than fake data
      return 0;
    }
  }, []);

  // Format balance data with async USD conversion
  const formatBalanceData = useCallback(async (
    token: SupportedCurrency,
    balance: any,
    isLoading: boolean
  ): Promise<TokenBalance> => {
    const balanceValue = balance?.formatted || "0";
    const usdValue = await getUSDValue(token, balanceValue);
    
    return {
      token,
      symbol: MENTO_TOKENS[token].symbol,
      balance: balance?.value?.toString() || "0",
      balanceFormatted: balanceValue,
      usdValue,
      address: MENTO_TOKENS[token].address,
      decimals: balance?.decimals || 18,
      isLoading
    };
  }, [getUSDValue]);

  // Update balance state when individual balances change
  useEffect(() => {
    if (!isConnected || !address) {
      setBalanceState({
        balances: [],
        totalUsdValue: 0,
        isLoading: false,
        lastUpdated: null,
        refreshing: false
      });
      return;
    }

    const updateBalances = async () => {
      const isAnyLoading = cUSDLoading || cEURLoading || cNGNLoading || cKESLoading || eXOFLoading || cREALLoading;

      const balances: TokenBalance[] = await Promise.all([
        formatBalanceData("cUSD", cUSDBalance, cUSDLoading),
        formatBalanceData("cEUR", cEURBalance, cEURLoading),
        formatBalanceData("cNGN", cNGNBalance, cNGNLoading),
        formatBalanceData("cKES", cKESBalance, cKESLoading),
        formatBalanceData("eXOF", eXOFBalance, eXOFLoading),
        formatBalanceData("cREAL", cREALBalance, cREALLoading),
      ]);

      const totalUsdValue = balances.reduce((total, balance) => total + balance.usdValue, 0);

      setBalanceState({
        balances,
        totalUsdValue,
        isLoading: isAnyLoading,
        lastUpdated: new Date(),
        refreshing: false
      });
    };

    updateBalances();
  }, [
    isConnected,
    address,
    cUSDBalance,
    cEURBalance,
    cNGNBalance,
    cKESBalance,
    eXOFBalance,
    cREALBalance,
    cUSDLoading,
    cEURLoading,
    cNGNLoading,
    cKESLoading,
    eXOFLoading,
    cREALLoading,
    formatBalanceData
  ]);

  // Auto-refresh balances when new blocks are mined
  useEffect(() => {
    if (blockNumber && isConnected && address) {
      // Debounce block updates to avoid excessive API calls
      const timer = setTimeout(() => {
        refreshBalances();
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [blockNumber]);

  // Manual refresh function
  const refreshBalances = useCallback(async () => {
    if (!isConnected || !address) return;

    setBalanceState(prev => ({ ...prev, refreshing: true }));

    try {
      await Promise.all([
        refetchCUSD(),
        refetchCEUR(),
        refetchCNGN(),
        refetchCKES(),
        refetchEXOF(),
        refetchCREAL()
      ]);
    } catch (error) {
      console.error("Failed to refresh balances:", error);
    }
  }, [
    isConnected,
    address,
    refetchCUSD,
    refetchCEUR,
    refetchCNGN,
    refetchCKES,
    refetchEXOF,
    refetchCREAL
  ]);

  // Get balance for specific token
  const getTokenBalance = useCallback((token: SupportedCurrency): TokenBalance | undefined => {
    return balanceState.balances.find(balance => balance.token === token);
  }, [balanceState.balances]);

  // Get balances sorted by USD value
  const getBalancesSortedByValue = useCallback(() => {
    return [...balanceState.balances].sort((a, b) => b.usdValue - a.usdValue);
  }, [balanceState.balances]);

  // Get non-zero balances only
  const getNonZeroBalances = useCallback(() => {
    return balanceState.balances.filter(balance => parseFloat(balance.balanceFormatted) > 0);
  }, [balanceState.balances]);

  // Check if user has sufficient balance for amount
  const hasSufficientBalance = useCallback((token: SupportedCurrency, amount: string | number): boolean => {
    const balance = getTokenBalance(token);
    if (!balance) return false;
    
    const amountNumber = typeof amount === 'string' ? parseFloat(amount) : amount;
    return parseFloat(balance.balanceFormatted) >= amountNumber;
  }, [getTokenBalance]);

  // Get portfolio distribution
  const getPortfolioDistribution = useCallback(() => {
    const { totalUsdValue } = balanceState;
    if (totalUsdValue === 0) return [];

    return balanceState.balances.map(balance => ({
      token: balance.token,
      symbol: balance.symbol,
      percentage: (balance.usdValue / totalUsdValue) * 100,
      value: balance.usdValue
    })).sort((a, b) => b.percentage - a.percentage);
  }, [balanceState]);

  return {
    // State
    ...balanceState,
    
    // Actions
    refreshBalances,
    
    // Utilities
    getTokenBalance,
    getBalancesSortedByValue,
    getNonZeroBalances,
    hasSufficientBalance,
    getPortfolioDistribution,
    
    // Computed values
    hasAnyBalance: balanceState.totalUsdValue > 0,
    isWalletConnected: isConnected && !!address,
    walletAddress: address
  };
}

/**
 * Hook for tracking balance changes and notifications
 */
export function useBalanceNotifications() {
  const [previousBalances, setPreviousBalances] = useState<Record<string, string>>({});
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    type: 'increase' | 'decrease';
    token: SupportedCurrency;
    amount: string;
    timestamp: Date;
  }>>([]);

  const { balances } = useMultiCurrencyBalances();

  // Track balance changes
  useEffect(() => {
    const currentBalances: Record<string, string> = {};
    
    balances.forEach(balance => {
      const key = balance.token;
      const currentAmount = balance.balanceFormatted;
      const previousAmount = previousBalances[key];
      
      currentBalances[key] = currentAmount;
      
      if (previousAmount && previousAmount !== currentAmount) {
        const isIncrease = parseFloat(currentAmount) > parseFloat(previousAmount);
        const difference = Math.abs(parseFloat(currentAmount) - parseFloat(previousAmount));
        
        if (difference > 0.01) { // Only notify for significant changes
          const notification = {
            id: `${key}-${Date.now()}`,
            type: isIncrease ? 'increase' as const : 'decrease' as const,
            token: balance.token,
            amount: difference.toFixed(2),
            timestamp: new Date()
          };
          
          setNotifications(prev => [notification, ...prev.slice(0, 9)]); // Keep last 10
        }
      }
    });
    
    setPreviousBalances(currentBalances);
  }, [balances, previousBalances]);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  }, []);

  return {
    notifications,
    clearNotifications,
    dismissNotification,
    hasUnreadNotifications: notifications.length > 0
  };
}