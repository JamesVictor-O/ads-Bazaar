import { useState, useEffect, useCallback } from "react";
import { useReadContracts, useAccount, usePublicClient } from "wagmi";
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
function formatBriefData(briefId: string, rawData: any[]): Brief | null {
  try {
    if (!Array.isArray(rawData) || rawData.length < 17) {
      console.error("Invalid brief data format:", rawData);
      return null;
    }

    const brief: Brief = {
      id: briefId as `0x${string}`,
      business: rawData[1] as `0x${string}`,
      name: rawData[2] as string,
      description: rawData[3] as string,
      requirements: rawData[4] as string,
      budget: Number(formatEther(rawData[5] as bigint)),
      status: Number(rawData[6]) as CampaignStatus,
      promotionDuration: Number(rawData[7]),
      promotionStartTime: Number(rawData[8]),
      promotionEndTime: Number(rawData[9]),
      proofSubmissionDeadline: Number(rawData[10]),
      verificationDeadline: Number(rawData[11]),
      maxInfluencers: Number(rawData[12]),
      selectedInfluencersCount: Number(rawData[13]),
      targetAudience: Number(rawData[14]) as TargetAudience,
      creationTime: Number(rawData[15]),
      selectionDeadline: Number(rawData[16]),
      applicationCount: 0, // Will be filled if available

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

  // Fetch influencer's applied brief IDs
  const {
    data: briefIdsResult,
    isLoading: isLoadingBriefIds,
    error: briefIdsError,
    refetch: refetchBriefIds,
  } = useReadContracts({
    contracts: [
      {
        address: CONTRACT_ADDRESS as Address,
        abi: ABI.abi,
        functionName: "getInfluencerApplications",
        args: [influencerAddress],
      },
    ],
  });

  const briefIds = briefIdsResult?.[0]?.result as string[] | undefined;

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
        const results = await Promise.all(
          ids.map(async (briefId) => {
            try {
              // Fetch brief details
              const briefData = await publicClient.readContract({
                address: CONTRACT_ADDRESS,
                abi: ABI.abi,
                functionName: "briefs",
                args: [briefId],
              });

              // Fetch application data for this brief
              const applicationData = (await publicClient.readContract({
                address: CONTRACT_ADDRESS,
                abi: ABI.abi,
                functionName: "getBriefApplications",
                args: [briefId],
              })) as RawApplicationData;

              if (Array.isArray(briefData)) {
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

        // Separate applied and assigned briefs
        const appliedBriefs = validResults;
        const assignedBriefs = validResults.filter(
          (result) => result.application.isSelected
        );

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
    if (!influencerAddress) {
      setDashboardData((prev) => ({
        ...prev,
        isLoading: false,
        error: "No influencer address available",
      }));
      return;
    }

    if (isLoadingBriefIds) {
      setDashboardData((prev) => ({ ...prev, isLoading: true }));
      return;
    }

    if (briefIdsError) {
      setDashboardData((prev) => ({
        ...prev,
        isLoading: false,
        error: briefIdsError.message || "Failed to fetch brief IDs",
      }));
      return;
    }

    if (briefIds && Array.isArray(briefIds)) {
      if (briefIds.length === 0) {
        setDashboardData({
          appliedBriefs: [],
          assignedBriefs: [],
          isLoading: false,
          error: null,
        });
      } else {
        fetchDashboardData(briefIds);
      }
    }
  }, [
    influencerAddress,
    briefIds,
    isLoadingBriefIds,
    briefIdsError,
    fetchDashboardData,
  ]);

  const refetch = useCallback(() => {
    // Add a small delay to prevent aggressive re-fetching
    setTimeout(() => {
      refetchBriefIds();
    }, 100);
  }, [refetchBriefIds]);

  return { ...dashboardData, refetch };
};
