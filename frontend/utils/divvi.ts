
import { getReferralTag, submitReferral } from '@divvi/referral-sdk'

const DIVVI_CONFIG: {
  consumer: `0x${string}`,
  providers: `0x${string}`[]
} = {
  consumer: '0x131EC028Bb8Bd936A3416635777D905497F3D21f',
  providers: [
    '0x0423189886d7966f0dd7e7d256898daeee625dca',
    '0xc95876688026be9d6fa7a7c33328bd013effa2bb',
  ],
}

export const getDivviTag = (userAddress: `0x${string}`): string => {
  try {
    return getReferralTag({
      user: userAddress,
      consumer: DIVVI_CONFIG.consumer,
      providers: DIVVI_CONFIG.providers,
    })
  } catch (error) {
    console.warn('Divvi tag generation failed:', error)
    return '0x'
  }
}


export const trackDivviTransaction = async (txHash: `0x${string}`, chainId: number) => {
  try {
    await submitReferral({ txHash, chainId })
    console.log('✅ Divvi tracking:', txHash)
  } catch (error) {
    console.warn('Divvi tracking failed:', error)
  }
}