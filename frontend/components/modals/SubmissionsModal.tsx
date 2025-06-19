// Enhanced SubmissionsModal.tsx with fixes for issues 2, 3, 4, and 5

"use client";

import { useState, useMemo } from "react";
import {
  CheckCircle,
  Clock,
  Globe,
  X,
  AlertTriangle,
  Loader2,
  Eye,
  Flag,
  Timer,
  CalendarClock,
  ExternalLink,
  Scale,
  Play,
  Pause,
  Clock3,
} from "lucide-react";
import { Brief, Application, DisputeStatus } from "@/types/index";
import { Hex } from "viem";
import DisputeModal from "./DisputeModal";
import { motion } from "framer-motion";
import { format } from "date-fns";
import {
  truncateAddress,
  formatTimeRemaining,
  getTimeRemaining,
} from "@/utils/format";
import Link from "next/link";
import {
  useHasPendingDisputes,
  usePendingDisputeCount,
} from "@/hooks/adsBazaar";
import { hasPendingDisputes } from "@/utils/campaignUtils";

interface SubmissionsModalProps {
  selectedBrief: Brief | null;
  applications: Application[];
  isLoadingApplications: boolean;
  isCompletingCampaign: boolean;
  onReleaseFunds: (briefId: Hex) => void;
  onClose: () => void;
}

export const SubmissionsModal = ({
  selectedBrief,
  applications,
  isLoadingApplications,
  isCompletingCampaign,
  onReleaseFunds,
  onClose,
}: SubmissionsModalProps) => {
  const [disputeModalOpen, setDisputeModalOpen] = useState(false);
  const [selectedInfluencer, setSelectedInfluencer] = useState<Hex | null>(
    null
  );
  const { hasPendingDisputes: contractHasPending, isLoadingPendingCheck } =
    useHasPendingDisputes(selectedBrief?.id || "0x0");

  const { pendingDisputeCount, isLoadingCount } = usePendingDisputeCount(
    selectedBrief?.id || "0x0"
  );

  if (!selectedBrief) return null;

  const selectedApplications = applications.filter((app) => app.isSelected);

  // Calculate timing information for button state
  const currentTime = Math.floor(Date.now() / 1000);

  // Enhanced dispute analysis
  const disputeAnalysis = hasPendingDisputes(selectedApplications, currentTime);
  const canAutoApprove = currentTime > selectedBrief.verificationDeadline;

  // Enhanced timing calculations
  const proofSubmissionTimeInfo = useMemo(() => {
    if (!selectedBrief.proofSubmissionDeadline) return null;

    const hasStarted = currentTime >= selectedBrief.promotionEndTime;
    const timeRemaining = getTimeRemaining(
      selectedBrief.proofSubmissionDeadline
    );

    return {
      hasStarted,
      timeRemaining,
      label: hasStarted
        ? timeRemaining.isExpired
          ? "Ended"
          : `Ends in ${formatTimeRemaining(timeRemaining)}`
        : "Not Started",
    };
  }, [
    selectedBrief.proofSubmissionDeadline,
    selectedBrief.promotionEndTime,
    currentTime,
  ]);

  const verificationTimeInfo = useMemo(() => {
    if (!selectedBrief.verificationDeadline) return null;

    const hasStarted = currentTime >= selectedBrief.proofSubmissionDeadline;
    const timeRemaining = getTimeRemaining(selectedBrief.verificationDeadline);

    return {
      hasStarted,
      timeRemaining,
      label: hasStarted
        ? timeRemaining.isExpired
          ? "Ended"
          : `Auto-approval in ${formatTimeRemaining(timeRemaining)}`
        : "Not Started",
    };
  }, [
    selectedBrief.verificationDeadline,
    selectedBrief.proofSubmissionDeadline,
    currentTime,
  ]);

  const canReleaseFunds = useMemo(() => {
    // Can't release if proof submission period still active
    if (currentTime < selectedBrief.proofSubmissionDeadline) {
      return {
        canRelease: false,
        reason: "Proof submission period still active",
        timeRemaining: selectedBrief.proofSubmissionDeadline - currentTime,
      };
    }
    // Can't manually complete if there are pending disputes
    if (disputeAnalysis.hasPending && !canAutoApprove) {
      return {
        canRelease: false,
        reason: `${disputeAnalysis.pendingCount} dispute(s) pending resolution`,
        pendingDisputes: disputeAnalysis.pendingCount,
      };
    }

    return { canRelease: true };
  }, [
    currentTime,
    selectedBrief.proofSubmissionDeadline,
    disputeAnalysis,
    canAutoApprove,
  ]);

  const handleOpenDisputeModal = (influencer: Hex) => {
    setSelectedInfluencer(influencer);
    setDisputeModalOpen(true);
  };

  const getSubmissionStatus = (submission: Application) => {
    if (submission.disputeStatus === DisputeStatus.FLAGGED) {
      return {
        label: "Disputed",
        icon: <Flag size={14} className="mr-1" />,
        className: "bg-red-500/10 text-red-400 border border-red-500/20",
      };
    }
    if (submission.disputeStatus === DisputeStatus.RESOLVED_INVALID) {
      return {
        label: "Rejected",
        icon: <X size={14} className="mr-1" />,
        className: "bg-red-500/10 text-red-400 border border-red-500/20",
      };
    }
    if (submission.isApproved) {
      return {
        label: "Approved & Paid",
        icon: <CheckCircle size={14} className="mr-1" />,
        className:
          "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
      };
    }
    if (isCompletingCampaign) {
      return {
        label: "Processing",
        icon: <Loader2 size={14} className="mr-1 animate-spin" />,
        className: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
      };
    }
    if (submission.proofLink) {
      return {
        label: "Under Review",
        icon: <Eye size={14} className="mr-1" />,
        className: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
      };
    }
    return {
      label: "Awaiting Proof",
      icon: <Clock size={14} className="mr-1" />,
      className: "bg-slate-500/10 text-slate-400 border border-slate-500/20",
    };
  };

  // Enhanced dispute logic - Fix for issue #3
  const canRaiseDispute = (submission: Application) => {
    return (
      submission.proofLink &&
      !submission.isApproved &&
      submission.disputeStatus === DisputeStatus.NONE && // Can't dispute if already flagged
      !isCompletingCampaign &&
      canReleaseFunds // Can only dispute during fund release period
    );
  };

  return (
    <>
      {/* Modal overlay */}
      <motion.div
        className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Modal container  */}
        <motion.div
          className="bg-slate-800/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl w-full max-w-4xl mx-auto shadow-2xl shadow-emerald-500/10 flex flex-col"
          style={{
            maxHeight: "90vh", // Explicit max height
            height: "90vh", // Fixed height for better mobile handling
          }}
          initial={{ scale: 0.95, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 20 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-700/50 bg-gradient-to-r from-slate-800 to-slate-900 rounded-t-2xl flex-shrink-0">
            <div className="flex-1 min-w-0">
              <h2 className="text-lg sm:text-xl font-bold text-white mb-1">
                Campaign Submissions
              </h2>
              <p className="text-emerald-400 font-medium truncate text-sm sm:text-base">
                {selectedBrief.name}
              </p>
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2 text-xs sm:text-sm text-slate-400">
                <span>
                  {selectedApplications.length} selected influencer
                  {selectedApplications.length !== 1 ? "s" : ""}
                </span>
                <span>•</span>
                <span>
                  {selectedApplications.filter((app) => app.proofLink).length}{" "}
                  submitted proof
                </span>
                <span>•</span>
                <span>
                  {selectedApplications.filter((app) => app.isApproved).length}{" "}
                  approved
                </span>
              </div>
            </div>

            {/* Dispute Resolution Link - Fix for issue #4 */}
            <div className="flex items-center gap-2 ml-4">
              <Link href="/disputeresolution">
                <motion.button
                  className="flex items-center gap-1.5 px-3 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg border border-blue-500/20 transition-all text-xs sm:text-sm font-medium"
                  whileTap={{ scale: 0.95 }}
                  title="View Dispute Resolution Dashboard"
                >
                  <Scale className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Disputes</span>
                </motion.button>
              </Link>

              <button
                onClick={onClose}
                className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all duration-200 flex-shrink-0"
                disabled={isCompletingCampaign}
                aria-label="Close modal"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>

          {/* Pending Disputes Warning */}
          {disputeAnalysis.hasPending && (
            <div className="p-3 sm:p-4 bg-amber-500/10 border-b border-amber-500/20 flex-shrink-0">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="text-amber-400 font-medium mb-2">
                    ⏳ Pending Disputes Block Manual Completion
                  </h3>
                  <p className="text-amber-300 text-sm mb-3">
                    {disputeAnalysis.pendingCount} dispute(s) must be resolved
                    before you can complete this campaign manually.
                    {canAutoApprove && " However, auto-approval is available."}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Link href="/disputeresolution">
                      <button className="text-amber-400 hover:text-amber-300 text-sm font-medium px-3 py-1 bg-amber-500/20 rounded">
                        View Disputes →
                      </button>
                    </Link>
                    {canAutoApprove && (
                      <button
                        onClick={() => onReleaseFunds(selectedBrief.id)}
                        className="text-emerald-400 hover:text-emerald-300 text-sm font-medium px-3 py-1 bg-emerald-500/20 rounded"
                        disabled={isCompletingCampaign}
                      >
                        ⚡ Trigger Auto-Approval
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Auto-approval Notice */}
          {canAutoApprove && !disputeAnalysis.hasPending && (
            <div className="p-3 sm:p-4 bg-blue-500/10 border-b border-blue-500/20 flex-shrink-0">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-blue-400 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="text-blue-400 font-medium mb-2">
                    🤖 Auto-Approval Available
                  </h4>
                  <p className="text-blue-300 text-sm">
                    The verification deadline has passed. Auto-approval will
                    finalize all payments and handle expired disputes
                    automatically.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Timing Information Section - Fix for issue #5 */}
          <div className="p-3 sm:p-4 bg-slate-900/30 border-b border-slate-700/50 flex-shrink-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  {proofSubmissionTimeInfo?.hasStarted ? (
                    proofSubmissionTimeInfo.timeRemaining.isExpired ? (
                      <Pause className="w-4 h-4 text-slate-500" />
                    ) : (
                      <Timer className="w-4 h-4 text-blue-400" />
                    )
                  ) : (
                    <Clock3 className="w-4 h-4 text-slate-500" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-300">
                    Proof Submission Period
                  </p>
                  <p
                    className={`text-xs ${
                      proofSubmissionTimeInfo?.hasStarted
                        ? proofSubmissionTimeInfo.timeRemaining.isExpired
                          ? "text-slate-500"
                          : "text-amber-400"
                        : "text-slate-500"
                    }`}
                  >
                    {proofSubmissionTimeInfo?.label || "Not Started"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  {verificationTimeInfo?.hasStarted ? (
                    verificationTimeInfo.timeRemaining.isExpired ? (
                      <Pause className="w-4 h-4 text-slate-500" />
                    ) : (
                      <CalendarClock className="w-4 h-4 text-purple-400" />
                    )
                  ) : (
                    <Clock3 className="w-4 h-4 text-slate-500" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-300">
                    Verification Period
                  </p>
                  <p
                    className={`text-xs ${
                      verificationTimeInfo?.hasStarted
                        ? verificationTimeInfo.timeRemaining.isExpired
                          ? "text-slate-500"
                          : "text-purple-400"
                        : "text-slate-500"
                    }`}
                  >
                    {verificationTimeInfo?.label || "Not Started"}
                  </p>
                </div>
              </div>
            </div>

            {!canReleaseFunds && (
              <div className="mt-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <p className="text-sm text-amber-400">
                    Funds can only be released after proof submission period
                    ends
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Submissions list - Scrollable area */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {isLoadingApplications ? (
              <div className="flex flex-col items-center justify-center py-12 h-full">
                <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mb-4" />
                <p className="text-slate-400">Loading submissions...</p>
              </div>
            ) : selectedApplications.length > 0 ? (
              <div className="divide-y divide-slate-700/50">
                {selectedApplications.map((submission, index) => {
                  const status = getSubmissionStatus(submission);

                  return (
                    <motion.div
                      key={`${submission.influencer}-${index}`}
                      className="p-4 sm:p-6 hover:bg-slate-800/30 transition-all duration-200"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: index * 0.1 }}
                    >
                      <div className="flex flex-col gap-4">
                        {/* Influencer info and status */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center text-white font-medium text-xs sm:text-sm">
                              {index + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm sm:text-base font-medium text-white mb-1">
                                Influencer #{index + 1}
                              </p>
                              <p className="text-xs sm:text-sm text-slate-400 font-mono">
                                {truncateAddress(submission.influencer)}
                              </p>
                            </div>
                          </div>
                          <span
                            className={`px-2 sm:px-3 py-1 sm:py-1.5 text-xs font-medium rounded-full flex items-center flex-shrink-0 ${status.className}`}
                          >
                            {status.icon}
                            {status.label}
                          </span>
                        </div>

                        {/* Enhanced status grid */}
                        <div className="ml-8 sm:ml-13">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4">
                            <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-700/50">
                              <p className="text-xs text-slate-400 mb-1">
                                Proof Submitted
                              </p>
                              <p
                                className={`text-sm font-medium ${
                                  submission.proofLink
                                    ? "text-emerald-400"
                                    : "text-slate-500"
                                }`}
                              >
                                {submission.proofLink ? "YES" : "NO"}
                              </p>
                            </div>

                            <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-700/50">
                              <p className="text-xs text-slate-400 mb-1">
                                Proof Approved
                              </p>
                              <p
                                className={`text-sm font-medium ${
                                  submission.isApproved
                                    ? "text-emerald-400"
                                    : "text-slate-500"
                                }`}
                              >
                                {submission.isApproved ? "YES" : "NO"}
                              </p>
                            </div>

                            <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-700/50">
                              <p className="text-xs text-slate-400 mb-1">
                                Dispute Status
                              </p>
                              <p
                                className={`text-sm font-medium ${
                                  submission.disputeStatus ===
                                  DisputeStatus.NONE
                                    ? "text-slate-500"
                                    : submission.disputeStatus ===
                                      DisputeStatus.FLAGGED
                                    ? "text-amber-400"
                                    : submission.disputeStatus ===
                                      DisputeStatus.RESOLVED_VALID
                                    ? "text-emerald-400"
                                    : "text-red-400"
                                }`}
                              >
                                {submission.disputeStatus === DisputeStatus.NONE
                                  ? "None"
                                  : submission.disputeStatus ===
                                    DisputeStatus.FLAGGED
                                  ? "Flagged"
                                  : submission.disputeStatus ===
                                    DisputeStatus.RESOLVED_VALID
                                  ? "Valid"
                                  : "Invalid"}
                              </p>
                            </div>
                          </div>

                          {submission.proofLink && (
                            <div className="space-y-3">
                              {/* Proof link */}
                              <div className="flex items-center gap-2 p-3 bg-slate-900/50 rounded-lg border border-slate-700/50">
                                <Globe className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                <a
                                  href={submission.proofLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-emerald-400 hover:text-emerald-300 transition-colors duration-200 font-medium text-sm flex-1 truncate"
                                >
                                  View Campaign Post
                                </a>
                                <div className="w-1 h-1 bg-slate-600 rounded-full"></div>
                                <span className="text-xs text-slate-500">
                                  {format(
                                    new Date(submission.timestamp * 1000),
                                    "MMM d, HH:mm"
                                  )}
                                </span>
                              </div>

                              {/* Dispute info */}
                              {submission.disputeStatus ===
                                DisputeStatus.FLAGGED &&
                                submission.disputeReason && (
                                  <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                                    <div className="flex items-start gap-2">
                                      <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                                      <div>
                                        <p className="text-sm font-medium text-red-400 mb-1">
                                          Dispute Reason:
                                        </p>
                                        <p className="text-sm text-slate-300">
                                          {submission.disputeReason}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                )}

                              {/* Action buttons - Enhanced dispute logic */}
                              {canReleaseFunds && (
                                <div className="flex gap-2">
                                  {canRaiseDispute(submission) && (
                                    <motion.button
                                      onClick={() =>
                                        handleOpenDisputeModal(
                                          submission.influencer
                                        )
                                      }
                                      disabled={isCompletingCampaign}
                                      className="px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg hover:bg-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2"
                                      whileTap={{ scale: 0.95 }}
                                    >
                                      <Flag className="w-3 h-3 sm:w-4 sm:h-4" />
                                      Raise Dispute
                                    </motion.button>
                                  )}

                                  {submission.disputeStatus ===
                                    DisputeStatus.FLAGGED && (
                                    <div className="px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center gap-2">
                                      <Flag className="w-3 h-3 sm:w-4 sm:h-4" />
                                      Dispute Pending
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}

                          {!submission.proofLink && (
                            <div className="p-4 bg-amber-500/10 rounded-lg border border-amber-500/20 flex items-start gap-3">
                              <Clock className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                              <div>
                                <p className="text-sm font-medium text-amber-400 mb-1">
                                  Awaiting Submission
                                </p>
                                <p className="text-sm text-slate-300">
                                  This influencer has not yet submitted proof of
                                  their campaign work.
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400 h-full">
                <div className="w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center mb-4">
                  <Globe className="w-8 h-8 text-slate-500" />
                </div>
                <h3 className="text-lg font-medium text-white mb-2">
                  No Submissions Yet
                </h3>
                <p className="text-sm text-center max-w-md leading-relaxed">
                  Selected influencers will appear here once they submit their
                  proof of campaign work. You can then review and approve their
                  submissions.
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          {selectedApplications.length > 0 && (
            <div className="border-t border-slate-700/50 p-4 sm:p-6 bg-slate-800/50 flex-shrink-0">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                <div className="text-xs sm:text-sm text-slate-400">
                  {canReleaseFunds.canRelease || canAutoApprove ? (
                    <span>
                      {canAutoApprove
                        ? "🤖 Auto-approval will process all valid submissions and expire unresolved disputes"
                        : "✅ Review all submissions and release funds for approved work"}
                    </span>
                  ) : (
                    <span>
                      ⏳ {canReleaseFunds.reason}
                      {canReleaseFunds.timeRemaining &&
                        ` (${formatTimeRemaining(
                          getTimeRemaining(
                            selectedBrief.proofSubmissionDeadline
                          )
                        )} remaining)`}
                    </span>
                  )}
                </div>

                <div className="flex gap-3 w-full sm:w-auto">
                  <button
                    onClick={onClose}
                    disabled={isCompletingCampaign}
                    className="flex-1 sm:flex-none px-4 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-medium text-slate-300 bg-slate-700/50 rounded-lg border border-slate-600/50 hover:bg-slate-700 hover:border-slate-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Close
                  </button>

                  <motion.button
                    onClick={() => onReleaseFunds(selectedBrief.id)}
                    disabled={
                      (!canReleaseFunds.canRelease && !canAutoApprove) ||
                      isCompletingCampaign
                    }
                    className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2 ${
                      (canReleaseFunds.canRelease || canAutoApprove) &&
                      !isCompletingCampaign
                        ? "text-white bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-md shadow-emerald-500/25"
                        : "bg-slate-600/50 text-slate-400 cursor-not-allowed border border-slate-600/50"
                    }`}
                    whileTap={
                      (canReleaseFunds.canRelease || canAutoApprove) &&
                      !isCompletingCampaign
                        ? { scale: 0.95 }
                        : {}
                    }
                  >
                    {isCompletingCampaign ? (
                      <>
                        <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
                        <span className="hidden sm:inline">Processing...</span>
                        <span className="sm:hidden">Processing...</span>
                      </>
                    ) : canAutoApprove ? (
                      <>
                        <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="hidden sm:inline">
                          🤖 Auto-Approve & Release Funds
                        </span>
                        <span className="sm:hidden">🤖 Auto-Approve</span>
                      </>
                    ) : canReleaseFunds.canRelease ? (
                      <>
                        <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="hidden sm:inline">
                          ✅ Complete & Release Funds
                        </span>
                        <span className="sm:hidden">✅ Complete</span>
                      </>
                    ) : (
                      <>
                        <Timer className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="hidden sm:inline">
                          ⏳ {canReleaseFunds.reason}
                        </span>
                        <span className="sm:hidden">⏳ Waiting</span>
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>

      {/* Dispute Modal */}
      {disputeModalOpen && selectedInfluencer && (
        <DisputeModal
          briefId={selectedBrief.id}
          influencer={selectedInfluencer}
          onClose={() => {
            setDisputeModalOpen(false);
            setSelectedInfluencer(null);
          }}
        />
      )}
    </>
  );
};
