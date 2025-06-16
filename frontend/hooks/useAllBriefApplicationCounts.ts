import { useReadContracts } from "wagmi";

import { FormattedBriefData } from "@/types/index";
import ABI from "../lib/AdsBazaar.json";
import { CONTRACT_ADDRESS } from "../lib/contracts";

// Hook to fetch application counts for multiple briefs
export const useAllBriefApplicationCounts = (briefs: FormattedBriefData[]) => {
  const briefIds = briefs
    .map((brief) => brief.id)
    .filter((id) => id && id !== "0x0");

  const contracts = briefIds.map((briefId) => ({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: ABI.abi,
    functionName: "briefApplicationCounts",
    args: [briefId],
  }));

  const { data, isLoading, error, refetch } = useReadContracts({
    contracts,
    query: {
      enabled: briefIds.length > 0,
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
      gcTime: 10 * 60 * 1000, // Garbage collect after 10 minutes
    },
  });

  // Map results to briefId -> count
  const applicationCounts = briefIds.reduce<Record<string, number>>(
    (acc, briefId, index) => {
      const result = data?.[index];
      acc[briefId] = result?.status === "success" ? Number(result.result) : 0;
      return acc;
    },
    {}
  );

  return {
    applicationCounts, // { [briefId]: count }
    isLoadingApplications: isLoading,
    errorApplications: error,
    refetchApplications: refetch,
  };
};