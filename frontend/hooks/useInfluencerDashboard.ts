import { useState, useEffect } from "react";
import { useReadContracts, useAccount } from "wagmi";
import { InfluencerDashboardData, BriefData } from "../types";
import ABI from "../lib/AdsBazaar.json";
import { CONTRACT_ADDRESS } from "../lib/contracts";
import { Address } from "viem";

export const useInfluencerDashboard = () => {
  const [dashboardData, setDashboardData] = useState<InfluencerDashboardData>({
    appliedBriefs: [],
    assignedBriefs: [],
    isLoading: true,
    error: null,
  });

  const { address: influencerAddress } = useAccount();

  // Step 1: Get the influencer's applied brief IDs
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

  const briefIds = briefIdsResult?.[0]?.result;

  // Step 2: When we have brief IDs, prepare contracts for batch read
  const [contractsToRead, setContractsToRead] = useState<
    {
      address: Address;
      abi: any;
      functionName: string;
      args?: any[];
    }[]
  >([]);

  useEffect(() => {
    if (!Array.isArray(briefIds) || briefIds.length === 0) return;

    // Create contract read configurations for each brief
    const contracts = [];

    // Add read for all briefs first
    contracts.push({
      address: CONTRACT_ADDRESS as Address,
      abi: ABI.abi,
      functionName: "getAllBriefs",
    });

    // For each brief ID, add read for brief data and applications
    briefIds.forEach((briefId) => {
      contracts.push({
        address: CONTRACT_ADDRESS as Address,
        abi: ABI.abi,
        functionName: "getAdBrief",
        args: [briefId],
      });

      contracts.push({
        address: CONTRACT_ADDRESS as Address,
        abi: ABI.abi,
        functionName: "getBriefApplications",
        args: [briefId],
      });
    });

    setContractsToRead(contracts);
  }, [briefIds]);

  // Step 3: Read all contract data in one batch
  const {
    data: briefsData,
    isLoading: isLoadingBriefsData,
    error: briefsDataError,
  } = useReadContracts({
    contracts: contractsToRead,
  });

  // Step 4: Process the data when ready
  useEffect(() => {
    if (!influencerAddress) {
      setDashboardData((prev) => ({
        ...prev,
        isLoading: false,
        error: "No influencer address available",
      }));
      return;
    }

    if (isLoadingBriefIds || isLoadingBriefsData || !briefsData) {
      setDashboardData((prev) => ({ ...prev, isLoading: true }));
      return;
    }

    if (briefIdsError || briefsDataError) {
      setDashboardData((prev) => ({
        ...prev,
        isLoading: false,
        error:
          briefIdsError?.message ||
          briefsDataError?.message ||
          "Failed to fetch data",
      }));
      return;
    }

    try {
      const appliedBriefs = [];
      const assignedBriefs = [];

      // First result is getAllBriefs
      const allBriefs = briefsData[0].result;

      // Process each brief - data comes in pairs (brief data, applications data)

      if (Array.isArray(briefIds)) {
        for (let i = 0; i < briefIds.length; i++) {
          const briefId = briefIds[i];
          const briefData = briefsData[i * 2 + 1]?.result as unknown as BriefData;
          const applicationsResult = briefsData[i * 2 + 2]?.result;
          if (!briefData || !applicationsResult) continue;
          const applicationsData = applicationsResult as {
            influencers: string[];
            messages: string[];
            timestamps: string[];
            isSelected: boolean[];
            hasClaimed: boolean[];
            proofLinks: string[];
            isApproved: boolean[];
          };

          // Find the influencer's application
          const influencerAppIndex = applicationsData.influencers.findIndex(
            (addr) => addr.toLowerCase() === influencerAddress.toLowerCase()
          );

          if (influencerAppIndex === -1) continue;

          const application = {
            influencer: applicationsData.influencers[influencerAppIndex],
            message: applicationsData.messages[influencerAppIndex],
            timestamp: applicationsData.timestamps[influencerAppIndex],
            isSelected: applicationsData.isSelected[influencerAppIndex],
            hasClaimed: applicationsData.hasClaimed[influencerAppIndex],
            proofLink: applicationsData.proofLinks[influencerAppIndex],
            isApproved: applicationsData.isApproved[influencerAppIndex],
          };

          // Add to appliedBriefs
          appliedBriefs.push({
            briefId,
            brief: briefData,
            application,
          });

          // If selected, add to assignedBriefs
          if (application.isSelected) {
            assignedBriefs.push({
              briefId,
              brief: briefData,
              application,
            });
          }
        }
      }

      setDashboardData({
        appliedBriefs,
        assignedBriefs,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error("Error processing data:", error);
      setDashboardData((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : "Failed to process data",
      }));
    }
  }, [
    influencerAddress,
    briefIds,
    briefsData,
    isLoadingBriefIds,
    isLoadingBriefsData,
    briefIdsError,
    briefsDataError,
  ]);

  const refetch = () => {
    refetchBriefIds();
  };

  return { ...dashboardData, refetch };
};