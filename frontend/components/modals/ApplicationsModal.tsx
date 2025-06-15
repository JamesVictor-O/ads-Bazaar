"use client";

import { useEffect, useState } from "react";
import { ApplicationsModalProps } from "@/types/index";
import {
  Loader2,
  ExternalLink,
  Check,
  Calendar,
  XCircle,
  Award,
  X,
  AlertTriangle,
  Shield,
} from "lucide-react";
import Image from "next/image";
import { toast } from "react-hot-toast";
import { formatDistanceToNow } from "date-fns";
import { truncateAddress } from "@/utils/format";
import { Hex } from "viem";
import {
  useCancelAdBrief,
  useSelectInfluencer,
  useCompleteCampaign,
} from "@/hooks/adsBazaar";
import { withNetworkGuard } from "@/components/WithNetworkGuard";
import { motion } from "framer-motion";

interface EnhancedApplicationsModalProps extends ApplicationsModalProps {
  guardedAction?: (action: () => Promise<void>) => Promise<void>;
}

const ApplicationsModal = ({
  selectedBrief,
  applications,
  isLoadingApplications,
  onClose,
  guardedAction,
}: EnhancedApplicationsModalProps) => {
  const [pendingIndex, setPendingIndex] = useState<number | null>(null);
  const [transactionPhase, setTransactionPhase] = useState<
    "idle" | "selecting" | "canceling" | "completing"
  >("idle");

  const {
    selectInfluencer,
    isPending: isSelectingInfluencer,
    isSuccess: isInfluencerSelected,
    error: selectError,
  } = useSelectInfluencer();

  const {
    cancelBrief,
    isPending: isCanceling,
    isSuccess: isCanceled,
    error: cancelError,
  } = useCancelAdBrief();

  const {
    completeCampaign,
    isPending: isCompleting,
    isSuccess: isCompleted,
    error: completeError,
  } = useCompleteCampaign();

  // Track transaction phases for better UX
  useEffect(() => {
    if (isSelectingInfluencer && transactionPhase !== "selecting") {
      setTransactionPhase("selecting");
    } else if (isCanceling && transactionPhase !== "canceling") {
      setTransactionPhase("canceling");
    } else if (isCompleting && transactionPhase !== "completing") {
      setTransactionPhase("completing");
    } else if (
      !isSelectingInfluencer &&
      !isCanceling &&
      !isCompleting &&
      transactionPhase !== "idle"
    ) {
      setTransactionPhase("idle");
    }
  }, [isSelectingInfluencer, isCanceling, isCompleting, transactionPhase]);

  // Handle success states
  useEffect(() => {
    if (isInfluencerSelected) {
      toast.success("Influencer assigned successfully!");
      setPendingIndex(null);
      setTransactionPhase("idle");
    }
  }, [isInfluencerSelected]);

  useEffect(() => {
    if (isCanceled) {
      toast.success("Campaign canceled successfully!");
      onClose();
    }
  }, [isCanceled, onClose]);

  useEffect(() => {
    if (isCompleted) {
      toast.success("Campaign completed successfully!");
      onClose();
    }
  }, [isCompleted, onClose]);

  // Handle errors
  useEffect(() => {
    const error = selectError || cancelError || completeError;
    if (!error) return;

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
    setPendingIndex(null);
    setTransactionPhase("idle");
  }, [selectError, cancelError, completeError]);

  const handleAssignInfluencer = async (briefId: Hex, index: number) => {
    if (!guardedAction) {
      toast.error("Network configuration error. Please refresh and try again.");
      return;
    }

    if (applications[index].isSelected) {
      toast.error("Influencer already selected");
      return;
    }

    setPendingIndex(index);

    await guardedAction(async () => {
      await selectInfluencer(briefId, index);
    });
  };

  const handleCancelCampaign = async () => {
    if (!selectedBrief || !guardedAction) {
      toast.error("Network configuration error. Please refresh and try again.");
      return;
    }

    await guardedAction(async () => {
      // @ts-expect-error: Brief ID should be typed but API currently accepts any string
      await cancelBrief(selectedBrief.briefId);
    });
  };

  const handleCompleteCampaign = async () => {
    if (!selectedBrief || !guardedAction) {
      toast.error("Network configuration error. Please refresh and try again.");
      return;
    }

    await guardedAction(async () => {
      // @ts-expect-error: Brief ID should be typed but API currently accepts any string
      await completeCampaign(selectedBrief.briefId);
    });
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

  if (!selectedBrief) return null;

  const maxInfluencers = Number(selectedBrief.maxInfluencers);
  const selectedCount = applications.filter((app) => app.isSelected).length;
  const spotsRemaining = maxInfluencers - selectedCount;

  const deadline = new Date(Number(selectedBrief.applicationDeadline) * 1000);
  const deadlinePassed = deadline < new Date();

  const hasSubmissions = applications.some(
    (app) => app.isSelected && app.hasClaimed
  );

  const showCancelButton =
    deadlinePassed ||
    applications.length === 0 ||
    (selectedCount === 0 && applications.length > 0);

  const showCompleteButton = selectedCount > 0 && hasSubmissions;

  const isTransactionInProgress =
    transactionPhase !== "idle" ||
    isSelectingInfluencer ||
    isCanceling ||
    isCompleting;

  return (
    <motion.div
      className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-opacity duration-300"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-slate-800/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 w-full max-w-2xl mx-auto max-h-[85vh] overflow-hidden flex flex-col shadow-2xl shadow-emerald-500/10"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">
              Applications for {selectedBrief.name}
            </h2>
            <div className="flex items-center text-sm text-slate-400 mt-2 gap-4">
              <span>
                {spotsRemaining > 0
                  ? `${spotsRemaining} spot${
                      spotsRemaining !== 1 ? "s" : ""
                    } remaining out of ${maxInfluencers}`
                  : "All influencer spots filled"}
              </span>
              {deadlinePassed && (
                <div className="flex items-center text-amber-400">
                  <Calendar className="w-4 h-4 mr-1" />
                  <span>Deadline passed</span>
                </div>
              )}
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

        {/* Network Status */}
        {/* Network protection is handled by withNetworkGuard HOC */}

        {/* Transaction Status */}
        {transactionPhase !== "idle" && (
          <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-start">
            <Loader2 className="animate-spin text-emerald-400 mr-3 mt-0.5 flex-shrink-0 w-5 h-5" />
            <div>
              <p className="text-sm font-medium text-emerald-400">
                Transaction in Progress
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {transactionPhase === "selecting" && "Assigning influencer..."}
                {transactionPhase === "canceling" && "Canceling campaign..."}
                {transactionPhase === "completing" && "Completing campaign..."}
              </p>
            </div>
          </div>
        )}

        {/* Applications list */}
        <div className="overflow-y-auto flex-grow">
          {isLoadingApplications ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mb-4" />
              <p className="text-slate-400">Loading applications...</p>
            </div>
          ) : applications && applications.length > 0 ? (
            <div className="space-y-4">
              {applications.map((application, index) => (
                <div
                  key={index}
                  className={`bg-slate-900/50 border ${
                    application.isSelected
                      ? "border-emerald-500/20"
                      : "border-slate-700/50"
                  } rounded-xl p-5 hover:bg-slate-900/80 transition-all duration-200 shadow-sm hover:shadow-md`}
                >
                  <div className="flex flex-col gap-4">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-slate-700/50 rounded-full overflow-hidden flex items-center justify-center">
                          {application.influencerProfile?.avatar ? (
                            <Image
                              src={application.influencerProfile.avatar}
                              alt="Profile"
                              width={48}
                              height={48}
                              className="object-cover"
                            />
                          ) : (
                            <span className="text-sm font-medium text-slate-400">
                              {application.influencer.slice(2, 4).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div>
                          <a
                            href={`/influencer/${application.influencer}`}
                            className="text-sm font-medium text-emerald-400 hover:text-emerald-300 inline-flex items-center transition-colors duration-200"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {application.influencerProfile?.name ||
                              truncateAddress(application.influencer)}
                            <ExternalLink className="w-4 h-4 ml-1" />
                          </a>
                          <p className="text-xs text-slate-400 mt-1">
                            Applied{" "}
                            {formatDistanceToNow(
                              new Date(application.timestamp * 1000),
                              { addSuffix: true }
                            )}
                          </p>
                        </div>
                      </div>
                      <div>
                        {application.isSelected ? (
                          <div className="flex items-center space-x-2 bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full text-xs font-medium border border-emerald-500/20">
                            <Check className="w-4 h-4" />
                            <span>Selected</span>
                          </div>
                        ) : (
                          spotsRemaining > 0 && (
                            <motion.button
                              onClick={() =>
                                handleAssignInfluencer(selectedBrief.id, index)
                              }
                              disabled={
                                isTransactionInProgress ||
                                pendingIndex === index
                              }
                              className={`px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 shadow-md flex items-center gap-2 ${
                                isTransactionInProgress ||
                                pendingIndex === index
                                  ? "bg-slate-600/50 text-slate-400 cursor-not-allowed border border-slate-600/50"
                                  : "text-white bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-emerald-500/25"
                              }`}
                              whileTap={
                                !(
                                  isTransactionInProgress ||
                                  pendingIndex === index
                                )
                                  ? { scale: 0.95 }
                                  : {}
                              }
                            >
                              {pendingIndex === index ? (
                                <>
                                  <Loader2 className="animate-spin h-4 w-4" />
                                  <span>Processing</span>
                                </>
                              ) : (
                                "Assign"
                              )}
                            </motion.button>
                          )
                        )}
                      </div>
                    </div>

                    <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                      <p className="text-sm text-slate-300 whitespace-pre-wrap">
                        {application.message ||
                          "No application message provided"}
                      </p>
                    </div>

                    {application.isSelected && (
                      <div className="space-y-2 border-t border-slate-700/50 pt-3 mt-1">
                        <div className="flex justify-between text-xs text-slate-400">
                          <span>Proof submitted:</span>
                          <span>{application.hasClaimed ? "Yes" : "No"}</span>
                        </div>
                        {application.hasClaimed && (
                          <>
                            <div className="flex justify-between text-xs text-slate-400">
                              <span>Proof approved:</span>
                              <span
                                className={
                                  application.isApproved
                                    ? "text-emerald-400"
                                    : "text-amber-400"
                                }
                              >
                                {application.isApproved ? "Yes" : "Pending"}
                              </span>
                            </div>
                            {application.proofLink && (
                              <a
                                href={application.proofLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-emerald-400 hover:text-emerald-300 inline-flex items-center transition-colors duration-200"
                              >
                                View submission proof
                                <ExternalLink className="w-4 h-4 ml-1" />
                              </a>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <svg
                className="w-16 h-16 mb-4 text-slate-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p className="font-medium">No applications yet</p>
              <p className="text-sm mt-1">Check back later for updates</p>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="mt-6 flex justify-end pt-4 border-t border-slate-700/50 gap-4">
          {showCancelButton && (
            <motion.button
              onClick={handleCancelCampaign}
              disabled={isTransactionInProgress}
              className={`mr-auto px-6 py-3 text-sm font-medium rounded-xl transition-all duration-200 shadow-md flex items-center gap-2 ${
                isTransactionInProgress
                  ? "bg-slate-600/50 text-slate-400 cursor-not-allowed border border-slate-600/50"
                  : "text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-red-500/25"
              }`}
              whileTap={!isTransactionInProgress ? { scale: 0.95 } : {}}
            >
              {transactionPhase === "canceling" ? (
                <>
                  <Loader2 className="animate-spin h-4 w-4" />
                  <span>Canceling...</span>
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4" />
                  <span>Cancel Campaign</span>
                </>
              )}
            </motion.button>
          )}

          {showCompleteButton && (
            <motion.button
              onClick={handleCompleteCampaign}
              disabled={isTransactionInProgress}
              className={`px-6 py-3 text-sm font-medium rounded-xl transition-all duration-200 shadow-md flex items-center gap-2 ${
                isTransactionInProgress
                  ? "bg-slate-600/50 text-slate-400 cursor-not-allowed border border-slate-600/50"
                  : "text-white bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-emerald-500/25"
              }`}
              whileTap={!isTransactionInProgress ? { scale: 0.95 } : {}}
            >
              {transactionPhase === "completing" ? (
                <>
                  <Loader2 className="animate-spin h-4 w-4" />
                  <span>Completing...</span>
                </>
              ) : (
                <>
                  <Award className="h-4 w-4" />
                  <span>Complete Campaign</span>
                </>
              )}
            </motion.button>
          )}

          <button
            onClick={onClose}
            disabled={isTransactionInProgress}
            className="px-6 py-3 text-sm font-medium text-slate-300 bg-slate-700/50 rounded-xl border border-slate-600/50 hover:bg-slate-700 hover:border-slate-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default withNetworkGuard(ApplicationsModal);
