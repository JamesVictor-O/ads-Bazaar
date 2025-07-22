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
  useMultiCurrencyPayments, 
  useMultiCurrencyPendingPayments
} from '@/hooks/useMultiCurrencyAdsBazaar';
import { MENTO_TOKENS, SupportedCurrency, formatCurrencyAmount } from '@/lib/mento-simple';

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
  const { isConnected } = useAccount();
  const { isCorrectChain, currentNetwork } = useEnsureNetwork();
  const [transactionPhase, setTransactionPhase] = useState<
    "idle" | "claiming" | "success" | "error"
  >("idle");


  // Multi-currency payment hooks
  const { 
    claimPaymentsInToken, 
    claimAllPendingPayments, 
    isClaiming: isClaimingMulti 
  } = useMultiCurrencyPayments();
  
  const { 
    pendingPayments: multiCurrencyPayments, 
    isLoading: isLoadingMultiCurrency, 
    refetch: refetchMultiCurrency 
  } = useMultiCurrencyPendingPayments();

  // State for currency selection
  const [selectedCurrency, setSelectedCurrency] = useState<SupportedCurrency | 'all'>('all');

  // Track transaction phases
  useEffect(() => {
    if (isClaimingMulti && transactionPhase !== "claiming") {
      setTransactionPhase("claiming");
    } else if (!isClaimingMulti && transactionPhase === "claiming") {
      setTransactionPhase("idle");
    }
  }, [isClaimingMulti, transactionPhase]);


  

  // Multi-currency claim function
  const handleClaimPayments = async () => {
    if (!guardedAction) {
      toast.error("Network guard not available. Please refresh and try again.");
      return;
    }

    // Check if we have any payments to claim
    const hasMultiCurrencyPayments = multiCurrencyPayments && multiCurrencyPayments.tokens.length > 0;

    if (!hasMultiCurrencyPayments) {
      toast.error("No pending payments to claim");
      return;
    }

    setTransactionPhase("idle");

    await guardedAction(async () => {
      try {
        if (selectedCurrency === 'all') {
          await claimAllPendingPayments();
          toast.success('All pending payments claimed successfully!');
        } else {
          await claimPaymentsInToken(selectedCurrency as SupportedCurrency);
          const currencyInfo = MENTO_TOKENS[selectedCurrency as SupportedCurrency];
          toast.success(`Payments claimed in ${currencyInfo.symbol}!`);
        }
        
        setTransactionPhase("success");
        if (onSuccess) onSuccess();
        
        // Refresh data and auto-close
        setTimeout(() => {
          refetchMultiCurrency();
          onClose();
          setTransactionPhase("idle");
        }, 2000);
      } catch (err) {
        console.error("Claim failed:", err);
        setTransactionPhase("error");
        toast.error("Failed to claim payments. Please try again.");
        setTimeout(() => setTransactionPhase("idle"), 3000);
      }
    });
  };


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
    isClaimingMulti || transactionPhase === "claiming";
  
  const hasMultiCurrencyPayments = multiCurrencyPayments && multiCurrencyPayments.tokens.length > 0;
  
  const canClaim =
    isConnected &&
    isCorrectChain &&
    hasMultiCurrencyPayments &&
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

            {/* Currency Selection */}
            {multiCurrencyPayments && (
              <div className="bg-slate-900/30 border border-slate-700/50 rounded-xl p-4">
                <h4 className="text-sm font-medium text-slate-300 mb-3">Currency Selection</h4>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setSelectedCurrency('all')}
                    className={`px-3 py-2 text-xs rounded-lg transition-all ${
                      selectedCurrency === 'all'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-slate-800/50 text-slate-400 border border-slate-600/30 hover:bg-slate-700/50'
                    }`}
                  >
                    All Currencies
                  </button>
                  {multiCurrencyPayments.tokens.map((token) => {
                    const tokenInfo = MENTO_TOKENS[token as SupportedCurrency];
                    return (
                      <button
                        key={token}
                        onClick={() => setSelectedCurrency(token as SupportedCurrency)}
                        className={`px-3 py-2 text-xs rounded-lg transition-all ${
                          selectedCurrency === token
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-slate-800/50 text-slate-400 border border-slate-600/30 hover:bg-slate-700/50'
                        }`}
                      >
                        {tokenInfo?.symbol || token}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Multi-Currency Summary */}
            {multiCurrencyPayments && (
              <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-5">
                <div className="text-center mb-4">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Award className="w-5 h-5 text-emerald-400" />
                    <span className="text-sm font-medium text-slate-300 uppercase tracking-wide">
                      Multi-Currency Claimable
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  {multiCurrencyPayments.tokens.map((token, index) => {
                    const tokenInfo = MENTO_TOKENS[token as SupportedCurrency];
                    const amount = multiCurrencyPayments.amounts[index];
                    return (
                      <div key={token} className="flex justify-between items-center">
                        <span className="text-sm text-slate-300">{tokenInfo?.symbol || token}:</span>
                        <span className="text-lg font-bold text-emerald-400">
                          {formatCurrencyAmount(amount.toString(), token as SupportedCurrency)}
                        </span>
                      </div>
                    );
                  })}
                  <div className="border-t border-slate-700/50 pt-2 mt-2">
                    <p className="text-xs text-slate-400 text-center">
                      From completed campaigns
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Multi-Currency Payment List */}
            {isLoadingMultiCurrency ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                </div>
              ) : multiCurrencyPayments && multiCurrencyPayments.tokens.length > 0 ? (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-slate-300 uppercase tracking-wide">
                    Multi-Currency Payment Breakdown
                  </h3>
                  {selectedCurrency === 'all' ? (
                    // Show all currencies
                    multiCurrencyPayments.tokens.map((token, index) => {
                      const tokenInfo = MENTO_TOKENS[token as SupportedCurrency];
                      const amount = multiCurrencyPayments.amounts[index];
                      return (
                        <div
                          key={token}
                          className="bg-slate-900/30 border border-slate-700/50 rounded-xl p-4"
                        >
                          <div className="flex justify-between items-center mb-3">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-emerald-400" />
                              <span className="text-sm font-medium text-white">
                                {tokenInfo?.name || token} Payments
                              </span>
                            </div>
                            <span className="text-lg font-bold text-emerald-400">
                              {formatCurrencyAmount(amount.toString(), token as SupportedCurrency)}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400">
                            From completed campaigns
                          </p>
                        </div>
                      );
                    })
                  ) : (
                    // Show selected currency only
                    (() => {
                      const tokenIndex = multiCurrencyPayments.tokens.findIndex(t => t === selectedCurrency);
                      if (tokenIndex === -1) return null;
                      const amount = multiCurrencyPayments.amounts[tokenIndex];
                      const tokenInfo = MENTO_TOKENS[selectedCurrency as SupportedCurrency];
                      return (
                        <div className="bg-slate-900/30 border border-slate-700/50 rounded-xl p-4">
                          <div className="flex justify-between items-center mb-3">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-emerald-400" />
                              <span className="text-sm font-medium text-white">
                                {tokenInfo?.name || selectedCurrency} Payments
                              </span>
                            </div>
                            <span className="text-lg font-bold text-emerald-400">
                              {formatCurrencyAmount(amount.toString(), selectedCurrency)}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400">
                            From completed campaigns
                          </p>
                        </div>
                      );
                    })()
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-white font-medium mb-2">
                    No Multi-Currency Payments
                  </p>
                  <p className="text-slate-400 text-sm">
                    Complete multi-currency campaigns and wait for approval to see claimable payments here.
                  </p>
                </div>
              )
            }

            {/* Gas Fee Notice */}
            {multiCurrencyPayments && multiCurrencyPayments.tokens.length > 0 && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-400 mb-1">
                      Transaction Fee Notice
                    </p>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      A small gas fee will be required to claim your payments.
                      {selectedCurrency === 'all' 
                        ? ' All currencies will be claimed in a single transaction.'
                        : ' All approved payments will be claimed in a single transaction.'
                      }
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
              ) : hasMultiCurrencyPayments ? (
                <>
                  <DollarSign className="w-4 h-4" />
                  <span>
                    {selectedCurrency === 'all' 
                      ? 'Claim All Currencies' 
                      : `Claim ${MENTO_TOKENS[selectedCurrency as SupportedCurrency]?.symbol || selectedCurrency}`
                    }
                  </span>
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