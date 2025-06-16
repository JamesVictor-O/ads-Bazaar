"use client";

import { CheckCircle, Clock, Globe, X } from "lucide-react";
import { Brief, Application } from "@/types/index";
import { Hex } from "viem";

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
  if (!selectedBrief) return null;

  const selectedApplications = applications.filter((app) => app.isSelected);

  console.log(selectedApplications);

  return (
    // Modal overlay with safe-area handling for mobile
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 z-50 transition-opacity duration-300 overflow-y-auto">
      {/* Modal container with constrained height and scrollability */}
      <div className="bg-slate-800/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 sm:p-8 w-full max-w-md mx-auto max-h-[85vh] sm:max-h-[80vh] overflow-y-auto shadow-2xl shadow-emerald-500/10">
        {/* Header */}
        <div className="flex justify-between items-start mb-6 gap-4">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl sm:text-2xl font-bold text-white leading-tight">
              Submissions for
            </h2>
            <p className="text-lg sm:text-xl font-semibold text-emerald-400 mt-1 truncate">
              {selectedBrief.name}
            </p>
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
        {isLoadingApplications ? (
          // Loading state
          <div className="flex justify-center py-12">
            <svg
              className="animate-spin h-8 w-8 text-emerald-500"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8h8a8 8 0 01-16 0z"
              />
            </svg>
          </div>
        ) : selectedApplications.length > 0 ? (
          // List of submissions
          <div className="space-y-4 sm:divide-y sm:divide-slate-700/50">
            {selectedApplications.map((submission, index) => (
              <div
                key={index}
                className="bg-slate-700/30 sm:bg-transparent rounded-xl sm:rounded-none p-4 sm:p-0 sm:py-4 border border-slate-600/30 sm:border-none"
              >
                <div className="flex flex-col gap-4">
                  {/* Influencer info and status */}
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-medium text-white">
                        Influencer #{index + 1}
                      </p>
                      <p className="text-sm text-slate-400 truncate mt-1">
                        {submission.influencer}
                      </p>
                    </div>
                    {submission.isApproved ? (
                      <span className="px-3 py-1 text-xs rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center flex-shrink-0">
                        <CheckCircle size={14} className="mr-1" />
                        Paid
                      </span>
                    ) : isCompletingCampaign ? (
                      <span className="px-3 py-1 text-xs rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center flex-shrink-0">
                        <svg
                          className="animate-spin h-4 w-4 mr-1"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8v8h8a8 8 0 01-16 0z"
                          />
                        </svg>
                        Processing
                      </span>
                    ) : null}
                  </div>

                  {/* Submission details */}
                  <div className="text-sm text-slate-300">
                    {submission.proofLink ? (
                      <div className="flex flex-col space-y-3">
                        {/* Proof link */}
                        <div className="flex items-center">
                          <Globe
                            size={16}
                            className="mr-2 text-slate-400 flex-shrink-0"
                          />
                          <a
                            href={submission.proofLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-400 hover:text-emerald-300 transition-colors duration-200 font-medium"
                          >
                            View Campaign Post
                          </a>
                        </div>

                        {/* Submission timestamp */}
                        <div className="text-xs text-slate-400 bg-slate-800/50 sm:bg-transparent rounded-lg sm:rounded-none p-2 sm:p-0">
                          <span className="font-medium">Submitted: </span>
                          <span className="block sm:inline mt-1 sm:mt-0">
                            {new Date(
                              submission.timestamp * 1000
                            ).toLocaleDateString()}{" "}
                            at{" "}
                            {new Date(
                              submission.timestamp * 1000
                            ).toLocaleTimeString()}
                          </span>
                        </div>

                        {/* Release funds button */}
                        {!submission.isApproved && (
                          <div className="pt-2 sm:mt-3 flex justify-end">
                            <button
                              onClick={() => onReleaseFunds(selectedBrief.id)}
                              disabled={isCompletingCampaign}
                              className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl hover:from-emerald-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md shadow-emerald-500/25 flex items-center justify-center"
                            >
                              <CheckCircle size="16" className="mr-1" />
                              Release Funds
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      // Awaiting submission message
                      <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20 text-amber-400 flex items-start">
                        <Clock
                          size={16}
                          className="mr-2 flex-shrink-0 mt-0.5"
                        />
                        <p className="text-sm leading-relaxed">
                          Awaiting submission from influencer
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Empty state
          <div className="p-6 text-center text-slate-400">
            <svg
              className="w-16 h-16 mx-auto mb-4 text-slate-600"
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
            <p className="font-medium text-base">No submissions yet</p>
            <p className="mt-2 text-sm leading-relaxed">
              Selected influencers will appear here once they submit their proof
              of work.
            </p>
          </div>
        )}

        {/* Action buttons */}
        <div className="mt-6 flex justify-end gap-4">
          <button
            onClick={onClose}
            disabled={isCompletingCampaign}
            className="px-6 py-3 text-sm font-medium text-slate-300 bg-slate-700/50 rounded-xl border border-slate-600/50 hover:bg-slate-700 hover:border-slate-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
