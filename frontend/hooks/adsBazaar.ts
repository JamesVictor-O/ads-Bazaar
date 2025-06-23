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
import { CIRCUIT_CONSTANTS } from "@/lib/circuit";

// Type definitions
type Address = `0x${string}`;
type Bytes32 = Hex;

// type UserProfile = {
//   isRegistered: boolean;
//   isBusiness: boolean;
//   isInfluencer: boolean;
//   profileData: string;
// };

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

  const userProfile = useMemo(() => {
    if (!data) return null;

    return {
      isRegistered: (data as [boolean, boolean, boolean, number, string, bigint, bigint])[0],
      isBusiness: (data as [boolean, boolean, boolean, number, string, bigint, bigint])[1],
      isInfluencer: (data as [boolean, boolean, boolean, number, string, bigint, bigint])[2],
      status: (data as [boolean, boolean, boolean, number, string, bigint, bigint])[3],
      profileData: (data as [boolean, boolean, boolean, number, string, bigint, bigint])[4],
      completedCampaigns: Number((data as [boolean, boolean, boolean, number, string, bigint, bigint])[5]),
      totalEscrowed: Number((data as [boolean, boolean, boolean, number, string, bigint, bigint])[6]),
    };
  }, [data]);

  return {
    userProfile,
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
    profileData: string,
    dataSuffix?: `0x${string}` // Referral tag to append to calldata
  ) => {
    console.log('DIVVI: Calling writeContract with dataSuffix:', dataSuffix);

    if (!address) {
      console.error('No wallet address available');
      return;
    }

    try {
      tx.writeContract({
        address: CONTRACT_ADDRESS,
        abi: ABI.abi,
        functionName: "registerUser",
        args: [isBusiness, isInfluencer, profileData],
        dataSuffix: dataSuffix, // This appends referral tag to transaction calldata
      });

      console.log('DIVVI: writeContract called, waiting for hash...');
    } catch (error) {
      console.error("Error registering user:", error);
      throw error;
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
    dataSuffix?: `0x${string}`;
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
        console.log('DIVVI: Creating brief with dataSuffix:', briefData.dataSuffix);
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
          dataSuffix: briefData.dataSuffix,
        });
        console.log('DIVVI: Brief creation writeContract called, waiting for hash...');
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
    targetAudience: number,
    dataSuffix?: `0x${string}`
  ) => {
    console.log('DIVVI: Creating brief with dataSuffix:', dataSuffix);

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
        dataSuffix,
      });

      setIsApproving(true);
      console.log('DIVVI: Approving cUSD with dataSuffix:', dataSuffix);
      await approveCUSD({
        address: cUSDContractConfig.address,
        abi: cUSDContractConfig.abi,
        functionName: "approve",
        args: [CONTRACT_ADDRESS, parseUnits(budget, 18)],
        dataSuffix: dataSuffix,
      });
      console.log('DIVVI: Approval transaction submitted');
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
    hash: tx.hash,
  };
}

// Apply to brief
export function useApplyToBrief() {
  const tx = useHandleTransaction();
  const { address } = useAccount();

  const applyToBrief = async (
    briefId: string,
    message: string,
    dataSuffix?: `0x${string}`
  ) => {
    console.log('DIVVI: Applying to brief with dataSuffix:', dataSuffix);

    if (!address) return;

    try {
      tx.writeContract({
        address: CONTRACT_ADDRESS,
        abi: ABI.abi,
        functionName: "applyToBrief",
        args: [briefId, message],
        dataSuffix: dataSuffix,
      });
    } catch (error) {
      console.error("Error applying to brief:", error);
      throw error;
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
    applicationIndex: number,
    dataSuffix?: `0x${string}`
  ) => {
    console.log('DIVVI: Selecting influencer with dataSuffix:', dataSuffix);

    if (!address) return;

    try {
      const result = await tx.writeContract({
        address: CONTRACT_ADDRESS,
        abi: ABI.abi,
        functionName: "selectInfluencer",
        args: [briefId, applicationIndex],
        dataSuffix: dataSuffix,
      });
      console.log('DIVVI: Select influencer transaction submitted:', result);
      return result;
    } catch (error) {
      console.error("Error selecting influencer:", error);
      throw error;
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

  const completeCampaign = async (briefId: Bytes32, dataSuffix?: `0x${string}`) => {
    console.log('DIVVI: Completing campaign with dataSuffix:', dataSuffix);

    if (!address) {
      toast.error("Please connect your wallet");
      return;
    }

    try {
      const result = await tx.writeContract({
        address: CONTRACT_ADDRESS,
        abi: ABI.abi,
        functionName: "completeCampaign",
        args: [briefId],
        dataSuffix: dataSuffix,
      });
      console.log('DIVVI: Complete campaign transaction submitted:', result);
      return result;
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

  const cancelBrief = async (briefId: Bytes32, dataSuffix?: `0x${string}`) => {
    console.log('DIVVI: Cancelling brief with dataSuffix:', dataSuffix);

    if (!address) {
      toast.error("Please connect your wallet");
      return;
    }

    if (!isCorrectChain) {
      const switched = await ensureNetwork();
      if (!switched) return;
    }

    try {
      const result = await writeContract({
        address: CONTRACT_ADDRESS,
        abi: ABI.abi,
        functionName: "cancelAdBrief",
        args: [briefId],
        dataSuffix: dataSuffix,
      });
      console.log('DIVVI: Cancel brief transaction submitted:', result);
      return result;
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

  const submitProof = async (briefId: string, proofLink: string, dataSuffix?: `0x${string}`) => {
    console.log('DIVVI: Submitting proof with dataSuffix:', dataSuffix);

    if (!address) {
      toast.error("Please connect your wallet");
      return { success: false, status: "error" };
    }

    try {
      const result = await writeContract({
        address: CONTRACT_ADDRESS,
        abi: ABI.abi,
        functionName: "submitProof",
        args: [briefId, proofLink],
        dataSuffix: dataSuffix,
      });
      
      console.log('DIVVI: Submit proof transaction submitted:', result);

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

  const claimPayments = async (dataSuffix?: `0x${string}`) => {
    console.log('DIVVI: Claiming payments with dataSuffix:', dataSuffix);

    // Early return with more descriptive error
    if (!address) {
      const error = new Error('Wallet not connected');
      console.error(' Cannot claim payments: Wallet not connected');
      throw error;
    }

    try {
      const result = await tx.writeContract({
        address: CONTRACT_ADDRESS,
        abi: ABI.abi,
        functionName: "claimPayments",
        args: [],
        dataSuffix: dataSuffix,
      });

      console.log('DIVVI: Payment claim transaction submitted:', result);
      return result;
    } catch (error) {
      console.error(" Error claiming payments:", error);
      
      // Enhanced error handling with more context
      if (error instanceof Error) {
        throw new Error(`Failed to claim payments: ${error.message}`);
      }
      throw error;
    }
  };

  return { 
    claimPayments, 
    ...tx,
    // Expose useful state for UI
    isConnected: !!address,
    address
  };
}

export function useGetDisputeTimestamp(
  briefId: `0x${string}`,
  influencer: `0x${string}`
) {
  const { data, error, isLoading, refetch } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ABI.abi,
    functionName: "disputeTimestamp",
    args: [briefId, influencer],
    query: {
      enabled: !!briefId && !!influencer,
    },
  });

  return {
    disputeTimestamp: data ? Number(data) : 0,
    isLoadingTimestamp: isLoading,
    timestampError: error,
    refetchTimestamp: refetch,
  };
}

// Enhanced campaign status computation for fund release logic
export function canReleaseFundsBasedOnContract(brief: Brief): {
  canRelease: boolean;
  reason?: string;
  timeRemaining?: number;
} {
  const currentTime = Math.floor(Date.now() / 1000);

  // From smart contract: require(brief.status == CampaignStatus.ASSIGNED, "Brief not in assigned status");
  if (brief.status !== CampaignStatus.ASSIGNED) {
    return {
      canRelease: false,
      reason: "Campaign must be in assigned status",
    };
  }

  // From smart contract: require(block.timestamp >= brief.proofSubmissionDeadline, "Proof submission period still active");
  if (currentTime < brief.proofSubmissionDeadline) {
    return {
      canRelease: false,
      reason: "Proof submission period still active",
      timeRemaining: brief.proofSubmissionDeadline - currentTime,
    };
  }

  return { canRelease: true };
}

// Helper function to determine if dispute can be raised
export function canRaiseDisputeBasedOnContract(
  application: Application,
  brief: Brief
): {
  canRaise: boolean;
  reason?: string;
} {
  const currentTime = Math.floor(Date.now() / 1000);

  // Must be selected influencer
  if (!application.isSelected) {
    return {
      canRaise: false,
      reason: "Influencer not selected for this campaign",
    };
  }

  // Must have submitted proof
  if (!application.proofLink || application.proofLink.trim() === "") {
    return {
      canRaise: false,
      reason: "No proof submitted yet",
    };
  }

  // Cannot dispute if already flagged or resolved
  if (application.disputeStatus !== DisputeStatus.NONE) {
    return {
      canRaise: false,
      reason: "Dispute already raised or resolved",
    };
  }

  // Cannot dispute if already approved
  if (application.isApproved) {
    return {
      canRaise: false,
      reason: "Submission already approved",
    };
  }

  // Must be in assigned status (campaign active)
  if (brief.status !== CampaignStatus.ASSIGNED) {
    return {
      canRaise: false,
      reason: "Campaign not in active status",
    };
  }

  return { canRaise: true };
}

// Enhanced error handling for smart contract interactions
export function parseSmartContractError(error: any): string {
  if (!error) return "Unknown error occurred";

  if (typeof error === "string") return error;

  if (error.message) {
    // Common smart contract error patterns
    const message = error.message.toLowerCase();

    if (message.includes("user rejected")) {
      return "Transaction was rejected by user";
    }

    if (message.includes("insufficient funds")) {
      return "Insufficient funds for gas fees";
    }

    if (message.includes("already applied")) {
      return "You have already applied to this campaign";
    }

    if (message.includes("not registered")) {
      return "You must register as an influencer first";
    }

    if (message.includes("max influencers already selected")) {
      return "All influencer spots are filled";
    }

    if (message.includes("brief not in open status")) {
      return "Campaign is no longer accepting applications";
    }

    if (message.includes("application period has ended")) {
      return "Application deadline has passed";
    }

    if (message.includes("proof submission period has ended")) {
      return "Proof submission deadline has passed";
    }

    if (message.includes("verification deadline not yet passed")) {
      return "Cannot complete campaign yet - verification period still active";
    }

    if (message.includes("already flagged")) {
      return "This submission has already been disputed";
    }

    if (message.includes("not authorized dispute resolver")) {
      return "You are not authorized to resolve disputes";
    }

    if (message.includes("dispute resolution deadline passed")) {
      return "Dispute resolution deadline has expired";
    }

    // Try to extract revert reason
    const revertReasonMatch = message.match(
      /reverted with reason string '([^']+)'/
    );
    if (revertReasonMatch) {
      return revertReasonMatch[1];
    }

    const executionRevertedMatch = message.match(/execution reverted: (.+)/);
    if (executionRevertedMatch) {
      return executionRevertedMatch[1];
    }

    return error.message;
  }

  return "Transaction failed - please try again";
}

export function useHasPendingDisputes(briefId: `0x${string}`) {
  const { data, error, isLoading, refetch } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ABI.abi,
    functionName: "hasPendingDisputes",
    args: [briefId],
    query: {
      enabled: !!briefId,
    },
  });

  return {
    hasPendingDisputes: data as boolean | undefined,
    isLoadingPendingCheck: isLoading,
    pendingCheckError: error,
    refetchPendingCheck: refetch,
  };
}

// Hook to get pending dispute count
export function usePendingDisputeCount(briefId: `0x${string}`) {
  const { data, error, isLoading, refetch } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ABI.abi,
    functionName: "getPendingDisputeCount",
    args: [briefId],
    query: {
      enabled: !!briefId,
    },
  });

  return {
    pendingDisputeCount: data ? Number(data) : 0,
    isLoadingCount: isLoading,
    countError: error,
    refetchCount: refetch,
  };
}

// Hook to expire a dispute
export function useExpireDispute() {
  const tx = useHandleTransaction();
  const { address } = useAccount();

  const expireDispute = async (
    briefId: `0x${string}`,
    influencer: `0x${string}`
  ) => {
    if (!address) return;

    try {
      await tx.writeContract({
        address: CONTRACT_ADDRESS,
        abi: ABI.abi,
        functionName: "expireDispute",
        args: [briefId, influencer],
      });
    } catch (error) {
      console.error("Error expiring dispute:", error);
    }
  };

  return {
    expireDispute,
    ...tx,
  };
}

export function useTriggerAutoApproval() {
  const tx = useHandleTransaction();
  const { address } = useAccount();

  const triggerAutoApproval = async (briefId: `0x${string}`, dataSuffix?: `0x${string}`) => {
    console.log('DIVVI: Triggering auto-approval with dataSuffix:', dataSuffix);

    if (!address) {
      toast.error("Please connect your wallet");
      return;
    }

    try {
      const result = await tx.writeContract({
        address: CONTRACT_ADDRESS,
        abi: ABI.abi,
        functionName: "triggerAutoApproval",
        args: [briefId],
        dataSuffix: dataSuffix,
      });
      console.log('DIVVI: Auto-approval transaction submitted:', result);
      return result;
    } catch (error) {
      console.error("Error triggering auto-approval:", error);
      if (error instanceof Error) {
        if (error.message.includes("Verification deadline not yet passed")) {
          toast.error(
            "Auto-approval not yet available - verification period still active"
          );
        } else if (error.message.includes("Brief not in assigned status")) {
          toast.error(
            "Campaign is not in the correct status for auto-approval"
          );
        } else {
          toast.error("Failed to trigger auto-approval. Please try again.");
        }
      }
      throw error;
    }
  };

  return {
    triggerAutoApproval,
    ...tx,
  };
}

export function useVerifySelfProof() {
  const tx = useHandleTransaction();
  const { address } = useAccount();

  const verifySelfProof = async (proof: any, publicSignals: string[], dataSuffix?: `0x${string}`) => {
    console.log('DIVVI: Verifying Self proof with dataSuffix:', dataSuffix);

    if (!address) {
      toast.error("Please connect your wallet");
      throw new Error("Wallet not connected");
    }

    // Validate public signals length
    if (publicSignals.length !== CIRCUIT_CONSTANTS.REQUIRED_PUBLIC_SIGNALS) {
      toast.error(`Invalid proof format. Expected ${CIRCUIT_CONSTANTS.REQUIRED_PUBLIC_SIGNALS} signals, got ${publicSignals.length}`);
      throw new Error("Invalid public signals length");
    }

    try {
      // Format proof for contract (matching Self protocol format)
      const formattedProof = {
        a: proof.a,
        b: [
          [proof.b[0][1], proof.b[0][0]],
          [proof.b[1][1], proof.b[1][0]],
        ],
        c: proof.c,
        pubSignals: publicSignals,
      };

      console.log("Submitting Self proof verification...");
      console.log("Nullifier:", publicSignals[CIRCUIT_CONSTANTS.NULLIFIER_INDEX]);
      console.log("User address from proof:", `0x${BigInt(publicSignals[CIRCUIT_CONSTANTS.USER_IDENTIFIER_INDEX]).toString(16).padStart(40, '0')}`);

      const result = await tx.writeContract({
        address: CONTRACT_ADDRESS,
        abi: ABI.abi,
        functionName: "verifySelfProof", 
        args: [formattedProof],
        dataSuffix: dataSuffix,
      });

      console.log('DIVVI: Self proof verification transaction submitted:', result);
      return result;
    } catch (error) {
      console.error("Error verifying Self proof:", error);
      
      // Enhanced error handling
      if (error instanceof Error) {
        if (error.message.includes("RegisteredNullifier")) {
          toast.error("This identity proof has already been used");
        } else if (error.message.includes("InvalidScope")) {
          toast.error("Invalid verification scope - please refresh and try again");
        } else if (error.message.includes("User rejected")) {
          toast.error("Transaction was cancelled");
        } else if (error.message.includes("insufficient funds")) {
          toast.error("Insufficient funds for gas fees");
        } else {
          toast.error("Identity verification failed. Please try again.");
        }
      }
      throw error;
    }
  };

  return {
    verifySelfProof,
    isPending: tx.isPending,
    isSuccess: tx.isSuccess,
    isError: tx.isError,
    error: tx.error,
    hash: tx.hash,
  };
}