import { useState, useEffect, useCallback } from "react";
import { useReadContract, useAccount, usePublicClient } from "wagmi";
import { formatEther } from "viem";
import {
  Brief,
  Application,
  InfluencerDashboardData,
  CampaignStatus,
  TargetAudience,
  DisputeStatus,
} from "../types";
import {
  computeCampaignStatusInfo,
  computeCampaignTimingInfo,
  computeCampaignProgressInfo,
  computeApplicationInfo,
} from "../utils/campaignUtils";
import ABI from "../lib/AdsBazaar.json";
import { CONTRACT_ADDRESS } from "../lib/contracts";
import { Address } from "viem";

interface RawBriefData {
  briefId: string;
  business: string;
  name: string;
  description: string;
  requirements: string;
  budget: bigint;
  status: number;
  promotionDuration: bigint;
  promotionStartTime: bigint;
  promotionEndTime: bigint;
  proofSubmissionDeadline: bigint;
  verificationDeadline: bigint;
  maxInfluencers: bigint;
  selectedInfluencersCount: bigint;
  targetAudience: number;
  creationTime: bigint;
  selectionDeadline: bigint;
}

interface RawApplicationData {
  influencers: string[];
  messages: string[];
  timestamps: bigint[];
  isSelected: boolean[];
  hasClaimed: boolean[];
  proofLinks: string[];
  isApproved: boolean[];
}

/**
 * Formats raw brief data from contract to frontend Brief type
 */
function formatBriefData(briefId: string, rawData: any): Brief | null {
  try {
    console.log(`[DEBUG] formatBriefData called for ${briefId}:`, rawData);
    if (!rawData || typeof rawData !== 'object') {
      console.error("Invalid brief data format:", rawData);
      return null;
    }

    const brief: Brief = {
      id: briefId as `0x${string}`,
      business: rawData.business as `0x${string}`,
      name: rawData.name as string,
      description: rawData.description as string,
      requirements: rawData.requirements as string || "",
      budget: Number(formatEther(rawData.budget as bigint)),
      status: Number(rawData.status) as CampaignStatus,
      promotionDuration: Number(rawData.promotionDuration),
      promotionStartTime: Number(rawData.promotionStartTime),
      promotionEndTime: Number(rawData.promotionEndTime),
      proofSubmissionDeadline: Number(rawData.proofSubmissionDeadline),
      verificationDeadline: Number(rawData.verificationDeadline),
      maxInfluencers: Number(rawData.maxInfluencers),
      selectedInfluencersCount: Number(rawData.selectedInfluencersCount),
      targetAudience: Number(rawData.targetAudience) as TargetAudience,
      creationTime: Number(rawData.creationTime),
      selectionDeadline: Number(rawData.selectionDeadline),
      applicationCount: 0, // Will be filled if available
      selectionGracePeriod: Number(rawData.selectionGracePeriod || 86400), // Default 1 day

      // Computed properties (will be set below)
      statusInfo: {} as any,
      timingInfo: {} as any,
      progressInfo: {} as any,
    };

    // Compute enhanced information
    brief.statusInfo = computeCampaignStatusInfo(brief);
    brief.timingInfo = computeCampaignTimingInfo(brief);
    brief.progressInfo = computeCampaignProgressInfo(brief);

    return brief;
  } catch (err) {
    console.error(`Error formatting brief ${briefId}:`, err);
    return null;
  }
}

/**
 * Formats raw application data from contract
 */
function formatApplicationData(
  rawData: RawApplicationData,
  influencerAddress: string,
  brief: Brief
): Application | null {
  try {
    if (!rawData.influencers || rawData.influencers.length === 0) {
      return null;
    }

    // Find the influencer's application
    const influencerIndex = rawData.influencers.findIndex(
      (addr) => addr.toLowerCase() === influencerAddress.toLowerCase()
    );

    if (influencerIndex === -1) {
      return null;
    }

    const application: Application = {
      influencer: rawData.influencers[influencerIndex] as `0x${string}`,
      message: rawData.messages[influencerIndex] as string,
      timestamp: Number(rawData.timestamps[influencerIndex]),
      isSelected: rawData.isSelected[influencerIndex] as boolean,
      hasClaimed: rawData.hasClaimed[influencerIndex] as boolean,
      proofLink: rawData.proofLinks[influencerIndex] as string,
      isApproved: rawData.isApproved[influencerIndex] as boolean,
      disputeStatus: DisputeStatus.NONE, // Default, would need additional contract call
      disputeReason: "",
      resolvedBy: "0x0000000000000000000000000000000000000000" as `0x${string}`,

      // Computed application info
      applicationInfo: {} as any,
    };

    // Compute application info
    application.applicationInfo = computeApplicationInfo(application, brief);

    return application;
  } catch (err) {
    console.error("Error formatting application data:", err);
    return null;
  }
}

export const useInfluencerDashboard = () => {
  const [dashboardData, setDashboardData] = useState<InfluencerDashboardData>({
    appliedBriefs: [],
    assignedBriefs: [],
    isLoading: true,
    error: null,
  });

  const { address: influencerAddress } = useAccount();
  const publicClient = usePublicClient();

  console.log('[DEBUG] useInfluencerDashboard hook initialized:', {
    influencerAddress,
    publicClient: !!publicClient,
    dashboardDataInitial: dashboardData
  });

  // Fetch influencer's applied brief IDs
  const {
    data: briefIdsResult,
    isLoading: isLoadingBriefIds,
    error: briefIdsError,
    refetch: refetchBriefIds,
  } = useReadContract({
    address: CONTRACT_ADDRESS as Address,
    abi: ABI.abi,
    functionName: "getInfluencerApplications",
    args: [influencerAddress],
    query: {
      enabled: !!influencerAddress,
    },
  });

  console.log('[DEBUG] Contract query state:', {
    isLoadingBriefIds,
    briefIdsError: briefIdsError?.message,
    briefIdsResult,
    influencerAddress,
    contractAddress: CONTRACT_ADDRESS
  });

  const briefIds = briefIdsResult?.[0]?.result as string[] | undefined;
  
  console.log('[DEBUG] Brief IDs result:', briefIdsResult);
  console.log('[DEBUG] Extracted brief IDs:', briefIds);

  // Fetch detailed data for each brief
  const fetchDashboardData = useCallback(
    async (ids: string[]) => {
      if (!publicClient || !influencerAddress) {
        setDashboardData((prev) => ({
          ...prev,
          isLoading: false,
          error: "Public client or influencer address not available",
        }));
        return;
      }

      setDashboardData((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        console.log(`[DEBUG] fetchDashboardData called with ${ids.length} IDs:`, ids);
        const results = await Promise.all(
          ids.map(async (briefId) => {
            try {
              console.log(`[DEBUG] Fetching brief ${briefId}...`);
              // Fetch brief details
              const briefData = await publicClient.readContract({
                address: CONTRACT_ADDRESS,
                abi: ABI.abi,
                functionName: "getAdBrief",
                args: [briefId],
              });

              console.log(`[DEBUG] Brief data for ${briefId}:`, briefData);

              // Fetch application data for this brief
              const applicationData = (await publicClient.readContract({
                address: CONTRACT_ADDRESS,
                abi: ABI.abi,
                functionName: "getBriefApplications",
                args: [briefId],
              })) as RawApplicationData;

              console.log(`[DEBUG] Application data for ${briefId}:`, applicationData);

              if (briefData) {
                const formattedBrief = formatBriefData(briefId, briefData);
                if (formattedBrief) {
                  const formattedApplication = formatApplicationData(
                    applicationData,
                    influencerAddress,
                    formattedBrief
                  );

                  if (formattedApplication) {
                    return {
                      briefId,
                      brief: formattedBrief,
                      application: formattedApplication,
                    };
                  }
                }
              }
              return null;
            } catch (err) {
              console.error(`Error fetching data for brief ${briefId}:`, err);
              return null;
            }
          })
        );

        const validResults = results.filter(
          (result): result is NonNullable<typeof result> => result !== null
        );

        console.log(`[DEBUG] Valid results count: ${validResults.length}`, validResults);

        // Separate applied and assigned briefs
        const appliedBriefs = validResults;
        const assignedBriefs = validResults.filter(
          (result) => result.application.isSelected
        );

        console.log(`[DEBUG] Applied briefs: ${appliedBriefs.length}`, appliedBriefs);
        console.log(`[DEBUG] Assigned briefs: ${assignedBriefs.length}`, assignedBriefs);

        setDashboardData({
          appliedBriefs,
          assignedBriefs,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setDashboardData((prev) => ({
          ...prev,
          isLoading: false,
          error:
            error instanceof Error
              ? error.message
              : "Failed to fetch dashboard data",
        }));
      }
    },
    [publicClient, influencerAddress]
  );

  // Effect to fetch data when brief IDs change
  useEffect(() => {
    console.log('[DEBUG] useEffect triggered with:', {
      influencerAddress,
      isLoadingBriefIds,
      briefIdsError,
      briefIds,
      briefIdsLength: briefIds?.length
    });

    if (!influencerAddress) {
      console.log('[DEBUG] No influencer address, setting error');
      setDashboardData((prev) => ({
        ...prev,
        isLoading: false,
        error: "No influencer address available",
      }));
      return;
    }

    if (isLoadingBriefIds) {
      console.log('[DEBUG] Still loading brief IDs');
      setDashboardData((prev) => ({ ...prev, isLoading: true }));
      return;
    }

    if (briefIdsError) {
      console.log('[DEBUG] Error loading brief IDs:', briefIdsError);
      setDashboardData((prev) => ({
        ...prev,
        isLoading: false,
        error: briefIdsError.message || "Failed to fetch brief IDs",
      }));
      return;
    }

    if (briefIds && Array.isArray(briefIds)) {
      if (briefIds.length === 0) {
        console.log('[DEBUG] No brief IDs found, setting empty state');
        setDashboardData({
          appliedBriefs: [],
          assignedBriefs: [],
          isLoading: false,
          error: null,
        });
      } else {
        console.log('[DEBUG] Found brief IDs, fetching dashboard data:', briefIds);
        fetchDashboardData(briefIds);
      }
    } else {
      console.log('[DEBUG] briefIds is not an array or is undefined:', briefIds);
    }
  }, [
    influencerAddress,
    briefIds,
    isLoadingBriefIds,
    briefIdsError,
    fetchDashboardData,
  ]);

  const refetch = useCallback(() => {
    // Add a longer delay to account for blockchain propagation
    setTimeout(() => {
      refetchBriefIds();
    }, 2000);
  }, [refetchBriefIds]);

  // Listen for global dashboard refresh events
  useEffect(() => {
    const handleDashboardRefresh = () => {
      refetch();
    };

    window.addEventListener('dashboardRefresh', handleDashboardRefresh);
    return () => {
      window.removeEventListener('dashboardRefresh', handleDashboardRefresh);
    };
  }, [refetch]);

  return { ...dashboardData, refetch };
};
