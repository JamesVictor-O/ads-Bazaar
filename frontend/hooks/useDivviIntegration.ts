
import { useAccount } from 'wagmi'
import { useEnsureNetwork } from './useEnsureNetwork'
import { getDivviTag, trackDivviTransaction } from '@/utils/divvi'

export const useDivviIntegration = () => {
  const { address } = useAccount()
  const { currentNetwork } = useEnsureNetwork()

  const generateDivviTag = (): string => {
    if (!address) return '0x'
    return getDivviTag(address)
  }

  const trackTransaction = async (txHash: string) => {
    if (!currentNetwork?.chain?.id) {
      console.warn('No chain ID available for Divvi tracking')
      return
    }
    
    await trackDivviTransaction(txHash as `0x${string}`, currentNetwork.chain.id)
  }

  return {
    generateDivviTag,
    trackTransaction,
  }
}