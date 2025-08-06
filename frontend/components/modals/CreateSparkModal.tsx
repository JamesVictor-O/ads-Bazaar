"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  X,
  Zap,
  Loader2,
  CheckCircle,
  DollarSign,
  Clock,
  Users,
  ExternalLink,
  Sparkles,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import { CurrencySelector } from "../CurrencySelector";
import { SupportedCurrency, MENTO_TOKENS } from "@/lib/mento-simple";
import { motion, AnimatePresence } from "framer-motion";
import { useAccount } from "wagmi";
import { toast } from "react-hot-toast";
import { NetworkStatus } from "../NetworkStatus";
import { useEnsureNetwork } from "@/hooks/useEnsureNetwork";
import { useCreateSparkCampaign, useSparkConfiguration } from "@/hooks/useSparkCampaign";
import { useMultiCurrencyBalances } from "@/hooks/useMultiCurrencyBalances";
import { formatUnits } from "viem";

interface CreateSparkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface SparkFormData {
  castUrl: string;
  currency: SupportedCurrency;
  depositAmount: string;
  multiplier: number;
  durationHours: number;
  maxParticipants: number;
}

const MULTIPLIER_OPTIONS = [
  { value: 1, label: "1x", color: "from-slate-400 to-slate-500", description: "Standard reward" },
  { value: 2, label: "2x", color: "from-blue-400 to-blue-500", description: "2x reward" },
  { value: 3, label: "3x", color: "from-green-400 to-green-500", description: "3x reward" },
  { value: 5, label: "5x", color: "from-yellow-400 to-yellow-500", description: "5x reward" },
  { value: 8, label: "8x", color: "from-orange-400 to-orange-500", description: "8x reward" },
  { value: 10, label: "10x", color: "from-red-400 to-red-500", description: "MAX reward" },
];

const DURATION_OPTIONS = [
  { value: 1, label: "1 Hour", description: "Quick spark" },
  { value: 6, label: "6 Hours", description: "Half day" },
  { value: 24, label: "1 Day", description: "Popular choice" },
  { value: 72, label: "3 Days", description: "Extended reach" },
  { value: 168, label: "1 Week", description: "Maximum duration" },
];

export default function CreateSparkModal({ isOpen, onClose, onSuccess }: CreateSparkModalProps) {
  const { address, isConnected } = useAccount();
  const { isCorrectChain } = useEnsureNetwork();
  const { createSparkCampaign, isCreating, isSuccess, error } = useCreateSparkCampaign();
  const { configuration } = useSparkConfiguration();
  const { balances } = useMultiCurrencyBalances();

  const [formData, setFormData] = useState<SparkFormData>({
    castUrl: "",
    currency: "cUSD",
    depositAmount: "",
    multiplier: 2,
    durationHours: 24,
    maxParticipants: 0, // 0 means unlimited
  });

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [estimatedRewards, setEstimatedRewards] = useState({
    baseReward: "0",
    totalReward: "0",
  });

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        castUrl: "",
        currency: "cUSD",
        depositAmount: "",
        multiplier: 2,
        durationHours: 24,
        maxParticipants: 0,
      });
      setShowAdvanced(false);
    }
  }, [isOpen]);

  // Calculate estimated rewards
  useEffect(() => {
    if (formData.depositAmount && !isNaN(Number(formData.depositAmount))) {
      const deposit = Number(formData.depositAmount);
      const participants = formData.maxParticipants > 0 ? formData.maxParticipants : 10; // Default estimate
      const baseReward = deposit / participants;
      const totalReward = baseReward * formData.multiplier;

      setEstimatedRewards({
        baseReward: baseReward.toFixed(4),
        totalReward: totalReward.toFixed(4),
      });
    } else {
      setEstimatedRewards({ baseReward: "0", totalReward: "0" });
    }
  }, [formData.depositAmount, formData.multiplier, formData.maxParticipants]);

  // Get user's balance for selected currency
  const selectedBalance = balances.find(b => b.token === formData.currency);
  const hasInsufficientBalance = selectedBalance && 
    formData.depositAmount && 
    Number(formData.depositAmount) > Number(selectedBalance.balanceFormatted);

  // Validate Farcaster cast URL
  const isValidCastUrl = (url: string) => {
    return url.includes('warpcast.com') || url.includes('farcaster.xyz') || url.startsWith('https://');
  };

  const isFormValid = 
    formData.castUrl && 
    isValidCastUrl(formData.castUrl) &&
    formData.depositAmount && 
    Number(formData.depositAmount) >= (configuration ? Number(formatUnits(configuration.minDeposit, 18)) : 2) &&
    !hasInsufficientBalance;

  const handleSubmit = async () => {
    if (!isFormValid || !isConnected) return;

    try {
      await createSparkCampaign({
        castUrl: formData.castUrl,
        currency: formData.currency,
        depositAmount: formData.depositAmount,
        multiplier: formData.multiplier,
        durationHours: formData.durationHours,
        maxParticipants: formData.maxParticipants,
      });

      // Success handled by the hook
      setTimeout(() => {
        onClose();
        onSuccess?.();
      }, 2000);
    } catch (error) {
      // Error handled by the hook
      console.error('Spark creation failed:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-slate-900 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-700"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Create Spark Campaign</h2>
                <p className="text-slate-400 text-sm">Instantly boost your Farcaster cast</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-800 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Network Status */}
          <div className="mb-6">
            <NetworkStatus />
          </div>

          <form className="space-y-6">
            {/* Cast URL */}
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">
                Farcaster Cast URL *
              </label>
              <div className="relative">
                <input
                  type="url"
                  placeholder="https://warpcast.com/username/0x..."
                  value={formData.castUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, castUrl: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                />
                <ExternalLink className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              </div>
              {formData.castUrl && !isValidCastUrl(formData.castUrl) && (
                <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4" />
                  Please enter a valid Farcaster cast URL
                </p>
              )}
            </div>

            {/* Currency and Amount */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  Currency
                </label>
                <CurrencySelector
                  value={formData.currency}
                  onChange={(currency) => setFormData(prev => ({ ...prev, currency }))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  Deposit Amount *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min={configuration ? formatUnits(configuration.minDeposit, 18) : "2"}
                    placeholder="10.00"
                    value={formData.depositAmount}
                    onChange={(e) => setFormData(prev => ({ ...prev, depositAmount: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  />
                  <DollarSign className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                </div>
                {selectedBalance && (
                  <p className="text-xs text-slate-400 mt-1">
                    Balance: {Number(selectedBalance.balanceFormatted).toFixed(4)} {selectedBalance.symbol}
                  </p>
                )}
                {hasInsufficientBalance && (
                  <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4" />
                    Insufficient balance
                  </p>
                )}
              </div>
            </div>

            {/* Multiplier Slider */}
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-3">
                Reward Multiplier: {formData.multiplier}x
              </label>
              <div className="space-y-4">
                <div className="grid grid-cols-6 gap-2">
                  {MULTIPLIER_OPTIONS.map((option) => (
                    <motion.button
                      key={option.value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, multiplier: option.value }))}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        formData.multiplier === option.value
                          ? 'border-yellow-400 bg-gradient-to-r ' + option.color + ' text-white shadow-lg'
                          : 'border-slate-600 bg-slate-800 text-slate-300 hover:border-slate-500'
                      }`}
                      whileTap={{ scale: 0.95 }}
                    >
                      <div className="text-center">
                        <div className="font-bold">{option.label}</div>
                        <div className="text-xs opacity-80">{option.description}</div>
                      </div>
                    </motion.button>
                  ))}
                </div>
                <div className="bg-slate-800 rounded-lg p-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Higher multiplier = More attention = Higher rewards</span>
                    <TrendingUp className="w-4 h-4 text-yellow-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-3">
                Campaign Duration
              </label>
              <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                {DURATION_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, durationHours: option.value }))}
                    className={`p-3 rounded-lg border transition-all ${
                      formData.durationHours === option.value
                        ? 'border-yellow-400 bg-yellow-400/10 text-yellow-400'
                        : 'border-slate-600 bg-slate-800 text-slate-300 hover:border-slate-500'
                    }`}
                  >
                    <div className="text-center">
                      <div className="font-medium">{option.label}</div>
                      <div className="text-xs opacity-80">{option.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Advanced Options */}
            <div>
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
              >
                <span>Advanced Options</span>
                <motion.div
                  animate={{ rotate: showAdvanced ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="w-4 h-4" />
                </motion.div>
              </button>

              <AnimatePresence>
                {showAdvanced && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="mt-4 space-y-4"
                  >
                    <div>
                      <label className="block text-sm font-medium text-slate-200 mb-2">
                        Max Participants (0 = Unlimited)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          max="1000"
                          placeholder="0"
                          value={formData.maxParticipants || ""}
                          onChange={(e) => setFormData(prev => ({ 
                            ...prev, 
                            maxParticipants: parseInt(e.target.value) || 0 
                          }))}
                          className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                        />
                        <Users className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Estimated Rewards */}
            {formData.depositAmount && (
              <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-xl p-4">
                <h4 className="text-yellow-400 font-medium mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Estimated Rewards
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-slate-400">Base Reward per User</div>
                    <div className="text-white font-medium">{estimatedRewards.baseReward} {MENTO_TOKENS[formData.currency].symbol}</div>
                  </div>
                  <div>
                    <div className="text-slate-400">With {formData.multiplier}x Multiplier</div>
                    <div className="text-yellow-400 font-medium">{estimatedRewards.totalReward} {MENTO_TOKENS[formData.currency].symbol}</div>
                  </div>
                </div>
              </div>
            )}
          </form>

          {/* Actions */}
          <div className="flex gap-3 mt-8">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-slate-700 text-white rounded-xl hover:bg-slate-600 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!isFormValid || isCreating || !isConnected || !isCorrectChain}
              className={`flex-1 px-6 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                !isFormValid || !isConnected || !isCorrectChain
                  ? "bg-slate-600 text-slate-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-yellow-400 to-orange-500 text-white hover:from-yellow-500 hover:to-orange-600 shadow-lg shadow-yellow-500/25"
              }`}
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating...
                </>
              ) : isSuccess ? (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Success!
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5" />
                  Create Spark
                </>
              )}
            </button>
          </div>

          {/* Help Text */}
          <div className="mt-4 p-3 bg-slate-800/50 rounded-lg">
            <p className="text-xs text-slate-400">
              💡 <strong>Tip:</strong> Higher multipliers attract more attention but cost more per participant. 
              Users will recast your content and get rewarded automatically when verified through Neynar API.
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}