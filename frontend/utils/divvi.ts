import { getReferralTag, submitReferral } from '@divvi/referral-sdk';

const DIVVI_CONFIG = {
  consumer: '0x131EC028Bb8Bd936A3416635777D905497F3D21f', // Your Divvi Identifier
  providers: [
    '0x0423189886d7966f0dd7e7d256898daeee625dca',
    '0xc95876688026be9d6fa7a7c33328bd013effa2bb'
  ] 
} as const;

export const getDivviReferralTag = (userAddress: `0x${string}`): `0x${string}` => {
  console.log('DIVVI: Generating referral tag for user:', userAddress);

  try {
    const referralTag = getReferralTag({
      user: userAddress, 
      consumer: DIVVI_CONFIG.consumer,
      providers: DIVVI_CONFIG.providers 
    });

    console.log('DIVVI: Referral tag generated:', referralTag);
    return referralTag as `0x${string}`;
  } catch (error) {
    console.error('DIVVI: Referral tag generation failed:', error);
    return '0x' as `0x${string}`;
  }
};

export const trackDivviTransaction = async (
  txHash: `0x${string}`,
  chainId: number
) => {
  console.log('DIVVI: Tracking transaction...');
  console.log('DIVVI: TX Hash:', txHash);
  console.log('DIVVI: Chain ID:', chainId);

  try {
    const result = await submitReferral({
      txHash,
      chainId,
    });

    console.log('DIVVI: Tracking SUCCESS:', result);
    return result;
  } catch (error) {
    console.error('DIVVI: Tracking FAILED:', error);
    throw error;
  }
};