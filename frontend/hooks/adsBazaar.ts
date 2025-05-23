import { useState, useEffect, useCallback, useMemo } from "react";
import {
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  useAccount,
  usePublicClient,
} from "wagmi";
import { parseUnits, Hex } from "viem";
import { cUSDContractConfig, CONTRACT_ADDRESS } from "../lib/contracts";
import { formatEther } from "viem";
import ABI from "../lib/AdsBazaar.json";
import { toast } from "react-hot-toast";

type Status = "OPEN" | "ASSIGNED" | "COMPLETED" | "CANCELLED";
type TargetAudience =
  | "GENERAL"
  | "FASHION"
  | "TECH"
  | "GAMING"
  | "FITNESS"
  | "BEAUTY"
  | "FOOD"
  | "TRAVEL"
  | "BUSINESS"
  | "EDUCATION"
  | "ENTERTAINMENT"
  | "SPORTS"
  | "LIFESTYLE"
  | "OTHER";

interface FormattedBriefDataOutput {
  id: Bytes32;
  business: Address;
  title: string;
  description: string;
  budget: number;
  status: Status | number;
  applicationDeadline: number;
  promotionDuration: number;
  promotionStartTime: number;
  promotionEndTime: number;
  maxInfluencers: number;
  selectedInfluencersCount: number;
  targetAudience: TargetAudience | number;
  verificationDeadline: number;
}
export interface InfluencerApplication {
  influencer: string;
  message: string;
  timestamp: number;
  isSelected: boolean;
  hasClaimed: boolean;
  proofLink: string;
  isApproved: boolean;
}
interface RawBriefData {
  business: `0x${string}`;
  name: string;
  description: string;
  budget: bigint;
  status: bigint;
  applicationDeadline: bigint;
  promotionDuration: bigint;
  promotionStartTime: bigint;
  promotionEndTime: bigint;
  maxInfluencers: bigint;
  selectedInfluencersCount: bigint;
  targetAudience: bigint;
  verificationDeadline: bigint;
}

interface FormattedBriefData {
  id: Bytes32;
  business: string;
  title: string;
  description: string;
  budget: number;
  status: number;
  applicationDeadline: number;
  applicationCount: number;
  promotionDuration: number;
  promotionStartTime: number;
  promotionEndTime: number;
  maxInfluencers: number;
  selectedInfluencersCount: number;
  targetAudience: number;
  verificationDeadline: number;
}

interface BriefData {
  business: Address;
  name: string;
  description: string;
  budget: bigint;
  status: Status;
  applicationDeadline: bigint;
  promotionDuration: bigint;
  promotionStartTime: bigint;
  promotionEndTime: bigint;
  maxInfluencers: bigint;
  selectedInfluencersCount: bigint;
  targetAudience: TargetAudience;
  verificationDeadline: bigint;
}

// Type definitions
type Address = `0x${string}`;
type Bytes32 = Hex;
type UserProfile = {
  isRegistered: boolean;
  isBusiness: boolean;
  isInfluencer: boolean;
  profileData: string;
};

type Application = {
  influencer: Address;
  message: string;
  timestamp: number;
  isSelected: boolean;
  hasClaimed: boolean;
  proofLink: string;
  isApproved: boolean;
};
type Payment = {
  briefId: Bytes32;
  amount: bigint;
  approved: boolean;
};

// Hook for handling transaction state
function useHandleTransaction() {
  const {
    writeContract,
    isPending: isWritePending,
    data: hash,
    error: writeError,
  } = useWriteContract();

  const {
    isLoading: isConfirming,
    isSuccess,
    isError: isReceiptError,
    error: receiptError,
  } = useWaitForTransactionReceipt({ hash });

  const isPending = isWritePending || isConfirming;
  const error = writeError || receiptError;

  return {
    writeContract,
    hash,
    isPending,
    isSuccess,
    isError: isReceiptError || (hash && !isSuccess && !isConfirming),
    error,
  };
}

export function useGetAllId() {
  const { data, isLoading, isError, error, refetch, isSuccess } =
    useReadContract({
      address: CONTRACT_ADDRESS,
      abi: ABI.abi,
      functionName: "getAllBriefs",
    });

  return {
    data,
    isLoading,
    isError,
    error,
    refetch,
    rawData: data,
  };
}

export function useGetAllBriefs() {
  const [processedBriefs, setProcessedBriefs] = useState<FormattedBriefData[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const publicClient = usePublicClient();

  // First fetch all brief IDs
  const {
    data: briefIds,
    isLoading: isLoadingIds,
    isError: isErrorIds,
    error: idError,
  } = useGetAllId();

  // Then fetch details for each brief
  const fetchAllBriefDetails = useCallback(
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
              // Fetch brief details
              if (!publicClient) {
                throw new Error("Public client not available");
              }
              if (!publicClient) {
                throw new Error("Public client not available");
              }
              if (!publicClient) {
                throw new Error("Public client not available");
              }
              const briefData = await publicClient.readContract({
                address: CONTRACT_ADDRESS,
                abi: ABI.abi,
                functionName: "briefs",
                args: [id],
              });

              // Fetch application count for this brief
              const applicationCount = await publicClient.readContract({
                address: CONTRACT_ADDRESS,
                abi: ABI.abi,
                functionName: "briefApplicationCounts",
                args: [id],
              });

              // Handle the array response properly
              if (Array.isArray(briefData)) {
                return formatBriefData(id, briefData, Number(applicationCount));
              }
              return null;
            } catch (err) {
              console.error(`Error fetching brief ${id}:`, err);
              return null;
            }
          })
        );

        setProcessedBriefs(
          results.filter((brief): brief is FormattedBriefData => brief !== null)
        );
      } catch (err) {
        console.error("Error fetching brief details:", err);
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    },
    [publicClient]
  );

  useEffect(() => {
    if (briefIds && !isLoadingIds) {
      fetchAllBriefDetails(briefIds as `0x${string}`[]);
    }
  }, [briefIds, isLoadingIds, fetchAllBriefDetails]);

  const formatBriefData = (
    briefId: `0x${string}`,
    rawData: any[],
    applicationCount: number
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
        verificationDeadline: Number(rawData[13] || 0), // Handle optional field
        applicationCount: applicationCount,
      };
    } catch (err) {
      console.error(`Error formatting brief ${briefId}:`, err);
      return null;
    }
  };

  return {
    briefs: processedBriefs,
    isLoading: isLoading || isLoadingIds,
    isError: isErrorIds || error !== null,
    error: idError || error,
  };
}

export function useGetBusinessBriefIds(businessAddress: `0x${string}`) {
  const { data, isLoading, isError, error, refetch } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ABI.abi,
    functionName: "getBusinessBriefs",
    args: [businessAddress],
  });

  return {
    data,
    isLoading,
    isError,
    error,
    refetch,
  };
}

export function useGetBusinessBriefs(businessAddress: `0x${string}`) {
  const [processedBriefs, setProcessedBriefs] = useState<FormattedBriefData[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const publicClient = usePublicClient();

  // First fetch all brief IDs for this business
  const {
    data: briefIds,
    isLoading: isLoadingIds,
    isError: isErrorIds,
    error: idError,
  } = useGetBusinessBriefIds(businessAddress);

  // Then fetch details for each brief
  const fetchBusinessBriefDetails = useCallback(
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
              const result = await publicClient.readContract({
                address: CONTRACT_ADDRESS,
                abi: ABI.abi,
                functionName: "briefs",
                args: [id],
              });

              // Handle the array response properly
              if (Array.isArray(result)) {
                return formatBriefData(id, result);
              }
              return null;
            } catch (err) {
              console.error(`Error fetching brief ${id}:`, err);
              return null;
            }
          })
        );

        setProcessedBriefs(
          results.filter((brief): brief is FormattedBriefData => brief !== null)
        );
      } catch (err) {
        console.error("Error fetching brief details:", err);
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    },
    [publicClient]
  );

  useEffect(() => {
    if (briefIds && !isLoadingIds) {
      fetchBusinessBriefDetails(briefIds as `0x${string}`[]);
    }
  }, [briefIds, isLoadingIds, fetchBusinessBriefDetails]);

  const formatBriefData = (
    briefId: `0x${string}`,
    rawData: any[]
  ): FormattedBriefData | null => {
    console.log("rawData", rawData);

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
        verificationDeadline: Number(rawData[13]),
        applicationCount: 0, // Default to 0 or fetch actual count if available
      };
    } catch (err) {
      console.error(`Error formatting brief ${briefId}:`, err);
      return null;
    }
  };

  return {
    briefs: processedBriefs,
    isLoading: isLoading || isLoadingIds,
    isError: isErrorIds || error !== null,
    error: idError || error,
  };
}

// Get user profile
export function useUserProfile(userAddress?: Address) {
  const { address } = useAccount();
  const targetAddress = userAddress || address;

  const { data, error, isLoading, refetch } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ABI.abi,
    functionName: "users",
    args: [targetAddress],
    query: {
      enabled: !!targetAddress,
    },
  });

  return {
    userProfile: data
      ? {
          isRegistered: (data as [boolean, boolean, boolean, string])[0],
          isBusiness: (data as [boolean, boolean, boolean, string])[1],
          isInfluencer: (data as [boolean, boolean, boolean, string])[2],
          profileData: (data as [boolean, boolean, boolean, string])[3],
        }
      : null,
    isLoadingProfile: isLoading,
    profileError: error,
    refetchProfile: refetch,
  };
}

// Check if an influencer is verified
export function useIsInfluencerVerified(influencerAddress?: Address) {
  const { address } = useAccount();
  const targetAddress = influencerAddress || address;

  const { data, error, isLoading, refetch } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ABI.abi,
    functionName: "isInfluencerVerified",
    args: [targetAddress],
    query: {
      enabled: !!targetAddress,
    },
  });

  return {
    isVerified: data as boolean | undefined,
    isLoadingVerification: isLoading,
    verificationError: error,
    refetchVerification: refetch,
  };
}

// Get ad brief details
export function useAdBrief(briefId: Bytes32) {
  const { data, error, isLoading, refetch } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ABI.abi,
    functionName: "getAdBrief",
    args: [briefId],
    query: {
      enabled: !!briefId,
    },
  });

  return {
    briefData: data as BriefData | undefined,
    isLoadingBrief: isLoading,
    briefError: error,
    refetchBrief: refetch,
  };
}

// Get all briefs for a business
export function useBusinessBriefs(businessAddress?: Address) {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const targetAddress = businessAddress || address;

  // First fetch the brief IDs
  const {
    data: briefIds,
    error: briefIdsError,
    isLoading: isLoadingBriefIds,
    refetch: refetchBriefIds,
  } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ABI.abi,
    functionName: "getBusinessBriefs",
    args: [targetAddress],
    query: {
      enabled: !!targetAddress,
    },
  });

  // Then fetch details for each brief
  const [briefs, setBriefs] = useState<Array<{ briefId: Bytes32 } & BriefData>>(
    []
  );
  const [isLoadingBriefs, setIsLoadingBriefs] = useState(false);
  const [briefsError, setBriefsError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchAllBriefData() {
      if (!Array.isArray(briefIds) || briefIds.length === 0) {
        setBriefs([]);
        return;
      }

      setIsLoadingBriefs(true);
      setBriefsError(null);

      try {
        const briefsData = await Promise.all(
          (briefIds as Bytes32[]).map(async (briefId) => {
            // @ts-ignore  
            const briefData = await publicClient.readContract({
              address: CONTRACT_ADDRESS,
              abi: ABI.abi,
              functionName: "getAdBrief",
              args: [briefId],
            });

            const rawData = briefData as any[];
            return {
              briefId,
              business: rawData[0],
              name: rawData[1],
              description: rawData[2],
              budget: rawData[3],
              status: convertStatus(rawData[4]),
              applicationDeadline: rawData[5],
              promotionDuration: rawData[6],
              promotionStartTime: rawData[7],
              promotionEndTime: rawData[8],
              maxInfluencers: rawData[9],
              selectedInfluencersCount: rawData[10],
              targetAudience: convertTargetAudience(rawData[11]),
              verificationDeadline: rawData[12],
            };
          })
        );
        setBriefs(briefsData);
      } catch (error) {
        console.error("Error fetching briefs data:", error);
        setBriefsError(error as Error);
        setBriefs([]);
      } finally {
        setIsLoadingBriefs(false);
      }
    }

    fetchAllBriefData();
  }, [briefIds, publicClient]);

  return {
    briefIds: briefIds as Bytes32[] | undefined,
    briefs,
    isLoading: isLoadingBriefIds || isLoadingBriefs,
    error: briefIdsError || briefsError,
    refetch: refetchBriefIds,
  };
}

// Helper functions to convert contract enums to strings
function convertStatus(statusNumber: bigint): Status {
  const statuses: Status[] = ["OPEN", "ASSIGNED", "COMPLETED", "CANCELLED"];
  return statuses[Number(statusNumber)] || "CANCELLED";
}

function convertTargetAudience(audienceNumber: bigint): TargetAudience {
  const audiences: TargetAudience[] = [
    "GENERAL",
    "FASHION",
    "TECH",
    "GAMING",
    "FITNESS",
    "BEAUTY",
    "FOOD",
    "TRAVEL",
    "BUSINESS",
    "EDUCATION",
    "ENTERTAINMENT",
    "SPORTS",
    "LIFESTYLE",
    "OTHER",
  ];
  return audiences[Number(audienceNumber)] || "GENERAL";
}

// Get all applications for an influencer
export function useInfluencerApplications(influencerAddress?: Address) {
  const { address } = useAccount();
  const targetAddress = influencerAddress || address;

  const {
    data: applicationIds,
    error,
    isLoading,
    refetch,
  } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ABI.abi,
    functionName: "getInfluencerApplications",
    args: [targetAddress],
    query: {
      enabled: !!targetAddress,
    },
  });

  return {
    applicationIds: applicationIds as
      | { briefId: Bytes32; applicationIndex: bigint }[]
      | undefined,
    isLoadingApplications: isLoading,
    applicationsError: error,
    refetchApplications: refetch,
  };
}

// Get applications for a brief
export function useBriefApplications(briefId: Bytes32) {
  const { data, error, isLoading, refetch } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ABI.abi,
    functionName: "getBriefApplications",
    args: [briefId],
    query: {
      enabled: !!briefId,
    },
  });

  // Format the application data into a more usable structure
  const formattedApplications =
    data &&
    typeof data === "object" &&
    "influencers" in data &&
    Array.isArray((data as any).influencers)
      ? ((data as any).influencers as Address[]).map((influencer, index) => ({
          influencer,
          message: (data as any).messages[index] as string,
          timestamp: Number((data as any).timestamps[index] as bigint),
          isSelected: (data as any).isSelected[index] as boolean,
          hasClaimed: (data as any).hasClaimed[index] as boolean,
          proofLink: (data as any).proofLinks[index] as string,
          isApproved: (data as any).isApproved[index] as boolean,
        }))
      : [];

  return {
    applications: formattedApplications as Application[],
    rawApplicationsData: data,
    isLoadingApplications: isLoading,
    applicationsError: error,
    refetchApplications: refetch,
  };
}

// Get pending payments for an influencer
export function usePendingPayments(influencerAddress?: Address) {
  const { address } = useAccount();
  const targetAddress = influencerAddress || address;

  const { data, error, isLoading, refetch } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ABI.abi,
    functionName: "getPendingPayments",
    args: [targetAddress],
    query: {
      enabled: !!targetAddress,
    },
  });

  // Format the payment data into a more usable structure
  const formattedPayments =
    data &&
    typeof data === "object" &&
    "briefIds" in data &&
    Array.isArray((data as any).briefIds) &&
    "amounts" in data &&
    Array.isArray((data as any).amounts) &&
    "approved" in data &&
    Array.isArray((data as any).approved)
      ? ((data as any).briefIds as Bytes32[]).map((briefId: Bytes32, index: number) => ({
          briefId,
          amount: (data as any).amounts[index] as bigint,
          approved: (data as any).approved[index] as boolean,
        }))
      : [];

  return {
    pendingPayments: formattedPayments as Payment[],
    rawPaymentsData: data,
    isLoadingPayments: isLoading,
    paymentsError: error,
    refetchPayments: refetch,
  };
}

// Get total pending amount for an influencer
export function useTotalPendingAmount(influencerAddress?: Address) {
  const { address } = useAccount();
  const targetAddress = influencerAddress || address;

  const { data, error, isLoading, refetch } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ABI.abi,
    functionName: "getTotalPendingAmount",
    args: [targetAddress],
    query: {
      enabled: !!targetAddress,
    },
  });

  return {
    totalPendingAmount: data as bigint | undefined,
    isLoadingTotalAmount: isLoading,
    totalAmountError: error,
    refetchTotalAmount: refetch,
  };
}

// Get platform fee percentage
export function usePlatformFeePercentage() {
  const { data, error, isLoading, refetch } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ABI.abi,
    functionName: "platformFeePercentage",
    query: {
      enabled: true,
    },
  });

  return {
    feePercentage: data ? Number(data) / 10 : null, // Convert from basis points (0.1%)
    isLoadingFee: isLoading,
    feeError: error,
    refetchFee: refetch,
  };
}

// Register user
export function useRegisterUser() {
  const tx = useHandleTransaction();
  const { address } = useAccount();

  const register = async (
    isBusiness: boolean,
    isInfluencer: boolean,
    profileData: string
  ) => {
    if (!address) return;

    try {
      await tx.writeContract({
        address: CONTRACT_ADDRESS,
        abi: ABI.abi,
        functionName: "registerUser",
        args: [isBusiness, isInfluencer, profileData],
      });
    } catch (error) {
      console.error("Error registering user:", error);
    }
  };

  return {
    register,
    ...tx,
  };
}

// Create ad brief
export function useCreateAdBrief() {
  const tx = useHandleTransaction();
  const { writeContract: approveCUSD } = useWriteContract();
  const { address } = useAccount();

  const createBrief = async (
    name: string,
    description: string,
    budget: string, // In cUSD with decimals (e.g. "100.50")
    applicationDeadline: number, // Unix timestamp
    promotionDuration: number, // In seconds
    maxInfluencers: number,
    targetAudience: number,
    verificationPeriod: number // In seconds
  ) => {
    if (!address) return;

    try {
      // Convert budget to the appropriate format (with 18 decimals for cUSD)
      const budgetInWei = parseUnits(budget, 18);

      // First approve the contract to spend cUSD
      const approvalTx = await approveCUSD({
        address: cUSDContractConfig.address,
        abi: cUSDContractConfig.abi,
        functionName: "approve",
        args: [CONTRACT_ADDRESS, budgetInWei],
      });

      // Then create the brief
      await tx.writeContract({
        address: CONTRACT_ADDRESS,
        abi: ABI.abi,
        functionName: "createAdBrief",
        args: [
          name,
          description,
          budgetInWei,
          BigInt(applicationDeadline),
          BigInt(promotionDuration),
          BigInt(maxInfluencers),
          targetAudience,
          BigInt(verificationPeriod),
        ],
      });
    } catch (error) {
      console.error("Error creating ad brief:", error);
    }
  };

  return {
    createBrief,
    ...tx,
  };
}

//Cancel ad brief
export function useCancelAdBrief() {
  const tx = useHandleTransaction();
  const { address } = useAccount();

  const cancelBrief = async (briefId: Bytes32) => {
    if (!address) return;

    try {
      await tx.writeContract({
        address: CONTRACT_ADDRESS,
        abi: ABI.abi,
        functionName: "cancelAdBrief",
        args: [briefId],
      });
    } catch (error) {
      console.error("Error cancelling ad brief:", error);
    }
  };

  return {
    cancelBrief,
    ...tx,
  };
}

// Select influencer
export function useSelectInfluencer() {
  const tx = useHandleTransaction();
  const { address } = useAccount();

  const selectInfluencer = async (
    briefId: Bytes32,
    applicationIndex: number
  ) => {
    if (!address) return;
  

    console.log("Calling selectInfluencer:", { briefId, applicationIndex });

    try {
      await tx.writeContract({
        address: CONTRACT_ADDRESS,
        abi: ABI.abi,
        functionName: "selectInfluencer",
        args: [briefId, applicationIndex],
      });
    } catch (error) {
      console.error("Error selecting influencer:", error);
    }
  };

  return {
    selectInfluencer,
    ...tx,
  };
}

// Complete campaign
export function useCompleteCampaign() {
  const tx = useHandleTransaction();
  const { address } = useAccount();

  const completeCampaign = async (briefId: Bytes32) => {
    if (!address) return;

    try {
      await tx.writeContract({
        address: CONTRACT_ADDRESS,
        abi: ABI.abi,
        functionName: "completeCampaign",
        args: [briefId],
      });
    } catch (error) {
      console.error("Error completing campaign:", error);
    }
  };

  return {
    completeCampaign,
    ...tx,
  };
}

// Apply to brief
export function useApplyToBrief() {
  const tx = useHandleTransaction();
  const { address } = useAccount();

  const applyToBrief = async (briefId: Bytes32, message: string) => {
    if (!address) return;

    try {
      await tx.writeContract({
        address: CONTRACT_ADDRESS,
        abi: ABI.abi,
        functionName: "applyToBrief",
        args: [briefId, message],
      });
    } catch (error) {
      console.error("Error applying to brief:", error);
    }
  };

  return {
    applyToBrief,
    ...tx,
  };
}

// Submit proof
export function useSubmitProof() {
  const { writeContract, hash, isPending, isSuccess, isError, error } =
    useHandleTransaction();
  const { address } = useAccount();

  const submitProof = async (briefId: string, proofLink: string) => {
    if (!address) {
      toast.error("Please connect your wallet");
      return { success: false, status: "error" };
    }

    try {
      // Initiate transaction
      await writeContract({
        address: CONTRACT_ADDRESS,
        abi: ABI.abi,
        functionName: "submitProof",
        args: [briefId, proofLink],
      });

      return {
        success: true,
        status: isPending ? "pending" : isSuccess ? "success" : "idle",
        hash,
        isPending,
        isSuccess,
        isError,
        error,
      };
    } catch (error: any) {
      console.error("Error submitting proof:", error);

      let errorMessage = "Failed to submit proof";
      if (error.shortMessage) {
        errorMessage = error.shortMessage;
      } else if (error.message) {
        errorMessage = error.message;
      }

      return {
        success: false,
        status: "error",
        error: errorMessage,
      };
    }
  };

  return {
    submitProof,
    hash,
    isPending,
    isSuccess,
    isError,
    error,
  };
}

// Claim payments
export function useClaimPayments() {
  const tx = useHandleTransaction();
  const { address } = useAccount();

  const claimPayments = async () => {
    if (!address) return;

    try {
      await tx.writeContract({
        address: CONTRACT_ADDRESS,
        abi: ABI.abi,
        functionName: "claimPayments",
      });
    } catch (error) {
      console.error("Error claiming payments:", error);
    }
  };

  return {
    claimPayments,
    ...tx,
  };
}

// Verify Self protocol proof
export function useVerifySelfProof() {
  const tx = useHandleTransaction();
  const { address } = useAccount();

  const verifySelfProof = async (proof: any, publicSignals: string[]) => {
    if (!address) return;

    try {
      // Format the proof according to your contract's expected structure
      const formattedProof = {
        a: [proof.pi_a[0], proof.pi_a[1]],
        b: [
          [proof.pi_b[0][1], proof.pi_b[0][0]], 
          [proof.pi_b[1][1], proof.pi_b[1][0]]
        ],
        c: [proof.pi_c[0], proof.pi_c[1]],
        pubSignals: publicSignals // This should be exactly 21 elements as per your ABI
      };

      await tx.writeContract({
        address: CONTRACT_ADDRESS,
        abi: ABI.abi,
        functionName: "verifySelfProof",
        args: [formattedProof],
      });
    } catch (error) {
      console.error("Error verifying Self proof:", error);
      throw error; // Re-throw so the calling component can handle it
    }
  };

  return {
    verifySelfProof,
    ...tx,
  };
}

// For admin only: Set platform fee
export function useSetPlatformFee() {
  const tx = useHandleTransaction();
  const { address } = useAccount();

  const setPlatformFee = async (feePercentage: number) => {
    if (!address) return;

    // Fee is in basis points (0.1%), so multiply by 10
    const feeInBasisPoints = Math.round(feePercentage * 10);

    try {
      await tx.writeContract({
        address: CONTRACT_ADDRESS,
        abi: ABI.abi,
        functionName: "setPlatformFee",
        args: [BigInt(feeInBasisPoints)],
      });
    } catch (error) {
      console.error("Error setting platform fee:", error);
    }
  };

  return {
    setPlatformFee,
    ...tx,
  };
}

// For admin only: Trigger auto approval
export function useTriggerAutoApproval() {
  const tx = useHandleTransaction();
  const { address } = useAccount();

  const triggerAutoApproval = async (briefId: Bytes32) => {
    if (!address) return;

    try {
      await tx.writeContract({
        address: CONTRACT_ADDRESS,
        abi: ABI.abi,
        functionName: "triggerAutoApproval",
        args: [briefId],
      });
    } catch (error) {
      console.error("Error triggering auto approval:", error);
    }
  };

  return {
    triggerAutoApproval,
    ...tx,
  };
}

// For admin only: Set verification config
export function useSetVerificationConfig() {
  const tx = useHandleTransaction();
  const { address } = useAccount();

  const setVerificationConfig = async (config: string) => {
    if (!address) return;

    try {
      await tx.writeContract({
        address: CONTRACT_ADDRESS,
        abi: ABI.abi,
        functionName: "setVerificationConfig",
        args: [config],
      });
    } catch (error) {
      console.error("Error setting verification config:", error);
    }
  };

  return {
    setVerificationConfig,
    ...tx,
  };
}

// Get verification config
export function useVerificationConfig() {
  const { data, error, isLoading, refetch } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ABI.abi,
    functionName: "getVerificationConfig",
    query: {
      enabled: true,
    },
  });

  return {
    verificationConfig: data as string | undefined,
    isLoadingConfig: isLoading,
    configError: error,
    refetchConfig: refetch,
  };
}
