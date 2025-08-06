"use client";

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  TrendingUp,
  Clock,
  DollarSign,
  Users,
  ExternalLink,
  Zap,
  Search,
  Filter,
  RefreshCw,
  ChevronDown,
  Star,
  Flame,
  AlertCircle,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAccount } from "wagmi";
import Link from "next/link";
import { 
  useSparkDiscovery, 
  useMultipleSparkCampaigns,
  SparkFilter,
  SparkSortBy,
} from "@/hooks/useSparkDiscovery";
import { useSparkParticipation, getSparkProgress, timeUntilExpiry } from "@/hooks/useSparkCampaign";
import { MENTO_TOKENS } from "@/lib/mento-simple";
import { formatUnits } from "viem";

interface SparkDiscoveryProps {
  isOpen: boolean;
  onClose: () => void;
}

const FILTER_OPTIONS: Array<{value: SparkFilter, label: string, icon: React.ReactNode}> = [
  { value: 'all', label: 'All Sparks', icon: <Sparkles className="w-4 h-4" /> },
  { value: 'trending', label: 'Trending', icon: <TrendingUp className="w-4 h-4" /> },
  { value: 'new', label: 'New', icon: <Star className="w-4 h-4" /> },
  { value: 'almost-complete', label: 'Almost Complete', icon: <Flame className="w-4 h-4" /> },
];

const SORT_OPTIONS: Array<{value: SparkSortBy, label: string}> = [
  { value: 'multiplier', label: 'Highest Multiplier' },
  { value: 'budget', label: 'Highest Budget' },
  { value: 'participants', label: 'Most Participants' },
  { value: 'progress', label: 'Almost Complete' },
  { value: 'created', label: 'Newest First' },
];

export default function SparkDiscovery({ isOpen, onClose }: SparkDiscoveryProps) {
  const { address, isConnected } = useAccount();
  const { verifyAndClaimSpark, isParticipating } = useSparkParticipation();
  
  const {
    currentSparkIds,
    filter,
    setFilter,
    sortBy,
    setSortBy,
    searchTerm,
    setSearchTerm,
    isLoading,
    refetch,
  } = useSparkDiscovery();

  const { sparkCampaigns, isLoading: isLoadingCampaigns } = useMultipleSparkCampaigns(currentSparkIds);

  const [selectedSparkId, setSelectedSparkId] = useState<string | null>(null);

  const handleParticipate = async (sparkId: string) => {
    if (!isConnected) return;
    
    try {
      setSelectedSparkId(sparkId);
      await verifyAndClaimSpark(sparkId as `0x${string}`);
      // Refresh data after successful participation
      refetch();
    } catch (error) {
      console.error('Failed to participate in spark:', error);
    } finally {
      setSelectedSparkId(null);
    }
  };

  const getCurrencyInfo = (tokenAddress: string) => {
    const currency = Object.entries(MENTO_TOKENS).find(([_, token]) => 
      token.address.toLowerCase() === tokenAddress.toLowerCase()
    );
    return currency ? { key: currency[0], ...currency[1] } : { key: 'cUSD', ...MENTO_TOKENS.cUSD };
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="bg-slate-900 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-slate-700 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Spark Discovery</h2>
                <p className="text-slate-400 text-sm">Participate in viral campaigns and earn rewards</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-800 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Filters and Search */}
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by cast URL, creator, or currency..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
            </div>

            {/* Filter Buttons */}
            <div className="flex gap-2 overflow-x-auto">
              {FILTER_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setFilter(option.value)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all whitespace-nowrap ${
                    filter === option.value
                      ? 'bg-yellow-500 text-white shadow-lg shadow-yellow-500/25'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-600'
                  }`}
                >
                  {option.icon}
                  {option.label}
                </button>
              ))}
            </div>

            {/* Sort Dropdown */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SparkSortBy)}
                className="appearance-none bg-slate-800 border border-slate-600 rounded-lg px-4 py-2.5 text-white pr-10 focus:outline-none focus:ring-2 focus:ring-yellow-500"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
            </div>

            {/* Refresh Button */}
            <button
              onClick={refetch}
              disabled={isLoading}
              className="flex items-center justify-center p-2.5 bg-slate-800 border border-slate-600 rounded-lg text-slate-300 hover:bg-slate-700 transition-colors"
            >
              <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {!isConnected ? (
            <div className="text-center py-12">
              <AlertCircle className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Connect Your Wallet</h3>
              <p className="text-slate-400">You need to connect your wallet to participate in Spark Campaigns</p>
            </div>
          ) : isLoading || isLoadingCampaigns ? (
            <div className="text-center py-12">
              <RefreshCw className="w-8 h-8 text-yellow-400 animate-spin mx-auto mb-4" />
              <p className="text-slate-400">Loading Spark Campaigns...</p>
            </div>
          ) : sparkCampaigns.length === 0 ? (
            <div className="text-center py-12">
              <Sparkles className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No Active Sparks</h3>
              <p className="text-slate-400">No spark campaigns match your current filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sparkCampaigns.map((spark) => {
                const currencyInfo = getCurrencyInfo(spark.tokenAddress);
                const progress = getSparkProgress(spark.totalBudget, spark.remainingBudget);
                const isParticipatingThis = selectedSparkId === spark.sparkId && isParticipating;

                return (
                  <motion.div
                    key={spark.sparkId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-slate-800/50 border border-slate-700 rounded-xl p-5 hover:bg-slate-800/70 transition-all hover:border-slate-600"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className={`px-2 py-1 rounded-lg bg-gradient-to-r ${
                          spark.multiplier >= 8 ? 'from-red-500 to-red-600' :
                          spark.multiplier >= 5 ? 'from-orange-500 to-orange-600' :
                          spark.multiplier >= 3 ? 'from-yellow-500 to-yellow-600' :
                          'from-blue-500 to-blue-600'
                        } text-white font-bold text-sm`}>
                          {spark.multiplier}x
                        </div>
                        <span className="text-xs text-slate-400">
                          {timeUntilExpiry(spark.expiresAt)}
                        </span>
                      </div>
                      <a
                        href={spark.castUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-400 hover:text-white transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>

                    {/* Budget Info */}
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 text-sm">Total Budget</span>
                        <span className="text-white font-medium">
                          {formatUnits(spark.totalBudget, currencyInfo.decimals)} {currencyInfo.symbol}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 text-sm">Remaining</span>
                        <span className="text-yellow-400 font-medium">
                          {formatUnits(spark.remainingBudget, currencyInfo.decimals)} {currencyInfo.symbol}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-slate-400 text-xs">Progress</span>
                          <span className="text-slate-400 text-xs">{progress}%</span>
                        </div>
                        <div className="w-full bg-slate-700 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-yellow-400 to-orange-500 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-white font-semibold">{spark.participantCount}</div>
                        <div className="text-slate-400 text-xs flex items-center justify-center gap-1">
                          <Users className="w-3 h-3" />
                          Participants
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-white font-semibold">{spark.verifiedCount}</div>
                        <div className="text-slate-400 text-xs flex items-center justify-center gap-1">
                          <Zap className="w-3 h-3" />
                          Verified
                        </div>
                      </div>
                    </div>

                    {/* Estimated Reward */}
                    <div className="bg-slate-700/50 rounded-lg p-3 mb-4">
                      <div className="text-center">
                        <div className="text-slate-400 text-xs mb-1">Estimated Reward</div>
                        <div className="text-yellow-400 font-bold">
                          ~{formatUnits(spark.baseReward * BigInt(spark.multiplier), currencyInfo.decimals)} {currencyInfo.symbol}
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <button
                      onClick={() => handleParticipate(spark.sparkId)}
                      disabled={isParticipatingThis || progress >= 100}
                      className={`w-full py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                        progress >= 100
                          ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                          : isParticipatingThis
                          ? 'bg-yellow-600 text-white cursor-not-allowed'
                          : 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white hover:from-yellow-500 hover:to-orange-600 shadow-lg shadow-yellow-500/25'
                      }`}
                    >
                      {isParticipatingThis ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Verifying...
                        </>
                      ) : progress >= 100 ? (
                        <>
                          <AlertCircle className="w-4 h-4" />
                          Completed
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4" />
                          Verify & Claim
                        </>
                      )}
                    </button>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}