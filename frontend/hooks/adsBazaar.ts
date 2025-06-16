import { useState, useEffect, useCallback, useMemo } from "react";
import {
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  useAccount,
  usePublicClient,
} from "wagmi";
import { parseUnits, Hex, formatEther } from "viem";
import { cUSDContractConfig, CONTRACT_ADDRESS } from "../lib/contracts";
import {
  Brief,
  RawBriefData,
  Application,
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
import { toast } from "react-hot-toast";
import { useEnsureNetwork } from "./useEnsureNetwork";

// Type definitions
type Address = `0x${string}`;
type Bytes32 = Hex;

type UserProfile = {
  isRegistered: boolean;
  isBusiness: boolean;
  isInfluencer: boolean;
  profileData: string;
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

/**
 * Formats raw brief data from contract to frontend Brief type
 */
function formatBriefData(
  briefId: `0x${string}`,
  rawData: any[],
  applicationCount: number = 0
): Brief | null {
  try {
    if (!Array.isArray(rawData) || rawData.length < 17) {
      console.error("Invalid brief data format:", rawData);
      return null;
    }

    // Convert bigint values to numbers and extract data
    const brief: Brief = {
      id: briefId,
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
      applicationCount,

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
  rawData: any,
  briefIndex: number
): Application | null {
  try {
    if (
      !rawData ||
      !rawData.influencers ||
      briefIndex >= rawData.influencers.length
    ) {
      return null;
    }

    const application: Application = {
      influencer: rawData.influencers[briefIndex] as `0x${string}`,
      message: rawData.messages[briefIndex] as string,
      timestamp: Number(rawData.timestamps[briefIndex]),
      isSelected: rawData.isSelected[briefIndex] as boolean,
      hasClaimed: rawData.hasClaimed[briefIndex] as boolean,
      proofLink: rawData.proofLinks[briefIndex] as string,
      isApproved: rawData.isApproved[briefIndex] as boolean,
      disputeStatus: 0 as DisputeStatus, // Default, would need additional contract call to get dispute info
      disputeReason: "",
      resolvedBy: "0x0000000000000000000000000000000000000000" as `0x${string}`,

      // Will be computed when we have brief context
      applicationInfo: {} as any,
    };

    return application;
  } catch (err) {
    console.error("Error formatting application data:", err);
    return null;
  }
}

// Get all brief IDs
export function useGetAllId() {
  const { data, isLoading, isError, error, refetch } = useReadContract({
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

// Get all briefs with enhanced data
export function useGetAllBriefs() {
  const [processedBriefs, setProcessedBriefs] = useState<Brief[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const publicClient = usePublicClient();

  // Fetch all brief IDs
  const {
    data: briefIds,
    isLoading: isLoadingIds,
    isError: isErrorIds,
    error: idError,
  } = useGetAllId();

  // Fetch details for each brief
  const fetchAllBriefDetails = useCallback(
    async (ids: `0x${string}`[]) => {
      if (!publicClient) {
        setError(new Error("Public client not available"));
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const results = await Promise.all(
          ids.map(async (id) => {
            try {
              // Fetch brief details
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

        const validBriefs = results.filter(
          (brief): brief is Brief => brief !== null
        );
        setProcessedBriefs(validBriefs);
      } catch (err) {
        console.error("Error fetching brief details:", err);
        setError(err instanceof Error ? err : new Error("Unknown error"));
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

  return {
    briefs: processedBriefs,
    isLoading: isLoading || isLoadingIds,
    isError: isErrorIds || error !== null,
    error: idError || error,
  };
}

// Get business briefs
export function useGetBusinessBriefs(businessAddress: `0x${string}`) {
  const [briefs, setBriefs] = useState<Brief[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const publicClient = usePublicClient();

  // Fetch brief IDs for the business
  const {
    data: briefIds,
    isLoading: isLoadingIds,
    isError: isErrorIds,
    error: idError,
  } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ABI.abi,
    functionName: "getBusinessBriefs",
    args: [businessAddress],
  });

  // Fetch details for each brief
  const fetchBusinessBriefDetails = useCallback(
    async (ids: `0x${string}`[]) => {
      if (!publicClient) {
        setError(new Error("Public client not available"));
        setIsLoading(false);
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

              // Also fetch application count
              const applicationCount = await publicClient.readContract({
                address: CONTRACT_ADDRESS,
                abi: ABI.abi,
                functionName: "briefApplicationCounts",
                args: [id],
              });

              if (Array.isArray(result)) {
                return formatBriefData(id, result, Number(applicationCount));
              }
              return null;
            } catch (err) {
              console.error(`Error fetching brief ${id}:`, err);
              return null;
            }
          })
        );

        const validBriefs = results.filter(
          (brief): brief is Brief => brief !== null
        );
        setBriefs(validBriefs);
      } catch (err) {
        console.error("Error fetching brief details:", err);
        setError(err instanceof Error ? err : new Error("Unknown error"));
      } finally {
        setIsLoading(false);
      }
    },
    [publicClient]
  );

  useEffect(() => {
    if (businessAddress && briefIds && !isLoadingIds) {
      fetchBusinessBriefDetails(briefIds as `0x${string}`[]);
    } else if (!businessAddress) {
      setBriefs([]);
      setIsLoading(false);
    }
  }, [businessAddress, briefIds, isLoadingIds, fetchBusinessBriefDetails]);

  return {
    briefs,
    isLoading: isLoading || isLoadingIds,
    isError: isErrorIds || !!error,
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

// Get applications for a brief with enhanced data
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
  const formattedApplications = useMemo(() => {
    if (
      !data ||
      typeof data !== "object" ||
      !("influencers" in data) ||
      !Array.isArray((data as any).influencers)
    ) {
      return [];
    }

    const rawData = data as any;
    return (rawData.influencers as Address[]).map((influencer, index) => {
      const application: Application = {
        influencer,
        message: rawData.messages[index] as string,
        timestamp: Number(rawData.timestamps[index] as bigint),
        isSelected: rawData.isSelected[index] as boolean,
        hasClaimed: rawData.hasClaimed[index] as boolean,
        proofLink: rawData.proofLinks[index] as string,
        isApproved: rawData.isApproved[index] as boolean,
        disputeStatus: 0 as DisputeStatus, // Would need additional call to get dispute info
        disputeReason: "",
        resolvedBy:
          "0x0000000000000000000000000000000000000000" as `0x${string}`,
        applicationInfo: {} as any, // Will be computed when we have brief context
      };

      return application;
    });
  }, [data]);

  return {
    applications: formattedApplications,
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
  const formattedPayments = useMemo(() => {
    if (!data || typeof data !== "object" || !("briefIds" in data)) {
      return [];
    }

    const rawData = data as any;
    if (
      !Array.isArray(rawData.briefIds) ||
      !Array.isArray(rawData.amounts) ||
      !Array.isArray(rawData.approved)
    ) {
      return [];
    }

    return (rawData.briefIds as Bytes32[]).map(
      (briefId: Bytes32, index: number) => ({
        briefId,
        amount: rawData.amounts[index] as bigint,
        approved: rawData.approved[index] as boolean,
      })
    );
  }, [data]);

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

// Create ad brief with improved error handling
export function useCreateAdBrief() {
  const tx = useHandleTransaction();
  const {
    writeContractAsync: approveCUSD,
    data: approveTxHash,
    error: approveError,
  } = useWriteContract();
  const { address } = useAccount();
  const [isApproving, setIsApproving] = useState(false);
  const [briefData, setBriefData] = useState<{
    name: string;
    description: string;
    requirements: string;
    budget: string;
    promotionDuration: number;
    maxInfluencers: number;
    targetAudience: number;
  } | null>(null);

  // Wait for approval transaction receipt
  const { status: approvalStatus, error: receiptError } =
    useWaitForTransactionReceipt({
      hash: approveTxHash,
      confirmations: 1,
    });

  // Handle approval completion
  useEffect(() => {
    if (isApproving && approvalStatus === "success" && briefData) {
      setIsApproving(false);
      try {
        tx.writeContract({
          address: CONTRACT_ADDRESS,
          abi: ABI.abi,
          functionName: "createAdBrief",
          args: [
            briefData.name,
            briefData.description,
            briefData.requirements,
            parseUnits(briefData.budget, 18),
            BigInt(briefData.promotionDuration),
            BigInt(briefData.maxInfluencers),
            briefData.targetAudience,
          ],
        });
      } catch (error) {
        console.error("Error creating ad brief:", error);
        setBriefData(null);
        throw error;
      }
    } else if (isApproving && approvalStatus === "error") {
      setIsApproving(false);
      setBriefData(null);
      const error = receiptError || new Error("Approval transaction failed");
      console.error("Approval failed:", error);
      throw error;
    }
  }, [approvalStatus, receiptError, isApproving, briefData, tx]);

  const createBrief = async (
    name: string,
    description: string,
    requirements: string,
    budget: string,
    promotionDuration: number,
    maxInfluencers: number,
    targetAudience: number
  ) => {
    if (!address) {
      throw new Error("Wallet not connected");
    }

    try {
      setBriefData({
        name,
        description,
        requirements,
        budget,
        promotionDuration,
        maxInfluencers,
        targetAudience,
      });

      setIsApproving(true);
      await approveCUSD({
        address: cUSDContractConfig.address,
        abi: cUSDContractConfig.abi,
        functionName: "approve",
        args: [CONTRACT_ADDRESS, parseUnits(budget, 18)],
      });
    } catch (error) {
      console.error("Error initiating approval:", error);
      setIsApproving(false);
      setBriefData(null);
      throw error;
    }
  };

  const isPending = isApproving || tx.isPending;
  const isError = !!approveError || !!receiptError || tx.isError;
  const error = approveError || receiptError || tx.error;

  return {
    createBrief,
    isPending,
    isSuccess: tx.isSuccess && !isApproving,
    isError,
    error,
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

// Select influencer
export function useSelectInfluencer() {
  const tx = useHandleTransaction();
  const { address } = useAccount();

  const selectInfluencer = async (
    briefId: Bytes32,
    applicationIndex: number
  ) => {
    if (!address) return;

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
    if (!address) {
      toast.error("Please connect your wallet");
      return;
    }

    try {
      await tx.writeContract({
        address: CONTRACT_ADDRESS,
        abi: ABI.abi,
        functionName: "completeCampaign",
        args: [briefId],
      });
    } catch (error) {
      console.error("Error completing campaign:", error);
      // Enhanced error handling
      if (error instanceof Error) {
        if (error.message.includes("User rejected")) {
          toast.error("Transaction was cancelled");
        } else if (error.message.includes("insufficient funds")) {
          toast.error("Insufficient funds for gas fees");
        } else {
          toast.error("Failed to complete campaign. Please try again.");
        }
      }
      throw error;
    }
  };

  return {
    completeCampaign,
    ...tx,
  };
}

// Cancel ad brief
export function useCancelAdBrief() {
  const { writeContract, hash, isPending, isSuccess, isError, error } =
    useHandleTransaction();
  const { address } = useAccount();
  const { isCorrectChain, ensureNetwork } = useEnsureNetwork();

  const cancelBrief = async (briefId: Bytes32) => {
    if (!address) {
      toast.error("Please connect your wallet");
      return;
    }

    if (!isCorrectChain) {
      const switched = await ensureNetwork();
      if (!switched) return;
    }

    try {
      await writeContract({
        address: CONTRACT_ADDRESS,
        abi: ABI.abi,
        functionName: "cancelAdBrief",
        args: [briefId],
      });
    } catch (error) {
      console.error("Error cancelling ad brief:", error);
      throw error;
    }
  };

  return {
    cancelBrief,
    hash,
    isPending,
    isSuccess,
    isError,
    error,
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
