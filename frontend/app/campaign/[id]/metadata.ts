import { Metadata } from 'next';
import { adsBazaarAbi } from '@/contracts/adsBazaar';
import { createPublicClient, http } from 'viem';
import { celo } from 'viem/chains';
import { formatCurrency } from '@/utils/format';
import { getAudienceLabel } from '@/utils/format';

const client = createPublicClient({
  chain: celo,
  transport: http(),
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const campaignId = resolvedParams.id;
  
  if (!campaignId) {
    return {
      title: 'Ads-Bazaar | Campaign',
      description: 'Discover influencer marketing opportunities',
      openGraph: {
        title: 'Ads-Bazaar | Campaign',
        description: 'Discover influencer marketing opportunities',
        images: ['https://ads-bazaar.vercel.app/adsBazaar-heroPage.png'],
        url: 'https://ads-bazaar.vercel.app/campaign',
        siteName: 'Ads-Bazaar',
        type: 'website',
      },
    };
  }

  try {
    // Fetch campaign data from contract
    const campaignData = await client.readContract({
      address: process.env.NEXT_PUBLIC_ADS_BAZAAR_ADDRESS as `0x${string}`,
      abi: adsBazaarAbi,
      functionName: 'getAdBrief',
      args: [BigInt(campaignId)],
    }) as any;

    if (!campaignData) {
      return {
        title: 'Ads-Bazaar | Campaign Not Found',
        description: 'Campaign not found or has been removed',
        openGraph: {
          title: 'Ads-Bazaar | Campaign Not Found',
          description: 'Campaign not found or has been removed',
          images: ['https://ads-bazaar.vercel.app/adsBazaar-heroPage.png'],
          url: `https://ads-bazaar.vercel.app/campaign/${campaignId}`,
          siteName: 'Ads-Bazaar',
          type: 'website',
        },
      };
    }

    const paymentPerInfluencer = Number(campaignData.budget) / Number(campaignData.maxInfluencers);
    const audienceLabel = getAudienceLabel(Number(campaignData.targetAudience));
    const spotsLeft = Number(campaignData.maxInfluencers) - Number(campaignData.applicationCount);
    
    const title = `${campaignData.name} | Ads-Bazaar`;
    const description = `💰 Earn ${formatCurrency(paymentPerInfluencer)} on Celo | ${spotsLeft} spots left | ${audienceLabel} audience | Apply now to this campaign`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        images: [`https://ads-bazaar.vercel.app/api/og/campaign?id=${campaignId}`],
        url: `https://ads-bazaar.vercel.app/campaign/${campaignId}`,
        siteName: 'Ads-Bazaar',
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [`https://ads-bazaar.vercel.app/api/og/campaign?id=${campaignId}`],
      },
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'Ads-Bazaar | Campaign',
      description: 'Discover influencer marketing opportunities',
      openGraph: {
        title: 'Ads-Bazaar | Campaign',
        description: 'Discover influencer marketing opportunities',
        images: ['https://ads-bazaar.vercel.app/adsBazaar-heroPage.png'],
        url: `https://ads-bazaar.vercel.app/campaign/${campaignId}`,
        siteName: 'Ads-Bazaar',
        type: 'website',
      },
    };
  }
}