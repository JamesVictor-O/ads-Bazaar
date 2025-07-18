'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { Brief } from '@/types';
import { useReadContract, useAccount } from 'wagmi';
import { adsBazaarAbi } from '@/contracts/adsBazaar';
import { Loader2, Users, Zap, Shield, ArrowRight, ExternalLink, DollarSign } from 'lucide-react';
import { useUserProfile } from '@/hooks/adsBazaar';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { formatCurrency } from '@/utils/format';
import { getAudienceLabel } from '@/utils/format';

function MiniAppCampaignContent() {
  const searchParams = useSearchParams();
  const [campaign, setCampaign] = useState<Brief | null>(null);
  const [loading, setLoading] = useState(true);

  // Wallet and user state
  const { isConnected } = useAccount();
  const { userProfile, isLoadingProfile } = useUserProfile();

  // Extract campaign ID from URL parameters (passed from Farcaster)
  const campaignId = searchParams.get('campaignId');
  const castHash = searchParams.get('castHash');

  // Determine user state
  const isRegistered = userProfile?.isRegistered || false;
  const canApply = isConnected && isRegistered && userProfile?.isInfluencer;

  // Read campaign data from contract
  const { data: campaignData, isLoading: contractLoading, error: contractError } = useReadContract({
    address: process.env.NEXT_PUBLIC_ADS_BAZAAR_ADDRESS as `0x${string}`,
    abi: adsBazaarAbi,
    functionName: 'getAdBrief',
    args: campaignId ? [BigInt(campaignId)] : undefined,
    query: {
      enabled: !!campaignId,
      retry: 2,
      retryDelay: 1000,
    },
  }) as { data: any, isLoading: boolean, error: any };

  useEffect(() => {
    if (!campaignId) {
      setLoading(false);
      return;
    }

    if (contractError) {
      console.error('Contract error:', contractError);
      setLoading(false);
      return;
    }

    if (campaignData && !contractLoading) {
      try {
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
          applicationCount: campaignData.applicationCount,
        } as any; // Type assertion for mini app context

        setCampaign(briefData);
        setLoading(false);
      } catch (error) {
        console.error('Error processing campaign data:', error);
        setLoading(false);
      }
    }
  }, [campaignData, contractLoading, campaignId, contractError]);

  const openFullApp = () => {
    const fullAppUrl = `https://ads-bazaar.vercel.app/campaign/share?campaignId=${campaignId}`;
    if (typeof window !== 'undefined') {
      window.open(fullAppUrl, '_blank');
    }
  };

  const openMarketplace = () => {
    const marketplaceUrl = `https://ads-bazaar.vercel.app/marketplace${campaignId ? `?highlight=${campaignId}` : ''}`;
    if (typeof window !== 'undefined') {
      window.open(marketplaceUrl, '_blank');
    }
  };

  if (loading || contractLoading || isLoadingProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-emerald-600" />
          <p className="text-gray-600">Loading campaign...</p>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center p-4">
        <div className="text-center max-w-md mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Campaign Not Found</h1>
          <p className="text-gray-600 mb-6">
            The campaign you're looking for doesn't exist or has been removed.
          </p>
          <button
            onClick={openMarketplace}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Browse All Campaigns
          </button>
        </div>
      </div>
    );
  }

  const paymentPerInfluencer = campaign.budget / campaign.maxInfluencers;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 p-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {campaign.name}
          </h1>
          <span className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
            {getAudienceLabel(campaign.targetAudience)}
          </span>
          {castHash && (
            <p className="text-xs text-emerald-600 mt-2">
              Shared via Farcaster ✨
            </p>
          )}
        </div>

        {/* Campaign Summary Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <p className="text-gray-700 mb-4 leading-relaxed">
            {campaign.description.length > 120 ? 
             `${campaign.description.slice(0, 120)}...` : 
             campaign.description
            }
          </p>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center p-3 bg-emerald-50 rounded-lg">
              <DollarSign className="h-5 w-5 text-emerald-600 mx-auto mb-1" />
              <p className="text-xs text-gray-500">Payment</p>
              <p className="font-bold text-emerald-600">{formatCurrency(paymentPerInfluencer)}</p>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <Users className="h-5 w-5 text-blue-600 mx-auto mb-1" />
              <p className="text-xs text-gray-500">Spots Left</p>
              <p className="font-bold text-blue-600">
                {campaign.maxInfluencers - Number(campaign.applicationCount)}
              </p>
            </div>
          </div>

          {/* Status */}
          <div className="text-center">
            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
              <div 
                className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: `${Math.min((Number(campaign.applicationCount) / campaign.maxInfluencers) * 100, 100)}%` 
                }}
              />
            </div>
            <p className="text-xs text-gray-500">
              {Number(campaign.applicationCount)}/{campaign.maxInfluencers} spots filled
            </p>
          </div>
        </div>

        {/* Action Section */}
        <div className="space-y-4">
          {!isConnected ? (
            <div className="text-center">
              <ConnectButton />
              <p className="text-sm text-gray-600 mt-2">Connect wallet to apply</p>
            </div>
          ) : !isRegistered ? (
            <div className="text-center">
              <button
                onClick={openFullApp}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <ArrowRight className="h-4 w-4" />
                Join Ads-Bazaar to Apply
              </button>
              <p className="text-sm text-gray-600 mt-2">Create your influencer profile</p>
            </div>
          ) : canApply ? (
            <button
              onClick={openMarketplace}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <ArrowRight className="h-4 w-4" />
              Apply to Campaign
            </button>
          ) : (
            <button
              onClick={openFullApp}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              View Details
            </button>
          )}

          {/* Open Full App Button */}
          <button
            onClick={openFullApp}
            className="w-full bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            Open Full App
          </button>
        </div>

        {/* Benefits */}
        <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
          <h3 className="font-bold text-gray-900 text-center mb-4">Why Ads-Bazaar?</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                <Zap className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <p className="font-medium text-sm">Instant Payments</p>
                <p className="text-xs text-gray-600">Smart contract guaranteed</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Shield className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-sm">Secure & Transparent</p>
                <p className="text-xs text-gray-600">All on blockchain</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <Users className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <p className="font-medium text-sm">Quality Brands</p>
                <p className="text-xs text-gray-600">Verified businesses only</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center p-4">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-emerald-600" />
        <p className="text-gray-600">Loading campaign...</p>
      </div>
    </div>
  );
}

export default function MiniAppCampaignPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <MiniAppCampaignContent />
    </Suspense>
  );
}