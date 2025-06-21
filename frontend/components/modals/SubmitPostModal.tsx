import React, { ReactNode, useEffect, useState } from "react";
import {
  Loader2,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  X,
  Link,
  Send,
  Sparkles,
  AlertTriangle,
  Edit3,
  Eye,
} from "lucide-react";
import { withNetworkGuard } from "@/components/WithNetworkGuard";
import { NetworkStatus } from "@/components/NetworkStatus";
import { useAccount } from "wagmi";
import { useEnsureNetwork } from "@/hooks/useEnsureNetwork";
import { useDivviIntegration } from '@/hooks/useDivviIntegration'

interface TransactionStatus {
  stage: "idle" | "preparing" | "confirming" | "mining" | "success" | "error";
  message: string;
  hash?: string;
}

interface SubmitPostModalProps {
  selectedCampaign: {
    id: string;
    title: string;
    brand: string;
  } | null;
  selectedTask: {
    name: string;
  } | null;
  postLink: string;
  setPostLink: (link: string) => void;
  onSubmit: () => Promise<void>;
  onClose: () => void;
  transactionStatus?: TransactionStatus;
  isSubmitting?: boolean;
  guardedAction?: (action: () => Promise<void>) => Promise<void>;
  existingProofLink?: string;
  isResubmission?: boolean;
}

function SubmitPostModal({
  selectedCampaign,
  selectedTask,
  postLink,
  setPostLink,
  onSubmit,
  onClose,
  transactionStatus = { stage: "idle", message: "" },
  isSubmitting = false,
  guardedAction,
  existingProofLink = "",
  isResubmission = false,
}: SubmitPostModalProps) {
  const { isConnected } = useAccount();
  const { isCorrectChain, currentNetwork } = useEnsureNetwork();
  const [showExistingProof, setShowExistingProof] = useState(false);
  const { generateDivviTag, trackTransaction } = useDivviIntegration()

  // Auto-populate with existing proof link if it's a resubmission
  useEffect(() => {
    if (isResubmission && existingProofLink && !postLink) {
      setPostLink(existingProofLink);
    }
  }, [isResubmission, existingProofLink, postLink, setPostLink]);

  if (!selectedCampaign || !selectedTask) return null;

  const getStatusIcon = (): ReactNode => {
    switch (transactionStatus.stage) {
      case "preparing":
      case "confirming":
      case "mining":
        return <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />;
      case "success":
        return <CheckCircle className="h-5 w-5 text-emerald-500" />;
      case "error":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getButtonText = (): string => {
    switch (transactionStatus.stage) {
      case "preparing":
        return "Preparing...";
      case "confirming":
        return "Confirm in Wallet";
      case "mining":
        return isResubmission ? "Updating..." : "Processing...";
      case "success":
        return isResubmission ? "Updated!" : "Submitted!";
      case "error":
        return "Try Again";
      default:
        return isResubmission ? "Update Proof" : "Submit Post";
    }
  };

  const getStatusStyles = () => {
    switch (transactionStatus.stage) {
      case "error":
        return "bg-red-50 border-red-200 text-red-800";
      case "success":
        return "bg-emerald-50 border-emerald-200 text-emerald-800";
      default:
        return "bg-indigo-50 border-indigo-200 text-indigo-800";
    }
  };

  const isDisabled =
    transactionStatus.stage !== "idle" &&
    transactionStatus.stage !== "error" &&
    transactionStatus.stage !== "success";

  const handleSubmit = async () => {
    if (!guardedAction) {
      await onSubmit();
      return;
    }

    if (!postLink.trim()) {
      return;
    }

    await guardedAction(async () => {
      const divviTag = generateDivviTag()
      const postLinkWithDivvi = postLink + divviTag
      setPostLink(postLinkWithDivvi)
      const txHash = await onSubmit()
      // Track with Divvi if txHash is a string
      if (typeof txHash === "string") {
        await trackTransaction(txHash)
      }
    });
  };

  const canSubmit =
    postLink.trim() &&
    !isSubmitting &&
    isConnected &&
    isCorrectChain &&
    (transactionStatus.stage === "idle" || transactionStatus.stage === "error");

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-slate-800 sm:bg-slate-800/90 sm:backdrop-blur-xl border-0 sm:border sm:border-slate-700/50 rounded-t-3xl sm:rounded-2xl shadow-2xl shadow-emerald-500/10 w-full sm:w-full sm:max-w-lg mx-auto transform transition-all duration-300 ease-out max-h-[95vh] sm:max-h-none overflow-hidden flex flex-col">
        {/* Mobile drag indicator */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-8 h-1 bg-slate-600 rounded-full"></div>
        </div>

        {/* Header */}
        <div className="relative px-4 sm:px-8 pt-4 sm:pt-8 pb-4 sm:pb-6 flex-shrink-0">
          <button
            onClick={onClose}
            className="absolute right-4 sm:right-6 top-4 sm:top-6 text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all duration-200 rounded-full p-2"
            disabled={isDisabled}
          >
            <X size={20} />
          </button>

          <div className="flex items-start sm:items-center gap-3 mb-2 pr-12 sm:pr-0">
            <div className="p-2 sm:p-2.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20 flex-shrink-0 mt-1 sm:mt-0">
              {isResubmission ? (
                <Edit3 className="h-4 sm:h-5 w-4 sm:w-5 text-emerald-400" />
              ) : (
                <Send className="h-4 sm:h-5 w-4 sm:w-5 text-emerald-400" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg sm:text-xl font-semibold text-white leading-tight">
                {isResubmission ? "Update Your Proof" : "Submit Your Post"}
              </h2>
              <p className="text-sm text-slate-400 mt-1 leading-relaxed">
                {isResubmission
                  ? "Update your content link to replace the existing proof"
                  : "Share your content link to complete the task"}
              </p>
            </div>
          </div>

          {/* Show resubmission warning */}
          {isResubmission && (
            <div className="mt-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start">
              <AlertTriangle className="text-amber-400 mr-3 mt-0.5 flex-shrink-0 w-4 h-4" />
              <div>
                <p className="text-sm font-medium text-amber-400">
                  Updating Existing Proof
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  This will replace your previously submitted proof link
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Scrollable Content */}
        <div className="px-4 sm:px-8 space-y-4 sm:space-y-6 overflow-y-auto flex-1 pb-4">
          {/* Network Status */}
          {isConnected && (
            <div>
              <NetworkStatus className="bg-slate-900/30 border-slate-600/50" />
            </div>
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
                  Connect your wallet to submit proof
                </p>
              </div>
            </div>
          )}

          {/* Existing Proof Section - Show if this is a resubmission */}
          {isResubmission && existingProofLink && (
            <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4 sm:p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-slate-300 flex items-center gap-2">
                  <Eye className="w-4 h-4 text-blue-400" />
                  Current Proof
                </h4>
                <button
                  onClick={() => setShowExistingProof(!showExistingProof)}
                  className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                >
                  {showExistingProof ? "Hide" : "View"}
                </button>
              </div>

              {showExistingProof && (
                <div className="space-y-2">
                  <div className="p-2 bg-slate-800/50 rounded-lg border border-slate-600/50">
                    <a
                      href={existingProofLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-emerald-400 hover:text-emerald-300 break-all flex items-start gap-2"
                    >
                      <ExternalLink className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      {existingProofLink}
                    </a>
                  </div>
                  <p className="text-xs text-slate-500">
                    This is your currently submitted proof link
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Campaign Info */}
          <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4 sm:p-5 shadow-sm">
            <div className="space-y-3 sm:space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-3.5 sm:h-4 w-3.5 sm:w-4 text-emerald-400" />
                  <label className="text-xs sm:text-sm font-medium text-slate-300 uppercase tracking-wide">
                    Campaign
                  </label>
                </div>
                <p className="text-white font-medium text-base sm:text-lg leading-tight">
                  {selectedCampaign.title}
                </p>
                <p className="text-sm text-slate-400 mt-1">
                  by {selectedCampaign.brand}
                </p>
              </div>

              <div className="border-t border-slate-700/50 pt-3 sm:pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                  <label className="text-xs sm:text-sm font-medium text-slate-300 uppercase tracking-wide">
                    Task
                  </label>
                </div>
                <p className="text-white font-medium leading-tight">
                  {selectedTask.name}
                </p>
              </div>
            </div>
          </div>

          {/* Post Link Input */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-3">
              {isResubmission ? "New Post Link" : "Post Link"}{" "}
              <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <Link className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 sm:h-5 w-4 sm:w-5 text-slate-400 pointer-events-none" />
              <input
                type="url"
                value={postLink}
                onChange={(e) => setPostLink(e.target.value)}
                className="w-full pl-11 sm:pl-12 pr-4 py-3.5 sm:py-4 bg-slate-900/50 border border-slate-700/50 rounded-xl text-sm text-slate-300 placeholder-slate-500 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="https://warpcast.com/~/cast/..."
                disabled={isDisabled}
                autoComplete="url"
                inputMode="url"
              />
            </div>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              {isResubmission
                ? "Enter the new link to replace your existing proof"
                : "Paste the direct link to your social media post"}
            </p>
          </div>

          {/* Transaction Status */}
          {transactionStatus.stage !== "idle" && (
            <div className={`rounded-xl border p-4 ${getStatusStyles()}`}>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">{getStatusIcon()}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white text-sm sm:text-base leading-tight">
                    {transactionStatus.message}
                  </p>
                  {transactionStatus.hash && (
                    <a
                      href={`https://explorer.celo.org/tx/${transactionStatus.hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-xs mt-2 text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
                    >
                      <ExternalLink className="h-3 w-3 mr-1 flex-shrink-0" />
                      <span>View transaction details</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Fixed Action Buttons */}
        <div className="border-t border-slate-700/50 bg-slate-800/90 backdrop-blur-sm p-4 sm:p-6 sm:pt-4 flex-shrink-0">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-3">
            <button
              onClick={onClose}
              className="order-2 sm:order-1 flex-1 px-4 sm:px-6 py-3.5 sm:py-3 text-sm font-medium text-slate-300 bg-slate-700/50 hover:bg-slate-700 active:bg-slate-600 rounded-xl border border-slate-600/50 hover:border-slate-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isDisabled}
            >
              {transactionStatus.stage === "success" ? "Close" : "Cancel"}
            </button>

            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className={`order-1 sm:order-2 flex-1 px-4 sm:px-6 py-3.5 sm:py-3 text-sm font-medium rounded-xl transition-all duration-200 flex items-center justify-center gap-2 ${
                !canSubmit
                  ? "bg-slate-600/50 text-slate-400 cursor-not-allowed border border-slate-600/50"
                  : "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700 active:from-emerald-700 active:to-emerald-800 shadow-md shadow-emerald-500/25"
              }`}
            >
              {isSubmitting ||
              (transactionStatus.stage !== "idle" &&
                transactionStatus.stage !== "error" &&
                transactionStatus.stage !== "success") ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" />
                  <span className="truncate">{getButtonText()}</span>
                </>
              ) : !isConnected ? (
                <>
                  <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">Connect Wallet</span>
                </>
              ) : !isCorrectChain ? (
                <>
                  <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">
                    Switch to {currentNetwork.name}
                  </span>
                </>
              ) : transactionStatus.stage === "success" ? (
                <>
                  <CheckCircle className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{getButtonText()}</span>
                </>
              ) : (
                <>
                  {isResubmission ? (
                    <Edit3 className="h-4 w-4 flex-shrink-0" />
                  ) : (
                    <Send className="h-4 w-4 flex-shrink-0" />
                  )}
                  <span className="truncate">{getButtonText()}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default withNetworkGuard(SubmitPostModal);
