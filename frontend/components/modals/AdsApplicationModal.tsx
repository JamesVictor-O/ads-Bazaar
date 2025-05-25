"use client";

import { useApplyToBrief } from "@/hooks/adsBazaar";
import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { X, Loader2, Send, DollarSign, FileText, User, CheckSquare } from "lucide-react";
import { motion } from "framer-motion";

interface ApplyModalProps {
  showApplyModal: boolean;
  setShowApplyModal: (show: boolean) => void;
  selectedBrief: {
    id: `0x${string}`;
    title: string;
    business: string;
    description: string;
    budget: number;
    requirements?: string;
  } | null;
  applicationMessage: string;
  setApplicationMessage: (message: string) => void;
}

export default function ApplyModal({
  showApplyModal,
  setShowApplyModal,
  selectedBrief,
  applicationMessage,
  setApplicationMessage,
}: ApplyModalProps) {
  const [isClient, setIsClient] = useState(false);
  const { applyToBrief, isPending, isSuccess, error } = useApplyToBrief();

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isSuccess) {
      toast.success("Application submitted successfully!");
      setShowApplyModal(false);
      setApplicationMessage("");
    }
  }, [isSuccess, setShowApplyModal, setApplicationMessage]);

  useEffect(() => {
    if (error) {
      let errorMessage = "Transaction failed";
      if (typeof error === "string") {
        errorMessage = error;
      } else if (error instanceof Error) {
        errorMessage = error.message;
        if (error.message.includes("User rejected the request")) {
          errorMessage = "Transaction rejected by user";
        } else if (error.message.includes("insufficient funds")) {
          errorMessage = "Insufficient funds for transaction";
        } else {
          const revertReason = extractRevertReason(error.message);
          if (revertReason) {
            errorMessage = revertReason;
          }
        }
      }
      toast.error(errorMessage, { duration: 5000 });
    }
  }, [error]);

  const handleApply = async (): Promise<void> => {
    if (!applicationMessage.trim()) {
      toast.error("Please enter an application message");
      return;
    }
    if (!selectedBrief) {
      toast.error("No campaign selected");
      return;
    }
    if (applicationMessage.length < 20) {
      toast.error("Application message must be at least 20 characters");
      return;
    }
    try {
      await applyToBrief(selectedBrief.id, applicationMessage);
    } catch (err) {
      console.error("Application failed:", err);
    }
  };

  const extractRevertReason = (message: string): string | null => {
    const revertPatterns = [
      /reason="([^"]+)"/,
      /reason: ([^,]+)/,
      /reverted with reason string '([^']+)'/,
      /reverted: ([^"]+)/,
      /execution reverted: ([^"]+)/,
      /Error: VM Exception while processing transaction: reverted with reason string '([^']+)'/,
      /"message":"([^"]+)"/,
    ];
    for (const pattern of revertPatterns) {
      const match = message.match(pattern);
      if (match && match[1]) {
        return match[1].replace(/^execution reverted:/i, "").trim();
      }
    }
    return null;
  };

  if (!showApplyModal || !selectedBrief || !isClient) return null;

  return (
    <motion.div
      className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className="bg-slate-800/90 backdrop-blur-md border border-slate-700/50 rounded-2xl w-full max-w-md sm:max-w-2xl mx-auto max-h-[90vh] overflow-hidden flex flex-col shadow-2xl shadow-emerald-500/10"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1">
          <div className="p-4 sm:p-8">
            {/* Header */}
            <div className="flex justify-between items-center mb-4 sm:mb-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white">
                  Apply for {selectedBrief.title}
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  Submit your application to join this campaign
                </p>
              </div>
              <button
                onClick={() => setShowApplyModal(false)}
                className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all duration-200"
                disabled={isPending}
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Campaign Details */}
            <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4 sm:p-6 mb-4 sm:mb-6 shadow-sm">
              <h3 className="text-xs sm:text-sm font-medium text-slate-400 mb-4 uppercase tracking-wide">
                Campaign Details
              </h3>
              <div className="space-y-4">
                {/* Business Name */}
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-slate-700/50 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-base sm:text-lg font-medium text-white">
                      {selectedBrief.business}
                    </p>
                    <p className="text-xs text-slate-400">Business</p>
                  </div>
                </div>

                {/* Description */}
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-500/10 rounded-full flex items-center justify-center border border-blue-500/20 mt-1">
                    <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <div className="max-h-24 sm:max-h-32 overflow-y-auto pr-2">
                      <p className="text-sm text-slate-300 leading-relaxed">
                        {selectedBrief.description}
                      </p>
                    </div>
                    <p className="text-xs text-slate-400 mt-2">Campaign Description</p>
                  </div>
                </div>

                {/* Budget */}
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/20">
                    <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-base sm:text-lg font-medium text-emerald-400">
                      {selectedBrief.budget} cUSD
                    </p>
                    <p className="text-xs text-slate-400">Total Budget</p>
                  </div>
                </div>

                {/* Requirements */}
                {selectedBrief.requirements && (
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-orange-500/10 rounded-full flex items-center justify-center border border-orange-500/20 mt-1">
                      <CheckSquare className="w-4 h-4 sm:w-5 sm:h-5 text-orange-400" />
                    </div>
                    <div className="flex-1">
                      <div className="max-h-24 sm:max-h-32 overflow-y-auto pr-2">
                        <p className="text-sm text-slate-300 leading-relaxed">
                          {selectedBrief.requirements}
                        </p>
                      </div>
                      <p className="text-xs text-slate-400 mt-2">Requirements</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Application Message */}
            <div className="mb-4 sm:mb-6">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Application Message
                <span className="text-red-400 ml-1">*</span>
              </label>
              <div className="relative">
                <textarea
                  value={applicationMessage}
                  onChange={(e) => setApplicationMessage(e.target.value)}
                  className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl p-3 sm:p-4 text-sm text-slate-300 placeholder-slate-500 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-200 resize-none min-h-[100px] sm:min-h-[120px]"
                  placeholder="Explain why you're a great fit for this campaign..."
                  disabled={isPending}
                />
                <div className="absolute bottom-2 sm:bottom-3 right-3 text-xs text-slate-500">
                  {applicationMessage.length}/20 min
                </div>
              </div>
              <p className="mt-2 text-xs text-slate-400">
                Minimum 20 characters required. Highlight your experience and approach.
              </p>
            </div>

            {/* Loading State */}
            {isPending && (
              <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-start">
                <Loader2 className="animate-spin text-emerald-400 mr-3 mt-0.5 flex-shrink-0 w-5 h-5" />
                <div>
                  <p className="text-sm font-medium text-emerald-400">
                    Transaction in progress
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Please wait while we process your application...
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Fixed Action Buttons */}
        <div className="border-t border-slate-700/50 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4">
            <motion.button
              onClick={() => setShowApplyModal(false)}
              disabled={isPending}
              className="px-4 sm:px-6 py-3 text-sm font-medium text-slate-300 bg-slate-700/50 rounded-xl border border-slate-600/50 hover:bg-slate-700 hover:border-slate-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed order-2 sm:order-1"
              whileTap={{ scale: 0.95 }}
            >
              Cancel
            </motion.button>
            <motion.button
              onClick={handleApply}
              disabled={
                !applicationMessage.trim() ||
                applicationMessage.length < 20 ||
                isPending
              }
              className="px-4 sm:px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl hover:from-emerald-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md shadow-emerald-500/25 order-1 sm:order-2"
              whileTap={{ scale: 0.95 }}
            >
              {isPending ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="animate-spin h-4 w-4" />
                  <span>Processing...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Send className="h-4 w-4" />
                  <span>Submit Application</span>
                </div>
              )}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}