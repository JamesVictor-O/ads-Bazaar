"use client";

import React, { useState} from "react";
import { motion } from "framer-motion";
import {
  XCircle,
  CheckCircle,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { format } from "date-fns";

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
  onResolveDispute: (disputeId: string, isValid: boolean) => Promise<void>;
  onClose: () => void;
  getStatusColor: (status: string) => string;
  getPriorityColor: (priority: string) => string;
}

// Transaction phases for better UX
type TransactionPhase = "idle" | "resolving" | "success" | "error";

const DisputeResolutionModal: React.FC<DisputeResolutionModalProps> = ({
  dispute,
  onResolveDispute,
  onClose,
  getStatusColor,
  getPriorityColor,
}) => {
  const [transactionPhase, setTransactionPhase] = useState<TransactionPhase>("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const handleResolve = async (isValid: boolean) => {
    setTransactionPhase("resolving");
    setErrorMessage("");

    try {
      await onResolveDispute(dispute.id, isValid);
      setTransactionPhase("success");
      toast.success(`Dispute resolved as ${isValid ? "valid" : "invalid"}`);
      setTimeout(() => {
        onClose();
        setTransactionPhase("idle");
      }, 2000);
    } catch (error) {
      setTransactionPhase("error");
      const message = error instanceof Error ? error.message : "Failed to resolve dispute";
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
          description: errorMessage || "There was an error resolving the dispute. Please try again.",
          icon: <XCircle className="w-5 h-5 text-red-400" />,
          bgColor: "bg-red-500/10 border-red-500/20",
          textColor: "text-red-400",
        };
      default:
        return null;
    }
  };

  const isTransactionInProgress = transactionPhase === "resolving";
  const canResolve = dispute.status === "FLAGGED" && !isTransactionInProgress;

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
          <h2 className="text-lg sm:text-xl font-bold text-white">
            Dispute Resolution
          </h2>
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
                      <p className={`text-sm font-medium ${txMessage.textColor}`}>
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
                <p className="text-sm text-white font-mono">{dispute.briefId}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-slate-300 mb-1">
                  Influencer
                </h4>
                <p className="text-sm text-white font-mono">{dispute.influencer}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-slate-300 mb-1">
                  Business
                </h4>
                <p className="text-sm text-white font-mono">{dispute.business}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-slate-300 mb-1">
                  Amount
                </h4>
                <p className="text-sm text-white">${dispute.amount}</p>
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
                  {format(dispute.flaggedDate, "MMM d, yyyy")}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-slate-300 mb-1">
                  Resolution Deadline
                </h4>
                <p className="text-sm text-white">
                  {format(dispute.deadline, "MMM d, yyyy")}
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
                  <p className="text-sm text-white">{dispute.reason}</p>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-slate-300 mb-1">
                  Proof Link
                </h4>
                <a
                  href={dispute.proofLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-emerald-400 hover:text-emerald-300 text-sm"
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  View Submitted Content
                </a>
              </div>
              <div className="flex flex-wrap gap-2">
                <span
                  className={`inline-flex px-2 py-1 text-[10px] font-semibold rounded-full ${getStatusColor(dispute.status)}`}
                >
                  {dispute.status.replace("_", " ")}
                </span>
                <span
                  className={`inline-flex px-2 py-1 text-[10px] font-semibold rounded-full ${getPriorityColor(dispute.priority)}`}
                >
                  {dispute.priority} Priority
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Fixed Action Buttons */}
        {dispute.status === "FLAGGED" && (
          <div className="border-t border-slate-700/50 bg-slate-800/95 p-4 sticky bottom-0">
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
                disabled={!canResolve}
                whileTap={{ scale: 0.95 }}
              >
                <XCircle className="h-4 w-4 flex-shrink-0" />
                Reject Dispute
              </motion.button>
              <motion.button
                onClick={() => handleResolve(true)}
                className="order-1 sm:order-3 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg font-medium hover:from-emerald-600 hover:to-emerald-700 active:from-emerald-700 active:to-emerald-800 transition-all duration-200 shadow-sm shadow-emerald-500/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                disabled={!canResolve}
                whileTap={{ scale: 0.95 }}
              >
                <CheckCircle className="h-4 w-4 flex-shrink-0" />
                Approve Dispute
              </motion.button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default DisputeResolutionModal;