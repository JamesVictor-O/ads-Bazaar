"use client";

import React from "react";
import { X } from "lucide-react";
import { motion} from "framer-motion";

// Mock date-fns format function for demonstration
interface FormatFunction {
  (date: Date | string | number, formatString: string): string;
}

const format: FormatFunction = (date, formatString) => {
  const d = new Date(date);
  if (formatString === "yyyy-MM-dd") {
    return d.toISOString().split("T")[0];
  }
  return d.toLocaleDateString();
};

interface FormData {
  name: string;
  description: string;
  budget: string;
  maxInfluencers: string;
  applicationDeadline: string;
  promotionDuration: string;
  targetAudience: string;
  verificationPeriod: string;
}

interface CreateCampaignModalProps {
  formData: FormData;
  setFormData: (data: FormData) => void;
  isCreatingBrief: boolean;
  isFormValid: boolean;
  onCreateCampaign: () => void;
  onClose: () => void;
}

export default function CreateCampaignModal({
  formData,
  setFormData,
  isCreatingBrief,
  isFormValid,
  onCreateCampaign,
  onClose,
}: CreateCampaignModalProps) {
  return (
    <motion.div
      className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className="bg-slate-800/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl w-full max-w-[95vw] sm:max-w-2xl mx-auto max-h-[90vh] overflow-y-auto"
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-slate-700/50 sticky top-0 bg-slate-800/95 z-10">
          <h2 className="text-lg sm:text-2xl font-bold text-white">
            Create New Campaign
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all duration-200"
            aria-label="Close modal"
            disabled={isCreatingBrief}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Content */}
        <div className="px-4 pb-4 max-h-[calc(90vh-180px)] sm:max-h-[calc(90vh-200px)] overflow-y-auto">
          <div className="space-y-4">
            {/* Campaign Name */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Campaign Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-3 py-2.5 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-200 text-sm"
                placeholder="Enter campaign name"
                required
                aria-required="true"
                disabled={isCreatingBrief}
              />
            </div>

            {/* Campaign Description */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Campaign Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-3 py-2.5 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-200 resize-y text-sm"
                rows={4}
                placeholder="Describe your campaign"
                required
                aria-required="true"
                disabled={isCreatingBrief}
              />
            </div>

            {/* Grid Container */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Budget */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Budget (cUSD)
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.budget}
                  onChange={(e) =>
                    setFormData({ ...formData, budget: e.target.value })
                  }
                  className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-3 py-2.5 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-200 text-sm"
                  placeholder="Enter budget amount"
                  required
                  aria-required="true"
                  disabled={isCreatingBrief}
                />
              </div>

              {/* Max Influencers */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Max Influencers
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.maxInfluencers}
                  onChange={(e) =>
                    setFormData({ ...formData, maxInfluencers: e.target.value })
                  }
                  className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-3 py-2.5 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-200 text-sm"
                  placeholder="Enter max influencers"
                  required
                  aria-required="true"
                  disabled={isCreatingBrief}
                />
              </div>

              {/* Application Deadline */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
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
                  className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-3 py-2.5 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-200 text-sm"
                  required
                  aria-required="true"
                  disabled={isCreatingBrief}
                />
              </div>

              {/* Promotion Duration */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
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
                  className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-200 appearance-none text-sm"
                  disabled={isCreatingBrief}
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
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Target Audience
                </label>
                <select
                  value={formData.targetAudience}
                  onChange={(e) =>
                    setFormData({ ...formData, targetAudience: e.target.value })
                  }
                  className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-200 appearance-none text-sm"
                  disabled={isCreatingBrief}
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
                <label className="block text-sm font-medium text-slate-300 mb-1">
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
                  className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-200 appearance-none text-sm"
                  disabled={isCreatingBrief}
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
          </div>
        </div>

        {/* Fixed Action Buttons */}
        <div className="border-t border-slate-700/50 bg-slate-800/95 p-4 sticky bottom-0">
          <div className="flex flex-col sm:flex-row justify-end gap-3">
            <button
              onClick={onClose}
              className="order-2 sm:order-1 px-4 py-2.5 bg-slate-700/50 text-slate-300 rounded-lg border border-slate-600/50 hover:bg-slate-700 hover:border-slate-500 active:bg-slate-600 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              disabled={isCreatingBrief}
            >
              Cancel
            </button>
            <button
              onClick={onCreateCampaign}
              disabled={!isFormValid || isCreatingBrief}
              className="order-1 sm:order-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg font-medium hover:from-emerald-600 hover:to-emerald-700 active:from-emerald-700 active:to-emerald-800 transition-all duration-200 shadow-sm shadow-emerald-500/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {isCreatingBrief ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4 text-white flex-shrink-0"
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
                  <span>Creating...</span>
                </>
              ) : (
                <span>Create Campaign</span>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}