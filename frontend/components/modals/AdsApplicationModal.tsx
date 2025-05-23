"use client";

import { useApplyToBrief } from "@/hooks/adsBazaar";
import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { X, Loader2, Send, DollarSign, FileText, User } from "lucide-react";

interface ApplyModalProps {
  showApplyModal: boolean;
  setShowApplyModal: (show: boolean) => void;
  selectedBrief: {
    id: `0x${string}`;
    title: string;
    business: string;
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
      // Format the error message for better readability
      let errorMessage = "Transaction failed";

      if (typeof error === "string") {
        errorMessage = error;
      } else if (error instanceof Error) {
        errorMessage = error.message;

        // Handle common error cases
        if (error.message.includes("User rejected the request")) {
          errorMessage = "Transaction rejected by user";
        } else if (error.message.includes("insufficient funds")) {
          errorMessage = "Insufficient funds for transaction";
        } else {
          // Extract revert reason from contract
          const revertReason = extractRevertReason(error.message);
          if (revertReason) {
            errorMessage = revertReason;
          }
        }
      }

      toast.error(errorMessage, {
        duration: 5000,
      });
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
      // Errors are handled by the error state from useApplyToBrief
      console.error("Application failed:", err);
    }
  };

  // Improved revert reason extraction
  const extractRevertReason = (message: string): string | null => {
    const revertPatterns = [
      /reason="([^"]+)"/, // For some RPC providers
      /reason: ([^,]+)/, // Common pattern
      /reverted with reason string '([^']+)'/, // Common pattern
      /reverted: ([^"]+)/, // Common pattern
      /execution reverted: ([^"]+)/, // Common pattern
      /Error: VM Exception while processing transaction: reverted with reason string '([^']+)'/, // Hardhat
      /"message":"([^"]+)"/, // Some JSON-RPC responses
    ];

    for (const pattern of revertPatterns) {
      const match = message.match(pattern);
      if (match && match[1]) {
        // Clean up the message
        return match[1].replace(/^execution reverted:/i, "").trim();
      }
    }
    return null;
  };

  if (!showApplyModal || !selectedBrief || !isClient) return null;

  return (
    // Modal overlay with dark, translucent background
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-opacity duration-300">
      {/* Modal container with dark theme and emerald shadow */}
      <div className="bg-slate-800/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 w-full max-w-2xl mx-auto max-h-[85vh] overflow-hidden flex flex-col shadow-2xl shadow-emerald-500/10">
        {/* Header with campaign name and close button */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">
              Apply for {selectedBrief.title}
            </h2>
            <p className="text-sm text-slate-400 mt-1">
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
        <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-6 mb-6 shadow-sm">
          <h3 className="text-sm font-medium text-slate-400 mb-4 uppercase tracking-wide">
            Campaign Details
          </h3>

          <div className="space-y-4">
            {/* Business Name */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-slate-700/50 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-slate-400" />
              </div>
              <div>
                <p className="text-lg font-medium text-white">
                  {selectedBrief.business}
                </p>
                <p className="text-xs text-slate-400">Business</p>
              </div>
            </div>

            {/* Budget */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/20">
                <DollarSign className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-lg font-medium text-emerald-400">
                  {selectedBrief.budget} cUSD
                </p>
                <p className="text-xs text-slate-400">Total Budget</p>
              </div>
            </div>

            {/* Requirements */}
            {selectedBrief.requirements && (
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-slate-700/50 rounded-full flex items-center justify-center mt-1">
                  <FileText className="w-5 h-5 text-slate-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {selectedBrief.requirements}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">Requirements</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Application Message Section */}
        <div className="flex-grow">
          <label className="block text-sm font-medium text-slate-300 mb-3">
            Application Message
            <span className="text-red-400 ml-1">*</span>
          </label>
          <div className="relative">
            <textarea
              value={applicationMessage}
              onChange={(e) => setApplicationMessage(e.target.value)}
              className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl p-4 text-sm text-slate-300 placeholder-slate-500 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-200 resize-none min-h-[120px]"
              placeholder="Explain why you're a great fit for this campaign. Highlight your relevant experience, audience demographics, and how you plan to promote their brand..."
              disabled={isPending}
            />
            <div className="absolute bottom-3 right-3 text-xs text-slate-500">
              {applicationMessage.length}/20 min
            </div>
          </div>
          <p className="mt-2 text-xs text-slate-400">
            Minimum 20 characters required. Be specific about your approach and
            why you're the right fit.
          </p>
        </div>

        {/* Loading State */}
        {isPending && (
          <div className="mt-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-start">
            <Loader2 className="animate-spin text-emerald-400 mr-3 mt-0.5 flex-shrink-0" />
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

        {/* Action buttons */}
        <div className="mt-6 flex justify-end pt-4 border-t border-slate-700/50 gap-4">
          <button
            onClick={() => setShowApplyModal(false)}
            disabled={isPending}
            className="px-6 py-3 text-sm font-medium text-slate-300 bg-slate-700/50 rounded-xl border border-slate-600/50 hover:bg-slate-700 hover:border-slate-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            disabled={
              !applicationMessage.trim() ||
              applicationMessage.length < 20 ||
              isPending
            }
            className="px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl hover:from-emerald-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md shadow-emerald-500/25"
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
          </button>
        </div>
      </div>
    </div>
  );
}
