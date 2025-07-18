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
  searchParams,
}: {
  searchParams: { campaignId?: string };
}): Promise<Metadata> {
  const campaignId = searchParams.campaignId;
  
  if (!campaignId) {
    return {
      title: 'Ads-Bazaar | Campaign Not Found',
      description: 'Campaign not found',
      openGraph: {
        title: 'Ads-Bazaar | Campaign Not Found',
        description: 'Campaign not found',
        images: ['https://ads-bazaar.vercel.app/adsBazaar-heroPage.png'],
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
        description: 'Campaign not found',
        openGraph: {
          title: 'Ads-Bazaar | Campaign Not Found',
          description: 'Campaign not found',
          images: ['https://ads-bazaar.vercel.app/adsBazaar-heroPage.png'],
        },
      };
    }

    const paymentPerInfluencer = Number(campaignData.budget) / Number(campaignData.maxInfluencers);
    const audienceLabel = getAudienceLabel(Number(campaignData.targetAudience));
    const spotsLeft = Number(campaignData.maxInfluencers) - Number(campaignData.applicationCount);
    
    const title = `${campaignData.name} | Ads-Bazaar`;
    const description = `💰 Earn ${formatCurrency(paymentPerInfluencer)} on Celo | ${spotsLeft} spots left | ${audienceLabel} audience | ${campaignData.description.slice(0, 100)}...`;

    // Generate Frame metadata
    const frameMetadata = {
      version: "next",
      imageUrl: `https://ads-bazaar.vercel.app/api/og/campaign?id=${campaignId}`,
      button: {
        title: "Apply to Campaign",
        action: {
          type: "launch_frame",
          name: "Ads-Bazaar",
          url: `https://ads-bazaar.vercel.app/mini-app/campaign?campaignId=${campaignId}`,
          splashImageUrl: "https://ads-bazaar.vercel.app/adsBazaar-logo.png",
          splashBackgroundColor: "#059669",
        },
      },
    };

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        images: [`https://ads-bazaar.vercel.app/api/og/campaign?id=${campaignId}`],
        url: `https://ads-bazaar.vercel.app/mini-app/campaign?campaignId=${campaignId}`,
        siteName: 'Ads-Bazaar',
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [`https://ads-bazaar.vercel.app/api/og/campaign?id=${campaignId}`],
      },
      other: {
        "fc:frame": JSON.stringify(frameMetadata),
        "fc:frame:image": `https://ads-bazaar.vercel.app/api/og/campaign?id=${campaignId}`,
        "fc:frame:button:1": "Apply to Campaign",
        "fc:frame:button:1:action": "launch_frame",
        "fc:frame:button:1:target": `https://ads-bazaar.vercel.app/mini-app/campaign?campaignId=${campaignId}`,
      },
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'Ads-Bazaar | Campaign',
      description: 'Discover influencer marketing opportunities on Ads-Bazaar',
      openGraph: {
        title: 'Ads-Bazaar | Campaign',
        description: 'Discover influencer marketing opportunities on Ads-Bazaar',
        images: ['https://ads-bazaar.vercel.app/adsBazaar-heroPage.png'],
      },
    };
  }
}