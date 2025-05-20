"use client";

import { useApplyToBrief } from "@/hooks/adsBazaar";
import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { FiX, FiLoader } from "react-icons/fi";

interface ApplyModalProps {
  showApplyModal: boolean;
  setShowApplyModal: (show: boolean) => void;
  selectedBrief: {
    id: `0x${string}`;
    title: string;
    business: string;
    budget: number;
    requirements?: string;
  } | null;
  applicationMessage: string;
  setApplicationMessage: (message: string) => void;
}

export default function ApplyModal({
  showApplyModal,
  setShowApplyModal,
  selectedBrief,
  applicationMessage,
  setApplicationMessage,
}: ApplyModalProps) {
  const [isClient, setIsClient] = useState(false);
  const { applyToBrief, isPending, isSuccess, error } = useApplyToBrief();

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isSuccess) {
      toast.success("Application submitted successfully!");
      setShowApplyModal(false);
      setApplicationMessage("");
    }
  }, [isSuccess, setShowApplyModal, setApplicationMessage]);

  useEffect(() => {
    if (error) {
      // Format the error message for better readability
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

      toast.error(errorMessage, {
        duration: 5000,
      });
    }
  }, [error]);

  const handleApply = async (): Promise<void> => {
    if (!applicationMessage.trim()) {
      toast.error("Please enter an application message");
      return;
    }

    if (!selectedBrief) {
      toast.error("No campaign selected");
      return;
    }

    if (applicationMessage.length < 20) {
      toast.error("Application message must be at least 20 characters");
      return;
    }

    try {
      await applyToBrief(selectedBrief.id, applicationMessage);
    } catch (err) {
      // Errors are handled by the error state from useApplyToBrief
      console.error("Application failed:", err);
    }
  };

  // Improved revert reason extraction
  const extractRevertReason = (message: string): string | null => {
    const revertPatterns = [
      /reason="([^"]+)"/, // For some RPC providers
      /reason: ([^,]+)/, // Common pattern
      /reverted with reason string '([^']+)'/, // Common pattern
      /reverted: ([^"]+)/, // Common pattern
      /execution reverted: ([^"]+)/, // Common pattern
      /Error: VM Exception while processing transaction: reverted with reason string '([^']+)'/, // Hardhat
      /"message":"([^"]+)"/, // Some JSON-RPC responses
    ];

    for (const pattern of revertPatterns) {
      const match = message.match(pattern);
      if (match && match[1]) {
        // Clean up the message
        return match[1].replace(/^execution reverted:/i, "").trim();
      }
    }
    return null;
  };

  if (!showApplyModal || !selectedBrief || !isClient) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-auto shadow-xl">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-semibold text-gray-800">
            Apply for {selectedBrief.title}
          </h2>
          <button
            onClick={() => setShowApplyModal(false)}
            className="text-gray-500 hover:text-gray-700"
            disabled={isPending}
          >
            <FiX size={20} />
          </button>
        </div>

        <div className="space-y-4 mb-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-500">
              Campaign Details
            </h3>
            <p className="text-lg font-medium text-gray-800 mt-1">
              {selectedBrief.business}
            </p>
            <p className="text-sm text-indigo-600 font-medium mt-1">
              Budget: {selectedBrief.budget} cUSD
            </p>
            {selectedBrief.requirements && (
              <div className="mt-2">
                <p className="text-sm text-gray-600">
                  {selectedBrief.requirements}
                </p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Application Message
              <span className="text-red-500">*</span>
            </label>
            <textarea
              value={applicationMessage}
              onChange={(e) => setApplicationMessage(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md p-3 text-sm text-gray-600 focus:ring-indigo-500 focus:border-indigo-500"
              rows={4}
              placeholder="Explain why you're a great fit for this campaign..."
              disabled={isPending}
            />
            <p className="mt-1 text-xs text-gray-500">
              Minimum 20 characters. Current: {applicationMessage.length}
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={() => setShowApplyModal(false)}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            disabled={isPending}
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={
              !applicationMessage.trim() ||
              applicationMessage.length < 20 ||
              isPending
            }
          >
            {isPending ? (
              <>
                <FiLoader className="animate-spin mr-2" />
                Processing...
              </>
            ) : (
              "Submit Application"
            )}
          </button>
        </div>

        {isPending && (
          <div className="mt-4 p-3 bg-blue-50 rounded-md flex items-start">
            <FiLoader className="animate-spin text-blue-500 mr-2 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-800">
                Transaction in progress
              </p>
              <p className="text-xs text-blue-600">
                Please wait while we process your application...
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
