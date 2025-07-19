"use client";

import { useEffect, useState } from "react";
import { ApplicationsModalProps } from "@/types/index";
import {
  Loader2,
  Check,
  XCircle,
  Award,
  X,
  AlertTriangle,
  CheckCircle,
  Upload,
  Eye,
  FileText,
  Clock,
  ArrowRight,
} from "lucide-react";
import Image from "next/image";
import { toast } from "react-hot-toast";
import { formatDistanceToNow } from "date-fns";
import { truncateAddress } from "@/utils/format";
import { UserDisplay } from "@/components/ui/UserDisplay";
import { Hex } from "viem";
import { useSelectInfluencer } from "@/hooks/adsBazaar";
import { withNetworkGuard } from "@/components/WithNetworkGuard";
import { motion } from "framer-motion";
import { handleTransactionSuccess } from "@/utils/transactionUtils";
import { useDivviIntegration } from "@/hooks/useDivviIntegration";
import Link from "next/link";

interface EnhancedApplicationsModalProps extends ApplicationsModalProps {
  guardedAction?: (action: () => Promise<void>) => Promise<void>;
  showOnlySelected?: boolean;
  onAssignSuccess?: () => void;
}

const ApplicationsModal = ({
  selectedBrief,
  applications,
  isLoadingApplications,
  onClose,
  guardedAction,
  showOnlySelected = false,
  onAssignSuccess,
}: EnhancedApplicationsModalProps) => {
  const [pendingIndex, setPendingIndex] = useState<number | null>(null);
  const [transactionPhase, setTransactionPhase] = useState<
    "idle" | "selecting"
  >("idle");
  const [successfullyAssignedIndices, setSuccessfullyAssignedIndices] = useState<Set<number>>(new Set());

  const { generateDivviReferralTag, trackTransaction } = useDivviIntegration();

  // Filter applications based on showOnlySelected prop
  const filteredApplications = showOnlySelected
    ? applications.filter((app) => app.isSelected)
    : applications;

  const {
    selectInfluencer,
    isPending: isSelectingInfluencer,
    isSuccess: isInfluencerSelected,
    error: selectError,
    hash: selectHash,
  } = useSelectInfluencer();

  useEffect(() => {
    if (selectHash) {
      console.log('DIVVI: Hash available from select influencer:', selectHash);
      trackTransaction(selectHash);
    }
  }, [selectHash, trackTransaction]);

  // Track transaction phases for better UX
  useEffect(() => {
    if (isSelectingInfluencer && transactionPhase !== "selecting") {
      setTransactionPhase("selecting");
    } else if (!isSelectingInfluencer && transactionPhase !== "idle") {
      setTransactionPhase("idle");
    }
  }, [isSelectingInfluencer, transactionPhase]);

  // Handle success states
  useEffect(() => {
    if (isInfluencerSelected && pendingIndex !== null) {
      toast.success("Influencer assigned successfully!");
      
      // Mark this index as successfully assigned
      setSuccessfullyAssignedIndices(prev => new Set(prev).add(pendingIndex));
      
      // Use standardized transaction success handler
      handleTransactionSuccess({
        immediateActions: [
          () => {
            if (onAssignSuccess) {
              onAssignSuccess();
            }
          }
        ],
        delayedActions: [
          () => {
            if (onAssignSuccess) {
              onAssignSuccess();
            }
          }
        ],
        triggerGlobalRefresh: true,
        propagationDelay: 2000
      });
      
      setPendingIndex(null);
      setTransactionPhase("idle");
    }
  }, [isInfluencerSelected, pendingIndex, onAssignSuccess]);

  // Reset local state when modal opens/applications change
  useEffect(() => {
    setSuccessfullyAssignedIndices(new Set());
    setPendingIndex(null);
    setTransactionPhase("idle");
  }, [applications]);

  // Handle errors
  useEffect(() => {
    const error = selectError;
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
  }, [selectError]);

  const handleAssignInfluencer = async (briefId: Hex, index: number) => {
    if (!guardedAction) {
      toast.error("Network configuration error. Please refresh and try again.");
      return;
    }

    if (filteredApplications[index].isSelected) {
      toast.error("Influencer already selected");
      return;
    }

    setPendingIndex(index);
    

    await guardedAction(async () => {
      // Generate Divvi referral tag to append to transaction calldata
      const referralTag = generateDivviReferralTag();
      console.log('DIVVI: About to apply to brief with referral tag:', referralTag);
      await selectInfluencer(briefId, index, referralTag);
      
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

  // Get proof submission status with clear YES/NO
  const getProofSubmissionStatus = (application: { proofLink?: string }) => {
    if (application.proofLink && application.proofLink.trim() !== "") {
      return {
        status: "YES",
        className: "text-emerald-400 font-semibold",
        icon: <CheckCircle className="w-4 h-4 text-emerald-400" />,
      };
    }
    return {
      status: "NO",
      className: "text-slate-500 font-medium",
      icon: <XCircle className="w-4 h-4 text-slate-500" />,
    };
  };

  if (!selectedBrief) return null;

  const maxInfluencers = Number(selectedBrief.maxInfluencers);
  const selectedCount = applications.filter((app) => app.isSelected).length;
  const spotsRemaining = maxInfluencers - selectedCount;

  const isTransactionInProgress =
    transactionPhase !== "idle" || isSelectingInfluencer;

  return (
    <motion.div
      className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-opacity duration-300"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-slate-800/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 w-full max-w-4xl mx-auto max-h-[85vh] overflow-hidden flex flex-col shadow-2xl shadow-emerald-500/10"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">
              {showOnlySelected ? "Selected Applications" : "All Applications"}{" "}
              for {selectedBrief.name}
            </h2>
            <div className="flex items-center text-sm text-slate-400 mt-2 gap-4">
              <span>
                {showOnlySelected
                  ? `${selectedCount} selected influencer${
                      selectedCount !== 1 ? "s" : ""
                    }`
                  : spotsRemaining > 0
                  ? `${spotsRemaining} spot${
                      spotsRemaining !== 1 ? "s" : ""
                    } remaining out of ${maxInfluencers}`
                  : "All influencer spots filled"}
              </span>
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
          ) : filteredApplications && filteredApplications.length > 0 ? (
            <div className="space-y-4">
              {filteredApplications.map((application, index) => {
                const proofStatus = getProofSubmissionStatus(application);

                return (
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
                                {application.influencer
                                  .slice(2, 4)
                                  .toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div>
                            <Link
                              href={`/influencer/${application.influencer}?from=applications&briefId=${selectedBrief?.id}&appIndex=${index}&maxInfluencers=${selectedBrief?.maxInfluencers || 1}`}
                              className="text-sm font-medium text-emerald-400 hover:text-emerald-300 inline-flex items-center transition-colors duration-200"
                            >
                              {application.influencerProfile?.name ||
                                <UserDisplay address={application.influencer} />}
                              <ArrowRight className="w-4 h-4 ml-1" />
                            </Link>
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
                          {application.isSelected || successfullyAssignedIndices.has(index) ? (
                            <div className="flex items-center space-x-2 bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full text-xs font-medium border border-emerald-500/20">
                              <Check className="w-4 h-4" />
                              <span>Selected</span>
                            </div>
                          ) : (
                            !showOnlySelected &&
                            spotsRemaining > 0 && (
                              <motion.button
                                onClick={() =>
                                  handleAssignInfluencer(
                                    selectedBrief.id,
                                    index
                                  )
                                }
                                disabled={
                                  isTransactionInProgress ||
                                  pendingIndex === index ||
                                  successfullyAssignedIndices.has(index)
                                }
                                className={`px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 shadow-md flex items-center gap-2 ${
                                  isTransactionInProgress ||
                                  pendingIndex === index ||
                                  successfullyAssignedIndices.has(index)
                                    ? "bg-slate-600/50 text-slate-400 cursor-not-allowed border border-slate-600/50"
                                    : "text-white bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-emerald-500/25"
                                }`}
                                whileTap={
                                  !(
                                    isTransactionInProgress ||
                                    pendingIndex === index ||
                                    successfullyAssignedIndices.has(index)
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
                                ) : successfullyAssignedIndices.has(index) ? (
                                  <>
                                    <Check className="h-4 w-4" />
                                    <span>Assigned</span>
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

                      {/* Enhanced status section  */}
                      {application.isSelected && (
                        <div className="space-y-3 border-t border-slate-700/50 pt-4">
                          {/* Status Grid */}
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                            <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-700/50">
                              <div className="flex items-center gap-2 mb-1">
                                <FileText className="w-4 h-4 text-slate-400" />
                                <p className="text-xs text-slate-400 font-medium">
                                  PROOF SUBMITTED
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                {proofStatus.icon}
                                <p
                                  className={`text-sm ${proofStatus.className}`}
                                >
                                  {proofStatus.status}
                                </p>
                              </div>
                            </div>

                            <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-700/50">
                              <div className="flex items-center gap-2 mb-1">
                                <CheckCircle className="w-4 h-4 text-slate-400" />
                                <p className="text-xs text-slate-400 font-medium">
                                  PROOF APPROVED
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                {application.isApproved ? (
                                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                                ) : (
                                  <XCircle className="w-4 h-4 text-slate-500" />
                                )}
                                <p
                                  className={`text-sm font-medium ${
                                    application.isApproved
                                      ? "text-emerald-400"
                                      : "text-slate-500"
                                  }`}
                                >
                                  {application.isApproved ? "YES" : "NO"}
                                </p>
                              </div>
                            </div>

                            <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-700/50">
                              <div className="flex items-center gap-2 mb-1">
                                <Award className="w-4 h-4 text-slate-400" />
                                <p className="text-xs text-slate-400 font-medium">
                                  PAYMENT CLAIMED
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                {application.hasClaimed ? (
                                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                                ) : (
                                  <Clock className="w-4 h-4 text-slate-500" />
                                )}
                                <p
                                  className={`text-sm font-medium ${
                                    application.hasClaimed
                                      ? "text-emerald-400"
                                      : "text-slate-500"
                                  }`}
                                >
                                  {application.hasClaimed ? "YES" : "PENDING"}
                                </p>
                              </div>
                            </div>

                            <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-700/50">
                              <div className="flex items-center gap-2 mb-1">
                                <AlertTriangle className="w-4 h-4 text-slate-400" />
                                <p className="text-xs text-slate-400 font-medium">
                                  STATUS
                                </p>
                              </div>
                              <p className="text-sm font-medium text-blue-400">
                                {application.isApproved
                                  ? "Completed"
                                  : application.proofLink
                                  ? "Under Review"
                                  : "Awaiting Proof"}
                              </p>
                            </div>
                          </div>

                          {/* Proof Link Display */}
                          {application.proofLink && (
                            <div className="p-3 bg-emerald-500/5 rounded-lg border border-emerald-500/20">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Upload className="w-4 h-4 text-emerald-400" />
                                  <span className="text-sm text-emerald-400 font-medium">
                                    Proof Submitted
                                  </span>
                                </div>
                                <a
                                  href={application.proofLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 text-sm transition-colors"
                                >
                                  <Eye className="w-4 h-4" />
                                  View Content
                                </a>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
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
              <p className="font-medium">
                {showOnlySelected
                  ? "No selected applications"
                  : "No applications yet"}
              </p>
              <p className="text-sm mt-1">
                {showOnlySelected
                  ? "You haven't selected any influencers yet"
                  : "Check back later for updates"}
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default withNetworkGuard(ApplicationsModal);
