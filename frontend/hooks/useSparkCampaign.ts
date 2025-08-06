import { useState, useCallback, useEffect, useMemo } from 'react';
import { useWriteContract, useReadContract, useAccount, useWaitForTransactionReceipt, usePublicClient } from 'wagmi';
import { parseUnits, formatUnits, Hex } from 'viem';
import { MENTO_TOKENS, SupportedCurrency } from '@/lib/mento-simple';
import { CONTRACT_ADDRESS } from '@/lib/contracts';
import AdsBazaarABI from '@/lib/AdsBazaar.json';
import { erc20Abi } from 'viem';
import { toast } from 'react-hot-toast';
import { useEnsureNetwork } from './useEnsureNetwork';
import { useDivviIntegration } from './useDivviIntegration';

// Type definitions
type SparkStatus = 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';

export interface SparkCampaign {
  sparkId: Hex;
  creator: string;
  castUrl: string;
  tokenAddress: string;
  totalBudget: bigint;
  remainingBudget: bigint;
  baseReward: bigint;
  multiplier: number;
  maxParticipants: number;
  createdAt: number;
  expiresAt: number;
  status: SparkStatus;
  participantCount: number;
  verifiedCount: number;
  totalRewardsPaid: bigint;
}

export interface SparkParticipation {
  participant: string;
  sparkId: Hex;
  recastUrl: string;
  timestamp: number;
  verified: boolean;
  rewarded: boolean;
  rewardAmount: bigint;
  verificationScore: number;
}

export interface SparkConfiguration {
  minDeposit: bigint;
  maxMultiplier: number;
  minDuration: number;
  maxDuration: number;
}

// Hook for creating Spark Campaigns
export function useCreateSparkCampaign() {
  const { address } = useAccount();
  const { writeContractAsync, isPending, error } = useWriteContract();
  const { waitForTransactionReceipt } = useWaitForTransactionReceipt();
  const { ensureNetwork } = useEnsureNetwork();
  const { generateDivviReferralTag, trackTransaction } = useDivviIntegration();
  const [isCreating, setIsCreating] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [latestError, setLatestError] = useState<Error | null>(null);

  const createSparkCampaign = useCallback(async (params: {
    castUrl: string;
    currency: SupportedCurrency;
    depositAmount: string;
    multiplier: number;
    durationHours: number;
    maxParticipants?: number;
  }) => {
    if (!address) throw new Error('Wallet not connected');
    
    const isCorrectNetwork = await ensureNetwork();
    if (!isCorrectNetwork) {
      throw new Error('Please switch to the correct network');
    }

    setIsCreating(true);
    setIsSuccess(false);
    setLatestError(null);
    
    try {
      const tokenInfo = MENTO_TOKENS[params.currency];
      const depositInWei = parseUnits(params.depositAmount, tokenInfo.decimals);
      const maxParticipants = params.maxParticipants || 0; // 0 means unlimited
      
      // Generate Divvi referral tag
      const referralTag = generateDivviReferralTag();

      // First approve token transfer (if not native token)
      if (tokenInfo.address !== '0x0000000000000000000000000000000000000000') {
        const approveTx = await writeContractAsync({
          address: tokenInfo.address as `0x${string}`,
          abi: erc20Abi,
          functionName: 'approve',
          args: [CONTRACT_ADDRESS as `0x${string}`, depositInWei],
        });

        await waitForTransactionReceipt({ hash: approveTx });
        toast.success('Token approval successful');
      }

      // Create spark campaign with Divvi tracking
      const tx = await writeContractAsync({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: AdsBazaarABI,
        functionName: 'createSparkCampaign',
        args: [
          params.castUrl,
          tokenInfo.address,
          params.multiplier,
          params.durationHours,
          maxParticipants
        ],
        value: tokenInfo.address === '0x0000000000000000000000000000000000000000' ? depositInWei : 0n,
        dataSuffix: referralTag,
      });

      const receipt = await waitForTransactionReceipt({ hash: tx });
      
      if (receipt.status === 'success') {
        setIsSuccess(true);
        
        // Track transaction with Divvi
        await trackTransaction(tx);
        
        toast.success('Spark Campaign created successfully!');
        return { success: true, txHash: tx };
      } else {
        throw new Error('Transaction failed');
      }
      
    } catch (error: any) {
      console.error('Error creating spark campaign:', error);
      setLatestError(error);
      toast.error(error.message || 'Failed to create spark campaign');
      throw error;
    } finally {
      setIsCreating(false);
    }
  }, [address, writeContractAsync, waitForTransactionReceipt, ensureNetwork, generateDivviReferralTag, trackTransaction]);

  return {
    createSparkCampaign,
    isCreating: isCreating || isPending,
    isSuccess,
    error: latestError || error,
  };
}

// Hook for participating in Spark Campaigns
export function useSparkParticipation() {
  const { address } = useAccount();
  const { writeContractAsync, isPending } = useWriteContract();
  const { waitForTransactionReceipt } = useWaitForTransactionReceipt();
  const { ensureNetwork } = useEnsureNetwork();
  const { generateDivviReferralTag, trackTransaction } = useDivviIntegration();
  const [isParticipating, setIsParticipating] = useState(false);
  const [latestError, setLatestError] = useState<Error | null>(null);

  const verifyAndClaimSpark = useCallback(async (sparkId: Hex) => {
    if (!address) throw new Error('Wallet not connected');
    
    const isCorrectNetwork = await ensureNetwork();
    if (!isCorrectNetwork) {
      throw new Error('Please switch to the correct network');
    }

    setIsParticipating(true);
    setLatestError(null);
    
    try {
      // Generate Divvi referral tag for participation tracking
      const referralTag = generateDivviReferralTag();
      
      const tx = await writeContractAsync({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: AdsBazaarABI,
        functionName: 'verifyAndClaimSpark',
        args: [sparkId],
        dataSuffix: referralTag,
      });

      const receipt = await waitForTransactionReceipt({ hash: tx });
      
      if (receipt.status === 'success') {
        // Track transaction with Divvi
        await trackTransaction(tx);
        
        toast.success('Verification initiated! You will be rewarded if the recast is confirmed.');
        return { success: true, txHash: tx };
      } else {
        throw new Error('Transaction failed');
      }
      
    } catch (error: any) {
      console.error('Error verifying spark participation:', error);
      setLatestError(error);
      toast.error(error.message || 'Failed to verify participation');
      throw error;
    } finally {
      setIsParticipating(false);
    }
  }, [address, writeContractAsync, waitForTransactionReceipt, ensureNetwork, generateDivviReferralTag, trackTransaction]);

  return {
    verifyAndClaimSpark,
    isParticipating: isParticipating || isPending,
    error: latestError,
  };
}

// Hook for fetching Spark Campaign data
export function useSparkCampaignData(sparkId?: Hex) {
  const { address } = useAccount();
  
  // Get specific spark campaign
  const { 
    data: sparkData, 
    isLoading: isLoadingSparkData,
    refetch: refetchSparkData 
  } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: AdsBazaarABI,
    functionName: 'getSparkCampaign',
    args: sparkId ? [sparkId] : undefined,
    query: {
      enabled: !!sparkId,
    },
  });

  // Get active sparks
  const { 
    data: activeSparksData,
    isLoading: isLoadingActiveSparks,
    refetch: refetchActiveSparks 
  } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: AdsBazaarABI,
    functionName: 'getActiveSparks',
    args: [0, 50], // offset: 0, limit: 50
  });

  // Get user's created sparks
  const { 
    data: userCreatedSparks,
    isLoading: isLoadingUserCreatedSparks,
    refetch: refetchUserCreatedSparks 
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
    data: userParticipatedSparks,
    isLoading: isLoadingUserParticipatedSparks,
    refetch: refetchUserParticipatedSparks 
  } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: AdsBazaarABI,
    functionName: 'getUserParticipatedSparks',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  // Get participation details for specific spark
  const { 
    data: participationData,
    isLoading: isLoadingParticipationData,
    refetch: refetchParticipationData 
  } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: AdsBazaarABI,
    functionName: 'getSparkParticipation',
    args: sparkId && address ? [sparkId, address] : undefined,
    query: {
      enabled: !!(sparkId && address),
    },
  });

  // Format spark campaign data
  const formattedSparkData = useMemo((): SparkCampaign | null => {
    if (!sparkData) return null;
    
    return {
      sparkId: sparkData[0],
      creator: sparkData[1],
      castUrl: sparkData[2],
      tokenAddress: sparkData[3],
      totalBudget: sparkData[4],
      remainingBudget: sparkData[5],
      baseReward: sparkData[6],
      multiplier: Number(sparkData[7]),
      maxParticipants: Number(sparkData[8]),
      createdAt: Number(sparkData[9]),
      expiresAt: Number(sparkData[10]),
      status: ['ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED'][Number(sparkData[11])] as SparkStatus,
      participantCount: Number(sparkData[12]),
      verifiedCount: Number(sparkData[13]),
      totalRewardsPaid: sparkData[14],
    };
  }, [sparkData]);

  // Format participation data
  const formattedParticipationData = useMemo((): SparkParticipation | null => {
    if (!participationData || !sparkId) return null;
    
    return {
      participant: participationData[0],
      sparkId: participationData[1],
      recastUrl: participationData[2],
      timestamp: Number(participationData[3]),
      verified: participationData[4],
      rewarded: participationData[5],
      rewardAmount: participationData[6],
      verificationScore: Number(participationData[7]),
    };
  }, [participationData, sparkId]);

  const refetchAll = useCallback(() => {
    refetchSparkData();
    refetchActiveSparks();
    refetchUserCreatedSparks();
    refetchUserParticipatedSparks();
    refetchParticipationData();
  }, [refetchSparkData, refetchActiveSparks, refetchUserCreatedSparks, refetchUserParticipatedSparks, refetchParticipationData]);

  return {
    // Single spark data
    sparkCampaign: formattedSparkData,
    participationData: formattedParticipationData,
    
    // Lists
    activeSparks: activeSparksData as Hex[] | undefined,
    userCreatedSparks: userCreatedSparks as Hex[] | undefined,
    userParticipatedSparks: userParticipatedSparks as Hex[] | undefined,
    
    // Loading states
    isLoading: isLoadingSparkData || isLoadingActiveSparks || isLoadingUserCreatedSparks || isLoadingUserParticipatedSparks || isLoadingParticipationData,
    isLoadingSparkData,
    isLoadingActiveSparks,
    
    // Actions
    refetch: refetchAll,
    refetchSparkData,
    refetchActiveSparks,
  };
}

// Hook for Spark Campaign configuration (admin only)
export function useSparkConfiguration() {
  // Get current configuration
  const { 
    data: configData,
    isLoading: isLoadingConfig,
    refetch: refetchConfig 
  } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: AdsBazaarABI,
    functionName: 'getSparkConfiguration',
  });

  // Format configuration data
  const configuration = useMemo((): SparkConfiguration | null => {
    if (!configData) return null;
    
    return {
      minDeposit: configData[0],
      maxMultiplier: Number(configData[1]),
      minDuration: Number(configData[2]),
      maxDuration: Number(configData[3]),
    };
  }, [configData]);

  return {
    configuration,
    isLoadingConfig,
    refetchConfig,
  };
}

// Hook for estimated earnings calculation
export function useSparkEarnings(sparkId?: Hex, participantAddress?: string) {
  const { 
    data: estimatedEarnings,
    isLoading 
  } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: AdsBazaarABI,
    functionName: 'getEstimatedEarnings',
    args: sparkId && participantAddress ? [sparkId, participantAddress] : undefined,
    query: {
      enabled: !!(sparkId && participantAddress),
    },
  });

  return {
    estimatedEarnings: estimatedEarnings as bigint | undefined,
    isLoading,
  };
}

// Hook for checking if user has participated
export function useHasParticipated(sparkId?: Hex, userAddress?: string) {
  const { 
    data: hasParticipated,
    isLoading,
    refetch 
  } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: AdsBazaarABI,
    functionName: 'hasParticipated',
    args: sparkId && userAddress ? [sparkId, userAddress] : undefined,
    query: {
      enabled: !!(sparkId && userAddress),
    },
  });

  return {
    hasParticipated: hasParticipated as boolean | undefined,
    isLoading,
    refetch,
  };
}

// Hook for trending sparks (by multiplier)
export function useTrendingSparks(minMultiplier: number = 5) {
  const { 
    data: trendingSparks,
    isLoading,
    refetch 
  } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: AdsBazaarABI,
    functionName: 'getSparksByMultiplier',
    args: [minMultiplier],
  });

  return {
    trendingSparks: trendingSparks as Hex[] | undefined,
    isLoading,
    refetch,
  };
}

// Utility functions for formatting
export const formatSparkAmount = (amount: bigint, tokenAddress: string): string => {
  const currency = Object.entries(MENTO_TOKENS).find(([_, token]) => 
    token.address.toLowerCase() === tokenAddress.toLowerCase()
  );
  
  if (!currency) return formatUnits(amount, 18);
  
  const [currencyKey] = currency;
  const tokenInfo = MENTO_TOKENS[currencyKey as SupportedCurrency];
  return formatUnits(amount, tokenInfo.decimals);
};

export const formatSparkDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    return `${days} day${days > 1 ? 's' : ''}`;
  }
  return `${hours} hour${hours > 1 ? 's' : ''}`;
};

export const getSparkStatusColor = (status: SparkStatus): string => {
  switch (status) {
    case 'ACTIVE': return 'text-green-600';
    case 'PAUSED': return 'text-yellow-600';
    case 'COMPLETED': return 'text-blue-600';
    case 'CANCELLED': return 'text-red-600';
    default: return 'text-gray-600';
  }
};

export const isSparkCompleted = (status: SparkStatus, remainingBudget: bigint): boolean => {
  return status === 'COMPLETED' || remainingBudget === 0n;
};

export const getSparkProgress = (totalBudget: bigint, remainingBudget: bigint): number => {
  if (totalBudget === 0n) return 0;
  const used = totalBudget - remainingBudget;
  return Number((used * 100n) / totalBudget);
};

export const timeUntilExpiry = (expiresAt: number): string => {
  const now = Date.now() / 1000;
  const remaining = expiresAt - now;
  
  if (remaining <= 0) return 'Expired';
  
  const hours = Math.floor(remaining / 3600);
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    return `${days}d ${hours % 24}h remaining`;
  }
  return `${hours}h remaining`;
};