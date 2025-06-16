import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, X, Loader2 } from "lucide-react";
import { Hex } from "viem";
import { useFlagSubmission } from "@/hooks/adsBazaar";
import { toast } from "react-hot-toast";

interface DisputeModalProps {
  briefId: Hex;
  influencer: Hex;
  onClose: () => void;
}

export const DisputeModal = ({ briefId, influencer, onClose }: DisputeModalProps) => {
  const [reason, setReason] = useState("");
  const { flagSubmission, isFlagging, flagSuccess, flagError } = useFlagSubmission();

  const handleSubmit = async () => {
    if (!reason.trim()) {
      toast.error("Please provide a reason for the dispute");
      return;
    }
    await flagSubmission(briefId, influencer, reason);
  };

  useEffect(() => {
    if (flagSuccess) {
      toast.success("Dispute raised successfully!");
      onClose();
    }
    if (flagError) {
      toast.error(`Failed to raise dispute: ${flagError.message || "Unknown error"}`);
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
            <p className="text-sm text-slate-400">Provide details for flagging this submission</p>
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
        <div className="mb-6">
          <label htmlFor="reason" className="block text-sm font-medium text-slate-300 mb-2">
            Reason for Dispute
          </label>
          <textarea
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full h-24 p-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500/50 transition-all"
            placeholder="Describe why you are flagging this submission (e.g., content does not meet requirements)"
            disabled={isFlagging}
          />
        </div>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isFlagging}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-300 bg-slate-700/50 rounded-xl border border-slate-600/50 hover:bg-slate-700 transition-all disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isFlagging}
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
        </div>
      </motion.div>
    </motion.div>
  );
};