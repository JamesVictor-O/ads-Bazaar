"use client";

import { useState } from "react";
import {
  CheckCircle,
  Clock,
  Globe,
  X,
  AlertTriangle,
  Loader2,
  Eye,
  Flag,
} from "lucide-react";
import { Brief, Application, DisputeStatus } from "@/types/index";
import { Hex } from "viem";
import DisputeModal from "./DisputeModal";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { truncateAddress } from "@/utils/format";

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

  if (!selectedBrief) return null;

  const selectedApplications = applications.filter((app) => app.isSelected);

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

  const canReleaseOrDispute = (submission: Application) => {
    return (
      submission.proofLink &&
      !submission.isApproved &&
      submission.disputeStatus !== DisputeStatus.FLAGGED &&
      submission.disputeStatus !== DisputeStatus.RESOLVED_INVALID &&
      !isCompletingCampaign
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
        {/* Modal container */}
        <motion.div
          className="bg-slate-800/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl w-full max-w-2xl mx-auto max-h-[90vh] overflow-hidden shadow-2xl shadow-emerald-500/10"
          initial={{ scale: 0.95, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 20 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-700/50 bg-gradient-to-r from-slate-800 to-slate-900">
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-white mb-1">
                Campaign Submissions
              </h2>
              <p className="text-emerald-400 font-medium truncate">
                {selectedBrief.name}
              </p>
              <div className="flex items-center gap-4 mt-2 text-sm text-slate-400">
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
            <button
              onClick={onClose}
              className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all duration-200 flex-shrink-0"
              disabled={isCompletingCampaign}
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Submissions list */}
          <div className="overflow-y-auto max-h-[calc(90vh-200px)]">
            {isLoadingApplications ? (
              <div className="flex flex-col items-center justify-center py-12">
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
                      className="p-6 hover:bg-slate-800/30 transition-all duration-200"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: index * 0.1 }}
                    >
                      <div className="flex flex-col gap-4">
                        {/* Influencer info and status */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
                              {index + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-base font-medium text-white mb-1">
                                Influencer #{index + 1}
                              </p>
                              <p className="text-sm text-slate-400 font-mono">
                                {truncateAddress(submission.influencer)}
                              </p>
                            </div>
                          </div>
                          <span
                            className={`px-3 py-1.5 text-xs font-medium rounded-full flex items-center flex-shrink-0 ${status.className}`}
                          >
                            {status.icon}
                            {status.label}
                          </span>
                        </div>

                        {/* Submission details */}
                        <div className="ml-13">
                          {submission.proofLink ? (
                            <div className="space-y-3">
                              {/* Proof link - Fixed section */}
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

                              {/* Action buttons */}
                              {canReleaseOrDispute(submission) && (
                                <div className="flex gap-2">
                                  <motion.button
                                    onClick={() =>
                                      onReleaseFunds(selectedBrief.id)
                                    }
                                    disabled={isCompletingCampaign}
                                    className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-lg hover:from-emerald-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md shadow-emerald-500/25 flex items-center justify-center gap-2"
                                    whileTap={{ scale: 0.95 }}
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                    Approve & Release Funds
                                  </motion.button>
                                  <motion.button
                                    onClick={() =>
                                      handleOpenDisputeModal(
                                        submission.influencer
                                      )
                                    }
                                    disabled={isCompletingCampaign}
                                    className="px-4 py-2.5 text-sm font-medium text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg hover:bg-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2"
                                    whileTap={{ scale: 0.95 }}
                                  >
                                    <Flag className="w-4 h-4" />
                                    Dispute
                                  </motion.button>
                                </div>
                              )}
                            </div>
                          ) : (
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
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
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
          <div className="border-t border-slate-700/50 p-6 bg-slate-800/50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-400">
                {selectedApplications.filter((app) => app.proofLink).length >
                  0 && (
                  <span>
                    Review each submission carefully before approving payments
                  </span>
                )}
              </div>
              <button
                onClick={onClose}
                disabled={isCompletingCampaign}
                className="px-6 py-2.5 text-sm font-medium text-slate-300 bg-slate-700/50 rounded-lg border border-slate-600/50 hover:bg-slate-700 hover:border-slate-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Close
              </button>
            </div>
          </div>
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
