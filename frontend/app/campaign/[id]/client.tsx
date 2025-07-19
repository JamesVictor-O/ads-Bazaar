'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

function CampaignDetailContent() {
  const params = useParams();
  const router = useRouter();

  // Extract campaign ID from URL parameters
  const campaignId = params.id as string;

  useEffect(() => {
    // Simply redirect to marketplace with highlighting like the Farcaster mini-app does
    if (campaignId) {
      const marketplaceUrl = `/marketplace?highlight=${campaignId}&from=share`;
      router.replace(marketplaceUrl);
    }
  }, [campaignId, router]);

  // Show loading while redirecting
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-emerald-600" />
        <p className="text-gray-600">Redirecting to campaign...</p>
      </div>
    </div>
  );
}

export default function CampaignDetailClient() {
  return <CampaignDetailContent />;
}