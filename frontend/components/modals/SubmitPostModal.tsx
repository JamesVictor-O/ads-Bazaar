import {
  Loader2,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  X,
  Link,
  Send,
  Sparkles,
} from "lucide-react";
import { ReactNode } from "react";

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
}

export function SubmitPostModal({
  selectedCampaign,
  selectedTask,
  postLink,
  setPostLink,
  onSubmit,
  onClose,
  transactionStatus = { stage: "idle", message: "" },
  isSubmitting = false,
}: SubmitPostModalProps) {
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
        return "Preparing Transaction...";
      case "confirming":
        return "Confirm in Wallet...";
      case "mining":
        return "Processing Transaction...";
      case "success":
        return "Successfully Submitted!";
      case "error":
        return "Try Again";
      default:
        return "Submit Post";
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

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-opacity duration-300">
      <div className="bg-slate-800/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl shadow-emerald-500/10 w-full max-w-lg mx-auto animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="relative px-8 pt-8 pb-6">
          <button
            onClick={onClose}
            className="absolute right-6 top-6 text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all duration-200 rounded-full p-2"
            disabled={
              transactionStatus.stage !== "idle" &&
              transactionStatus.stage !== "error" &&
              transactionStatus.stage !== "success"
            }
          >
            <X size={20} />
          </button>

          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
              <Send className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">
                Submit Your Post
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                Share your content link to complete the task
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-8 pb-8 space-y-6">
          {/* Campaign Info */}
          <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-5 shadow-sm">
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4 text-emerald-400" />
                  <label className="text-sm font-medium text-slate-300 uppercase tracking-wide">
                    Campaign
                  </label>
                </div>
                <p className="text-white font-medium text-lg">
                  {selectedCampaign.title}
                </p>
                <p className="text-sm text-slate-400">
                  by {selectedCampaign.brand}
                </p>
              </div>

              <div className="border-t border-slate-700/50 pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                  <label className="text-sm font-medium text-slate-300 uppercase tracking-wide">
                    Task
                  </label>
                </div>
                <p className="text-white font-medium">{selectedTask.name}</p>
              </div>
            </div>
          </div>

          {/* Post Link Input */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-3">
              Post Link <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <Link className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="url"
                value={postLink}
                onChange={(e) => setPostLink(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-slate-900/50 border border-slate-700/50 rounded-xl text-sm text-slate-300 placeholder-slate-500 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="https://warpcast.com/~/cast/..."
                disabled={
                  transactionStatus.stage !== "idle" &&
                  transactionStatus.stage !== "error"
                }
              />
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Paste the direct link to your social media post
            </p>
          </div>

          {/* Transaction Status */}
          {transactionStatus.stage !== "idle" && (
            <div className={`rounded-xl border p-4 ${getStatusStyles()}`}>
              <div className="flex items-start gap-3">
                {getStatusIcon()}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white">
                    {transactionStatus.message}
                  </p>
                  {transactionStatus.hash && (
                    <a
                      href={`https://explorer.celo.org/tx/${transactionStatus.hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-xs mt-2 text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      View transaction details
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 text-sm font-medium text-slate-300 bg-slate-700/50 hover:bg-slate-700 rounded-xl border border-slate-600/50 hover:border-slate-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={
                transactionStatus.stage !== "idle" &&
                transactionStatus.stage !== "error" &&
                transactionStatus.stage !== "success"
              }
            >
              {transactionStatus.stage === "success" ? "Close" : "Cancel"}
            </button>

            <button
              onClick={onSubmit}
              disabled={
                !postLink.trim() ||
                isSubmitting ||
                (transactionStatus.stage !== "idle" &&
                  transactionStatus.stage !== "error")
              }
              className={`flex-1 px-6 py-3 text-sm font-medium rounded-xl transition-all duration-200 flex items-center justify-center gap-2 ${
                !postLink.trim() ||
                isSubmitting ||
                (transactionStatus.stage !== "idle" &&
                  transactionStatus.stage !== "error")
                  ? "bg-slate-600/50 text-slate-400 cursor-not-allowed border border-slate-600/50"
                  : transactionStatus.stage === "success"
                  ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700 shadow-md shadow-emerald-500/25"
                  : "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700 shadow-md shadow-emerald-500/25"
              }`}
            >
              {isSubmitting ||
              (transactionStatus.stage !== "idle" &&
                transactionStatus.stage !== "error") ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{getButtonText()}</span>
                </>
              ) : transactionStatus.stage === "success" ? (
                <>
                  <CheckCircle className="h-4 w-4" />
                  <span>{getButtonText()}</span>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span>{getButtonText()}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
