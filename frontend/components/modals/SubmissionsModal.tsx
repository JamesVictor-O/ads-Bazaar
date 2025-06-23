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
  Scale,
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
import { hasPendingDisputes } from "@/utils/campaignUtils";
import { useDivviIntegration } from '@/hooks/useDivviIntegration'

interface SubmissionsModalProps {
  selectedBrief: Brief | null;
  applications: Application[];
  isLoadingApplications: boolean;
  isCompletingCampaign: boolean;
  onReleaseFunds: (briefId: Hex, referralTag?: `0x${string}`) => void; // UPDATED TO ACCEPT REFERRAL TAG
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
  

  const { generateDivviReferralTag, trackTransaction } = useDivviIntegration()

  // Calculate timing information for button state
  const currentTime = Math.floor(Date.now() / 1000);

  // Always call hooks, even if selectedBrief is null
  const proofSubmissionTimeInfo = useMemo(() => {
    if (!selectedBrief || !selectedBrief.proofSubmissionDeadline) return null;

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
    selectedBrief,
    currentTime,
  ]);

  const verificationTimeInfo = useMemo(() => {
    if (!selectedBrief || !selectedBrief.verificationDeadline) return null;

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
    selectedBrief,
    currentTime,
  ]);

  const selectedApplications = applications.filter((app) => app.isSelected);

  // Enhanced dispute analysis
  const disputeAnalysis = useMemo(() => {
    return selectedBrief
      ? hasPendingDisputes(selectedApplications, currentTime)
      : { hasPending: false, pendingCount: 0 };
  }, [selectedBrief, selectedApplications, currentTime]);
  const canAutoApprove = selectedBrief
    ? currentTime > selectedBrief.verificationDeadline
    : false;

  //  Enhanced logic to check for actual submissions 
  const canReleaseFunds = useMemo(() => {
    if (!selectedBrief) {
      return {
        canRelease: false,
        reason: "No campaign selected",
        noSubmissions: true,
      };
    }
    // Can't release if proof submission period still active
    if (currentTime < selectedBrief.proofSubmissionDeadline) {
      return {
        canRelease: false,
        reason: "Proof submission period still active",
        timeRemaining: selectedBrief.proofSubmissionDeadline - currentTime,
      };
    }

    //  Check if there are any submissions to review
    const submissionsWithProof = selectedApplications.filter(
      (app) => app.proofLink && app.proofLink.trim() !== ""
    );

    if (submissionsWithProof.length === 0) {
      return {
        canRelease: false,
        reason: "No proof submissions to review",
        noSubmissions: true,
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
    selectedBrief,
    currentTime,
    selectedApplications,
    disputeAnalysis,
    canAutoApprove,
  ]);

  if (!selectedBrief) return null;

  const handleOpenDisputeModal = (influencer: Hex) => {
    setSelectedInfluencer(influencer);
    setDisputeModalOpen(true);
  };

  // ADDED: Handler to generate referral tag and call onReleaseFunds
  const handleReleaseFunds = async () => {
    // Generate Divvi referral tag to append to transaction calldata
    const referralTag = generateDivviReferralTag();
    console.log('DIVVI: About to release funds with referral tag:', referralTag);
    
    onReleaseFunds(selectedBrief.id, referralTag);
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
      canReleaseFunds.canRelease // Can only dispute during fund release period
    );
  };

  return (
    <>
      {/* Modal overlay */}
      <motion.div
        className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Modal container - Enhanced mobile optimization */}
        <motion.div
          className="bg-slate-800/95 backdrop-blur-xl border border-slate-700/50 rounded-xl sm:rounded-2xl w-full max-w-4xl mx-auto shadow-2xl shadow-emerald-500/10 flex flex-col"
          style={{
            maxHeight: "95vh", // Slightly more space on mobile
            height: "95vh",
          }}
          initial={{ scale: 0.95, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 20 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          {/* Header - More compact on mobile */}
          <div className="flex items-center justify-between p-3 sm:p-6 border-b border-slate-700/50 bg-gradient-to-r from-slate-800 to-slate-900 rounded-t-xl sm:rounded-t-2xl flex-shrink-0">
            <div className="flex-1 min-w-0">
              <h2 className="text-base sm:text-xl font-bold text-white mb-1">
                Campaign Submissions
              </h2>
              <p className="text-emerald-400 font-medium truncate text-sm">
                {selectedBrief.name}
              </p>
              <div className="flex flex-wrap items-center gap-1 sm:gap-4 mt-1.5 sm:mt-2 text-xs text-slate-400">
                <span>
                  {selectedApplications.length} selected
                </span>
                <span>•</span>
                <span>
                  {selectedApplications.filter((app) => app.proofLink).length}{" "}
                  submitted
                </span>
                <span>•</span>
                <span>
                  {selectedApplications.filter((app) => app.isApproved).length}{" "}
                  approved
                </span>
              </div>
            </div>

            {/* Header buttons - More compact */}
            <div className="flex items-center gap-1.5 sm:gap-2 ml-2 sm:ml-4">
              <Link href="/disputeresolution">
                <motion.button
                  className="flex items-center gap-1 px-2 py-1.5 sm:px-3 sm:py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg border border-blue-500/20 transition-all text-xs font-medium"
                  whileTap={{ scale: 0.95 }}
                  title="View Dispute Resolution Dashboard"
                >
                  <Scale className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Disputes</span>
                </motion.button>
              </Link>

              <button
                onClick={onClose}
                className="p-1.5 sm:p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all duration-200 flex-shrink-0"
                disabled={isCompletingCampaign}
                aria-label="Close modal"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>

          {/* Pending Disputes Warning - More compact */}
          {disputeAnalysis.hasPending && (
          <div className="p-2.5 sm:p-4 bg-amber-500/10 border-b border-amber-500/20 flex-shrink-0">
            <div className="flex items-start gap-2 sm:gap-3">
              <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-amber-400 font-medium mb-1 sm:mb-2 text-sm sm:text-base">
                  ⏳ Pending Disputes Block Campaign Completion
                </h3>
                <p className="text-amber-300 text-xs sm:text-sm mb-2 sm:mb-3 leading-relaxed">
                  {disputeAnalysis.pendingCount} dispute(s) must be resolved
                  before you can complete this campaign.
                  {canAutoApprove && " However, you can force completion after the verification period."}
                </p>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  <Link href="/disputeresolution">
                    <button className="text-amber-400 hover:text-amber-300 text-xs sm:text-sm font-medium px-2 py-1 sm:px-3 bg-amber-500/20 rounded">
                      View Disputes →
                    </button>
                  </Link>
                  {canAutoApprove && (
                    <button
                      onClick={handleReleaseFunds} // UPDATED TO USE NEW HANDLER
                      className="text-emerald-400 hover:text-emerald-300 text-xs sm:text-sm font-medium px-2 py-1 sm:px-3 bg-emerald-500/20 rounded"
                      disabled={isCompletingCampaign}
                    >
                      ⚡ Force Complete
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

          {/* Timing Information Section - Mobile optimized grid */}
          <div className="p-2.5 sm:p-4 bg-slate-900/30 border-b border-slate-700/50 flex-shrink-0">
            <div className="grid grid-cols-1 gap-2 sm:gap-4">
              {/* Proof Submission Period */}
              <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-0">
                <div className="p-1.5 sm:p-2 bg-blue-500/10 rounded-lg flex-shrink-0">
                  {proofSubmissionTimeInfo?.hasStarted ? (
                    proofSubmissionTimeInfo.timeRemaining.isExpired ? (
                      <Pause className="w-3 h-3 sm:w-4 sm:h-4 text-slate-500" />
                    ) : (
                      <Timer className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400" />
                    )
                  ) : (
                    <Clock3 className="w-3 h-3 sm:w-4 sm:h-4 text-slate-500" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-slate-300 truncate">
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

              {/* Verification Period */}
              <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-0">
                <div className="p-1.5 sm:p-2 bg-purple-500/10 rounded-lg flex-shrink-0">
                  {verificationTimeInfo?.hasStarted ? (
                    verificationTimeInfo.timeRemaining.isExpired ? (
                      <Pause className="w-3 h-3 sm:w-4 sm:h-4 text-slate-500" />
                    ) : (
                      <CalendarClock className="w-3 h-3 sm:w-4 sm:h-4 text-purple-400" />
                    )
                  ) : (
                    <Clock3 className="w-3 h-3 sm:w-4 sm:h-4 text-slate-500" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-slate-300 truncate">
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

            {/* Status message - More compact */}
            {!canReleaseFunds.canRelease && !canReleaseFunds.noSubmissions && (
              <div className="mt-2 sm:mt-3 p-2 sm:p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4 text-amber-400 flex-shrink-0" />
                  <p className="text-xs sm:text-sm text-amber-400 leading-relaxed">
                    {canReleaseFunds.reason}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Submissions list - Enhanced mobile scrolling */}
          <div className="flex-1 overflow-y-auto min-h-0 overscroll-contain">
            {isLoadingApplications ? (
              <div className="flex flex-col items-center justify-center py-8 sm:py-12 h-full">
                <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-500 animate-spin mb-3 sm:mb-4" />
                <p className="text-slate-400 text-sm sm:text-base">Loading submissions...</p>
              </div>
            ) : selectedApplications.length > 0 ? (
              <div className="divide-y divide-slate-700/50">
                {selectedApplications.map((submission, index) => {
                  const status = getSubmissionStatus(submission);

                  return (
                    <motion.div
                      key={`${submission.influencer}-${index}`}
                      className="p-3 sm:p-6 hover:bg-slate-800/30 transition-all duration-200"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: index * 0.1 }}
                    >
                      <div className="flex flex-col gap-3 sm:gap-4">
                        {/* Influencer info and status - Mobile optimized */}
                        <div className="flex items-start justify-between gap-2 sm:gap-3">
                          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                            <div className="w-7 h-7 sm:w-10 sm:h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center text-white font-medium text-xs sm:text-sm flex-shrink-0">
                              {index + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm sm:text-base font-medium text-white mb-0.5 sm:mb-1">
                                Influencer #{index + 1}
                              </p>
                              <p className="text-xs sm:text-sm text-slate-400 font-mono truncate">
                                {truncateAddress(submission.influencer, 4, 4)}
                              </p>
                            </div>
                          </div>
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full flex items-center flex-shrink-0 ${status.className}`}
                          >
                            {status.icon}
                            <span className="hidden sm:inline">{status.label}</span>
                            <span className="sm:hidden">{status.label.split(' ')[0]}</span>
                          </span>
                        </div>

                        {/* Status grid - Mobile optimized */}
                        <div className="ml-7 sm:ml-13">
                          <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-3 sm:mb-4">
                            <div className="p-2 sm:p-3 bg-slate-900/50 rounded-lg border border-slate-700/50">
                              <p className="text-xs text-slate-400 mb-0.5 sm:mb-1 truncate">
                                Proof
                              </p>
                              <p
                                className={`text-xs sm:text-sm font-medium ${
                                  submission.proofLink
                                    ? "text-emerald-400"
                                    : "text-slate-500"
                                }`}
                              >
                                {submission.proofLink ? "YES" : "NO"}
                              </p>
                            </div>

                            <div className="p-2 sm:p-3 bg-slate-900/50 rounded-lg border border-slate-700/50">
                              <p className="text-xs text-slate-400 mb-0.5 sm:mb-1 truncate">
                                Approved
                              </p>
                              <p
                                className={`text-xs sm:text-sm font-medium ${
                                  submission.isApproved
                                    ? "text-emerald-400"
                                    : "text-slate-500"
                                }`}
                              >
                                {submission.isApproved ? "YES" : "NO"}
                              </p>
                            </div>

                            <div className="p-2 sm:p-3 bg-slate-900/50 rounded-lg border border-slate-700/50">
                              <p className="text-xs text-slate-400 mb-0.5 sm:mb-1 truncate">
                                Dispute
                              </p>
                              <p
                                className={`text-xs sm:text-sm font-medium ${
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
                            <div className="space-y-2 sm:space-y-3">
                              {/* Proof link - Mobile optimized */}
                              <div className="flex items-center gap-2 p-2 sm:p-3 bg-slate-900/50 rounded-lg border border-slate-700/50">
                                <Globe className="w-3 h-3 sm:w-4 sm:h-4 text-slate-400 flex-shrink-0" />
                                <a
                                  href={submission.proofLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-emerald-400 hover:text-emerald-300 transition-colors duration-200 font-medium text-xs sm:text-sm flex-1 truncate"
                                >
                                  View Campaign Post
                                </a>
                                <span className="text-xs text-slate-500 flex-shrink-0">
                                  {format(
                                    new Date(submission.timestamp * 1000),
                                    "MMM d"
                                  )}
                                </span>
                              </div>

                              {/* Dispute info - Mobile optimized */}
                              {submission.disputeStatus ===
                                DisputeStatus.FLAGGED &&
                                submission.disputeReason && (
                                  <div className="p-2 sm:p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                                    <div className="flex items-start gap-2">
                                      <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4 text-red-400 flex-shrink-0 mt-0.5" />
                                      <div className="min-w-0 flex-1">
                                        <p className="text-xs sm:text-sm font-medium text-red-400 mb-1">
                                          Dispute Reason:
                                        </p>
                                        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                                          {submission.disputeReason}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                )}

                              {/* Action buttons - Mobile optimized */}
                              {canReleaseFunds.canRelease && (
                                <div className="flex flex-wrap gap-2">
                                  {canRaiseDispute(submission) && (
                                    <motion.button
                                      onClick={() =>
                                        handleOpenDisputeModal(
                                          submission.influencer
                                        )
                                      }
                                      disabled={isCompletingCampaign}
                                      className="px-3 py-2 text-xs font-medium text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg hover:bg-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-1.5"
                                      whileTap={{ scale: 0.95 }}
                                    >
                                      <Flag className="w-3 h-3" />
                                      <span className="hidden sm:inline">Raise Dispute</span>
                                      <span className="sm:hidden">Dispute</span>
                                    </motion.button>
                                  )}

                                  {submission.disputeStatus ===
                                    DisputeStatus.FLAGGED && (
                                    <div className="px-3 py-2 text-xs font-medium text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center gap-1.5">
                                      <Flag className="w-3 h-3" />
                                      <span className="hidden sm:inline">Dispute Pending</span>
                                      <span className="sm:hidden">Pending</span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}

                          {!submission.proofLink && (
                            <div className="p-3 sm:p-4 bg-amber-500/10 rounded-lg border border-amber-500/20 flex items-start gap-2 sm:gap-3">
                              <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                              <div>
                                <p className="text-xs sm:text-sm font-medium text-amber-400 mb-1">
                                  Awaiting Submission
                                </p>
                                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
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
              <div className="flex flex-col items-center justify-center py-8 sm:py-12 text-slate-400 h-full px-4">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-slate-700/50 rounded-full flex items-center justify-center mb-3 sm:mb-4">
                  <Globe className="w-6 h-6 sm:w-8 sm:h-8 text-slate-500" />
                </div>
                <h3 className="text-base sm:text-lg font-medium text-white mb-2 text-center">
                  No Submissions Yet
                </h3>
                <p className="text-xs sm:text-sm text-center max-w-md leading-relaxed">
                  Selected influencers will appear here once they submit their
                  proof of campaign work. You can then review and approve their
                  submissions.
                </p>
              </div>
            )}
          </div>

          {/* Footer - Mobile optimized */}
          {selectedApplications.length > 0 && (
            <div className="border-t border-slate-700/50 p-3 sm:p-6 bg-slate-800/50 flex-shrink-0">
              <div className="flex flex-col gap-2 sm:gap-4">
                {/* Status message */}
                <div className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  {canReleaseFunds.canRelease || canAutoApprove ? (
                    <span>
                      {canAutoApprove
                        ? "🕒 Verification period complete - you can now finalize all payments"
                        : "✅ Review all submissions and complete the campaign"}
                    </span>
                  ) : canReleaseFunds.noSubmissions ? (
                    <span>
                      📄 Waiting for influencer submissions before campaign can be completed
                    </span>
                  ) : (
                    <span>
                      ⏳ {canReleaseFunds.reason}
                      {canReleaseFunds.timeRemaining &&
                        ` (${formatTimeRemaining(
                          getTimeRemaining(selectedBrief.proofSubmissionDeadline)
                        )} remaining)`}
                    </span>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex gap-2 sm:gap-3">
                  <button
                    onClick={onClose}
                    disabled={isCompletingCampaign}
                    className="flex-1 px-3 py-2 sm:px-6 sm:py-2.5 text-xs sm:text-sm font-medium text-slate-300 bg-slate-700/50 rounded-lg border border-slate-600/50 hover:bg-slate-700 hover:border-slate-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Close
                  </button>

                  <motion.button
                    onClick={handleReleaseFunds} // UPDATED TO USE NEW HANDLER
                    disabled={
                      (!canReleaseFunds.canRelease && !canAutoApprove) ||
                      isCompletingCampaign
                    }
                    className={`flex-1 px-3 py-2 sm:px-6 sm:py-2.5 text-xs sm:text-sm font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-1.5 sm:gap-2 ${
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
                        <span>Processing...</span>
                      </>
                    ) : canAutoApprove ? (
                      <>
                        <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="hidden sm:inline">
                          🕒 Complete & Release Funds
                        </span>
                        <span className="sm:hidden">🕒 Complete</span>
                      </>
                    ) : canReleaseFunds.canRelease ? (
                      <>
                        <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="hidden sm:inline">
                          ✅ Complete & Release Funds
                        </span>
                        <span className="sm:hidden">✅ Complete</span>
                      </>
                    ) : canReleaseFunds.noSubmissions ? (
                      <>
                        <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="hidden sm:inline">
                          📄 Awaiting Submissions
                        </span>
                        <span className="sm:hidden">📄 Waiting</span>
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