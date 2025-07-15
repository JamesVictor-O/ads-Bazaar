'use client';

import { useState } from 'react';
import { Share, ExternalLink, Copy, Check } from 'lucide-react';
import { Brief } from '@/types';
import { formatCurrency } from '@/utils/format';
import { getAudienceLabel } from '@/utils/format';

interface ShareCampaignButtonProps {
  campaign: Brief;
  className?: string;
}

export default function ShareCampaignButton({ campaign, className = '' }: ShareCampaignButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const generateShareText = () => {
    const paymentPerInfluencer = campaign.budget / campaign.maxInfluencers;
    return `🚀 New ${getAudienceLabel(campaign.targetAudience)} campaign on @ads-bazaar!

📝 ${campaign.name}
💰 ${formatCurrency(paymentPerInfluencer)} per influencer
🎯 ${campaign.maxInfluencers} spots available
⏰ Apply before deadline!

Secure smart contract payments guaranteed! 

#InfluencerMarketing #Web3 #Farcaster`;
  };

  const handleFarcasterShare = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/farcaster/share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          campaignId: campaign.id.toString(),
          castText: generateShareText(),
          businessAddress: campaign.business,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        // Open Farcaster compose window
        window.open(data.farcasterShareLink, '_blank', 'width=600,height=700');
      } else {
        console.error('Failed to generate share link:', data.error);
      }
    } catch (error) {
      console.error('Error sharing to Farcaster:', error);
    } finally {
      setIsLoading(false);
      setShowDropdown(false);
    }
  };

  const handleCopyLink = async () => {
    const shareUrl = `${window.location.origin}/campaign/share?campaignId=${campaign.id}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  const handleDirectLink = () => {
    const shareUrl = `${window.location.origin}/campaign/share?campaignId=${campaign.id}`;
    window.open(shareUrl, '_blank');
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors"
      >
        <Share className="h-4 w-4" />
        Share Campaign
      </button>

      {showDropdown && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setShowDropdown(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-20">
            <button
              onClick={handleFarcasterShare}
              disabled={isLoading}
              className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 transition-colors"
            >
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-purple-600 font-bold text-sm">FC</span>
              </div>
              <div>
                <p className="font-medium text-gray-900">Share to Farcaster</p>
                <p className="text-xs text-gray-500">Post to your Farcaster feed</p>
              </div>
            </button>

            <button
              onClick={handleCopyLink}
              className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 transition-colors"
            >
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4 text-blue-600" />
                )}
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  {copied ? 'Copied!' : 'Copy Link'}
                </p>
                <p className="text-xs text-gray-500">Copy campaign URL</p>
              </div>
            </button>

            <button
              onClick={handleDirectLink}
              className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 transition-colors"
            >
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                <ExternalLink className="h-4 w-4 text-gray-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Open Share Page</p>
                <p className="text-xs text-gray-500">View campaign share page</p>
              </div>
            </button>
          </div>
        </>
      )}
    </div>
  );
}