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
import { MENTO_TOKENS, SupportedCurrency } from "../lib/mento-simple";
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

// Helper function to get currency symbol from token address
function getCurrencyFromTokenAddress(tokenAddress: string): string {
  console.log(`🔍 Looking up currency for token address: ${tokenAddress}`);
  console.log('📋 Available tokens:', MENTO_TOKENS);
  
  // Log each token address for comparison
  Object.entries(MENTO_TOKENS).forEach(([key, token]) => {
    console.log(`  ${key}: ${token.address} (${token.address.toLowerCase()})`);
  });
  
  const currency = Object.entries(MENTO_TOKENS).find(([_, token]) => 
    token.address.toLowerCase() === tokenAddress.toLowerCase()
  );
  
  console.log(`💰 Found currency mapping:`, currency);
  const result = currency ? currency[0] : 'cUSD';
  console.log(`✅ Final currency result: ${result}`);
  return result;
}

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
  rawData: any,
  applicationCount: number = 0,
  currency?: string
): Brief | null {
  try {
    if (!rawData || typeof rawData !== 'object') {
      console.error("Invalid brief data format:", rawData);
      return null;
    }

    // Extract data from struct format
    const brief: Brief = {
      id: briefId,
      business: rawData.business as `0x${string}`,
      name: rawData.name as string,
      description: rawData.description as string,
      requirements: rawData.requirements as string,
      budget: Number(formatEther(rawData.budget as bigint)),
      currency: currency || 'cUSD', // Default to cUSD if currency info unavailable
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
      applicationCount,
      selectionGracePeriod: Number(rawData.selectionGracePeriod),

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
                functionName: "getAdBrief",
                args: [id],
              });

              // Fetch applications to get count
              const applicationsData = await publicClient.readContract({
                address: CONTRACT_ADDRESS,
                abi: ABI.abi,
                functionName: "getBriefApplications",
                args: [id],
              });
              
              const applicationCount = applicationsData ? (applicationsData as any).influencers.length : 0;

              // Fetch campaign token info for currency
              let currency = 'cUSD'; // Default
              try {
                console.log(`🔎 Fetching token info for campaign ${id}`);
                const tokenInfo = await publicClient.readContract({
                  address: CONTRACT_ADDRESS,
                  abi: ABI.abi,
                  functionName: "getCampaignTokenInfo",
                  args: [id],
                });
                console.log(`📄 Campaign ${id} token info raw response:`, tokenInfo);
                console.log(`📄 Token info type:`, typeof tokenInfo);
                console.log(`📄 Token info structure:`, JSON.stringify(tokenInfo, null, 2));
                
                if (tokenInfo && (tokenInfo as any).tokenAddress && (tokenInfo as any).tokenAddress !== '0x0000000000000000000000000000000000000000') {
                  const tokenAddress = (tokenInfo as any).tokenAddress;
                  console.log(`🎯 Campaign ${id} has token address: ${tokenAddress}`);
                  currency = getCurrencyFromTokenAddress(tokenAddress);
                  console.log(`🎯 Campaign ${id} mapped to currency: ${currency} from token: ${tokenAddress}`);
                } else {
                  console.log(`⚠️ Campaign ${id} has no valid token address set (got: ${(tokenInfo as any)?.tokenAddress}), using default cUSD`);
                }
              } catch (err) {
                console.error(`❌ Error fetching token info for campaign ${id}:`, err);
                console.log(`❌ Campaign ${id} token info call failed, defaulting to cUSD`);
              }

              if (briefData) {
                return formatBriefData(id, briefData, Number(applicationCount), currency);
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
    refetch: () => {
      if (briefIds && !isLoadingIds) {
        fetchAllBriefDetails(briefIds as `0x${string}`[]);
      }
    },
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
    refetch: refetchBriefIds,
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
                functionName: "getAdBrief",
                args: [id],
              });

              // Also fetch applications to get count
              const applicationsData = await publicClient.readContract({
                address: CONTRACT_ADDRESS,
                abi: ABI.abi,
                functionName: "getBriefApplications",
                args: [id],
              });
              
              const applicationCount = applicationsData ? (applicationsData as any).influencers.length : 0;

              // Fetch campaign token info for currency
              let currency = 'cUSD'; // Default
              try {
                const tokenInfo = await publicClient.readContract({
                  address: CONTRACT_ADDRESS,
                  abi: ABI.abi,
                  functionName: "getCampaignTokenInfo",
                  args: [id],
                });
                console.log(`Campaign ${id} token info:`, tokenInfo);
                if (tokenInfo && (tokenInfo as any).tokenAddress && (tokenInfo as any).tokenAddress !== '0x0000000000000000000000000000000000000000') {
                  const tokenAddress = (tokenInfo as any).tokenAddress;
                  currency = getCurrencyFromTokenAddress(tokenAddress);
                  console.log(`Campaign ${id} mapped to currency: ${currency} from token: ${tokenAddress}`);
                } else {
                  console.log(`Campaign ${id} has no token address set, using default cUSD`);
                }
              } catch (err) {
                console.error(`Error fetching token info for campaign ${id}:`, err);
                console.log(`Campaign ${id} token info call failed, defaulting to cUSD`);
              }

              if (result) {
                return formatBriefData(id, result, Number(applicationCount), currency);
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

  const refetch = useCallback(async () => {
    // First refetch the brief IDs
    await refetchBriefIds();
    // The useEffect will automatically refetch the details when briefIds changes
  }, [refetchBriefIds]);

  return {
    briefs,
    isLoading: isLoading || isLoadingIds,
    isError: isErrorIds || !!error,
    error: idError || error,
    refetch,
  };
}

// Get user profile with fallback to legacy contract
export function useUserProfile(userAddress?: Address) {
  const { address } = useAccount();
  const targetAddress = userAddress || address;

  // Query multi-currency contract first
  const { 
    data: newData, 
    error: newError, 
    isLoading: newLoading, 
    refetch: refetchNew 
  } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ABI.abi,
    functionName: "getUsers",
    args: [targetAddress],
    query: {
      enabled: !!targetAddress,
    },
  });

  // Removed legacy contract query - using only diamond contract

  // Use only diamond contract data
  const data = newData;
  const error = newError;
  const isLoading = newLoading;
  
  const refetch = async () => {
    await refetchNew();
  };

  // Debug the contract call
  useEffect(() => {
    console.log('useUserProfile debug:', {
      targetAddress,
      contract: CONTRACT_ADDRESS,
      data: data && (data as any)?.isRegistered ? 'registered' : 'not registered',
      error: error?.message,
      isLoading,
      enabled: !!targetAddress
    });
  }, [targetAddress, data, error, isLoading]);

  const userProfile = useMemo(() => {
    if (!data) return null;

    // Debug logging
    console.log('Raw getUsers data:', data);
    console.log('Data type:', typeof data);
    console.log('Data as array:', Array.isArray(data));

    // The contract returns a struct object, not a tuple array
    const structData = data as {
      isRegistered: boolean;
      isBusiness: boolean;
      isInfluencer: boolean;
      status: number;
      username: string;
      profileData: string;
      completedCampaigns: bigint;
      totalEscrowed: bigint;
    };

    const profile = {
      isRegistered: structData.isRegistered,
      isBusiness: structData.isBusiness,
      isInfluencer: structData.isInfluencer,
      status: structData.status,
      username: structData.username,
      profileData: structData.profileData,
      completedCampaigns: Number(structData.completedCampaigns),
      totalEscrowed: Number(structData.totalEscrowed),
    };

    console.log('Parsed userProfile:', profile);
    return profile;
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
  const { address, chain } = useAccount();

  const register = async (
    isBusiness: boolean,
    isInfluencer: boolean,
    username: string,
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
        args: [isBusiness, isInfluencer, username, profileData],
        dataSuffix: dataSuffix,
        account: address,
        chain,
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

// Get username by address with fallback to legacy contract
export function useGetUsername(userAddress?: Address) {
  const { address } = useAccount();
  const targetAddress = userAddress || address;

  // Query multi-currency contract first
  const { 
    data: newUsername, 
    error: newError, 
    isLoading: newLoading,
    refetch: refetchNew 
  } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ABI.abi,
    functionName: "getUserUsername",
    args: [targetAddress],
    query: {
      enabled: !!targetAddress,
    },
  });

  // Removed legacy contract query - using only diamond contract
  
  // Use only diamond contract username
  const username = newUsername as string | undefined;

  const isLoading = newLoading;
  const error = newError;

  const refetch = async () => {
    await refetchNew();
  };

  return {
    username,
    isLoadingUsername: isLoading,
    usernameError: error,
    refetchUsername: refetch,
  };
}

// Get address by username
export function useGetUserByUsername(username?: string) {
  const { data, error, isLoading, refetch } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ABI.abi,
    functionName: "getUserByUsername",
    args: [username],
    query: {
      enabled: !!username,
    },
  });

  return {
    userAddress: data as Address | undefined,
    isLoadingUser: isLoading,
    userError: error,
    refetchUser: refetch,
  };
}

// Check if username is available
export function useIsUsernameAvailable(username?: string) {
  const { data, error, isLoading, refetch } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ABI.abi,
    functionName: "isUsernameAvailable",
    args: [username],
    query: {
      enabled: !!username && username.length >= 3,
      retry: 2,
      retryDelay: 1000,
      staleTime: 30000, // 30 seconds
    },
  });

  // Debug logging
  useEffect(() => {
    if (username && username.length >= 3) {
      console.log('Username availability check:', {
        username,
        isLoading,
        data,
        error: error?.message,
        contractAddress: CONTRACT_ADDRESS
      });
    }
  }, [username, isLoading, data, error]);

  return {
    isAvailable: data as boolean | undefined,
    isLoadingAvailability: isLoading,
    availabilityError: error,
    refetchAvailability: refetch,
  };
}

// Get influencer profile (using getInfluencerProfile function)
export function useGetInfluencerProfile(influencerAddress?: Address) {
  const { address } = useAccount();
  const targetAddress = influencerAddress || address;

  const { data, error, isLoading, refetch } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ABI.abi,
    functionName: "getInfluencerProfile",
    args: [targetAddress],
    query: {
      enabled: !!targetAddress,
    },
  });

  return {
    data: data as string | undefined,
    isLoading: isLoading,
    error: error,
    refetch: refetch,
  };
}

// Update influencer profile
export function useUpdateInfluencerProfile() {
  const tx = useHandleTransaction();
  const { address, chain } = useAccount();

  const updateProfile = async (profileData: string) => {
    if (!address) {
      throw new Error("Wallet not connected");
    }

    try {
      tx.writeContract({
        address: CONTRACT_ADDRESS,
        abi: ABI.abi,
        functionName: "updateInfluencerProfile",
        args: [profileData],
        account: address,
        chain,
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      throw error;
    }
  };

  return {
    updateProfile,
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
  const { address, chain } = useAccount();
  const [isApproving, setIsApproving] = useState(false);
  const [briefData, setBriefData] = useState<{
    name: string;
    description: string;
    requirements: string;
    budget: string;
    promotionDuration: number;
    maxInfluencers: number;
    targetAudience: number;
    applicationPeriod: number;
    proofSubmissionGracePeriod: number;
    verificationPeriod: number;
    selectionGracePeriod: number;
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
            BigInt(briefData.applicationPeriod),
            BigInt(briefData.proofSubmissionGracePeriod),
            BigInt(briefData.verificationPeriod),
            BigInt(briefData.selectionGracePeriod),
          ],
          dataSuffix: briefData.dataSuffix,
          account: address,
          chain,
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
    applicationPeriod: number,
    proofSubmissionGracePeriod: number,
    verificationPeriod: number,
    selectionGracePeriod: number,
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
        applicationPeriod,
        proofSubmissionGracePeriod,
        verificationPeriod,
        selectionGracePeriod,
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
        account: address,
        chain,
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
  const { address, chain } = useAccount();

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
        account: address,
        chain,
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
  const { address, chain } = useAccount();

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
        account: address,
        chain,
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
  const { address, chain } = useAccount();

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
        account: address,
        chain,
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
  const { address, chain } = useAccount();
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
        account: address,
        chain,
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
  const { address, chain } = useAccount();

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
        account: address,
        chain,
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
  const { address, chain } = useAccount();

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
        account: address,
        chain,
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
  const { address, chain } = useAccount();

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
        account: address,
        chain,
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
  const { address, chain } = useAccount();

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
        account: address,
        chain,
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
  const { address, chain } = useAccount();

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
        account: address,
        chain,
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

export function useExpireCampaign() {
  const tx = useHandleTransaction();
  const { address, chain } = useAccount();
  const { isCorrectChain, ensureNetwork } = useEnsureNetwork();

  const expireCampaign = async (briefId: Bytes32, dataSuffix?: `0x${string}`) => {
    console.log('DIVVI: Expiring campaign with dataSuffix:', dataSuffix);

    if (!address) {
      toast.error("Please connect your wallet");
      return;
    }

    if (!isCorrectChain) {
      const switched = await ensureNetwork();
      if (!switched) return;
    }

    try {
      const result = await tx.writeContract({
        address: CONTRACT_ADDRESS,
        abi: ABI.abi,
        functionName: "expireCampaign",
        args: [briefId],
        dataSuffix: dataSuffix,
        account: address,
        chain,
      });
      console.log('DIVVI: Expire campaign transaction submitted:', result);
      return result;
    } catch (error) {
      console.error("Error expiring campaign:", error);
      
      // Enhanced error handling
      if (error instanceof Error) {
        if (error.message.includes("Grace period still active")) {
          toast.error("Campaign cannot be expired yet - grace period still active");
        } else if (error.message.includes("Campaign is not open")) {
          toast.error("Campaign is no longer in open status");
        } else if (error.message.includes("User rejected")) {
          toast.error("Transaction was cancelled");
        } else if (error.message.includes("insufficient funds")) {
          toast.error("Insufficient funds for gas fees");
        } else {
          toast.error("Failed to expire campaign. Please try again.");
        }
      }
      throw error;
    }
  };

  return {
    expireCampaign,
    isPending: tx.isPending,
    isSuccess: tx.isSuccess,
    isError: tx.isError,
    error: tx.error,
    hash: tx.hash,
  };
}

// Start campaign with partial selection
export function useStartCampaignWithPartialSelection() {
  const tx = useHandleTransaction();
  const { address, chain } = useAccount();

  const startCampaignWithPartialSelection = async (
    briefId: string,
    dataSuffix?: `0x${string}`
  ) => {
    if (!address) return;

    try {
      tx.writeContract({
        address: CONTRACT_ADDRESS,
        abi: ABI.abi,
        functionName: "startCampaignWithPartialSelection",
        args: [briefId],
        dataSuffix: dataSuffix,
        account: address,
        chain,
      });
    } catch (error) {
      console.error("Error starting campaign with partial selection:", error);
      throw error;
    }
  };

  return {
    startCampaignWithPartialSelection,
    ...tx,
  };
}

// Cancel campaign with compensation
export function useCancelCampaignWithCompensation() {
  const tx = useHandleTransaction();
  const { address, chain } = useAccount();

  const cancelCampaignWithCompensation = async (
    briefId: string,
    compensationPerInfluencer: string,
    dataSuffix?: `0x${string}`
  ) => {
    if (!address) return;

    try {
      tx.writeContract({
        address: CONTRACT_ADDRESS,
        abi: ABI.abi,
        functionName: "cancelCampaignWithCompensation",
        args: [briefId, parseUnits(compensationPerInfluencer, 18)],
        dataSuffix: dataSuffix,
        account: address,
        chain,
      });
    } catch (error) {
      console.error("Error cancelling campaign with compensation:", error);
      throw error;
    }
  };

  return {
    cancelCampaignWithCompensation,
    ...tx,
  };
}