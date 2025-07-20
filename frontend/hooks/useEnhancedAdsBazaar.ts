// Enhanced version of existing hooks with multi-currency support
import { useState, useCallback } from 'react';
import { useWriteContract, useAccount } from 'wagmi';
import { parseUnits } from 'viem';
import { CONTRACT_ADDRESS } from '@/lib/contracts';
import { SupportedCurrency, MENTO_TOKENS } from '@/lib/mento-simple';
import { CURRENT_NETWORK } from '@/lib/networks';
import { toast } from 'react-hot-toast';
import ABI from '../lib/AdsBazaar.json'; // Same ABI, now includes multi-currency functions

// ENHANCED: Backward-compatible createBrief with optional currency
export function useCreateBrief() {
  const { address } = useAccount();
  const { writeContract, isPending, error } = useWriteContract();
  const [isCreating, setIsCreating] = useState(false);

  const createBrief = useCallback(async (
    name: string,
    description: string,
    requirements: string,
    budget: string,
    promotionDuration: number,
    maxInfluencers: number,
    targetAudience: number,
    applicationPeriod: number,
    proofSubmissionGracePeriod: number,
    verificationPeriod: number,
    selectionGracePeriod: number,
    currency: SupportedCurrency = 'cUSD' // 🆕 Optional currency parameter
  ) => {
    if (!address) throw new Error('Wallet not connected');

    setIsCreating(true);
    try {
      const tokenInfo = MENTO_TOKENS[currency];
      const budgetInWei = parseUnits(budget, tokenInfo.decimals);

      if (currency === 'cUSD') {
        // ✅ Use EXISTING function for cUSD (100% backward compatible)
        const result = await writeContract({
          address: CONTRACT_ADDRESS,
          abi: ABI.abi,
          functionName: 'createAdBrief', // Same function name
          args: [
            name,
            description,
            requirements,
            budgetInWei,
            BigInt(promotionDuration),
            BigInt(maxInfluencers),
            targetAudience,
            BigInt(applicationPeriod),
            BigInt(proofSubmissionGracePeriod),
            BigInt(verificationPeriod),
            BigInt(selectionGracePeriod)
          ],
          chain: CURRENT_NETWORK,
          account: address,
        });
        return result;
      } else {
        // 🆕 Use NEW function for other currencies
        const result = await writeContract({
          address: CONTRACT_ADDRESS,
          abi: ABI.abi,
          functionName: 'createAdBriefWithToken',
          args: [
            name,
            description,
            requirements,
            budgetInWei,
            BigInt(promotionDuration),
            BigInt(maxInfluencers),
            targetAudience,
            BigInt(applicationPeriod),
            BigInt(proofSubmissionGracePeriod),
            BigInt(verificationPeriod),
            BigInt(selectionGracePeriod),
            tokenInfo.address
          ],
          chain: CURRENT_NETWORK,
          account: address,
        });
        return result;
      }
    } catch (error) {
      console.error('Error creating campaign:', error);
      throw error;
    } finally {
      setIsCreating(false);
    }
  }, [address, writeContract]);

  return {
    createBrief,
    isCreating: isCreating || isPending,
    error
  };
}

// ENHANCED: Backward-compatible claimPayments with optional currency
export function useClaimPayments() {
  const { address } = useAccount();
  const { writeContract, isPending } = useWriteContract();
  const [isClaiming, setIsClaiming] = useState(false);

  const claimPayments = useCallback(async (currency?: SupportedCurrency) => {
    if (!address) throw new Error('Wallet not connected');

    setIsClaiming(true);
    try {
      if (!currency) {
        // ✅ Use EXISTING function (100% backward compatible)
        const result = await writeContract({
          address: CONTRACT_ADDRESS,
          abi: ABI.abi,
          functionName: 'claimPayments', // Same function name
          args: [],
          chain: CURRENT_NETWORK,
          account: address,
        });
        return result;
      } else {
        // 🆕 Use NEW function for specific currency
        const tokenInfo = MENTO_TOKENS[currency];
        const result = await writeContract({
          address: CONTRACT_ADDRESS,
          abi: ABI.abi,
          functionName: 'claimPaymentsInToken',
          args: [tokenInfo.address],
          chain: CURRENT_NETWORK,
          account: address,
        });
        return result;
      }
    } catch (error) {
      console.error('Error claiming payments:', error);
      throw error;
    } finally {
      setIsClaiming(false);
    }
  }, [address, writeContract]);

  const claimAllCurrencies = useCallback(async () => {
    if (!address) throw new Error('Wallet not connected');

    setIsClaiming(true);
    try {
      const result = await writeContract({
        address: CONTRACT_ADDRESS,
        abi: ABI.abi,
        functionName: 'claimAllPendingPayments',
        args: [],
        chain: CURRENT_NETWORK,
        account: address,
      });
      toast.success('All pending payments claimed!');
      return result;
    } catch (error) {
      console.error('Error claiming all payments:', error);
      throw error;
    } finally {
      setIsClaiming(false);
    }
  }, [address, writeContract]);

  return {
    claimPayments,
    claimAllCurrencies,
    isClaiming: isClaiming || isPending
  };
}

// ALL OTHER EXISTING HOOKS REMAIN EXACTLY THE SAME
// - useGetAllBriefs() ✅ No changes needed
// - useGetBrief() ✅ No changes needed  
// - useApplyForBrief() ✅ No changes needed
// - useSelectInfluencers() ✅ No changes needed
// - useSubmitProof() ✅ No changes needed
// - useApproveProof() ✅ No changes needed
// etc...