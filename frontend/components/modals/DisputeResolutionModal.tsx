"use client";

import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  XCircle,
  CheckCircle,
  ExternalLink,
  Loader2,
  Shield,
  Eye,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { format } from "date-fns";
import { useDivviIntegration } from "@/hooks/useDivviIntegration";

interface Dispute {
  id: string;
  briefId: string;
  influencer: string;
  business: string;
  campaignTitle: string;
  flaggedDate: Date;
  deadline: Date;
  reason: string;
  proofLink: string;
  status: "FLAGGED" | "RESOLVED_VALID" | "RESOLVED_INVALID";
  priority: "HIGH" | "MEDIUM" | "LOW";
  category: string;
  amount: number;
}

interface DisputeResolutionModalProps {
  dispute: Dispute;
  onResolveDispute: (disputeId: string, isValid: boolean, referralTag?: `0x${string}`) => Promise<void>; 
  onClose: () => void;
  getStatusColor: (status: string) => string;
  getPriorityColor: (priority: string) => string;
  canResolve?: boolean; // New prop for access control
  isResolving?: boolean; // New prop for loading state
}

// Transaction phases for better UX
type TransactionPhase = "idle" | "resolving" | "success" | "error";

const DisputeResolutionModal: React.FC<DisputeResolutionModalProps> = ({
  dispute,
  onResolveDispute,
  onClose,
  getStatusColor,
  getPriorityColor,
  canResolve = false,
  isResolving = false,
}) => {
  const [transactionPhase, setTransactionPhase] =
    useState<TransactionPhase>("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const { generateDivviReferralTag, trackTransaction } = useDivviIntegration();

  const isExpired = useMemo(() => {
    const currentTime = new Date();
    return dispute.status === "FLAGGED" && currentTime > dispute.deadline;
  }, [dispute]);

  const handleResolve = async (isValid: boolean) => {
    if (!canResolve) {
      toast.error("You are not authorized to resolve disputes");
      return;
    }

    setTransactionPhase("resolving");
    setErrorMessage("");

    try {
      // Generate Divvi referral tag to append to transaction calldata
      const referralTag = generateDivviReferralTag();
      console.log('DIVVI: About to resolve dispute with referral tag:', referralTag);
      // If onResolveDispute returns a txHash, use it; otherwise, just call it and then trackTransaction if needed
      const txHash = await onResolveDispute(dispute.id, isValid, referralTag);
      if (typeof txHash === "string") {
        await trackTransaction(txHash);
      }
      setTransactionPhase("success");
      toast.success(`Dispute resolved as ${isValid ? "valid" : "invalid"}`);
      setTimeout(() => {
        onClose();
        setTransactionPhase("idle");
      }, 2000);
    } catch (error) {
      setTransactionPhase("error");
      const message =
        error instanceof Error ? error.message : "Failed to resolve dispute";
      setErrorMessage(message);
      toast.error(message);
    }
  };

  const getTransactionMessage = () => {
    switch (transactionPhase) {
      case "resolving":
        return {
          title: "Resolving Dispute",
          description: "Processing dispute resolution, please wait...",
          icon: <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />,
          bgColor: "bg-emerald-500/10 border-emerald-500/20",
          textColor: "text-emerald-400",
        };
      case "success":
        return {
          title: "Dispute Resolved Successfully!",
          description: "The dispute has been resolved and updated.",
          icon: <CheckCircle className="w-5 h-5 text-green-400" />,
          bgColor: "bg-green-500/10 border-green-500/20",
          textColor: "text-green-400",
        };
      case "error":
        return {
          title: "Resolution Failed",
          description:
            errorMessage ||
            "There was an error resolving the dispute. Please try again.",
          icon: <XCircle className="w-5 h-5 text-red-400" />,
          bgColor: "bg-red-500/10 border-red-500/20",
          textColor: "text-red-400",
        };
      default:
        return null;
    }
  };

  const isTransactionInProgress =
    transactionPhase === "resolving" || isResolving;
  const canActuallyResolve =
    dispute.status === "FLAGGED" &&
    canResolve &&
    !isTransactionInProgress &&
    !isExpired;

  return (
    <motion.div
      className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className="bg-slate-800/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl w-full max-w-[95vw] sm:max-w-2xl mx-auto max-h-[90vh] overflow-y-auto"
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-slate-700/50 sticky top-0 bg-slate-800/95 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
              {canResolve ? (
                <Shield className="w-5 h-5 text-emerald-400" />
              ) : (
                <Eye className="w-5 h-5 text-blue-400" />
              )}
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white">
                Dispute Resolution
              </h2>
              <p className="text-sm text-slate-400">
                {canResolve
                  ? "Review and resolve this dispute"
                  : "View dispute details (read-only)"}
              </p>
            </div>
          </div>
          <motion.button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all duration-200"
            aria-label="Close modal"
            disabled={isTransactionInProgress}
            whileTap={{ scale: 0.95 }}
          >
            <XCircle className="w-5 h-5" />
          </motion.button>
        </div>

        {/* Access Control Notice */}
        {!canResolve && (
          <div className="px-4 pt-4">
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-start">
              <Eye className="text-blue-400 mr-3 mt-0.5 flex-shrink-0 w-5 h-5" />
              <div>
                <p className="text-sm font-medium text-blue-400 mb-1">
                  Read-Only View
                </p>
                <p className="text-xs text-slate-400">
                  You can view dispute details for transparency. Only authorized
                  dispute resolvers can take action.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Expiration Notice */}
        {isExpired && (
          <div className="px-4 pt-4">
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start">
              <XCircle className="text-red-400 mr-3 mt-1 flex-shrink-0 w-5 h-5" />
              <div>
                <p className="text-sm font-medium text-red-400 mb-1">
                  ⏰ Dispute Resolution Period Expired
                </p>
                <p className="text-xs text-red-300">
                  This dispute was not resolved within the 2-day deadline. It
                  will be automatically marked as invalid during campaign
                  completion to protect the business.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Scrollable Content */}
        <div className="px-4 pb-4 max-h-[calc(90vh-180px)] sm:max-h-[calc(90vh-200px)] overflow-y-auto">
          {/* Transaction Status */}
          {transactionPhase !== "idle" && (
            <div className="mt-4">
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

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {/* Left Column - Dispute Details */}
            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-medium text-slate-300 mb-1">
                  Campaign Title
                </h4>
                <p className="text-sm text-white">{dispute.campaignTitle}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-slate-300 mb-1">
                  Brief ID
                </h4>
                <p className="text-sm text-white font-mono break-all">
                  {dispute.briefId}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-slate-300 mb-1">
                  Influencer
                </h4>
                <p className="text-sm text-white font-mono break-all">
                  {dispute.influencer}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-slate-300 mb-1">
                  Business
                </h4>
                <p className="text-sm text-white font-mono break-all">
                  {dispute.business}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-slate-300 mb-1">
                  Amount at Stake
                </h4>
                <p className="text-sm text-white">
                  ${dispute.amount.toFixed(0)} cUSD
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-slate-300 mb-1">
                  Category
                </h4>
                <p className="text-sm text-white">{dispute.category}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-slate-300 mb-1">
                  Flagged Date
                </h4>
                <p className="text-sm text-white">
                  {format(dispute.flaggedDate, "MMM d, yyyy 'at' HH:mm")}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-slate-300 mb-1">
                  Resolution Deadline
                </h4>
                <p className="text-sm text-white">
                  {format(dispute.deadline, "MMM d, yyyy 'at' HH:mm")}
                </p>
              </div>
            </div>

            {/* Right Column - Dispute Reason and Proof */}
            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-medium text-slate-300 mb-1">
                  Dispute Reason
                </h4>
                <div className="mt-2 p-3 bg-slate-700/50 rounded-md border border-slate-600/50">
                  <p className="text-sm text-white leading-relaxed">
                    {dispute.reason}
                  </p>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-slate-300 mb-1">
                  Submitted Content
                </h4>
                <a
                  href={dispute.proofLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-emerald-400 hover:text-emerald-300 text-sm transition-colors duration-200"
                >
                  <ExternalLink className="h-4 w-4 mr-1 flex-shrink-0" />
                  View Submitted Content
                </a>
              </div>
              <div className="flex flex-wrap gap-2">
                <span
                  className={`inline-flex px-2 py-1 text-[10px] font-semibold rounded-full ${getStatusColor(
                    dispute.status
                  )}`}
                >
                  {dispute.status.replace("_", " ")}
                </span>
                <span
                  className={`inline-flex px-2 py-1 text-[10px] font-semibold rounded-full ${getPriorityColor(
                    dispute.priority
                  )}`}
                >
                  {dispute.priority} Priority
                </span>
              </div>
            </div>
          </div>

          {/* Resolution Guidelines for Resolvers */}
          {canResolve && dispute.status === "FLAGGED" && !isExpired && (
            <div className="mt-6 p-4 bg-slate-900/50 rounded-xl border border-slate-700/50">
              <h4 className="text-sm font-medium text-slate-300 mb-2">
                Resolution Guidelines
              </h4>
              <ul className="text-sm text-slate-400 space-y-1">
                <li>
                  • Review the submitted content against campaign requirements
                </li>
                <li>• Consider if the business&apos;s concerns are valid</li>
                <li>• Check content quality, relevance, and compliance</li>
                <li>• Make a fair decision based on objective criteria</li>
              </ul>
            </div>
          )}
        </div>

        {/* Fixed Action Buttons */}
        {dispute.status === "FLAGGED" && (
          <div className="border-t border-slate-700/50 bg-slate-800/95 p-4 sticky bottom-0">
            {canResolve && !isExpired ? (
              <div className="flex flex-col sm:flex-row justify-end gap-3">
                <motion.button
                  onClick={onClose}
                  className="order-2 sm:order-1 px-4 py-2.5 bg-slate-700/50 text-slate-300 rounded-lg border border-slate-600/50 hover:bg-slate-700 hover:border-slate-500 active:bg-slate-600 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  disabled={isTransactionInProgress}
                  whileTap={{ scale: 0.95 }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  onClick={() => handleResolve(false)}
                  className="order-1 sm:order-2 px-4 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg font-medium hover:from-red-600 hover:to-red-700 active:from-red-700 active:to-red-800 transition-all duration-200 shadow-sm shadow-red-500/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  disabled={!canActuallyResolve}
                  whileTap={{ scale: 0.95 }}
                >
                  <XCircle className="h-4 w-4 flex-shrink-0" />
                  Mark as Invalid
                </motion.button>
                <motion.button
                  onClick={() => handleResolve(true)}
                  className="order-1 sm:order-3 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg font-medium hover:from-emerald-600 hover:to-emerald-700 active:from-emerald-700 active:to-emerald-800 transition-all duration-200 shadow-sm shadow-emerald-500/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  disabled={!canActuallyResolve}
                  whileTap={{ scale: 0.95 }}
                >
                  <CheckCircle className="h-4 w-4 flex-shrink-0" />
                  Mark as Valid
                </motion.button>
              </div>
            ) : (
              <div className="flex justify-center">
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 bg-slate-700/50 text-slate-300 rounded-lg border border-slate-600/50 hover:bg-slate-700 hover:border-slate-500 transition-all duration-200 font-medium text-sm"
                >
                  {isExpired ? "Close (Expired)" : "Close"}
                </button>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default DisputeResolutionModal;
