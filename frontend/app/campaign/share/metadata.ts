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
  searchParams: Promise<{ campaignId?: string }>;
}): Promise<Metadata> {
  const resolvedSearchParams = await searchParams;
  const campaignId = resolvedSearchParams.campaignId;
  
  if (!campaignId) {
    return {
      title: 'Ads-Bazaar | Shared Campaign',
      description: 'Discover influencer marketing opportunities shared via Farcaster',
      openGraph: {
        title: 'Ads-Bazaar | Shared Campaign',
        description: 'Discover influencer marketing opportunities shared via Farcaster',
        images: ['https://ads-bazaar.vercel.app/adsBazaar-heroPage.png'],
        url: 'https://ads-bazaar.vercel.app/campaign/share',
        siteName: 'Ads-Bazaar',
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: 'Ads-Bazaar | Shared Campaign',
        description: 'Discover influencer marketing opportunities shared via Farcaster',
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
        description: 'Campaign not found or has been removed',
        openGraph: {
          title: 'Ads-Bazaar | Campaign Not Found',
          description: 'Campaign not found or has been removed',
          images: ['https://ads-bazaar.vercel.app/adsBazaar-heroPage.png'],
          url: `https://ads-bazaar.vercel.app/campaign/share?campaignId=${campaignId}`,
          siteName: 'Ads-Bazaar',
          type: 'website',
        },
        twitter: {
          card: 'summary_large_image',
          title: 'Ads-Bazaar | Campaign Not Found',
          description: 'Campaign not found or has been removed',
          images: ['https://ads-bazaar.vercel.app/adsBazaar-heroPage.png'],
        },
      };
    }

    const paymentPerInfluencer = Number(campaignData.budget) / Number(campaignData.maxInfluencers);
    const audienceLabel = getAudienceLabel(Number(campaignData.targetAudience));
    const spotsLeft = Number(campaignData.maxInfluencers) - Number(campaignData.applicationCount);
    
    const title = `${campaignData.name} | Shared from Farcaster`;
    const description = `💰 Earn ${formatCurrency(paymentPerInfluencer)} on Celo | ${spotsLeft} spots left | ${audienceLabel} audience | Join this campaign shared via Farcaster`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        images: [`https://ads-bazaar.vercel.app/api/og/campaign?id=${campaignId}`],
        url: `https://ads-bazaar.vercel.app/campaign/share?campaignId=${campaignId}`,
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
        "fc:frame": JSON.stringify({
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
        }),
        "fc:frame:image": `https://ads-bazaar.vercel.app/api/og/campaign?id=${campaignId}`,
        "fc:frame:button:1": "Apply to Campaign",
        "fc:frame:button:1:action": "launch_frame",
        "fc:frame:button:1:target": `https://ads-bazaar.vercel.app/mini-app/campaign?campaignId=${campaignId}`,
      },
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'Ads-Bazaar | Shared Campaign',
      description: 'Discover influencer marketing opportunities shared via Farcaster',
      openGraph: {
        title: 'Ads-Bazaar | Shared Campaign',
        description: 'Discover influencer marketing opportunities shared via Farcaster',
        images: ['https://ads-bazaar.vercel.app/adsBazaar-heroPage.png'],
        url: `https://ads-bazaar.vercel.app/campaign/share?campaignId=${campaignId}`,
        siteName: 'Ads-Bazaar',
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: 'Ads-Bazaar | Shared Campaign',
        description: 'Discover influencer marketing opportunities shared via Farcaster',
        images: ['https://ads-bazaar.vercel.app/adsBazaar-heroPage.png'],
      },
    };
  }
}