// CreateCampaignModal.tsx
"use client";
import { format } from "date-fns";
import {FormData} from "@/types/index"

interface CreateCampaignModalProps {
  formData: FormData;
  setFormData: (data: FormData) => void;
  isCreatingBrief: boolean;
  isFormValid: boolean;
  onCreateCampaign: () => void;
  onClose: () => void;
}

export const CreateCampaignModal = ({
  formData,
  setFormData,
  isCreatingBrief,
  isFormValid,
  onCreateCampaign,
  onClose,
}: CreateCampaignModalProps) => {
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-auto">
        <h2 className="text-lg font-medium mb-4 text-black">Create Campaign</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Campaign Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="mt-1 block w-full border border-gray-300 text-black rounded-md p-2 text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Campaign Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-sm"
              rows={4}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Budget (cUSD)
            </label>
            <input
              type="number"
              min="1"
              value={formData.budget}
              onChange={(e) =>
                setFormData({ ...formData, budget: e.target.value })
              }
              className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Max Influencers
            </label>
            <input
              type="number"
              min="1"
              value={formData.maxInfluencers}
              onChange={(e) =>
                setFormData({ ...formData, maxInfluencers: e.target.value })
              }
              className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Application Deadline
            </label>
            <input
              type="date"
              min={format(new Date(), "yyyy-MM-dd")}
              value={formData.applicationDeadline}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  applicationDeadline: e.target.value,
                })
              }
              className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Promotion Duration (days)
            </label>
            <select
              value={formData.promotionDuration}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  promotionDuration: e.target.value,
                })
              }
              className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-sm"
            >
              <option value="86400">1 day</option>
              <option value="259200">3 days</option>
              <option value="604800">7 days</option>
              <option value="1209600">14 days</option>
              <option value="2592000">30 days</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Target Audience
            </label>
            <select
              value={formData.targetAudience}
              onChange={(e) =>
                setFormData({ ...formData, targetAudience: e.target.value })
              }
              className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-sm"
            >
              <option value="0">General</option>
              <option value="1">Technology</option>
              <option value="2">Fashion</option>
              <option value="3">Health & Fitness</option>
              <option value="4">Food & Beverage</option>
              <option value="5">Travel</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Verification Period (hours)
            </label>
            <select
              value={formData.verificationPeriod}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  verificationPeriod: e.target.value,
                })
              }
              className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-sm"
            >
              <option value="3600">1 hour</option>
              <option value="7200">2 hours</option>
              <option value="14400">4 hours</option>
              <option value="28800">8 hours</option>
              <option value="86400">24 hours</option>
            </select>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            disabled={isCreatingBrief}
          >
            Cancel
          </button>
          <button
            onClick={onCreateCampaign}
            disabled={!isFormValid || isCreatingBrief}
            className={`py-2 px-4 rounded-md text-white transition-colors ${
              isFormValid && !isCreatingBrief
                ? "bg-indigo-600 hover:bg-indigo-700"
                : "bg-gray-400 cursor-not-allowed"
            }`}
          >
            {isCreatingBrief ? (
              <svg
                className="animate-spin h-5 w-5 mx-auto text-white"
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
            ) : (
              "Create Campaign"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};