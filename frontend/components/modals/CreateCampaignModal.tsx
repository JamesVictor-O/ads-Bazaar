"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  AlertTriangle,
  Loader2,
  CheckCircle,
  DollarSign,
  Clock,
  Users,
} from "lucide-react";
import { CurrencySelector } from "../CurrencySelector";
import { CurrencyConverter } from "../CurrencyConverter";
import { SupportedCurrency } from "@/lib/mento-simple";
// import { motion } from "framer-motion";
import { useAccount } from "wagmi";
import { toast } from "react-hot-toast";
import { withNetworkGuard } from "../WithNetworkGuard";
import { NetworkStatus } from "../NetworkStatus";
import { useEnsureNetwork } from "@/hooks/useEnsureNetwork";
import { useDivviIntegration } from "@/hooks/useDivviIntegration";
import { useMultiCurrencyCampaignCreation, usePreferredCurrency } from "@/hooks/useMultiCurrencyAdsBazaar";

interface FormData {
  name: string;
  description: string;
  requirements: string;
  budget: string;
  currency: SupportedCurrency;
  maxInfluencers: string;
  promotionDuration: string;
  targetAudience: string;
  applicationPeriod: string;
  proofSubmissionGracePeriod: string;
  verificationPeriod: string;
  selectionGracePeriod: string;
}

interface CreateCampaignModalProps {
  formData: FormData;
  setFormData: (data: FormData) => void;
  isCreatingBrief: boolean;
  isFormValid: boolean;
  onCreateCampaign: (referralTag?: `0x${string}`) => Promise<string>;
  onClose: () => void;
  guardedAction?: (action: () => Promise<void>) => Promise<void>;
  isCreateSuccess?: boolean;
  isCreateError?: boolean;
  createError?: Error | null;
}

// Transaction phases for better UX
type TransactionPhase = "idle" | "approving" | "creating" | "success" | "error";

function CreateCampaignModal({
  formData,
  setFormData,
  isCreatingBrief,
  isFormValid,
  onCreateCampaign,
  onClose,
  guardedAction,
  isCreateSuccess = false,
  isCreateError = false,
  createError = null,
}: CreateCampaignModalProps) {
  const { isConnected } = useAccount();
  const { isCorrectChain, currentNetwork } = useEnsureNetwork();
  const { generateDivviReferralTag } = useDivviIntegration(); // ADD THIS LINE
  const [transactionPhase, setTransactionPhase] =
    useState<TransactionPhase>("idle");
  const [showConverter, setShowConverter] = useState(false);
  
  // Multi-currency hooks
  const { createCampaignWithToken, isCreating: isCreatingMultiCurrency } = useMultiCurrencyCampaignCreation();
  const { preferredCurrency } = usePreferredCurrency(true); // true for business

  // Monitor transaction states to update phase
  useEffect(() => {
    if (isCreatingBrief) {
      if (transactionPhase === "idle") {
        setTransactionPhase("approving");
      } else if (transactionPhase === "approving") {
        setTransactionPhase("creating");
      }
    } else {
      if (transactionPhase === "creating") {
        setTransactionPhase("success");
        // Reset after a delay
        setTimeout(() => setTransactionPhase("idle"), 2000);
      }
    }
  }, [isCreatingBrief, transactionPhase]);

  // Handle success and error states from parent component
  useEffect(() => {
    if (isCreateSuccess) {
      setTransactionPhase("success");
      // Close modal after showing success message
      setTimeout(() => {
        onClose();
        setTransactionPhase("idle");
      }, 2000);
    }

    if (isCreateError) {
      setTransactionPhase("error");
      // Reset error state after showing error message
      setTimeout(() => {
        setTransactionPhase("idle");
      }, 3000);
    }
  }, [isCreateSuccess, isCreateError, onClose]);

  const handleCreateCampaign = async () => {
    if (!guardedAction) {
      toast.error("Network guard not available. Please refresh and try again.");
      return;
    }

    if (!isFormValid) {
      toast.error("Please fill in all required fields correctly");
      return;
    }

    setTransactionPhase("idle");

    await guardedAction(async () => {
      const requirements = formData.requirements;

      // Generate Divvi referral tag to append to transaction calldata
      const referralTag = generateDivviReferralTag(); // ADD THIS LINE
      console.log(
        "DIVVI: About to create campaign with referral tag:",
        referralTag
      ); // ADD THIS LINE

      // Update requirements in formData before calling onCreateCampaign
      setFormData({ ...formData, requirements: requirements });
      await onCreateCampaign(referralTag); // PASS THE REFERRAL TAG
    });
  };

  const getTransactionMessage = () => {
    switch (transactionPhase) {
      case "approving":
        return {
          title: "Approving cUSD Spending",
          description: "Please confirm the token approval in your wallet...",
          icon: <DollarSign className="w-5 h-5 text-blue-400" />,
          bgColor: "bg-blue-500/10 border-blue-500/20",
          textColor: "text-blue-400",
        };
      case "creating":
        return {
          title: "Creating Campaign",
          description: "Campaign approval confirmed. Creating your campaign...",
          icon: <Clock className="w-5 h-5 text-emerald-400" />,
          bgColor: "bg-emerald-500/10 border-emerald-500/20",
          textColor: "text-emerald-400",
        };
      case "success":
        return {
          title: "Campaign Created Successfully!",
          description: "Your campaign is now live and accepting applications.",
          icon: <CheckCircle className="w-5 h-5 text-green-400" />,
          bgColor: "bg-green-500/10 border-green-500/20",
          textColor: "text-green-400",
        };
      case "error":
        return {
          title: "Transaction Failed",
          description:
            createError?.message ||
            "There was an error creating your campaign. Please try again.",
          icon: <AlertTriangle className="w-5 h-5 text-red-400" />,
          bgColor: "bg-red-500/10 border-red-500/20",
          textColor: "text-red-400",
        };
      default:
        return null;
    }
  };

  const isTransactionInProgress =
    isCreatingBrief ||
    transactionPhase === "approving" ||
    transactionPhase === "creating";
  const canSubmit =
    isConnected && isCorrectChain && isFormValid && !isTransactionInProgress;

  const transactionMessage = getTransactionMessage();

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-slate-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div>
            <h2 className="text-xl font-bold text-white">Create Campaign</h2>
            <p className="text-sm text-slate-400">
              Launch your multi-currency marketing campaign
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Network Status */}
        <div className="px-6 pt-4">
          <NetworkStatus />
        </div>

        {/* Transaction Status */}
        {transactionMessage && (
          <div className="mx-6 mt-4">
            <div className={`p-4 rounded-lg border ${transactionMessage.bgColor}`}>
              <div className="flex items-center gap-3">
                {transactionMessage.icon}
                <div>
                  <h3 className={`font-medium ${transactionMessage.textColor}`}>
                    {transactionMessage.title}
                  </h3>
                  <p className="text-sm text-slate-400">
                    {transactionMessage.description}
                  </p>
                </div>
                {isTransactionInProgress && (
                  <Loader2 className="w-5 h-5 animate-spin text-slate-400 ml-auto" />
                )}
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <div className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Campaign Details</h3>
            
            {/* Campaign Name */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Campaign Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-emerald-500 focus:outline-none"
                placeholder="Enter campaign name"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-emerald-500 focus:outline-none resize-none"
                placeholder="Describe your campaign goals and what you're promoting"
              />
            </div>

            {/* Requirements */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Requirements *
              </label>
              <textarea
                value={formData.requirements}
                onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-emerald-500 focus:outline-none resize-none"
                placeholder="Specify what influencers need to do (e.g., post type, hashtags, mentions)"
              />
            </div>
          </div>

          {/* Budget & Currency */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-400" />
              Budget & Currency
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Budget */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Total Budget *
                </label>
                <input
                  type="number"
                  value={formData.budget}
                  onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-emerald-500 focus:outline-none"
                  placeholder="100"
                />
              </div>

              {/* Currency */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Currency *
                </label>
                <CurrencySelector
                  selectedCurrency={formData.currency}
                  onCurrencyChange={(currency) => setFormData({ ...formData, currency })}
                  amount={formData.budget}
                  className="bg-slate-800 border-slate-600 text-white"
                />
              </div>
            </div>

            {/* Currency Converter */}
            {showConverter && formData.budget && formData.currency !== 'cUSD' && (
              <div className="mt-4">
                <CurrencyConverter
                  amount={formData.budget}
                  fromCurrency={formData.currency}
                  toCurrency="cUSD"
                  className="bg-slate-800/50"
                />
              </div>
            )}
            
            <button
              onClick={() => setShowConverter(!showConverter)}
              className="text-sm text-emerald-400 hover:text-emerald-300"
            >
              {showConverter ? 'Hide' : 'Show'} currency conversion
            </button>
          </div>

          {/* Campaign Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-400" />
              Campaign Settings
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Max Influencers */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Max Influencers *
                </label>
                <input
                  type="number"
                  value={formData.maxInfluencers}
                  onChange={(e) => setFormData({ ...formData, maxInfluencers: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-emerald-500 focus:outline-none"
                  placeholder="5"
                />
              </div>

              {/* Target Audience */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Target Audience *
                </label>
                <select
                  value={formData.targetAudience}
                  onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:border-emerald-500 focus:outline-none"
                >
                  <option value="">Select audience</option>
                  <option value="1">General (All ages)</option>
                  <option value="2">Young Adults (18-30)</option>
                  <option value="3">Adults (30-50)</option>
                  <option value="4">Seniors (50+)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Timing Configuration Section */}
          <div className="bg-slate-900/30 border border-slate-700/30 rounded-xl p-4">
            <h4 className="text-sm font-medium text-slate-300 mb-3 flex items-center">
              <Clock className="w-4 h-4 mr-2" />
              Campaign Timing Configuration
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Application Period */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Application Period
                </label>
                <select
                  value={formData.applicationPeriod}
                  onChange={(e) => setFormData({ ...formData, applicationPeriod: e.target.value })}
                  className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-200 appearance-none text-sm"
                  disabled={isTransactionInProgress}
                >
                  <option value="86400">1 day</option>
                  <option value="172800">2 days</option>
                  <option value="259200">3 days</option>
                  <option value="345600">4 days</option>
                  <option value="432000">5 days</option>
                  <option value="604800">7 days</option>
                  <option value="864000">10 days</option>
                  <option value="1209600">14 days</option>
                </select>
                <p className="text-xs text-slate-400 mt-1">
                  How long influencers can apply
                </p>
              </div>

              {/* Proof Submission Grace Period */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Proof Grace Period
                </label>
                <select
                  value={formData.proofSubmissionGracePeriod}
                  onChange={(e) => setFormData({ ...formData, proofSubmissionGracePeriod: e.target.value })}
                  className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-200 appearance-none text-sm"
                  disabled={isTransactionInProgress}
                >
                  <option value="86400">1 day</option>
                  <option value="172800">2 days (max)</option>
                </select>
                <p className="text-xs text-slate-400 mt-1">
                  Grace period after promotion ends
                </p>
              </div>

              {/* Verification Period */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Verification Period
                </label>
                <select
                  value={formData.verificationPeriod}
                  onChange={(e) => setFormData({ ...formData, verificationPeriod: e.target.value })}
                  className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-200 appearance-none text-sm"
                  disabled={isTransactionInProgress}
                >
                  <option value="86400">1 day</option>
                  <option value="172800">2 days</option>
                  <option value="259200">3 days</option>
                  <option value="345600">4 days</option>
                  <option value="432000">5 days (max)</option>
                </select>
                <p className="text-xs text-slate-400 mt-1">
                  Time to review submissions
                </p>
              </div>

              {/* Selection Grace Period */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Selection Grace Period
                </label>
                <select
                  value={formData.selectionGracePeriod}
                  onChange={(e) => setFormData({ ...formData, selectionGracePeriod: e.target.value })}
                  className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-200 appearance-none text-sm"
                  disabled={isTransactionInProgress}
                >
                  <option value="86400">1d</option>
                  <option value="172800">2d (max)</option>
                </select>
                <p className="text-xs text-slate-400 mt-1">
                  Grace period for selecting influencers
                </p>
              </div>
            </div>

            {/* Promotion Duration - Separate section */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Promotion Duration
              </label>
              <select
                value={formData.promotionDuration}
                onChange={(e) => setFormData({ ...formData, promotionDuration: e.target.value })}
                className="w-full md:w-1/2 bg-slate-900/50 border border-slate-700/50 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-200 appearance-none text-sm"
                disabled={isTransactionInProgress}
              >
                <option value="86400">1 day</option>
                <option value="172800">2 days</option>
                <option value="259200">3 days</option>
                <option value="345600">4 days</option>
                <option value="432000">5 days</option>
                <option value="604800">6 days</option>
                <option value="691200">7 days</option>
                <option value="777600">8 days</option>
                <option value="864000">9 days</option>
                <option value="950400">10 days</option>
                <option value="1036800">11 days</option>
                <option value="1123200">12 days</option>
                <option value="1209600">13 days</option>
                <option value="1296000">14 days</option>
              </select>
              <p className="text-xs text-slate-400 mt-1">
                How long the promotion campaign will run
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
            <button
              onClick={onClose}
              className="px-6 py-2 text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateCampaign}
              disabled={!canSubmit}
              className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-700 disabled:text-slate-400 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
            >
              {isTransactionInProgress ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Campaign'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default withNetworkGuard(CreateCampaignModal);
