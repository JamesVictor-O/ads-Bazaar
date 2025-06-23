import { useAccount } from 'wagmi';
import { useEnsureNetwork } from './useEnsureNetwork';
import { getDivviReferralTag, trackDivviTransaction } from '@/utils/divvi';

export const useDivviIntegration = () => {
  const { address } = useAccount();
  const { currentNetwork } = useEnsureNetwork();

  const generateDivviReferralTag = (): `0x${string}` => {
    console.log('DIVVI: generateDivviReferralTag called');
    console.log('User address:', address);

    if (!address) {
      console.warn('DIVVI: No address available');
      return '0x' as `0x${string}`;
    }

    const referralTag = getDivviReferralTag(address);
    console.log('DIVVI: Generated referral tag:', referralTag);
    return referralTag;
  };

  const trackTransaction = async (txHash: string | unknown) => {
    console.log('DIVVI: trackTransaction called');
    console.log('TX Hash received:', txHash, typeof txHash);

    if (!txHash || typeof txHash !== 'string') {
      console.error('DIVVI: Invalid transaction hash:', txHash);
      return;
    }

    const formattedTxHash = txHash.startsWith('0x') ? txHash : `0x${txHash}`;
    const chainId = currentNetwork?.chain?.id;

    if (!chainId) {
      console.error('DIVVI: No chain ID available');
      return;
    }

    try {
      await trackDivviTransaction(formattedTxHash as `0x${string}`, chainId);
    } catch (error) {
      console.error('DIVVI: Transaction tracking failed:', error);
    }
  };

  return {
    generateDivviReferralTag,
    trackTransaction,
  };
};