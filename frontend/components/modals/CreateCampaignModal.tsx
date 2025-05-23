"use client";
import { format } from "date-fns";
import { FormData } from "@/types/index";
import { X } from "lucide-react";

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
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-opacity duration-300">
      <div className="bg-slate-800/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 w-full max-w-lg mx-auto shadow-2xl shadow-emerald-500/10 transform transition-all duration-300 scale-100">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Create New Campaign</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all duration-200"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <div className="space-y-6">
          {/* Campaign Name */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Campaign Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-200"
              placeholder="Enter campaign name"
              required
              aria-required="true"
            />
          </div>

          {/* Campaign Description */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Campaign Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-200 resize-y"
              rows={4}
              placeholder="Describe your campaign"
              required
              aria-required="true"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Budget (cUSD)
              </label>
              <input
                type="number"
                min="1"
                value={formData.budget}
                onChange={(e) =>
                  setFormData({ ...formData, budget: e.target.value })
                }
                className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-200"
                placeholder="Enter budget amount"
                required
                aria-required="true"
              />
            </div>

            {/* Max Influencers */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Max Influencers
              </label>
              <input
                type="number"
                min="1"
                value={formData.maxInfluencers}
                onChange={(e) =>
                  setFormData({ ...formData, maxInfluencers: e.target.value })
                }
                className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-200"
                placeholder="Enter max influencers"
                required
                aria-required="true"
              />
            </div>

            {/* Application Deadline */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
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
                className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-200"
                required
                aria-required="true"
              />
            </div>

            {/* Promotion Duration */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Promotion Duration
              </label>
              <select
                value={formData.promotionDuration}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    promotionDuration: e.target.value,
                  })
                }
                className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-200 appearance-none"
              >
                <option value="86400">1 day</option>
                <option value="172800">2 days</option>
                <option value="259200">3 days</option>
                <option value="345600">4 days</option>
                <option value="432000">5 days</option>
                <option value="518400">6 days</option>
                <option value="604800">7 days</option>
              </select>
            </div>

            {/* Target Audience */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Target Audience
              </label>
              <select
                value={formData.targetAudience}
                onChange={(e) =>
                  setFormData({ ...formData, targetAudience: e.target.value })
                }
                className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-200 appearance-none"
              >
                <option value="0">General</option>
                <option value="1">Fashion</option>
                <option value="2">Technology</option>
                <option value="3">Gaming</option>
                <option value="4">Fitness</option>
                <option value="5">Beauty</option>
                <option value="6">Food</option>
                <option value="7">Travel</option>
                <option value="8">Business</option>
                <option value="9">Education</option>
                <option value="10">Entertainment</option>
                <option value="11">Sports</option>
                <option value="12">Lifestyle</option>
                <option value="13">Other</option>
              </select>
            </div>

            {/* Verification Period */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Verification Period
              </label>
              <select
                value={formData.verificationPeriod}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    verificationPeriod: e.target.value,
                  })
                }
                className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-200 appearance-none"
              >
                <option value="3600">1 hour</option>
                <option value="7200">2 hours</option>
                <option value="14400">4 hours</option>
                <option value="28800">8 hours</option>
                <option value="86400">24 hours</option>
                <option value="172800">48 hours</option>
              </select>
            </div>
          </div>
          {/* Budget */}
        </div>

        {/* Actions */}
        <div className="mt-8 flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-slate-700/50 text-slate-300 rounded-xl border border-slate-600/50 hover:bg-slate-700 hover:border-slate-500 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isCreatingBrief}
          >
            Cancel
          </button>
          <button
            onClick={onCreateCampaign}
            disabled={!isFormValid || isCreatingBrief}
            className={`px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-medium hover:from-emerald-600 hover:to-emerald-700 transition-all duration-200 shadow-lg shadow-emerald-500/25 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isCreatingBrief ? (
              <svg
                className="animate-spin h-5 w-5 text-white"
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
            ) : (
              <>
                <span>Create Campaign</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
