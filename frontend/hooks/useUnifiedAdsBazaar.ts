/**
 * Unified AdsBazaar Hook
 * Consolidates all AdsBazaar functionality into a single hook system
 * Supports both legacy cUSD workflows and modern multi-currency operations
 */

import { useState, useCallback, useMemo } from 'react';
import { useWriteContract, useReadContract, useAccount, useBalance } from 'wagmi';
import { parseUnits, formatUnits, erc20Abi } from 'viem';
import { CONTRACT_ADDRESS, getMentoTokenAddresses } from '@/lib/contracts';
import { SupportedCurrency, MENTO_TOKENS } from '@/lib/mento-simple';
import { DEFAULT_NETWORK } from '@/lib/networks';
import { toast } from 'react-hot-toast';
import AdsBazaarABI from '@/lib/AdsBazaar.json';

// Types
export interface CampaignData {
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
}

export interface UserBalance {
  currency: SupportedCurrency;
  symbol: string;
  balance: string;
  formattedBalance: string;
  hasBalance: boolean;
  address: string;
}

// Main Unified Hook
export function useUnifiedAdsBazaar() {
  const { address } = useAccount();
  const { writeContract, isPending } = useWriteContract();
  const [loading, setLoading] = useState(false);

  // Contract configuration
  const contractConfig = useMemo(() => ({
    address: CONTRACT_ADDRESS,
    abi: AdsBazaarABI.abi,
    chainId: DEFAULT_NETWORK.id,
  }), []);

  // User Registration
  const registerUser = useCallback(async (
    username: string,
    isBusiness: boolean,
    isInfluencer: boolean
  ) => {
    if (!address) throw new Error('Wallet not connected');

    setLoading(true);
    try {
      const result = await writeContract({
        ...contractConfig,
        functionName: 'registerUser',
        args: [username, isBusiness, isInfluencer],
        account: address,
        chain: DEFAULT_NETWORK,
      });
      toast.success('User registered successfully!');
      return result;
    } catch (error) {
      console.error('Error registering user:', error);
      toast.error('Failed to register user');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [address, writeContract, contractConfig]);

  return {
    // Core functionality
    registerUser,
    
    // State
    isLoading: loading || isPending,
    address,
    contractConfig,
  };
}

// Campaign Management Hook
export function useCampaignManagement() {
  const { address } = useAccount();
  const { writeContract, isPending } = useWriteContract();
  const [isCreating, setIsCreating] = useState(false);

  const contractConfig = useMemo(() => ({
    address: CONTRACT_ADDRESS,
    abi: AdsBazaarABI.abi,
  }), []);

  // Multicurrency Campaign Creation (supports all currencies including cUSD)
  const createCampaign = useCallback(async (
    campaignData: CampaignData,
    currency: SupportedCurrency = 'cUSD'
  ) => {
    if (!address) throw new Error('Wallet not connected');

    setIsCreating(true);
    try {
      const tokenInfo = MENTO_TOKENS[currency];
      const budgetInWei = parseUnits(campaignData.budget, tokenInfo.decimals);

      // Always use multicurrency function - unified contract supports all currencies
      const result = await writeContract({
        ...contractConfig,
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
        account: address,
        chain: DEFAULT_NETWORK,
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
  }, [address, writeContract, contractConfig]);

  // Cancel Campaign
  const cancelCampaign = useCallback(async (briefId: string) => {
    if (!address) throw new Error('Wallet not connected');

    try {
      const result = await writeContract({
        ...contractConfig,
        functionName: 'cancelAdBrief',
        args: [briefId],
        account: address,
        chain: DEFAULT_NETWORK,
      });
      toast.success('Campaign cancelled successfully!');
      return result;
    } catch (error) {
      console.error('Error cancelling campaign:', error);
      toast.error('Failed to cancel campaign');
      throw error;
    }
  }, [address, writeContract, contractConfig]);

  return {
    createCampaign,
    cancelCampaign,
    isCreating: isCreating || isPending,
  };
}

// Payment Management Hook
export function usePaymentManagement() {
  const { address } = useAccount();
  const { writeContract, isPending } = useWriteContract();
  const [isClaiming, setIsClaiming] = useState(false);

  const contractConfig = useMemo(() => ({
    address: CONTRACT_ADDRESS,
    abi: AdsBazaarABI.abi,
  }), []);

  // Multicurrency Payment Claims
  const claimPayments = useCallback(async (currency?: SupportedCurrency) => {
    if (!address) throw new Error('Wallet not connected');

    setIsClaiming(true);
    try {
      if (!currency) {
        // Claim all payments across all currencies
        const result = await writeContract({
          ...contractConfig,
          functionName: 'claimAllPendingPayments',
          args: [],
          account: address,
          chain: DEFAULT_NETWORK,
        });
        toast.success('All payments claimed successfully!');
        return result;
      } else {
        // Claim payments for specific currency
        const tokenInfo = MENTO_TOKENS[currency];
        const result = await writeContract({
          ...contractConfig,
          functionName: 'claimPaymentsInToken',
          args: [tokenInfo.address],
          account: address,
          chain: DEFAULT_NETWORK,
        });
        toast.success(`${tokenInfo.symbol} payments claimed successfully!`);
        return result;
      }
    } catch (error) {
      console.error('Error claiming payments:', error);
      toast.error('Failed to claim payments');
      throw error;
    } finally {
      setIsClaiming(false);
    }
  }, [address, writeContract, contractConfig]);

  // Claim all currencies at once
  const claimAllPayments = useCallback(async () => {
    if (!address) throw new Error('Wallet not connected');

    setIsClaiming(true);
    try {
      const result = await writeContract({
        ...contractConfig,
        functionName: 'claimAllPendingPayments',
        args: [],
        account: address,
        chain: DEFAULT_NETWORK,
      });
      toast.success('All payments claimed successfully!');
      return result;
    } catch (error) {
      console.error('Error claiming all payments:', error);
      toast.error('Failed to claim payments');
      throw error;
    } finally {
      setIsClaiming(false);
    }
  }, [address, writeContract, contractConfig]);

  return {
    claimPayments,
    claimAllPayments,
    isClaiming: isClaiming || isPending,
  };
}

// Application Management Hook
export function useApplicationManagement() {
  const { address } = useAccount();
  const { writeContract, isPending } = useWriteContract();

  const contractConfig = useMemo(() => ({
    address: CONTRACT_ADDRESS,
    abi: AdsBazaarABI.abi,
  }), []);

  // Apply to Campaign
  const applyToCampaign = useCallback(async (briefId: string, message: string) => {
    if (!address) throw new Error('Wallet not connected');

    try {
      const result = await writeContract({
        ...contractConfig,
        functionName: 'applyToBrief',
        args: [briefId, message],
        account: address,
        chain: DEFAULT_NETWORK,
      });
      toast.success('Application submitted successfully!');
      return result;
    } catch (error) {
      console.error('Error applying to campaign:', error);
      toast.error('Failed to submit application');
      throw error;
    }
  }, [address, writeContract, contractConfig]);

  // Select Influencer
  const selectInfluencer = useCallback(async (briefId: string, influencerAddress: string) => {
    if (!address) throw new Error('Wallet not connected');

    try {
      const result = await writeContract({
        ...contractConfig,
        functionName: 'selectInfluencer',
        args: [briefId, influencerAddress],
        account: address,
        chain: DEFAULT_NETWORK,
      });
      toast.success('Influencer selected successfully!');
      return result;
    } catch (error) {
      console.error('Error selecting influencer:', error);
      toast.error('Failed to select influencer');
      throw error;
    }
  }, [address, writeContract, contractConfig]);

  return {
    applyToCampaign,
    selectInfluencer,
    isLoading: isPending,
  };
}

// User Balance Hook (supports all currencies)
export function useUserBalances() {
  const { address } = useAccount();
  const mentoTokens = getMentoTokenAddresses();

  // Get CELO balance
  const { data: celoBalance } = useBalance({
    address,
    chainId: DEFAULT_NETWORK.id,
  });

  // Get all token balances
  const tokenBalances = Object.entries(MENTO_TOKENS).map(([currency, tokenInfo]) => {
    const { data: balance } = useBalance({
      address,
      token: tokenInfo.address as `0x${string}`,
      chainId: DEFAULT_NETWORK.id,
    });

    const formattedBalance = balance ? formatUnits(balance.value, balance.decimals) : '0';
    const hasBalance = balance && balance.value > 0n;

    return {
      currency: currency as SupportedCurrency,
      symbol: tokenInfo.symbol,
      balance: balance?.value?.toString() || '0',
      formattedBalance,
      hasBalance: !!hasBalance,
      address: tokenInfo.address,
    } as UserBalance;
  });

  // Filter balances to show only CELO, cUSD, and currencies with balance > 0
  const displayBalances = useMemo(() => {
    const balances: UserBalance[] = [];

    // Always include CELO
    if (celoBalance) {
      balances.push({
        currency: 'CELO' as SupportedCurrency,
        symbol: 'CELO',
        balance: celoBalance.value.toString(),
        formattedBalance: formatUnits(celoBalance.value, celoBalance.decimals),
        hasBalance: celoBalance.value > 0n,
        address: '0x0000000000000000000000000000000000000000', // Native token
      });
    }

    // Always include cUSD
    const cUSDBalance = tokenBalances.find(b => b.currency === 'cUSD');
    if (cUSDBalance) {
      balances.push(cUSDBalance);
    }

    // Include other currencies only if they have balance > 0
    const otherBalances = tokenBalances.filter(b => 
      b.currency !== 'cUSD' && b.hasBalance
    );
    balances.push(...otherBalances);

    return balances;
  }, [celoBalance, tokenBalances]);

  return {
    balances: displayBalances,
    totalCurrencies: displayBalances.length,
    hasAnyBalance: displayBalances.some(b => b.hasBalance),
  };
}

// Data Fetching Hooks
export function useAdsBazaarData() {
  const contractConfig = useMemo(() => ({
    address: CONTRACT_ADDRESS,
    abi: AdsBazaarABI.abi,
    chainId: DEFAULT_NETWORK.id,
  }), []);

  // Get user by username (unified contract)
  const getUserByUsername = useCallback((username: string) => {
    return useReadContract({
      ...contractConfig,
      functionName: 'getUserByUsername',
      args: [username],
    });
  }, [contractConfig]);

  // Get all briefs
  const getAllBriefs = useCallback(() => {
    return useReadContract({
      ...contractConfig,
      functionName: 'getAllBriefs',
      args: [],
    });
  }, [contractConfig]);

  return {
    getUserByUsername,
    getAllBriefs,
    contractConfig,
  };
}

// Main export - provides all functionality
export default function useAdsBazaar() {
  const unified = useUnifiedAdsBazaar();
  const campaigns = useCampaignManagement();
  const payments = usePaymentManagement();
  const applications = useApplicationManagement();
  const balances = useUserBalances();
  const data = useAdsBazaarData();

  return {
    // User management
    registerUser: unified.registerUser,
    address: unified.address,
    
    // Campaign management
    createCampaign: campaigns.createCampaign,
    cancelCampaign: campaigns.cancelCampaign,
    isCreatingCampaign: campaigns.isCreating,
    
    // Payment management
    claimPayments: payments.claimPayments,
    claimAllPayments: payments.claimAllPayments,
    isClaimingPayments: payments.isClaiming,
    
    // Application management
    applyToCampaign: applications.applyToCampaign,
    selectInfluencer: applications.selectInfluencer,
    isProcessingApplication: applications.isLoading,
    
    // Balance management
    userBalances: balances.balances,
    hasAnyBalance: balances.hasAnyBalance,
    
    // Data fetching
    getUserByUsername: data.getUserByUsername,
    getAllBriefs: data.getAllBriefs,
    
    // General state
    isLoading: unified.isLoading,
    contractConfig: unified.contractConfig,
  };
}