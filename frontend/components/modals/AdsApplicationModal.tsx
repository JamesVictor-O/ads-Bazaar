"use client";

import { useApplyToBrief } from "@/hooks/adsBazaar";
import { useState } from "react";

interface Campaign {
  id: number; // This should probably be Bytes32 to match your contract
  category: string;
  title: string;
  brand: string;
  budget: number;
  description: string;
  audience: string;
  duration: string;
  deliverables: number;
  requirements: string;
  applications: Array<{
    address: string;
    username: string;
    message: string;
  }>;
}

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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { applyToBrief } = useApplyToBrief();

  const handleApply = async (): Promise<void> => {
    if (!applicationMessage.trim() || !selectedBrief) return;
     console.log("Applying to brief:", selectedBrief.id, applicationMessage);
    setIsLoading(true);
    setError(null);

    try {
      await applyToBrief(selectedBrief.id, applicationMessage);
      setShowApplyModal(false);
      setApplicationMessage("");
      alert("Application submitted successfully!");
    } catch (err) {
      console.error("Application failed:", err);
      setError("Failed to submit application. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!showApplyModal || !selectedBrief) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-auto">
        <h2 className="text-xl font-medium mb-4 text-gray-700">Apply for {selectedBrief.title}</h2>
        
        {error && (
          <div className="mb-4 p-2 bg-red-100 text-red-700 rounded text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-lg font-medium text-gray-700">Campaign Details</label>
            <p className="text-base text-gray-600">{selectedBrief.business} - {selectedBrief.budget} cUSD</p>
            <p className="text-base text-gray-500 mt-1">{selectedBrief.requirements}</p>
          </div>
          <div>
            <label className="block text-base font-medium text-gray-700">Application Message</label>
            <textarea
              value={applicationMessage}
              onChange={(e) => setApplicationMessage(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-sm text-gray-600"
              rows={4}
              placeholder="Why are you a great fit for this campaign?"
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={() => setShowApplyModal(false)}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
            disabled={!applicationMessage.trim() || isLoading}
          >
            {isLoading ? "Submitting..." : "Submit Application"}
          </button>
        </div>
      </div>
    </div>
  );
}