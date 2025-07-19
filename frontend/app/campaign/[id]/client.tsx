'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { Brief, CampaignStatus, TargetAudience } from '@/types';
import { useReadContract, useAccount } from 'wagmi';
import ABI from '@/lib/AdsBazaar.json';
import CampaignCard from '@/components/CampaignCard';
import { Loader2, Users, Zap, Shield, ArrowRight, ArrowLeft } from 'lucide-react';
import { useUserProfile } from '@/hooks/adsBazaar';
import GetStartedModal from '@/components/modals/GetStartedModal';
import AdsApplicationModal from '@/components/modals/AdsApplicationModal';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { CONTRACT_ADDRESS } from '@/lib/contracts';
import { computeCampaignStatusInfo, computeCampaignTimingInfo, computeCampaignProgressInfo } from '@/utils/campaignUtils';
import { formatEther } from 'viem';

function CampaignDetailContent() {
  const params = useParams();
  const router = useRouter();
  const [campaign, setCampaign] = useState<Brief | null>(null);
  const [loading, setLoading] = useState(true);
  const [showGetStarted, setShowGetStarted] = useState(false);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [applicationMessage, setApplicationMessage] = useState("");

  // Wallet and user state
  const { isConnected } = useAccount();
  const { userProfile, isLoadingProfile } = useUserProfile();

  // Extract campaign ID from URL parameters
  const campaignId = params.id as string;

  // Determine user state
  const isRegistered = userProfile?.isRegistered || false;
  const canApply = isConnected && isRegistered && userProfile?.isInfluencer;

  // Read campaign data from contract
  const { data: campaignData, isLoading: contractLoading, error: contractError } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ABI.abi,
    functionName: 'getAdBrief',
    args: campaignId ? [campaignId] : undefined,
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
        const briefData: Brief = {
          id: (campaignId || '0') as `0x${string}`,
          business: campaignData.business as `0x${string}`,
          name: campaignData.name,
          description: campaignData.description,
          requirements: campaignData.requirements || '',
          budget: Number(formatEther(campaignData.budget || BigInt(0))),
          status: Number(campaignData.status) as CampaignStatus,
          promotionDuration: Number(campaignData.promotionDuration || 0),
          promotionStartTime: Number(campaignData.promotionStartTime || 0),
          promotionEndTime: Number(campaignData.promotionEndTime || 0),
          proofSubmissionDeadline: Number(campaignData.proofSubmissionDeadline || 0),
          verificationDeadline: Number(campaignData.verificationDeadline || 0),
          maxInfluencers: Number(campaignData.maxInfluencers || 0),
          selectedInfluencersCount: Number(campaignData.selectedInfluencersCount || 0),
          targetAudience: Number(campaignData.targetAudience || 0) as TargetAudience,
          creationTime: Number(campaignData.creationTime || Date.now() / 1000),
          selectionDeadline: Number(campaignData.selectionDeadline || 0),
          applicationCount: Number(campaignData.applicationCount || 0),
          selectionGracePeriod: Number(campaignData.selectionGracePeriod || 86400),
          
          // Computed properties - will be set by utility functions
          statusInfo: {} as any,
          timingInfo: {} as any,
          progressInfo: {} as any,
        };

        // Compute enhanced information
        briefData.statusInfo = computeCampaignStatusInfo(briefData);
        briefData.timingInfo = computeCampaignTimingInfo(briefData);
        briefData.progressInfo = computeCampaignProgressInfo(briefData);

        setCampaign(briefData);
        setLoading(false);
      } catch (error) {
        console.error('Error processing campaign data:', error);
        setLoading(false);
      }
    }
  }, [campaignData, contractLoading, campaignId, contractError]);

  const handleApplyToCampaign = () => {
    if (!isConnected) {
      // User needs to connect wallet first
      return;
    }
    
    if (!isRegistered) {
      // User needs to register first
      setShowGetStarted(true);
      return;
    }

    if (!userProfile?.isInfluencer) {
      // User is registered as business, redirect to marketplace with highlighting
      router.push(`/marketplace?highlight=${campaignId}&from=share`);
      return;
    }

    // User is ready to apply - show application modal
    setShowApplicationModal(true);
  };

  const handleViewMarketplace = () => {
    router.push(`/marketplace?highlight=${campaignId}&from=share`);
  };

  const handleGetStarted = () => {
    setShowGetStarted(true);
  };

  const handleRegistrationSuccess = () => {
    setShowGetStarted(false);
    // After successful registration, automatically try to apply
    setTimeout(() => {
      handleApplyToCampaign();
    }, 1000); // Small delay to allow state updates
  };

  const handleBackToMarketplace = () => {
    router.push(`/marketplace?highlight=${campaignId}&from=share`);
  };

  if (loading || contractLoading || isLoadingProfile) {
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
        {/* Back Button */}
        <div className="mb-6">
          <button
            onClick={handleBackToMarketplace}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Marketplace
          </button>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Campaign Details
          </h1>
          <p className="text-gray-600">
            Apply to this influencer marketing opportunity
          </p>
        </div>

        {/* Campaign Card */}
        <div className="max-w-2xl mx-auto mb-8">
          <CampaignCard
            brief={campaign}
            onApply={handleApplyToCampaign}
            showFullDetails={true}
          />
        </div>

        {/* Action Buttons - Dynamic based on user state */}
        <div className="flex justify-center gap-4">
          {!isConnected ? (
            <div className="flex flex-col items-center gap-4">
              <ConnectButton />
              <p className="text-sm text-gray-600">Connect your wallet to apply to this campaign</p>
            </div>
          ) : !isRegistered ? (
            <div className="flex flex-col items-center gap-4">
              <button
                onClick={handleGetStarted}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <ArrowRight className="h-4 w-4" />
                Join Ads-Bazaar to Apply
              </button>
              <p className="text-sm text-gray-600">Create your influencer profile to start earning</p>
            </div>
          ) : !userProfile?.isInfluencer ? (
            <div className="flex flex-col items-center gap-4">
              <button
                onClick={handleViewMarketplace}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition-colors"
              >
                Switch to Influencer Mode
              </button>
              <p className="text-sm text-gray-600">You're registered as a business. Switch to influencer to apply.</p>
            </div>
          ) : (
            <>
              <button
                onClick={handleApplyToCampaign}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <ArrowRight className="h-4 w-4" />
                Apply to Campaign
              </button>
              <button
                onClick={handleViewMarketplace}
                className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 px-8 py-3 rounded-lg font-medium transition-colors"
              >
                Browse More Campaigns
              </button>
            </>
          )}
        </div>

        {/* Benefits Section for New Users */}
        {(!isConnected || !isRegistered) && (
          <div className="mt-12 bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-6">
              Why Join Ads-Bazaar?
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Zap className="h-6 w-6 text-emerald-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Instant Payments</h3>
                <p className="text-gray-600 text-sm">Get paid immediately via smart contracts. No waiting for payments.</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Secure & Transparent</h3>
                <p className="text-gray-600 text-sm">All transactions on blockchain. No disputes, full transparency.</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Quality Brands</h3>
                <p className="text-gray-600 text-sm">Work with verified businesses and build your influence.</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Registration Modal */}
      {showGetStarted && (
        <GetStartedModal 
          isOpen={showGetStarted}
          onClose={() => setShowGetStarted(false)}
          onSuccess={handleRegistrationSuccess}
        />
      )}

      {/* Application Modal */}
      {showApplicationModal && campaign && (
        <AdsApplicationModal
          showApplyModal={showApplicationModal}
          setShowApplyModal={setShowApplicationModal}
          selectedBrief={{
            id: campaign.id,
            title: campaign.name,
            business: campaign.business,
            description: campaign.description,
            budget: campaign.budget,
            maxInfluencers: campaign.maxInfluencers,
            requirements: campaign.requirements,
          }}
          applicationMessage={applicationMessage}
          setApplicationMessage={setApplicationMessage}
        />
      )}
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-emerald-600" />
        <p className="text-gray-600">Loading campaign...</p>
      </div>
    </div>
  );
}

export default function CampaignDetailClient() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <CampaignDetailContent />
    </Suspense>
  );
}