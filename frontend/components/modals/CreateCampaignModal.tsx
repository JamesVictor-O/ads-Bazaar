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
import { motion } from "framer-motion";
import { useAccount } from "wagmi";
import { toast } from "react-hot-toast";
import { withNetworkGuard } from "../WithNetworkGuard";
import { NetworkStatus } from "../NetworkStatus";
import { useEnsureNetwork } from "@/hooks/useEnsureNetwork";
import { useDivviIntegration } from "@/hooks/useDivviIntegration"; 

interface FormData {
  name: string;
  description: string;
  requirements: string;
  budget: string;
  maxInfluencers: string;
  promotionDuration: string;
  targetAudience: string;
  applicationPeriod: string;
  proofSubmissionGracePeriod: string;
  verificationPeriod: string;
}

interface CreateCampaignModalProps {
  formData: FormData;
  setFormData: (data: FormData) => void;
  isCreatingBrief: boolean;
  isFormValid: boolean;
  onCreateCampaign: (referralTag?: `0x${string}`) => Promise<string>;
  onClose: () => void;
  guardedAction?: (action: () => Promise<void>) => Promise<void>;
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
}: CreateCampaignModalProps) {
  const { isConnected } = useAccount();
  const { isCorrectChain, currentNetwork } = useEnsureNetwork();
  const { generateDivviReferralTag } = useDivviIntegration(); // ADD THIS LINE
  const [transactionPhase, setTransactionPhase] =
    useState<TransactionPhase>("idle");

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
      console.log('DIVVI: About to create campaign with referral tag:', referralTag); // ADD THIS LINE

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
            disabled={isTransactionInProgress}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Content */}
        <div className="px-4 pb-4 max-h-[calc(90vh-180px)] sm:max-h-[calc(90vh-200px)] overflow-y-auto">
          {/* Network Status */}
          {isConnected && (
            <div className="mt-4">
              <NetworkStatus className="bg-slate-900/30 border-slate-600/50" />
            </div>
          )}

          {/* Connection Warning */}
          {!isConnected && (
            <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start">
              <AlertTriangle className="text-amber-400 mr-3 mt-0.5 flex-shrink-0 w-5 h-5" />
              <div>
                <p className="text-sm font-medium text-amber-400">
                  Wallet Not Connected
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Connect your wallet to create campaigns
                </p>
              </div>
            </div>
          )}

          {/* Transaction Status */}
          {transactionPhase !== "idle" && (
            <div className="mt-4">
              {(() => {
                const txMessage = getTransactionMessage();
                if (!txMessage) return null;

                return (
                  <div
                    className={`p-3 rounded-xl border flex items-start ${txMessage.bgColor}`}
                  >
                    <div className="mr-3 mt-0.5 flex-shrink-0">
                      {transactionPhase === "approving" ||
                      transactionPhase === "creating" ? (
                        <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
                      ) : (
                        txMessage.icon
                      )}
                    </div>
                    <div>
                      <p
                        className={`text-sm font-medium ${txMessage.textColor}`}
                      >
                        {txMessage.title}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        {txMessage.description}
                      </p>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          <div className="space-y-4 mt-4">
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
                disabled={isTransactionInProgress}
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
                disabled={isTransactionInProgress}
              />
            </div>

            {/* Campaign Requirements */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Campaign Requirements
              </label>
              <textarea
                value={formData.requirements}
                onChange={(e) =>
                  setFormData({ ...formData, requirements: e.target.value })
                }
                className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-3 py-2.5 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-200 resize-y text-sm"
                rows={4}
                placeholder="Specify campaign requirements (e.g., content type, posting guidelines)"
                required
                aria-required="true"
                disabled={isTransactionInProgress}
              />
            </div>

            {/* Grid Container */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Budget */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Budget (cUSD)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={formData.budget}
                    onChange={(e) =>
                      setFormData({ ...formData, budget: e.target.value })
                    }
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-900/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-200 text-sm"
                    placeholder="Enter budget amount"
                    required
                    aria-required="true"
                    disabled={isTransactionInProgress}
                  />
                </div>
              </div>

              {/* Max Influencers */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Max Influencers
                </label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={formData.maxInfluencers}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        maxInfluencers: e.target.value,
                      })
                    }
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-900/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-200 text-sm"
                    placeholder="Max influencers (1-10)"
                    required
                    aria-required="true"
                    disabled={isTransactionInProgress}
                  />
                </div>
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
                  disabled={isTransactionInProgress}
                >
                  <option value="86400">1 day</option>
                  <option value="172800">2 days</option>
                  <option value="259200">3 days</option>
                  <option value="345600">4 days</option>
                  <option value="432000">5 days</option>
                  <option value="518400">6 days</option>
                  <option value="604800">7 days</option>
                  <option value="691200">8 days</option>
                  <option value="777600">9 days</option>
                  <option value="864000">10 days</option>
                  <option value="950400">11 days</option>
                  <option value="1036800">12 days</option>
                  <option value="1123200">13 days</option>
                  <option value="1209600">14 days</option>
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
                  disabled={isTransactionInProgress}
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
                  
                </select>
              </div>
            </div>

            {/* Timing Configuration Section */}
            <div className="bg-slate-900/30 border border-slate-700/30 rounded-xl p-4">
              <h4 className="text-sm font-medium text-slate-300 mb-3 flex items-center">
                <Clock className="w-4 h-4 mr-2" />
                Campaign Timing Configuration
              </h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Application Period */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Application Period
                  </label>
                  <select
                    value={formData.applicationPeriod}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        applicationPeriod: e.target.value,
                      })
                    }
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
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        proofSubmissionGracePeriod: e.target.value,
                      })
                    }
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
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        verificationPeriod: e.target.value,
                      })
                    }
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
              </div>
            </div>

            {/* Budget Breakdown Info */}
            {formData.budget && Number(formData.budget) > 0 && (
              <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4">
                <h4 className="text-sm font-medium text-slate-300 mb-2">
                  Budget Breakdown
                </h4>
                <div className="space-y-1 text-xs text-slate-400">
                  <div className="flex justify-between">
                    <span>Total Budget:</span>
                    <span className="text-white">{formData.budget} cUSD</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Platform Fee (0.5%):</span>
                    <span>
                      {(Number(formData.budget) * 0.005).toFixed(2)} cUSD
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-slate-700/50 pt-1">
                    <span>Influencer Payout:</span>
                    <span className="text-emerald-400">
                      {(Number(formData.budget) * 0.995).toFixed(2)} cUSD
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Fixed Action Buttons */}
        <div className="border-t border-slate-700/50 bg-slate-800/95 p-4 sticky bottom-0">
          <div className="flex flex-col sm:flex-row justify-end gap-3">
            <button
              onClick={onClose}
              className="order-2 sm:order-1 px-4 py-2.5 bg-slate-700/50 text-slate-300 rounded-lg border border-slate-600/50 hover:bg-slate-700 hover:border-slate-500 active:bg-slate-600 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              disabled={isTransactionInProgress}
            >
              Cancel
            </button>
            <button
              onClick={handleCreateCampaign}
              disabled={!canSubmit}
              className="order-1 sm:order-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg font-medium hover:from-emerald-600 hover:to-emerald-700 active:from-emerald-700 active:to-emerald-800 transition-all duration-200 shadow-sm shadow-emerald-500/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {isTransactionInProgress ? (
                <>
                  <Loader2 className="animate-spin h-4 w-4 text-white flex-shrink-0" />
                  <span>
                    {transactionPhase === "approving"
                      ? "Approving..."
                      : "Creating..."}
                  </span>
                </>
              ) : !isConnected ? (
                <>
                  <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                  <span>Connect Wallet</span>
                </>
              ) : !isCorrectChain ? (
                <>
                  <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                  <span>Switch to {currentNetwork.name}</span>
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

export default withNetworkGuard(CreateCampaignModal);