import { useState, useCallback, useEffect, useMemo } from 'react';
import { useReadContract, useAccount } from 'wagmi';
import { Hex } from 'viem';
import { CONTRACT_ADDRESS } from '@/lib/contracts';
import AdsBazaarABI from '@/lib/AdsBazaar.json';
import { MENTO_TOKENS, SupportedCurrency } from '@/lib/mento-simple';
import { SparkCampaign, formatSparkAmount, isSparkCompleted } from './useSparkCampaign';

export type SparkFilter = 'all' | 'trending' | 'new' | 'almost-complete' | 'my-created' | 'my-participated';
export type SparkSortBy = 'multiplier' | 'budget' | 'participants' | 'created' | 'progress';

export interface SparkWithMetadata extends SparkCampaign {
  currency: SupportedCurrency;
  currencySymbol: string;
  formattedBudget: string;
  formattedRemainingBudget: string;
  formattedBaseReward: string;
  formattedRewardWithMultiplier: string;
  isCompleted: boolean;
  budgetProgress: number; // Percentage of budget used
  timeRemaining: string;
  isCreatedByUser: boolean;
  userHasParticipated: boolean;
  estimatedUserEarnings?: string;
}

// Hook for discovering and filtering Spark Campaigns
export function useSparkDiscovery() {
  const { address } = useAccount();
  const [filter, setFilter] = useState<SparkFilter>('all');
  const [sortBy, setSortBy] = useState<SparkSortBy>('multiplier');
  const [searchTerm, setSearchTerm] = useState('');

  // Get active sparks
  const { 
    data: activeSparkIds,
    isLoading: isLoadingActive,
    refetch: refetchActive 
  } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: AdsBazaarABI,
    functionName: 'getActiveSparks',
    args: [0, 100], // offset: 0, limit: 100
  });

  // Get trending sparks (high multiplier)
  const { 
    data: trendingSparkIds,
    isLoading: isLoadingTrending 
  } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: AdsBazaarABI,
    functionName: 'getSparksByMultiplier',
    args: [5], // 5x multiplier or higher
  });

  // Get user's created sparks
  const { 
    data: userCreatedSparkIds,
    isLoading: isLoadingUserCreated 
  } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: AdsBazaarABI,
    functionName: 'getUserCreatedSparks',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  // Get user's participated sparks
  const { 
    data: userParticipatedSparkIds,
    isLoading: isLoadingUserParticipated 
  } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: AdsBazaarABI,
    functionName: 'getUserParticipatedSparks',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  // Get current spark IDs based on filter
  const currentSparkIds = useMemo(() => {
    switch (filter) {
      case 'trending':
        return trendingSparkIds as Hex[] || [];
      case 'my-created':
        return userCreatedSparkIds as Hex[] || [];
      case 'my-participated':
        return userParticipatedSparkIds as Hex[] || [];
      case 'all':
      case 'new':
      case 'almost-complete':
      default:
        return activeSparkIds as Hex[] || [];
    }
  }, [filter, activeSparkIds, trendingSparkIds, userCreatedSparkIds, userParticipatedSparkIds]);

  return {
    // Current filter data
    currentSparkIds,
    
    // All data
    activeSparkIds: activeSparkIds as Hex[] | undefined,
    trendingSparkIds: trendingSparkIds as Hex[] | undefined,
    userCreatedSparkIds: userCreatedSparkIds as Hex[] | undefined,
    userParticipatedSparkIds: userParticipatedSparkIds as Hex[] | undefined,
    
    // Loading states
    isLoading: isLoadingActive || isLoadingTrending || isLoadingUserCreated || isLoadingUserParticipated,
    isLoadingActive,
    isLoadingTrending,
    
    // Filter controls
    filter,
    setFilter,
    sortBy,
    setSortBy,
    searchTerm,
    setSearchTerm,
    
    // Actions
    refetch: refetchActive,
  };
}

// Hook for fetching multiple spark campaigns with metadata
export function useMultipleSparkCampaigns(sparkIds: Hex[]) {
  const { address } = useAccount();
  const [sparkCampaigns, setSparkCampaigns] = useState<SparkWithMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Function to get currency from token address
  const getCurrencyFromAddress = useCallback((tokenAddress: string): { currency: SupportedCurrency; symbol: string } => {
    const currency = Object.entries(MENTO_TOKENS).find(([_, token]) => 
      token.address.toLowerCase() === tokenAddress.toLowerCase()
    );
    
    if (currency) {
      const [currencyKey] = currency;
      return {
        currency: currencyKey as SupportedCurrency,
        symbol: MENTO_TOKENS[currencyKey as SupportedCurrency].symbol
      };
    }
    
    return { currency: 'cUSD', symbol: 'cUSD' };
  }, []);

  // Function to calculate time remaining
  const calculateTimeRemaining = useCallback((expiresAt: number): string => {
    const now = Math.floor(Date.now() / 1000);
    const remaining = expiresAt - now;
    
    if (remaining <= 0) return 'Expired';
    
    const days = Math.floor(remaining / 86400);
    const hours = Math.floor((remaining % 86400) / 3600);
    const minutes = Math.floor((remaining % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  }, []);

  // Fetch spark campaigns data
  const fetchSparkCampaigns = useCallback(async () => {
    if (!sparkIds.length) {
      setSparkCampaigns([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // This would typically be done with a multicall contract or batch requests
      // For now, we'll simulate the data structure
      const campaigns: SparkWithMetadata[] = [];
      
      // In a real implementation, you would batch these calls
      for (const sparkId of sparkIds) {
        try {
          // You would fetch each campaign data here
          // const sparkData = await readContract({...});
          // For now, we'll create a placeholder structure
          
          // This is where you'd implement the actual contract calls
          // campaigns.push(formattedCampaign);
        } catch (err) {
          console.warn(`Failed to fetch spark campaign ${sparkId}:`, err);
        }
      }
      
      setSparkCampaigns(campaigns);
    } catch (err) {
      console.error('Error fetching spark campaigns:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [sparkIds, address, getCurrencyFromAddress, calculateTimeRemaining]);

  useEffect(() => {
    fetchSparkCampaigns();
  }, [fetchSparkCampaigns]);

  // Filter and sort campaigns
  const filteredAndSortedCampaigns = useMemo(() => {
    return sparkCampaigns
      .filter(campaign => !isSparkCompleted(campaign.status, campaign.remainingBudget))
      .sort((a, b) => {
        switch (true) {
          case 'multiplier':
            return b.multiplier - a.multiplier;
          case 'budget':
            return Number(b.totalBudget - a.totalBudget);
          case 'participants':
            return b.participantCount - a.participantCount;
          case 'created':
            return b.createdAt - a.createdAt;
          case 'progress':
            return b.budgetProgress - a.budgetProgress; // Most budget used first
          default:
            return b.multiplier - a.multiplier;
        }
      });
  }, [sparkCampaigns]);

  return {
    sparkCampaigns: filteredAndSortedCampaigns,
    isLoading,
    error,
    refetch: fetchSparkCampaigns,
  };
}

// Hook for Spark Campaign statistics
export function useSparkStats() {
  // Get active sparks count
  const { data: activeSparkIds } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: AdsBazaarABI,
    functionName: 'getActiveSparks',
    args: [0, 1000], // Get up to 1000 to count them
  });

  // Get trending sparks count
  const { data: trendingSparkIds } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: AdsBazaarABI,
    functionName: 'getSparksByMultiplier',
    args: [5],
  });

  const stats = useMemo(() => {
    const activeSparks = (activeSparkIds as Hex[] || []).length;
    const trendingSparks = (trendingSparkIds as Hex[] || []).length;
    
    return {
      totalActiveSparks: activeSparks,
      trendingSparks,
      regularSparks: activeSparks - trendingSparks,
    };
  }, [activeSparkIds, trendingSparkIds]);

  return stats;
}

// Hook for real-time spark updates
export function useSparkRealTimeUpdates(sparkId?: Hex) {
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now());

  // Simulate real-time updates (in production, you'd use WebSockets or polling)
  useEffect(() => {
    if (!sparkId) return;

    const interval = setInterval(() => {
      setLastUpdate(Date.now());
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [sparkId]);

  return { lastUpdate };
}

// Hook for Spark Campaign search and filtering
export function useSparkSearch(campaigns: SparkWithMetadata[], searchTerm: string) {
  return useMemo(() => {
    if (!searchTerm.trim()) return campaigns;
    
    const term = searchTerm.toLowerCase();
    
    return campaigns.filter(campaign => 
      campaign.castUrl.toLowerCase().includes(term) ||
      campaign.creator.toLowerCase().includes(term) ||
      campaign.currencySymbol.toLowerCase().includes(term) ||
      campaign.multiplier.toString().includes(term)
    );
  }, [campaigns, searchTerm]);
}

// Hook for Spark Campaign analytics
export function useSparkAnalytics(sparkId?: Hex) {
  const { data: sparkData } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: AdsBazaarABI,
    functionName: 'getSparkCampaign',
    args: sparkId ? [sparkId] : undefined,
    query: { enabled: !!sparkId },
  });

  const analytics = useMemo(() => {
    if (!sparkData) return null;

    const totalBudget = sparkData[4] as bigint;
    const remainingBudget = sparkData[5] as bigint;
    const totalRewardsPaid = sparkData[14] as bigint;
    const participantCount = Number(sparkData[12]);
    const verifiedCount = Number(sparkData[13]);

    const completionRate = participantCount > 0 ? (verifiedCount / participantCount) * 100 : 0;
    const budgetUtilization = totalBudget > 0n ? Number((totalBudget - remainingBudget) * 100n / totalBudget) : 0;

    return {
      totalParticipants: participantCount,
      verifiedParticipants: verifiedCount,
      completionRate: Math.round(completionRate),
      budgetUtilization: Math.round(budgetUtilization),
      averageReward: verifiedCount > 0 ? totalRewardsPaid / BigInt(verifiedCount) : 0n,
      remainingBudget,
      totalRewardsPaid,
    };
  }, [sparkData]);

  return analytics;
}

// Export utility functions
export const filterSparksByStatus = (campaigns: SparkWithMetadata[], status: 'active' | 'completed'): SparkWithMetadata[] => {
  return campaigns.filter(campaign => 
    status === 'active' ? !campaign.isCompleted : campaign.isCompleted
  );
};

export const getTopSparksByMultiplier = (campaigns: SparkWithMetadata[], limit: number = 10): SparkWithMetadata[] => {
  return [...campaigns]
    .sort((a, b) => b.multiplier - a.multiplier)
    .slice(0, limit);
};

export const getSparksByBudgetProgress = (campaigns: SparkWithMetadata[], minProgress: number = 80): SparkWithMetadata[] => {
  return campaigns.filter(campaign => 
    campaign.budgetProgress >= minProgress && !campaign.isCompleted
  );
};