
import { useState, useEffect, useCallback ,useMemo} from "react";
import {
  useReadContract,
  useAccount,
  usePublicClient,
} from "wagmi";



import { formatEther } from "viem";
type Bytes32 = Hex;
import ABI from "../lib/AdsBazaar.json";


const CONTRACT_ADDRESS = "0xe0F5Aeb011C4B8e5C0A5A10611b3Aa57ab4Bf56F";
export interface InfluencerApplication {
  influencer: string;
  message: string;
  timestamp: number;
  isSelected: boolean;
  hasClaimed: boolean;
  proofLink: string;
  isApproved: boolean;
}

export interface BriefApplications {
  influencers: `0x${string}`[];
  messages: string[];
  timestamps: bigint[];
  isSelected: boolean[];
  hasClaimed: boolean[];
  proofLinks: string[];
  isApproved: boolean[];
}

interface FormattedBriefData {
  id: Bytes32;
  business: string;
  title: string;
  description: string;
  budget: number;
  status: number;
  applicationDeadline: number;
  promotionDuration: number;
  promotionStartTime: number;
  promotionEndTime: number;
  maxInfluencers: number;
  selectedInfluencersCount: number;
  targetAudience: number;
  verificationDeadline: number;
}


// influncers applied brifes

export function useGetInfluencerApplicationIds(influencerAddress: `0x${string}`) {
  const { data, isLoading, isError, error, refetch } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ABI.abi,
    functionName: "getInfluencerApplications",
    args: [influencerAddress],
  });

  return {
    data,
    isLoading,
    isError,
    error,
    refetch,
  };
}



export function useGetInfluencerApplications(influencerAddress: `0x${string}`) { 
  const [processedBriefs, setProcessedBriefs] = useState<FormattedBriefData[]>([]);
  const [applications, setApplications] = useState<InfluencerApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const publicClient = usePublicClient();

  // First fetch all brief IDs this influencer applied to
  const {
    data: briefIds,
    isLoading: isLoadingIds,
    isError: isErrorIds,
    error: idError,
  } = useGetInfluencerApplicationIds(influencerAddress);

  // Then fetch details for each brief and application status
  const fetchInfluencerApplications = useCallback(
    async (ids: `0x${string}`[]) => {
      if (!publicClient) {
        setError(new Error("Public client not available"));
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const results = await Promise.all(
          ids.map(async (id) => {
            try {
              // Get the brief details
              const briefResult = await publicClient.readContract({
                address: CONTRACT_ADDRESS,
                abi: ABI.abi,
                functionName: "briefs",
                args: [id],
              });

              // Get the application details for this influencer
              const applicationsResult = await publicClient.readContract({
                address: CONTRACT_ADDRESS,
                abi: ABI.abi,
                functionName: "getBriefApplications",
                args: [id],
              }) as BriefApplications;

              // Find this influencer's application
              const influencerApp = applicationsResult.influencers
                .map((influencer: string, index: number) => ({
                  influencer,
                  message: applicationsResult.messages[index],
                  timestamp: applicationsResult.timestamps[index],
                  isSelected: applicationsResult.isSelected[index],
                  hasClaimed: applicationsResult.hasClaimed[index],
                  proofLink: applicationsResult.proofLinks[index],
                  isApproved: applicationsResult.isApproved[index],
                }))
                .find((app: any) => app.influencer.toLowerCase() === influencerAddress.toLowerCase());

              if (Array.isArray(briefResult)) {
                return {
                  brief: formatBriefData(id, briefResult),
                  application: influencerApp,
                };
              }
              return null;
            } catch (err) {
              console.error(`Error fetching brief ${id}:`, err);
              return null;
            }
          })
        );

        const validResults = results.filter(
          (result): result is { brief: FormattedBriefData; application: { influencer: string; message: string; timestamp: bigint; isSelected: boolean; hasClaimed: boolean; proofLink: string; isApproved: boolean; } } =>
            result !== null && result.application !== undefined
        );

        setProcessedBriefs(validResults.map(r => r.brief));
        setApplications(
          validResults.map(r => ({
            ...r.application,
            timestamp: Number(r.application.timestamp),
          }))
        );
      } catch (err) {
        console.error("Error fetching influencer applications:", err);
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    },
    [publicClient, influencerAddress]
  );

  useEffect(() => {
    if (briefIds && !isLoadingIds) {
      fetchInfluencerApplications(briefIds as `0x${string}`[]);
    }
  }, [briefIds, isLoadingIds, fetchInfluencerApplications]);


   const formatBriefData = (
    briefId: `0x${string}`,
    rawData: any[]
  ): FormattedBriefData | null => {
    try {
      // Ensure rawData is an array with enough elements
      if (!Array.isArray(rawData) || rawData.length < 13) {
        console.error("Invalid brief data format:", rawData);
        return null;
      }

      return {
        id: briefId,
        business: rawData[1] as `0x${string}`,
        title: rawData[2] as string,
        description: rawData[3] as string,
        budget: Number(formatEther(rawData[4] as bigint)),
        status: Number(rawData[5]),
        applicationDeadline: Number(rawData[6]),
        promotionDuration: Number(rawData[7]),
        promotionStartTime: Number(rawData[8]),
        promotionEndTime: Number(rawData[9]),
        maxInfluencers: Number(rawData[10]),
        selectedInfluencersCount: Number(rawData[11]),
        targetAudience: Number(rawData[12]),
        verificationDeadline: Number(rawData[13] || 0n), // Handle optional field
      };
    } catch (err) {
      console.error(`Error formatting brief ${briefId}:`, err);
      return null;
    }
  };
  return {
    briefs: processedBriefs,
    applications,
    isLoading: isLoading || isLoadingIds,
    isError: isErrorIds || error !== null,
    error: idError || error,
  };
}





export function useInfluencerApplicationDetails(briefId: `0x${string}`, influencerAddress?: `0x${string}`) {
  const { address } = useAccount();
  const addr = influencerAddress || address;
  
  const { data, isLoading, isError, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ABI.abi,
    functionName: "getBriefApplications",
    args: [briefId],
  }) as { data?: BriefApplications } & Omit<ReturnType<typeof useReadContract>, 'data'>;

  // Find the influencer's specific application
  const application = useMemo(() => {
    if (!data?.influencers) return null;
    
    const index = data.influencers.findIndex(
      (inf) => inf.toLowerCase() === addr?.toLowerCase()
    );
    
    if (index === -1) return null;
    
    return {
      influencer: data.influencers[index],
      message: data.messages[index],
      timestamp: Number(data.timestamps[index]),
      isSelected: data.isSelected[index],
      hasClaimed: data.hasClaimed[index],
      proofLink: data.proofLinks[index],
      isApproved: data.isApproved[index],
    } as InfluencerApplication;
  }, [data, addr]);

  return {
    application,
    isLoading,
    isError,
    error,
  };
}