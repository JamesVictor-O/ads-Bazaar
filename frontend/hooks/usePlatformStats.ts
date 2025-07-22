import { useReadContracts } from "wagmi";
import { CONTRACT_ADDRESS } from "../lib/contracts";
import ABI from "../lib/AdsBazaar.json";
import { useMemo, useState, useEffect } from "react";
import { SupportedCurrency } from "../lib/mento-simple";
import { getAllLiveRates } from "../lib/mento-live";

// Live exchange rates from Mento Protocol - completely dynamic
const useExchangeRates = (baseCurrency: SupportedCurrency = "cUSD") => {
  const [rates, setRates] = useState<Record<SupportedCurrency, number>>(() => {
    // Initialize with empty state - will be populated by useEffect
    return {
      cUSD: 1.0,
      cEUR: 1.0,
      cREAL: 1.0,
      cKES: 1.0,
      eXOF: 1.0,
      cNGN: 1.0,
    };
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    const fetchLiveRates = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        console.log('🔄 Fetching live exchange rates from Mento Protocol...');
        const liveRates = await getAllLiveRates(baseCurrency);
        
        if (isMounted) {
          setRates(liveRates);
          console.log('✅ Live rates loaded:', liveRates);
        }
      } catch (err) {
        console.error('❌ Failed to fetch live rates from Mento:', err);
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Failed to fetch live rates'));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchLiveRates();

    // Refresh rates frequently as they change dynamically
    const interval = setInterval(fetchLiveRates, 5 * 60 * 1000); // Every 5 minutes

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [baseCurrency]);

  const convertAmount = (amount: number, fromCurrency: SupportedCurrency, toCurrency: SupportedCurrency = baseCurrency): number => {
    if (fromCurrency === toCurrency) return amount;
    
    // Only convert if we have valid rates
    if (!rates[fromCurrency] || !rates[toCurrency]) {
      console.warn(`⚠️ Missing rate data for ${fromCurrency} or ${toCurrency}`);
      return amount; // Return original amount if no rates available
    }
    
    // Convert from -> cUSD -> to
    const usdAmount = amount * rates[fromCurrency];
    return usdAmount / rates[toCurrency];
  };

  return { rates, convertAmount, isLoading, error };
};

export function usePlatformStats(displayCurrency: SupportedCurrency = "cUSD") {
  const { convertAmount } = useExchangeRates(displayCurrency);

  // Call all platform statistics functions from the diamond contract
  const { data, isLoading, error, refetch } = (useReadContracts as any)({
    contracts: [
      {
        address: CONTRACT_ADDRESS,
        abi: ABI.abi,
        functionName: "getTotalUsers",
      },
      {
        address: CONTRACT_ADDRESS,
        abi: ABI.abi,
        functionName: "getTotalBusinesses",
      },
      {
        address: CONTRACT_ADDRESS,
        abi: ABI.abi,
        functionName: "getTotalInfluencers",
      },
      {
        address: CONTRACT_ADDRESS,
        abi: ABI.abi,
        functionName: "getCampaignStatsByCurrency",
      },
    ],
    query: {
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
      gcTime: 10 * 60 * 1000, // Garbage collect after 10 minutes
    },
  });

  // Process multi-currency escrow data
  const multiCurrencyData = useMemo(() => {
    const campaignStats = data?.[3]?.status === "success" ? data[3].result : null;
    
    if (!campaignStats) {
      return {
        escrowByToken: {},
        totalEscrowAmount: 0,
        escrowBreakdown: [],
      };
    }

    // getCampaignStatsByCurrency returns: { tokens, symbols, campaignCounts, totalBudgets, totalVolumes }
    const { symbols, totalBudgets } = campaignStats;
    const escrowByToken: Record<string, number> = {};
    const escrowBreakdown: Array<{currency: SupportedCurrency, amount: number, convertedAmount: number}> = [];
    let totalInDisplayCurrency = 0;

    symbols.forEach((symbol: string, index: number) => {
      const currency = symbol as SupportedCurrency;
      const amount = Number(totalBudgets[index]) / 1e18; // totalBudgets represents escrow amounts
      const convertedAmount = convertAmount(amount, currency, displayCurrency);
      
      escrowByToken[currency] = amount;
      escrowBreakdown.push({
        currency,
        amount,
        convertedAmount,
      });
      totalInDisplayCurrency += convertedAmount;
    });

    return {
      escrowByToken,
      totalEscrowAmount: totalInDisplayCurrency,
      escrowBreakdown,
    };
  }, [data, convertAmount, displayCurrency]);

  const stats = {
    totalUsers: data?.[0]?.status === "success" ? Number(data[0].result) : 0,
    totalBusinesses: data?.[1]?.status === "success" ? Number(data[1].result) : 0,
    totalInfluencers: data?.[2]?.status === "success" ? Number(data[2].result) : 0,
    totalEscrowAmount: multiCurrencyData.totalEscrowAmount,
    escrowByToken: multiCurrencyData.escrowByToken,
    escrowBreakdown: multiCurrencyData.escrowBreakdown,
    displayCurrency,
  };

  return {
    stats,
    isLoading,
    error,
    refetch,
  };
}

