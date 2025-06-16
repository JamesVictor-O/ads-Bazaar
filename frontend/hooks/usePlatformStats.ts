import { useReadContracts } from "wagmi";
import { CONTRACT_ADDRESS } from "../lib/contracts";
import ABI from "../lib/AdsBazaar.json";

export function usePlatformStats() {
  const { data, isLoading, error, refetch } = useReadContracts({
    contracts: [
      {
        address: CONTRACT_ADDRESS,
        abi: ABI.abi,
        functionName: "getTotalUsers",
      },
      {
        address: CONTRACT_ADDRESS,
        abi: ABI.abi,
        functionName: "getTotalBusinesses",
      },
      {
        address: CONTRACT_ADDRESS,
        abi: ABI.abi,
        functionName: "getTotalInfluencers",
      },
      {
        address: CONTRACT_ADDRESS,
        abi: ABI.abi,
        functionName: "getTotalEscrowAmount",
      },
    ],
    query: {
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
      gcTime: 10 * 60 * 1000, // Garbage collect after 10 minutes
    },
  });

  const stats = {
    totalUsers: data?.[0]?.status === "success" ? Number(data[0].result) : 0,
    totalBusinesses:
      data?.[1]?.status === "success" ? Number(data[1].result) : 0,
    totalInfluencers:
      data?.[2]?.status === "success" ? Number(data[2].result) : 0,
    totalEscrowAmount:
      data?.[3]?.status === "success" ? Number(data[3].result) / 1e18 : 0, // Convert from wei to ether
  };

  return {
    stats,
    isLoading,
    error,
    refetch,
  };
}
