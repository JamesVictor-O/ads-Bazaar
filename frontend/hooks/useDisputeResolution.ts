import React, { useState } from "react";
import {
  useWriteContract,
  useWaitForTransactionReceipt,
  useReadContract,
} from "wagmi";
import { useAccount } from "wagmi";
import { Hex } from "viem";
import { CONTRACT_ADDRESS } from "../lib/contracts";
import ABI from "../lib/AdsBazaar.json";
import { toast } from "react-hot-toast";

// Hook for flagging submissions
export function useFlagSubmission() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { address } = useAccount();
  const [isSuccess, setIsSuccess] = useState(false);

  const { isLoading: isConfirming, isSuccess: txSuccess } =
    useWaitForTransactionReceipt({
      hash,
    });

  // Update success state when transaction is confirmed
  React.useEffect(() => {
    if (txSuccess) {
      setIsSuccess(true);
      setTimeout(() => setIsSuccess(false), 3000); // Reset after 3 seconds
    }
  }, [txSuccess]);

  const flagSubmission = async (
    briefId: Hex,
    influencer: Hex,
    reason: string
  ) => {
    if (!address) {
      toast.error("Please connect your wallet");
      return;
    }

    try {
      await writeContract({
        address: CONTRACT_ADDRESS,
        abi: ABI.abi,
        functionName: "flagSubmission",
        args: [briefId, influencer, reason],
      });
    } catch (error) {
      console.error("Error flagging submission:", error);
      throw error;
    }
  };

  return {
    flagSubmission,
    isFlagging: isPending || isConfirming,
    flagSuccess: isSuccess,
    flagError: error,
    hash,
  };
}

// Hook for resolving disputes
export function useResolveDispute() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { address } = useAccount();
  const [isSuccess, setIsSuccess] = useState(false);

  const { isLoading: isConfirming, isSuccess: txSuccess } =
    useWaitForTransactionReceipt({
      hash,
    });

  React.useEffect(() => {
    if (txSuccess) {
      setIsSuccess(true);
      setTimeout(() => setIsSuccess(false), 3000);
    }
  }, [txSuccess]);

  const resolveDispute = async (
    briefId: Hex,
    influencer: Hex,
    isValid: boolean
  ) => {
    if (!address) {
      toast.error("Please connect your wallet");
      return;
    }

    try {
      await writeContract({
        address: CONTRACT_ADDRESS,
        abi: ABI.abi,
        functionName: "resolveDispute",
        args: [briefId, influencer, isValid],
      });
    } catch (error) {
      console.error("Error resolving dispute:", error);
      throw error;
    }
  };

  return {
    resolveDispute,
    isResolving: isPending || isConfirming,
    resolveSuccess: isSuccess,
    resolveError: error,
    hash,
  };
}

// Hook for getting dispute details
export function useGetDisputeDetails(briefId: Hex, influencer: Hex) {
  const { data, error, isLoading, refetch } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ABI.abi,
    functionName: "getApplicationDispute",
    args: [briefId, influencer],
    query: {
      enabled: !!briefId && !!influencer,
    },
  });

  return {
    disputeDetails: data as [number, string, string] | undefined, // [disputeStatus, disputeReason, resolvedBy]
    isLoadingDispute: isLoading,
    disputeError: error,
    refetchDispute: refetch,
  };
}

// Hook for checking if user is a dispute resolver
export function useIsDisputeResolver(address?: Hex) {
  const { address: connectedAddress } = useAccount();
  const targetAddress = address || connectedAddress;

  const { data, error, isLoading } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ABI.abi,
    functionName: "disputeResolvers",
    args: [targetAddress],
    query: {
      enabled: !!targetAddress,
    },
  });

  return {
    isDisputeResolver: data as boolean | undefined,
    isLoadingResolver: isLoading,
    resolverError: error,
  };
}
