import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { campaignId, castText, businessAddress } = body;

    if (!campaignId) {
      return NextResponse.json(
        { error: 'Campaign ID is required' },
        { status: 400 }
      );
    }

    // Generate share URL for Farcaster
    const shareUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://ads-bazaar.vercel.app'}/campaign/share?campaignId=${campaignId}`;
    
    // Generate Farcaster cast text
    const generatedCastText = castText || generateCastText(campaignId, shareUrl);

    // Create Farcaster share link
    const farcasterShareLink = `https://warpcast.com/~/compose?text=${encodeURIComponent(generatedCastText)}&embeds[]=${encodeURIComponent(shareUrl)}`;

    return NextResponse.json({
      success: true,
      shareUrl,
      farcasterShareLink,
      castText: generatedCastText,
    });

  } catch (error) {
    console.error('Error generating Farcaster share link:', error);
    return NextResponse.json(
      { error: 'Failed to generate share link' },
      { status: 500 }
    );
  }
}

function generateCastText(campaignId: string, shareUrl: string): string {
  return `🚀 New influencer opportunity on @ads-bazaar! 

💰 Earn from your influence
🎯 Quality brand partnerships  
⛓️ Secure smart contract payments

Apply now and get paid for your content! 

#InfluencerMarketing #Web3 #Farcaster`;
}