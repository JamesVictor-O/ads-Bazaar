"use client";
import { useEffect, useState } from "react";
import { Brief, Application } from "@/types/index";
import {
  Loader2,
  ExternalLink,
  Check,
  AlertTriangle,
  Calendar,
  XCircle,
  Award,
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

interface ApplicationsModalProps {
  selectedBrief: Brief | null;
  applications: Application[];
  isLoadingApplications: boolean;
  onClose: () => void;
}

export const ApplicationsModal = ({
  selectedBrief,
  applications,
  isLoadingApplications,
  onClose,
}: ApplicationsModalProps) => {
  const { address, isConnected } = useAccount();
  const [pendingIndex, setPendingIndex] = useState<number | null>(null);

  // Transaction hooks
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

  // Handle transaction success/error states
  useEffect(() => {
    if (isInfluencerSelected) {
      toast.success("Influencer assigned successfully!");
      setPendingIndex(null);
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

  // Error handling for all transactions
  useEffect(() => {
    const error = selectError || cancelError || completeError;
    if (!error) return;

    let errorMessage = "Transaction failed";
    if (typeof error === "string") {
      errorMessage = error;
    } else if (error instanceof Error) {
      errorMessage = error.message;

      // Handle common error cases
      if (error.message.includes("User rejected the request")) {
        errorMessage = "Transaction rejected by user";
      } else if (error.message.includes("insufficient funds")) {
        errorMessage = "Insufficient funds for transaction";
      } else {
        // Extract revert reason from contract
        const revertReason = extractRevertReason(error.message);
        if (revertReason) {
          errorMessage = revertReason;
        }
      }
    }

    toast.error(errorMessage, { duration: 5000 });
  }, [selectError, cancelError, completeError]);

  const handleAssignInfluencer = async (briefId: Hex, index: number) => {
    if (!isConnected) {
      toast.error("Please connect your wallet first");
      return;
    }

    const application = applications[index];
    const influencerName =
      application.influencerProfile?.name ||
      truncateAddress(application.influencer);

    setPendingIndex(index);
    const toastId = toast.loading(`Assigning ${influencerName}...`);

    try {
      await selectInfluencer(briefId, index);
      toast.success(`${influencerName} assigned successfully!`, {
        id: toastId,
      });
    } catch (error) {
      console.error("Transaction error:", error);
      toast.error(`Failed to assign influencer`, { id: toastId });
    } finally {
      setPendingIndex(null);
    }
  };

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

  // Improved revert reason extraction (same as in ApplyModal)
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

  // Check if deadline has passed
  const deadline = new Date(Number(selectedBrief.applicationDeadline) * 1000);
  const deadlinePassed = deadline < new Date();

  // Check if there are submissions
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
    selectedCount > 0 && hasSubmissions && selectedBrief.status !== 2; // 2 = COMPLETED

  return (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-full max-w-2xl mx-auto max-h-[85vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center border-b dark:border-gray-700 pb-4 mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Applications for {selectedBrief?.name}
            </h2>
            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mt-1">
              <span className="mr-4">
                {spotsRemaining > 0
                  ? `${spotsRemaining} spot${
                      spotsRemaining !== 1 ? "s" : ""
                    } remaining out of ${maxInfluencers}`
                  : "All influencer spots filled"}
              </span>
              {deadlinePassed && (
                <div className="flex items-center text-amber-600 dark:text-amber-400">
                  <Calendar className="w-3 h-3 mr-1" />
                  <span>Deadline passed</span>
                </div>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            disabled={isSelectingInfluencer || isCanceling || isCompleting}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              ></path>
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto flex-grow">
          {isLoadingApplications ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                Loading applications...
              </p>
            </div>
          ) : applications && applications.length > 0 ? (
            <div className="space-y-4">
              {applications.map((application, index) => (
                <div
                  key={index}
                  className={`bg-white dark:bg-gray-800 border ${
                    application.isSelected
                      ? "border-green-200 dark:border-green-800"
                      : "border-gray-200 dark:border-gray-700"
                  } rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-200`}
                >
                  <div className="flex flex-col gap-4">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden flex items-center justify-center">
                          {application.influencerProfile?.avatar ? (
                            <Image
                              src={application.influencerProfile.avatar}
                              alt="Profile"
                              width={40}
                              height={40}
                              className="object-cover"
                            />
                          ) : (
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                              {application.influencer.slice(2, 4).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div>
                          <a
                            href={`/profile/${application.influencer}`}
                            className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 inline-flex items-center"
                          >
                            {application.influencerProfile?.name ||
                              truncateAddress(application.influencer)}
                            <ExternalLink className="w-3 h-3 ml-1" />
                          </a>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
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
                          <div className="flex items-center space-x-2 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-3 py-1 rounded-full text-xs font-medium">
                            <Check className="w-3 h-3" />
                            <span>Selected</span>
                          </div>
                        ) : (
                          spotsRemaining > 0 && (
                            <button
                              onClick={() =>
                                handleAssignInfluencer(
                                  selectedBrief.briefId,
                                  index
                                )
                              }
                              disabled={
                                isSelectingInfluencer ||
                                pendingIndex === index ||
                                isCanceling ||
                                isCompleting
                              }
                              className="px-4 py-1.5 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                            >
                              {pendingIndex === index ? (
                                <div className="flex items-center space-x-1">
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

                    <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-md">
                      <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                        {application.message ||
                          "No application message provided"}
                      </p>
                    </div>

                    {application.isSelected && (
                      <div className="space-y-2 border-t border-gray-100 dark:border-gray-700 pt-3 mt-1">
                        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                          <span>Proof submitted:</span>
                          <span>{application.hasClaimed ? "Yes" : "No"}</span>
                        </div>
                        {application.hasClaimed && (
                          <>
                            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                              <span>Proof approved:</span>
                              <span
                                className={
                                  application.isApproved
                                    ? "text-green-500 dark:text-green-400"
                                    : "text-yellow-500 dark:text-yellow-400"
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
                                className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 inline-flex items-center"
                              >
                                View submission proof
                                <ExternalLink className="w-3 h-3 ml-1" />
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
            <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
              <svg
                className="w-16 h-16 mb-4 text-gray-300 dark:text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                ></path>
              </svg>
              <p className="font-medium">No applications yet</p>
              <p className="text-sm mt-1">Check back later for updates</p>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
          {showCancelButton && (
            <button
              onClick={handleCancelCampaign}
              disabled={isCanceling || isCompleting || isSelectingInfluencer}
              className="mr-auto px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:bg-red-300 dark:disabled:bg-red-800/50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
            >
              {isCanceling ? (
                <div className="flex items-center space-x-1">
                  <Loader2 className="animate-spin h-4 w-4" />
                  <span>Canceling...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-1">
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
              className="mr-3 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:bg-green-300 dark:disabled:bg-green-800/50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
            >
              {isCompleting ? (
                <div className="flex items-center space-x-1">
                  <Loader2 className="animate-spin h-4 w-4" />
                  <span>Completing...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-1">
                  <Award className="h-4 w-4" />
                  <span>Complete Campaign</span>
                </div>
              )}
            </button>
          )}

          <button
            onClick={onClose}
            disabled={isSelectingInfluencer || isCanceling || isCompleting}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
