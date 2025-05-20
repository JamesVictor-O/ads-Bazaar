// SubmitPostModal.tsx
"use client";

import { Campaign } from "@/types/index";


interface SubmitPostModalProps {
  selectedCampaign: Campaign | null;
  postLink: string;
  setPostLink: (link: string) => void;
  onSubmit: (campaignId: number, taskName: string) => void;
  onClose: () => void;
}

export const SubmitPostModal = ({
  selectedCampaign,
  postLink,
  setPostLink,
  onSubmit,
  onClose,
}: SubmitPostModalProps) => {
  if (!selectedCampaign) return null;

  const pendingTask = selectedCampaign.tasks.find((t) => t.status === "pending");

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-auto">
        <h2 className="text-lg font-medium mb-4">Submit Post Link</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Campaign
            </label>
            <p className="text-sm text-gray-900">
              {selectedCampaign.title}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Post Link
            </label>
            <input
              type="url"
              value={postLink}
              onChange={(e) => setPostLink(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-sm"
              placeholder="https://farcaster.com/post/..."
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (pendingTask) {
                onSubmit(selectedCampaign.id, pendingTask.name);
              }
            }}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
            disabled={!postLink || !pendingTask}
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
};