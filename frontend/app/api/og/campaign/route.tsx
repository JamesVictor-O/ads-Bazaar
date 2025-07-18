import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { adsBazaarAbi } from '@/contracts/adsBazaar';
import { createPublicClient, http } from 'viem';
import { celo } from 'viem/chains';
import { formatCurrency } from '@/utils/format';
import { getAudienceLabel } from '@/utils/format';

const client = createPublicClient({
  chain: celo,
  transport: http(),
});

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('id');

    if (!campaignId) {
      return new ImageResponse(
        (
          <div
            style={{
              height: '100%',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#059669',
              color: 'white',
            }}
          >
            <div style={{ fontSize: 60, fontWeight: 'bold' }}>Ads-Bazaar</div>
            <div style={{ fontSize: 24, marginTop: 20 }}>Campaign Not Found</div>
          </div>
        ),
        {
          width: 1200,
          height: 630,
        }
      );
    }

    // Fetch campaign data
    const campaignData = await client.readContract({
      address: process.env.NEXT_PUBLIC_ADS_BAZAAR_ADDRESS as `0x${string}`,
      abi: adsBazaarAbi,
      functionName: 'getAdBrief',
      args: [BigInt(campaignId)],
    }) as any;

    if (!campaignData) {
      return new ImageResponse(
        (
          <div
            style={{
              height: '100%',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#059669',
              color: 'white',
            }}
          >
            <div style={{ fontSize: 60, fontWeight: 'bold' }}>Ads-Bazaar</div>
            <div style={{ fontSize: 24, marginTop: 20 }}>Campaign Not Found</div>
          </div>
        ),
        {
          width: 1200,
          height: 630,
        }
      );
    }

    const paymentPerInfluencer = Number(campaignData.budget) / Number(campaignData.maxInfluencers);
    const audienceLabel = getAudienceLabel(Number(campaignData.targetAudience));
    const spotsLeft = Number(campaignData.maxInfluencers) - Number(campaignData.applicationCount);

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#f0fdf4',
            backgroundImage: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
            padding: '40px',
            fontFamily: 'system-ui',
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '30px',
            }}
          >
            <div
              style={{
                fontSize: '32px',
                fontWeight: 'bold',
                color: '#059669',
              }}
            >
              Ads-Bazaar
            </div>
            <div
              style={{
                backgroundColor: '#059669',
                color: 'white',
                padding: '8px 16px',
                borderRadius: '20px',
                fontSize: '18px',
                fontWeight: '500',
              }}
            >
              {audienceLabel}
            </div>
          </div>

          {/* Campaign Title */}
          <div
            style={{
              fontSize: '48px',
              fontWeight: 'bold',
              color: '#1f2937',
              marginBottom: '20px',
              lineHeight: '1.2',
            }}
          >
            {campaignData.name}
          </div>

          {/* Description */}
          <div
            style={{
              fontSize: '24px',
              color: '#6b7280',
              marginBottom: '40px',
              lineHeight: '1.4',
            }}
          >
            {campaignData.description.length > 120 
              ? `${campaignData.description.slice(0, 120)}...`
              : campaignData.description
            }
          </div>

          {/* Stats */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '40px',
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                backgroundColor: 'white',
                padding: '20px',
                borderRadius: '16px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                minWidth: '200px',
              }}
            >
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#059669' }}>
                {formatCurrency(paymentPerInfluencer)}
              </div>
              <div style={{ fontSize: '18px', color: '#6b7280' }}>Payment per Influencer</div>
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                backgroundColor: 'white',
                padding: '20px',
                borderRadius: '16px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                minWidth: '200px',
              }}
            >
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#3b82f6' }}>
                {spotsLeft}
              </div>
              <div style={{ fontSize: '18px', color: '#6b7280' }}>Spots Left</div>
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                backgroundColor: 'white',
                padding: '20px',
                borderRadius: '16px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                minWidth: '200px',
              }}
            >
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#f59e0b' }}>
                {formatCurrency(Number(campaignData.budget))}
              </div>
              <div style={{ fontSize: '18px', color: '#6b7280' }}>Total Budget</div>
            </div>
          </div>

          {/* Call to Action */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: '#059669',
              color: 'white',
              padding: '20px',
              borderRadius: '16px',
              fontSize: '24px',
              fontWeight: 'bold',
              marginTop: 'auto',
            }}
          >
            🚀 Apply Now on Ads-Bazaar • Secure Blockchain Payments
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error) {
    console.error('Error generating OG image:', error);
    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#059669',
            color: 'white',
          }}
        >
          <div style={{ fontSize: 60, fontWeight: 'bold' }}>Ads-Bazaar</div>
          <div style={{ fontSize: 24, marginTop: 20 }}>Influencer Marketing Platform</div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  }
}