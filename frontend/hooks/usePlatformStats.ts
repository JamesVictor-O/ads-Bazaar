import { useReadContracts } from "wagmi";
import { CONTRACT_ADDRESS } from "../lib/contracts";
import ABI from "../lib/AdsBazaar.json";
import { useMemo } from "react";
import { SupportedCurrency } from "../lib/mento-simple";

// Exchange rates (mock data - in production, fetch from Mento)
const useExchangeRates = (baseCurrency: SupportedCurrency = "cUSD") => {
  // Mock exchange rates - replace with real Mento rates in production
  const rates: Record<SupportedCurrency, number> = {
    cUSD: 1.0,
    cEUR: 1.06, // 1 cEUR ≈ 1.06 cUSD
    cREAL: 0.19, // 1 cREAL ≈ 0.19 cUSD
    cKES: 0.0077, // 1 cKES ≈ 0.0077 cUSD
    eXOF: 0.0017, // 1 eXOF ≈ 0.0017 cUSD  
    cNGN: 0.0013, // 1 cNGN ≈ 0.0013 cUSD
  };

  const convertAmount = (amount: number, fromCurrency: SupportedCurrency, toCurrency: SupportedCurrency = baseCurrency): number => {
    if (fromCurrency === toCurrency) return amount;
    // Convert from -> cUSD -> to
    const usdAmount = amount * rates[fromCurrency];
    return usdAmount / rates[toCurrency];
  };

  return { rates, convertAmount };
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

