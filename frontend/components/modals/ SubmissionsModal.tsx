// SubmissionsModal.tsx
"use client";

import { CheckCircle, Clock, Globe } from "lucide-react";
import {Brief, Application} from "@/types/index";

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

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-auto max-h-[80vh] overflow-y-auto">
        <h2 className="text-lg font-medium mb-4">
          Submissions for {selectedBrief.name}
        </h2>
        {isLoadingApplications ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : selectedApplications.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {selectedApplications.map((submission, index) => (
              <li key={index} className="py-4">
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Influencer #{index + 1}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {submission.influencer}
                      </p>
                    </div>
                    {submission.isApproved ? (
                      <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 flex items-center">
                        <CheckCircle size={12} className="mr-1" />
                        Paid
                      </span>
                    ) : isCompletingCampaign ? (
                      <span className="px-2 py-1 text-xs rounded-full bg-indigo-100 text-indigo-800 flex items-center">
                        <svg
                          className="animate-spin h-3 w-3 mr-1"
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
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8v8h8a8 8 0 01-16 0z"
                          ></path>
                        </svg>
                        Processing
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-2 text-sm text-gray-600">
                    {submission.proofLink ? (
                      <div className="flex flex-col space-y-2">
                        <div className="flex items-center">
                          <Globe size={14} className="mr-1 text-gray-500" />
                          <a
                            href={submission.proofLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 hover:text-indigo-800 underline"
                          >
                            View Campaign Post
                          </a>
                        </div>

                        <div className="text-xs text-gray-500">
                          Submitted:{" "}
                          {new Date(
                            submission.timestamp * 1000
                          ).toLocaleDateString()}{" "}
                          at{" "}
                          {new Date(
                            submission.timestamp * 1000
                          ).toLocaleTimeString()}
                        </div>

                        {submission.message && (
                          <div className="mt-2 p-3 bg-gray-50 rounded-md text-gray-700">
                            <p className="text-xs font-medium mb-1">Note:</p>
                            <p className="text-sm">{submission.message}</p>
                          </div>
                        )}

                        {!submission.isApproved && (
                          <div className="mt-3 flex justify-end">
                            <button
                              onClick={() => onReleaseFunds(selectedBrief.briefId)}
                              disabled={isCompletingCampaign}
                              className="px-3 py-1 text-sm text-white bg-green-600 rounded-md hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center"
                            >
                              <CheckCircle size={14} className="mr-1" />
                              Release Funds
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-3 bg-yellow-50 rounded-md text-yellow-800 flex items-center">
                        <Clock size={14} className="mr-2" />
                        <p>Awaiting submission from influencer</p>
                      </div>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="p-8 text-center text-gray-500">
            <p>No selected influencers yet or no submissions received.</p>
            <p className="mt-2 text-sm">
              Selected influencers will appear here once they submit their
              proof of work.
            </p>
          </div>
        )}
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};