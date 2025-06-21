import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, X, Loader2, CheckCircle } from "lucide-react";
import { Hex } from "viem";
import { useFlagSubmission } from "@/hooks/useDisputeResolution";
import { toast } from "react-hot-toast";
import { withNetworkGuard } from "@/components/WithNetworkGuard";
import { useDivviIntegration } from '@/hooks/useDivviIntegration'

interface DisputeModalProps {
  briefId: Hex;
  influencer: Hex;
  onClose: () => void;
  guardedAction?: (action: () => Promise<void>) => Promise<void>;
}

function DisputeModal({
  briefId,
  influencer,
  onClose,
  guardedAction,
}: DisputeModalProps) {
  const [reason, setReason] = useState("");
  const { flagSubmission, isFlagging, flagSuccess, flagError } =
    useFlagSubmission();

  const { generateDivviTag, trackTransaction } = useDivviIntegration()

  const handleSubmit = async () => {
    if (!reason.trim()) {
      toast.error("Please provide a reason for the dispute");
      return;
    }

    if (!guardedAction) {
      toast.error("Network guard not available. Please refresh and try again.");
      return;
    }

    await guardedAction(async () => {
      const divviTag = generateDivviTag()
      const reasonWithDivvi = reason + divviTag
      const txHash = await flagSubmission(briefId, influencer, reasonWithDivvi)
      // Track with Divvi
      if (typeof txHash === "string") {
        await trackTransaction(txHash)
      }
    });
  };

  useEffect(() => {
    if (flagSuccess) {
      toast.success("Dispute raised successfully!");
      onClose();
    }
    if (flagError) {
      toast.error(
        `Failed to raise dispute: ${flagError.message || "Unknown error"}`
      );
    }
  }, [flagSuccess, flagError, onClose]);

  return (
    <motion.div
      className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-slate-800/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 max-w-md mx-auto shadow-2xl shadow-red-500/10"
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-red-500/10 rounded-xl border border-red-500/20">
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Raise Dispute</h3>
            <p className="text-sm text-slate-400">
              Provide details for flagging this submission
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isFlagging}
            className="ml-auto p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Transaction Status */}
        {(isFlagging || flagSuccess) && (
          <div
            className={`mb-4 p-3 rounded-xl border flex items-start ${
              flagSuccess
                ? "bg-green-500/10 border-green-500/20"
                : "bg-blue-500/10 border-blue-500/20"
            }`}
          >
            <div className="mr-3 mt-0.5 flex-shrink-0">
              {isFlagging ? (
                <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
              ) : (
                <CheckCircle className="w-5 h-5 text-green-400" />
              )}
            </div>
            <div>
              <p
                className={`text-sm font-medium ${
                  flagSuccess ? "text-green-400" : "text-blue-400"
                }`}
              >
                {isFlagging ? "Raising Dispute" : "Dispute Raised Successfully"}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {isFlagging
                  ? "Please confirm the transaction in your wallet..."
                  : "The submission has been flagged for review."}
              </p>
            </div>
          </div>
        )}

        <div className="mb-6">
          <label
            htmlFor="reason"
            className="block text-sm font-medium text-slate-300 mb-2"
          >
            Reason for Dispute <span className="text-red-400">*</span>
          </label>
          <textarea
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full h-24 p-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500/50 transition-all resize-none"
            placeholder="Describe why you are flagging this submission (e.g., content does not meet requirements, inappropriate content, etc.)"
            disabled={isFlagging || flagSuccess}
            maxLength={500}
          />
          <div className="flex justify-between mt-1">
            <p className="text-xs text-slate-500">
              Be specific about what requirements were not met
            </p>
            <p className="text-xs text-slate-500">{reason.length}/500</p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isFlagging}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-300 bg-slate-700/50 rounded-xl border border-slate-600/50 hover:bg-slate-700 transition-all disabled:opacity-50"
          >
            {flagSuccess ? "Close" : "Cancel"}
          </button>
          {!flagSuccess && (
            <button
              onClick={handleSubmit}
              disabled={isFlagging || !reason.trim()}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-red-500 to-red-600 rounded-xl hover:from-red-600 hover:to-red-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isFlagging ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Flagging...
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4" />
                  Raise Dispute
                </>
              )}
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

export default withNetworkGuard(DisputeModal);
