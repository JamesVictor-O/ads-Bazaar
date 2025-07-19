import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';

interface ShareTrackingData {
  shareCount: number;
  isLoading: boolean;
  error: string | null;
  trackShare: (platform: string) => Promise<boolean>;
  refreshShareCount: () => void;
}

export function useShareTracking(campaignId: string): ShareTrackingData {
  const [shareCount, setShareCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { address } = useAccount();

  // Fetch share count
  const fetchShareCount = async () => {
    if (!campaignId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/campaigns/share?campaignId=${campaignId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch share count');
      }

      const data = await response.json();
      setShareCount(data.shareCount || 0);
    } catch (err) {
      console.error('Error fetching share count:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch share count');
      setShareCount(0);
    } finally {
      setIsLoading(false);
    }
  };

  // Track a new share
  const trackShare = async (platform: string): Promise<boolean> => {
    if (!campaignId) {
      console.error('Cannot track share: no campaign ID');
      return false;
    }

    try {
      const response = await fetch('/api/campaigns/share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          campaignId,
          platform,
          userAddress: address || null,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to track share');
      }

      // Immediately update the share count locally
      setShareCount(prev => prev + 1);
      return true;
    } catch (err) {
      console.error('Error tracking share:', err);
      return false;
    }
  };

  // Refresh share count
  const refreshShareCount = () => {
    fetchShareCount();
  };

  // Initial load
  useEffect(() => {
    fetchShareCount();
  }, [campaignId]);

  return {
    shareCount,
    isLoading,
    error,
    trackShare,
    refreshShareCount,
  };
}

// Hook for getting share counts for multiple campaigns
export function useBatchShareCounts(campaignIds: string[]) {
  const [shareCounts, setShareCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBatchShareCounts = async () => {
      if (campaignIds.length === 0) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Fetch share counts for all campaigns
        const promises = campaignIds.map(async (campaignId) => {
          try {
            const response = await fetch(`/api/campaigns/share?campaignId=${campaignId}`);
            if (response.ok) {
              const data = await response.json();
              return { campaignId, shareCount: data.shareCount || 0 };
            }
            return { campaignId, shareCount: 0 };
          } catch {
            return { campaignId, shareCount: 0 };
          }
        });

        const results = await Promise.all(promises);
        
        const countsMap = results.reduce((acc, { campaignId, shareCount }) => {
          acc[campaignId] = shareCount;
          return acc;
        }, {} as Record<string, number>);

        setShareCounts(countsMap);
      } catch (err) {
        console.error('Error fetching batch share counts:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch share counts');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBatchShareCounts();
  }, [campaignIds.join(',')]); // Re-fetch when campaign list changes

  return {
    shareCounts,
    isLoading,
    error,
  };
}