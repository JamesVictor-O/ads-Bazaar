"use client";

import { useState, useEffect } from "react";
import {
  X,
  DollarSign,
  CheckCircle,
  Loader2,
  AlertTriangle,
  Clock,
  Award,
} from "lucide-react";
import { motion } from "framer-motion";
import { useAccount } from "wagmi";
import { toast } from "react-hot-toast";
import { withNetworkGuard } from "@/components/WithNetworkGuard";
import { NetworkStatus } from "@/components/NetworkStatus";
import { useEnsureNetwork } from "@/hooks/useEnsureNetwork";
import {
  useClaimPayments,
  usePendingPayments,
  useTotalPendingAmount,
} from "@/hooks/adsBazaar";
import { formatEther } from "viem";
import { useDivviIntegration } from '@/hooks/useDivviIntegration'

interface ClaimPaymentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  guardedAction?: (action: () => Promise<void>) => Promise<void>;
}

function ClaimPaymentsModal({
  isOpen,
  onClose,
  onSuccess,
  guardedAction,
}: ClaimPaymentsModalProps) {
  const { address, isConnected } = useAccount();
  const { isCorrectChain, currentNetwork } = useEnsureNetwork();
  const [transactionPhase, setTransactionPhase] = useState<
    "idle" | "claiming" | "success" | "error"
  >("idle");
  const { trackTransaction } = useDivviIntegration()

  // Fetch pending payments data
  const { pendingPayments, isLoadingPayments, paymentsError, refetchPayments } =
    usePendingPayments(address);

  const { totalPendingAmount, isLoadingTotalAmount } =
    useTotalPendingAmount(address);

  const {
    claimPayments,
    hash,
    isPending: isClaimPending,
    isSuccess: isClaimSuccess,
    isError: isClaimError,
    error: claimError,
  } = useClaimPayments();

  // Track transaction phases
  useEffect(() => {
    if (isClaimPending && transactionPhase !== "claiming") {
      setTransactionPhase("claiming");
    } else if (!isClaimPending && transactionPhase === "claiming") {
      setTransactionPhase("idle");
    }
  }, [isClaimPending, transactionPhase]);

  // Handle success
  useEffect(() => {
    if (isClaimSuccess) {
      setTransactionPhase("success");
      toast.success("Payments claimed successfully!");
      refetchPayments();

      if (onSuccess) {
        onSuccess();
      }

      // Auto-close after success
      setTimeout(() => {
        onClose();
        setTransactionPhase("idle");
      }, 2000);
    }
  }, [isClaimSuccess, onClose, refetchPayments, onSuccess]);

  // Handle errors
  useEffect(() => {
    if (isClaimError && claimError) {
      setTransactionPhase("error");
      let errorMessage = "Failed to claim payments";

      if (typeof claimError === "string") {
        errorMessage = claimError;
      } else if (claimError instanceof Error) {
        errorMessage = claimError.message;
        if (claimError.message.includes("User rejected the request")) {
          errorMessage = "Transaction rejected by user";
        } else if (claimError.message.includes("insufficient funds")) {
          errorMessage = "Insufficient funds for transaction";
        }
      }

      toast.error(errorMessage, { duration: 5000 });

      // Reset phase after showing error
      setTimeout(() => {
        setTransactionPhase("idle");
      }, 3000);
    }
  }, [isClaimError, claimError]);

  

  const handleClaimPayments = async () => {
    if (!guardedAction) {
      toast.error("Network guard not available. Please refresh and try again.");
      return;
    }

    if (!pendingPayments || pendingPayments.length === 0) {
      toast.error("No pending payments to claim");
      return;
    }

    setTransactionPhase("idle");

    await guardedAction(async () => {
      try {
        await claimPayments();
      } catch (err) {
        console.error("Claim failed:", err);
        throw err;
      }
    });
  };

  useEffect(() => {
    if (hash) {
      console.log('DIVVI: Hash available from claim payments:', hash);
      trackTransaction(hash);
    }
  }, [hash, trackTransaction]);

  const getTransactionMessage = () => {
    switch (transactionPhase) {
      case "claiming":
        return {
          title: "Processing Claim",
          description: "Please confirm the transaction in your wallet...",
          icon: <Loader2 className="w-5 h-5 animate-spin text-blue-400" />,
          bgColor: "bg-blue-500/10 border-blue-500/20",
          textColor: "text-blue-400",
        };
      case "success":
        return {
          title: "Payments Claimed!",
          description:
            "Your payments have been successfully transferred to your wallet.",
          icon: <CheckCircle className="w-5 h-5 text-green-400" />,
          bgColor: "bg-green-500/10 border-green-500/20",
          textColor: "text-green-400",
        };
      case "error":
        return {
          title: "Claim Failed",
          description:
            "There was an error claiming your payments. Please try again.",
          icon: <AlertTriangle className="w-5 h-5 text-red-400" />,
          bgColor: "bg-red-500/10 border-red-500/20",
          textColor: "text-red-400",
        };
      default:
        return null;
    }
  };

  const isTransactionInProgress =
    isClaimPending || transactionPhase === "claiming";
  const canClaim =
    isConnected &&
    isCorrectChain &&
    pendingPayments &&
    pendingPayments.length > 0 &&
    !isTransactionInProgress &&
    transactionPhase !== "success";

  if (!isOpen) return null;

  return (
    <motion.div
      className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className="bg-slate-800/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl w-full max-w-md mx-auto max-h-[90vh] overflow-hidden shadow-2xl shadow-emerald-500/10"
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
              <DollarSign className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Claim Payments</h2>
              <p className="text-sm text-slate-400 mt-1">
                Withdraw your earned rewards
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all duration-200"
            disabled={isTransactionInProgress}
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="p-6 space-y-6">
            {/* Network Status */}
            {isConnected && (
              <NetworkStatus className="bg-slate-900/30 border-slate-600/50" />
            )}

            {/* Connection Warning */}
            {!isConnected && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start">
                <AlertTriangle className="text-amber-400 mr-3 mt-0.5 flex-shrink-0 w-5 h-5" />
                <div>
                  <p className="text-sm font-medium text-amber-400">
                    Wallet Not Connected
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Connect your wallet to claim payments
                  </p>
                </div>
              </div>
            )}

            {/* Transaction Status */}
            {transactionPhase !== "idle" && (
              <div className="mb-4">
                {(() => {
                  const txMessage = getTransactionMessage();
                  if (!txMessage) return null;

                  return (
                    <div
                      className={`p-3 rounded-xl border flex items-start ${txMessage.bgColor}`}
                    >
                      <div className="mr-3 mt-0.5 flex-shrink-0">
                        {txMessage.icon}
                      </div>
                      <div>
                        <p
                          className={`text-sm font-medium ${txMessage.textColor}`}
                        >
                          {txMessage.title}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          {txMessage.description}
                        </p>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Total Amount Summary */}
            {!isLoadingTotalAmount && totalPendingAmount !== undefined && (
              <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-5">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Award className="w-5 h-5 text-emerald-400" />
                    <span className="text-sm font-medium text-slate-300 uppercase tracking-wide">
                      Total Claimable
                    </span>
                  </div>
                  <p className="text-3xl font-bold text-white mb-1">
                    {parseFloat(formatEther(totalPendingAmount)).toFixed(4)}{" "}
                    cUSD
                  </p>
                  <p className="text-xs text-slate-400">
                    From {pendingPayments?.length || 0} completed campaign
                    {pendingPayments?.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
            )}

            {/* Pending Payments List */}
            {isLoadingPayments ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
              </div>
            ) : paymentsError ? (
              <div className="text-center py-8">
                <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-3" />
                <p className="text-white font-medium mb-2">
                  Error Loading Payments
                </p>
                <p className="text-slate-400 text-sm">
                  {paymentsError.message}
                </p>
              </div>
            ) : pendingPayments && pendingPayments.length > 0 ? (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-slate-300 uppercase tracking-wide">
                  Payment Breakdown
                </h3>
                {pendingPayments.map((payment, index) => (
                  <div
                    key={index}
                    className="bg-slate-900/30 border border-slate-700/50 rounded-xl p-4"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="w-4 h-4 text-emerald-400" />
                          <span className="text-sm font-medium text-white">
                            Campaign Payment
                          </span>
                          {payment.approved && (
                            <span className="px-2 py-0.5 text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">
                              Approved
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mb-2">
                          Brief ID: {payment.briefId.slice(0, 10)}...
                          {payment.briefId.slice(-6)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-emerald-400">
                          {parseFloat(formatEther(payment.amount)).toFixed(4)}{" "}
                          cUSD
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Clock className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-white font-medium mb-2">
                  No Pending Payments
                </p>
                <p className="text-slate-400 text-sm">
                  Complete campaigns and wait for approval to see claimable
                  payments here.
                </p>
              </div>
            )}

            {/* Gas Fee Notice */}
            {pendingPayments && pendingPayments.length > 0 && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-400 mb-1">
                      Transaction Fee Notice
                    </p>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      A small gas fee will be required to claim your payments.
                      All approved payments will be claimed in a single
                      transaction.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Fixed Action Buttons */}
        <div className="border-t border-slate-700/50 p-6">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isTransactionInProgress}
              className="flex-1 px-4 py-3 text-sm font-medium text-slate-300 bg-slate-700/50 rounded-xl border border-slate-600/50 hover:bg-slate-700 hover:border-slate-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {transactionPhase === "success" ? "Close" : "Cancel"}
            </button>

            <button
              onClick={handleClaimPayments}
              disabled={!canClaim}
              className={`flex-1 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 flex items-center justify-center gap-2 ${
                !canClaim
                  ? "bg-slate-600/50 text-slate-400 cursor-not-allowed border border-slate-600/50"
                  : "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700 shadow-md shadow-emerald-500/25"
              }`}
            >
              {isTransactionInProgress ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Claiming...</span>
                </>
              ) : !isConnected ? (
                <>
                  <AlertTriangle className="w-4 h-4" />
                  <span>Connect Wallet</span>
                </>
              ) : !isCorrectChain ? (
                <>
                  <AlertTriangle className="w-4 h-4" />
                  <span>Switch to {currentNetwork.name}</span>
                </>
              ) : transactionPhase === "success" ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Claimed!</span>
                </>
              ) : pendingPayments && pendingPayments.length > 0 ? (
                <>
                  <DollarSign className="w-4 h-4" />
                  <span>Claim All Payments</span>
                </>
              ) : (
                <>
                  <Clock className="w-4 h-4" />
                  <span>No Payments Available</span>
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default withNetworkGuard(ClaimPaymentsModal);
