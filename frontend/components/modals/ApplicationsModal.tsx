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
} from "lucide-react";
import Image from "next/image";
import { toast } from "react-hot-toast";
import { formatDistanceToNow } from "date-fns";
import { truncateAddress } from "@/utils/format";
import { useAccount } from "wagmi";
import { Hex } from "viem";
import {
  useCancelAdBrief,
  useSelectInfluencer,
  useCompleteCampaign,
} from "@/hooks/adsBazaar";

export const ApplicationsModal = ({
  selectedBrief,
  applications,
  isLoadingApplications,
  onClose,
}: ApplicationsModalProps) => {
  const {isConnected } = useAccount();

  const [pendingIndex, setPendingIndex] = useState<number | null>(null);

  const {
    selectInfluencer,
    isPending: isSelectingInfluencer,
    isSuccess: isInfluencerSelected,
    error: selectError,
  } = useSelectInfluencer();

  // Hook for canceling a campaign
  const {
    cancelBrief,
    isPending: isCanceling,
    isSuccess: isCanceled,
    error: cancelError,
  } = useCancelAdBrief();


  console.log("selectedBrief", selectedBrief);

  // Hook for completing a campaign
  const {
    completeCampaign, // Function to complete the campaign
    isPending: isCompleting, // Loading state
    isSuccess: isCompleted, // Success state
    error: completeError, // Error state
  } = useCompleteCampaign();

  // Show success notification when an influencer is selected
  useEffect(() => {
    if (isInfluencerSelected) {
      toast.success("Influencer assigned successfully!");
      setPendingIndex(null); // Reset pending state
    }
  }, [isInfluencerSelected]);

  // Close modal and show success notification when campaign is canceled
  useEffect(() => {
    if (isCanceled) {
      toast.success("Campaign canceled successfully!");
      onClose();
    }
  }, [isCanceled, onClose]);

  // Close modal and show success notification when campaign is completed
  useEffect(() => {
    if (isCompleted) {
      toast.success("Campaign completed successfully!");
      onClose();
    }
  }, [isCompleted, onClose]);

  // Handle errors for all transactions
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
  }, [selectError, cancelError, completeError]);

  // Function to assign an influencer to the campaign
  const handleAssignInfluencer = async (briefId: Hex, index: number) => {
    if (!isConnected) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (applications[index].isSelected) {
      toast.error("Influencer already selected");
      return;
    }

    const application = applications[index];
    const influencerName = truncateAddress(application.influencer);

    setPendingIndex(index);
    const toastId = toast.loading(`Assigning ${influencerName}...`);

    try {
      await selectInfluencer(briefId, index);
    } catch (error: any) {
      console.error("Transaction error:", error);
      toast.error(
        `Failed to assign influencer: ${error.message || "Unknown error"}`,
        {
          id: toastId,
        }
      );
    } finally {
      setPendingIndex(null); // Reset loading state
    }
  };

  // Function to cancel the campaign
  const handleCancelCampaign = async () => {
    if (!selectedBrief) return;

    const toastId = toast.loading("Canceling campaign...");

    try {
      await cancelBrief(selectedBrief.briefId);
      toast.success("Campaign canceled successfully!", { id: toastId });
    } catch (error) {
      console.error("Transaction error:", error);
      toast.error("Failed to cancel campaign", { id: toastId });
    }
  };

  // Function to complete the campaign
  const handleCompleteCampaign = async () => {
    if (!selectedBrief) return;

    const toastId = toast.loading("Completing campaign...");

    try {
      await completeCampaign(selectedBrief.briefId);
      toast.success("Campaign completed successfully!", { id: toastId });
    } catch (error) {
      console.error("Transaction error:", error);
      toast.error("Failed to complete campaign", { id: toastId });
    }
  };

  // Extract revert reason from blockchain error messages
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

  // If no brief is selected, render nothing
  if (!selectedBrief) return null;

  // Calculate remaining influencer spots
  const maxInfluencers = Number(selectedBrief.maxInfluencers);
  const selectedCount = applications.filter((app) => app.isSelected).length;
  const spotsRemaining = maxInfluencers - selectedCount;

  // Check if application deadline has passed
  const deadline = new Date(Number(selectedBrief.applicationDeadline) * 1000);
  const deadlinePassed = deadline < new Date();

  // Check if there are any submissions
  const hasSubmissions = applications.some(
    (app) => app.isSelected && app.hasClaimed
  );

  // Determine if cancel button should be shown
  const showCancelButton =
    deadlinePassed ||
    applications.length === 0 ||
    (selectedCount === 0 && applications.length > 0);

  // Determine if complete button should be shown
  const showCompleteButton =
    selectedCount > 0 && hasSubmissions && s// For formatting timestamps (e.g., "2 days ago")electedBrief.status !== 2; // 2 = COMPLETED

  return (
    // Modal overlay with dark, translucent background
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-opacity duration-300">
      {/* Modal container with dark theme and emerald shadow */}
      <div className="bg-slate-800/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 w-full max-w-2xl mx-auto max-h-[85vh] overflow-hidden flex flex-col shadow-2xl shadow-emerald-500/10">
        {/* Header with campaign name and close button */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">
              Applications for {selectedBrief.title}
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
            disabled={isSelectingInfluencer || isCanceling || isCompleting}
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Applications list or loading/empty state */}
        <div className="overflow-y-auto flex-grow">
          {isLoadingApplications ? (
            // Loading state
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mb-4" />
              <p className="text-slate-400">Loading applications...</p>
            </div>
          ) : applications && applications.length > 0 ? (
            // List of applications
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
                    {/* Influencer info and action button */}
                    <div className="flex justify-between items-start">
                      <div className="flex items-center space-x-3">
                        {/* Avatar */}
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
                            <button
                              onClick={() =>
                                handleAssignInfluencer(selectedBrief.id, index)
                              }
                              disabled={
                                isSelectingInfluencer ||
                                pendingIndex === index ||
                                isCanceling ||
                                isCompleting
                              }
                              className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-emerald-500/25"
                            >
                              {pendingIndex === index ? (
                                <div className="flex items-center space-x-2">
                                  <Loader2 className="animate-spin h-4 w-4" />
                                  <span>Processing</span>
                                </div>
                              ) : (
                                "Assign"
                              )}
                            </button>
                          )
                        )}
                      </div>
                    </div>

                    {/* Application message */}
                    <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                      <p className="text-sm text-slate-300 whitespace-pre-wrap">
                        {application.message ||
                          "No application message provided"}
                      </p>
                    </div>

                    {/* Submission details for selected influencers */}
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
            // Empty state when no applications exist
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
            <button
              onClick={handleCancelCampaign}
              disabled={isCanceling || isCompleting || isSelectingInfluencer}
              className="mr-auto px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-red-500 to-red-600 rounded-xl hover:from-red-600 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md shadow-red-500/25"
            >
              {isCanceling ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="animate-spin h-4 w-4" />
                  <span>Canceling...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <XCircle className="h-4 w-4" />
                  <span>Cancel Campaign</span>
                </div>
              )}
            </button>
          )}

          {showCompleteButton && (
            <button
              onClick={handleCompleteCampaign}
              disabled={isCompleting || isCanceling || isSelectingInfluencer}
              className="px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl hover:from-emerald-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md shadow-emerald-500/25"
            >
              {isCompleting ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="animate-spin h-4 w-4" />
                  <span>Completing...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Award className="h-4 w-4" />
                  <span>Complete Campaign</span>
                </div>
              )}
            </button>
          )}

          <button
            onClick={onClose}
            disabled={isSelectingInfluencer || isCanceling || isCompleting}
            className="px-6 py-3 text-sm font-medium text-slate-300 bg-slate-700/50 rounded-xl border border-slate-600/50 hover:bg-slate-700 hover:border-slate-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
