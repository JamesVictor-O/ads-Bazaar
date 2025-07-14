'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Brief } from '@/types';
import { useReadContract } from 'wagmi';
import { adsBazaarAbi } from '@/contracts/adsBazaar';
import CampaignCard from '@/components/CampaignCard';
import { Loader2 } from 'lucide-react';

export default function CampaignSharePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [campaign, setCampaign] = useState<Brief | null>(null);
  const [loading, setLoading] = useState(true);

  // Extract campaign ID from URL parameters
  const campaignId = searchParams.get('campaignId');
  const castHash = searchParams.get('castHash');
  const castFid = searchParams.get('castFid');

  // Read campaign data from contract
  const { data: campaignData, isLoading: contractLoading } = useReadContract({
    address: process.env.NEXT_PUBLIC_ADS_BAZAAR_ADDRESS as `0x${string}`,
    abi: adsBazaarAbi,
    functionName: 'getAdBrief',
    args: campaignId ? [BigInt(campaignId)] : undefined,
  });

  useEffect(() => {
    if (campaignData && !contractLoading) {
      // Transform contract data to Brief format
      const briefData = {
        id: BigInt(campaignId || '0'),
        name: campaignData.name,
        description: campaignData.description,
        requirements: campaignData.requirements,
        budget: campaignData.budget,
        maxInfluencers: campaignData.maxInfluencers,
        targetAudience: campaignData.targetAudience,
        applicationDeadline: campaignData.applicationDeadline,
        promotionDuration: campaignData.promotionDuration,
        proofSubmissionGracePeriod: campaignData.proofSubmissionGracePeriod,
        verificationPeriod: campaignData.verificationPeriod,
        selectionGracePeriod: campaignData.selectionGracePeriod,
        createdAt: campaignData.createdAt,
        business: campaignData.business,
        isActive: campaignData.isActive,
        currentApplicants: campaignData.currentApplicants,
      } as Brief;

      setCampaign(briefData);
      setLoading(false);
    }
  }, [campaignData, contractLoading, campaignId]);

  const handleApplyToCampaign = () => {
    if (campaignId) {
      router.push(`/marketplace?highlight=${campaignId}`);
    }
  };

  const handleViewMarketplace = () => {
    router.push('/marketplace');
  };

  if (loading || contractLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-emerald-600" />
          <p className="text-gray-600">Loading campaign...</p>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Campaign Not Found</h1>
          <p className="text-gray-600 mb-6">
            The campaign you're looking for doesn't exist or has been removed.
          </p>
          <button
            onClick={handleViewMarketplace}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Browse All Campaigns
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Shared Campaign from Farcaster
          </h1>
          <p className="text-gray-600">
            Discover this influencer marketing opportunity
          </p>
          {castHash && (
            <p className="text-sm text-emerald-600 mt-2">
              Shared via cast: {castHash.slice(0, 10)}...
            </p>
          )}
        </div>

        {/* Campaign Card */}
        <div className="max-w-2xl mx-auto mb-8">
          <CampaignCard
            brief={campaign}
            onApply={handleApplyToCampaign}
            showFullDetails={true}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4">
          <button
            onClick={handleApplyToCampaign}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            Apply to Campaign
          </button>
          <button
            onClick={handleViewMarketplace}
            className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 px-8 py-3 rounded-lg font-medium transition-colors"
          >
            Browse More Campaigns
          </button>
        </div>

        {/* Share Info */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>This campaign was shared via Farcaster.</p>
          <p>Join Ads-Bazaar to connect with businesses and earn from your influence!</p>
        </div>
      </div>
    </div>
  );
}