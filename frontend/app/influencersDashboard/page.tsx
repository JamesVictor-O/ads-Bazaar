"use client";

import { useState, useEffect } from "react";
import SubmitPostModal from "@/components/modals/SubmitPostModal";
import ClaimPaymentsModal from "@/components/modals/ClaimPaymentsModal";
import { Transaction } from "@/types";
import { motion } from "framer-motion";
import {
  Briefcase,
  DollarSign,
  Calendar,
  TrendingUp,
  CheckCircle,
  Link as LinkIcon,
  ExternalLink,
  AlertCircle,
  Shield,
 
  Sparkles,
  User,
  Timer,
  Star,
  Zap,
 
  Upload,
  Bell,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useProfile } from "@farcaster/auth-kit";
import { useAccount } from "wagmi";
import { format } from "date-fns";
import {
  useUserProfile,
  useIsInfluencerVerified,
  useSubmitProof,
  useTotalPendingAmount,
  usePendingPayments,
} from "../../hooks/adsBazaar";
import { Toaster, toast } from "react-hot-toast";
import { useInfluencerDashboard } from "@/hooks/useInfluencerDashboard";
import Link from "next/link";
import Image from "next/image";
import { formatEther } from "viem";
import {
  Brief,
  Application,
  CampaignStatus,
} from "@/types";
import {
  computeApplicationInfo,
  getStatusColor,
  getPhaseColor,
  getProofStatusColor,
  getPaymentStatusColor,
  formatTimeRemaining,
  getPhaseLabel,
} from "@/utils/campaignUtils";

// Define precise interfaces
interface ApplicationWithBrief {
  briefId: string;
  brief: Brief;
  application: Application;
}

interface Task {
  name: string;
}

interface SubmitProofResult {
  hash?: string;
}

type TxStage =
  | "idle"
  | "error"
  | "success"
  | "preparing"
  | "confirming"
  | "mining";

export default function InfluencerDashboard() {
  const { status } = useSession();
  const { isConnected, address } = useAccount();
  const {
    profile: { username, displayName, pfpUrl },
  } = useProfile();
  const [isMounted, setIsMounted] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [selectedCampaign, setSelectedCampaign] =
    useState<ApplicationWithBrief | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [postLink, setPostLink] = useState("");
  const [transactionHistory, setTransactionHistory] = useState<Transaction[]>(
    []
  );
  const [expandedBriefId, setExpandedBriefId] = useState<string | null>(null);
  const [filter, setFilter] = useState<
    "all" | "active" | "completed" | "urgent"
  >("all");

  const [txStatus, setTxStatus] = useState<{
    stage: TxStage;
    message: string;
    hash: string | undefined;
  }>({
    stage: "idle",
    message: "",
    hash: undefined,
  });

  const { userProfile, isLoadingProfile } = useUserProfile();
  const { isVerified } = useIsInfluencerVerified();
  const { appliedBriefs, assignedBriefs, isLoading, error, refetch } =
    useInfluencerDashboard();

  // Fetch pending payments data
  const { totalPendingAmount, isLoadingTotalAmount } =
    useTotalPendingAmount(address);

  const { pendingPayments, isLoadingPayments, refetchPayments } =
    usePendingPayments(address);

  const {
    submitProof,
    isPending: isSubmittingProof,
    isSuccess: isSubmittingSuccess,
    isError: isSubmittingError,
    error: submitError,
  } = useSubmitProof();

  useEffect(() => {
    setIsMounted(true);
  }, [isConnected, address]);

  useEffect(() => {
    if (
      isSubmittingProof &&
      txStatus.stage !== "mining" &&
      txStatus.stage !== "confirming"
    ) {
      setTxStatus({
        stage: "mining",
        message: "Submitting post...",
        hash: txStatus.hash,
      });
    }
  }, [isSubmittingProof, txStatus.stage, txStatus.hash]);

  useEffect(() => {
    if (isSubmittingSuccess && txStatus.stage !== "success") {
      setTxStatus({
        stage: "success",
        message: "Post submitted successfully!",
        hash: txStatus.hash,
      });
      toast.success("Post submitted successfully!");
      refetch();
      setTimeout(() => {
        setShowSubmitModal(false);
        setPostLink("");
        setTxStatus({ stage: "idle", message: "", hash: undefined });
        setSelectedCampaign(null);
        setSelectedTask(null);
      }, 1500);
    }
  }, [isSubmittingSuccess, txStatus.stage, txStatus.hash, refetch]);

  useEffect(() => {
    if (isSubmittingError && txStatus.stage !== "error") {
      setTxStatus({
        stage: "error",
        message: submitError?.message || "Submission failed. Try again.",
        hash: txStatus.hash,
      });
      toast.error(submitError?.message || "Submission failed");
    }
  }, [isSubmittingError, submitError, txStatus.stage, txStatus.hash]);

  useEffect(() => {
    if (assignedBriefs && assignedBriefs.length > 0) {
      const txHistory = assignedBriefs
        .filter(
          (brief) =>
            brief.application.isApproved && brief.application.hasClaimed
        )
        .map((brief) => ({
          id: brief.briefId,
          type: "payment" as const,
          amount: Number(brief.brief.budget) / 1e18,
          from: brief.brief.business,
          date: format(new Date(), "yyyy-MM-dd"),
          txHash: `${brief.briefId.slice(0, 10)}...${brief.briefId.slice(-6)}`,
          status: "confirmed" as const,
        }));
      setTransactionHistory(txHistory);
    }
  }, [assignedBriefs]);

  const handleSubmitPost = async (briefId: string): Promise<void> => {
    if (!postLink) {
      toast.error("Please enter a post link");
      return;
    }

    setTxStatus({
      stage: "preparing",
      message: "Preparing submission...",
      hash: undefined,
    });

    try {
      const result: SubmitProofResult = await submitProof(briefId, postLink);
      if (result?.hash) {
        setTxStatus({
          stage: "confirming",
          message: "Confirm in wallet",
          hash: result.hash,
        });
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Submission failed";
      setTxStatus({
        stage: "error",
        message: errorMessage,
        hash: undefined,
      });
      toast.error(errorMessage);
    }
  };

  const handleOpenClaimModal = () => {
    if (!isConnected) {
      toast.error("Please connect your wallet to claim payments");
      return;
    }
    setShowClaimModal(true);
  };

  const handleClaimSuccess = () => {
    refetchPayments();
    refetch();
    toast.success("Payments claimed successfully!");
  };

  const handleCloseModal = () => {
    if (
      txStatus.stage !== "idle" &&
      txStatus.stage !== "error" &&
      txStatus.stage !== "success"
    ) {
      return;
    }
    setShowSubmitModal(false);
    setSelectedCampaign(null);
    setSelectedTask(null);
    setPostLink("");
    setTxStatus({ stage: "idle", message: "", hash: undefined });
  };

  // Enhanced campaign filtering
  const getFilteredCampaigns = () => {
    if (!appliedBriefs) return [];

    return appliedBriefs.filter((briefData) => {
      const appInfo = computeApplicationInfo(
        briefData.application,
        briefData.brief
      );

      switch (filter) {
        case "active":
          return (
            briefData.brief.status === CampaignStatus.OPEN ||
            briefData.brief.status === CampaignStatus.ASSIGNED
          );
        case "completed":
          return (
            briefData.brief.status === CampaignStatus.COMPLETED ||
            briefData.application.hasClaimed
          );
        case "urgent":
          return appInfo.canSubmitProof || appInfo.canClaim || appInfo.warning;
        default:
          return true;
      }
    });
  };

  const filteredCampaigns = getFilteredCampaigns();

  // Enhanced stats calculation
  const stats = {
    applied: appliedBriefs?.length || 0,
    assigned: assignedBriefs?.length || 0,
    totalEarned: transactionHistory.reduce((sum, tx) => sum + tx.amount, 0),
    pendingEarnings: totalPendingAmount
      ? parseFloat(formatEther(totalPendingAmount))
      : 0,
    hasClaimablePayments: pendingPayments && pendingPayments.length > 0,
    urgentActions: filteredCampaigns.filter((briefData) => {
      const appInfo = computeApplicationInfo(
        briefData.application,
        briefData.brief
      );
      return appInfo.canSubmitProof || appInfo.canClaim || appInfo.warning;
    }).length,
  };

  const isInitialLoading =
    !isMounted ||
    status === "loading" ||
    isLoadingProfile ||
    (isLoading && appliedBriefs === undefined && assignedBriefs === undefined);

  if (isInitialLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-emerald-500 mx-auto mb-2"></div>
          <p className="text-slate-400 text-xs">Loading dashboard...</p>
        </motion.div>
      </div>
    );
  }

  if (!userProfile?.isRegistered || !userProfile?.isInfluencer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <motion.div
          className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-lg p-6 max-w-[90vw] sm:max-w-sm text-center"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
        >
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-lg flex items-center justify-center mx-auto mb-3">
            <Briefcase className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-white mb-2">
            Influencer Account Required
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm mb-4 leading-relaxed">
            Register as an influencer to access the dashboard and apply for
            campaigns.
          </p>
          <Link href="/">
            <motion.button
              className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold py-2 px-3 rounded-lg hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-md shadow-emerald-500/20"
              whileTap={{ scale: 0.95 }}
            >
              Register
            </motion.button>
          </Link>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <motion.div
          className="text-center p-6 max-w-[90vw] sm:max-w-sm"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
        >
          <AlertCircle className="h-8 w-8 text-red-400 mx-auto mb-2" />
          <h2 className="text-lg font-bold text-white mb-1">
            Error Loading Dashboard
          </h2>
          <p className="text-slate-400 text-xs mb-3">{error}</p>
          <motion.button
            onClick={refetch}
            className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all text-xs"
            whileTap={{ scale: 0.95 }}
          >
            Retry
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pt-20 sm:pt-24 md:pt-40 pb-20">
      <Toaster position="top-right" />

      <div className="px-4 sm:px-6 md:px-8 pb-8">
        {/* Header Section */}
        <motion.div
          className="mb-6"
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center overflow-hidden">
                {pfpUrl ? (
                  <Image
                    src={pfpUrl}
                    alt="Profile"
                    width={50}
                    height={50}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-7 h-7 text-white" />
                )}
              </div>
              <div>
                <h1 className="text-lg sm:text-xl md:text-3xl font-bold text-white flex items-center gap-1.5">
                  Hi,{" "}
                  <span className="bg-gradient-to-r from-emerald-400 to-emerald-600 bg-clip-text text-transparent">
                    {username || displayName || "Influencer"}
                  </span>
                  {isVerified && (
                    <span className="ml-1 inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      <Shield className="w-2 h-2 mr-0.5" /> Verified
                    </span>
                  )}
                </h1>
                <p className="text-xs sm:text-sm md:text-xl text-slate-400 mt-0.5">
                  {stats.urgentActions > 0
                    ? `${stats.urgentActions} action${
                        stats.urgentActions !== 1 ? "s" : ""
                      } needed`
                    : "All caught up! 🎉"}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/selfVerification">
                <motion.button
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs md:text-sm font-medium text-white bg-emerald-600/80 hover:bg-emerald-700 rounded-lg transition-all shadow-sm"
                  whileTap={{ scale: 0.95 }}
                >
                  Verify With Self Protocol <ExternalLink className="w-3 h-3" />
                </motion.button>
              </Link>
              <Link href={`/influencer/${address}`}>
                <motion.button
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs md:text-sm font-medium text-slate-300 bg-slate-800/50 hover:bg-slate-800 rounded-lg border border-slate-700/50 transition-all shadow-sm"
                  whileTap={{ scale: 0.95 }}
                >
                  Profile <ExternalLink className="w-3 h-3" />
                </motion.button>
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Urgent Actions Alert */}
        {stats.urgentActions > 0 && (
          <motion.div
            className="mb-6 bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-500/20 rounded-xl p-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-start gap-3">
              <div className="p-2 bg-orange-500/20 rounded-lg border border-orange-500/30">
                <Bell className="w-5 h-5 text-orange-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-2">
                  Action Required
                </h3>
                <p className="text-sm text-orange-400">
                  You have {stats.urgentActions} campaign
                  {stats.urgentActions !== 1 ? "s" : ""} that need
                  {stats.urgentActions === 1 ? "s" : ""} your attention
                </p>
              </div>
              <motion.button
                onClick={() => setFilter("urgent")}
                className="px-3 py-1.5 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 rounded-lg text-sm font-medium transition-all"
                whileTap={{ scale: 0.95 }}
              >
                View All
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* Filter Tabs */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {[
              {
                key: "all",
                label: "All Campaigns",
                count: appliedBriefs?.length || 0,
              },
              {
                key: "active",
                label: "Active",
                count: stats.applied + stats.assigned,
              },
              {
                key: "completed",
                label: "Completed",
                count: transactionHistory.length,
              },
              {
                key: "urgent",
                label: "Action Needed",
                count: stats.urgentActions,
              },
            ].map((tab) => (
              <motion.button
                key={tab.key}
                onClick={() => setFilter(tab.key as any)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  filter === tab.key
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : "bg-slate-800/50 text-slate-400 border border-slate-700/50 hover:bg-slate-800"
                }`}
                whileTap={{ scale: 0.95 }}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className="ml-2 px-1.5 py-0.5 bg-slate-600/50 rounded-full text-xs">
                    {tab.count}
                  </span>
                )}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {[
            {
              icon: Briefcase,
              value: stats.applied,
              label: "Applied",
              color: "blue-400",
            },
            {
              icon: CheckCircle,
              value: stats.assigned,
              label: "Selected",
              color: "emerald-400",
            },
            {
              icon: DollarSign,
              value: stats.totalEarned.toFixed(2),
              label: "Earned",
              color: "purple-400",
            },
            {
              icon: TrendingUp,
              value: stats.pendingEarnings.toFixed(2),
              label: "Pending",
              color: "amber-400",
              hasClaimable: stats.hasClaimablePayments && isConnected,
              isLoading: isLoadingTotalAmount || isLoadingPayments,
            },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              className="bg-slate-800/60 backdrop-blur-md border border-slate-700/50 rounded-lg p-2.5 transition-all duration-200 shadow-sm relative"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: 0.05 * index }}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div
                  className={`p-1 bg-${stat.color}/10 rounded-md border border-${stat.color}/20`}
                >
                  <stat.icon className={`w-3.5 h-3.5 text-${stat.color}`} />
                </div>
                {stat.hasClaimable && !stat.isLoading && (
                  <motion.button
                    onClick={handleOpenClaimModal}
                    className="p-1 rounded-full bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    title="Claim rewards"
                  >
                    <DollarSign className="w-3 h-3 text-amber-400" />
                  </motion.button>
                )}
              </div>
              <p className="text-base font-bold text-white">
                {stat.isLoading ? (
                  <span className="animate-pulse">...</span>
                ) : (
                  stat.value
                )}
              </p>
              <p className="text-[10px] text-slate-400">{stat.label}</p>

              {stat.hasClaimable && !stat.isLoading && (
                <motion.button
                  onClick={handleOpenClaimModal}
                  className="w-full mt-2 py-1 text-xs bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-md flex items-center justify-center gap-1"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <DollarSign className="w-3 h-3" />
                  Claim All
                </motion.button>
              )}
            </motion.div>
          ))}
        </div>

        {/* Campaigns List */}
        <motion.div
          className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-lg overflow-hidden mb-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="p-3 sm:p-4 border-b border-slate-700/50 bg-gradient-to-r from-slate-800 to-slate-900">
            <div className="flex items-center justify-between">
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-1.5">
                <Briefcase className="w-5 h-5 md:text-xl text-emerald-400" />{" "}
                Campaigns
              </h2>
              <span className="text-xs text-slate-400">
                {filteredCampaigns.length} of {appliedBriefs?.length || 0}
              </span>
            </div>
          </div>

          {isLoading && appliedBriefs === undefined ? (
            <div className="p-6 text-center">
              <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-emerald-500 mb-2"></div>
              <p className="text-slate-400 text-xs">Loading...</p>
            </div>
          ) : !filteredCampaigns || filteredCampaigns.length === 0 ? (
            <div className="p-6 text-center">
              <Briefcase className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <h3 className="text-base font-semibold text-white mb-1">
                {filter === "all" ? "No Campaigns" : `No ${filter} campaigns`}
              </h3>
              <p className="text-slate-400 text-xs mb-3">
                {filter === "all"
                  ? "Apply to campaigns to get started."
                  : "Try changing the filter or apply to more campaigns."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {filteredCampaigns.map((briefData, index) => {
                const appInfo = computeApplicationInfo(
                  briefData.application,
                  briefData.brief
                );
                const isExpanded = expandedBriefId === briefData.briefId;
                const budget = briefData.brief.budget;

                return (
                  <motion.div
                    key={briefData.briefId}
                    className="p-3 sm:p-4 transition-all duration-200"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                  >
                    <div
                      className="flex flex-col gap-2 cursor-pointer"
                      onClick={() =>
                        setExpandedBriefId(
                          isExpanded ? null : briefData.briefId
                        )
                      }
                    >
                      <div className="flex items-start gap-2">
                        <div className="p-1.5 bg-gradient-to-br from-slate-700 to-slate-800 rounded-md border border-slate-600/50">
                          <Briefcase className="w-3.5 h-3.5 text-slate-300" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 mb-1">
                            <h3 className="text-sm md:text-lg font-semibold text-white truncate">
                              {briefData.brief.name}
                            </h3>
                            <div className="flex items-center gap-2 flex-wrap">
                              {/* Status badge */}
                              <span
                                className={`px-2 py-0.5 text-xs font-medium rounded-full border ${getStatusColor(
                                  briefData.brief.status
                                )}`}
                              >
                                {briefData.brief.statusInfo.statusLabel}
                              </span>

                              {/* Phase badge */}
                              <span
                                className={`px-2 py-0.5 text-xs font-medium rounded-full border ${getPhaseColor(
                                  briefData.brief.timingInfo.phase
                                )}`}
                              >
                                {getPhaseLabel(
                                  briefData.brief.timingInfo.phase
                                )}
                              </span>

                              {/* Application status */}
                              {briefData.application.isSelected && (
                                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                  <Star className="w-3 h-3 mr-1 inline" />
                                  Selected
                                </span>
                              )}

                              {/* Urgent indicator */}
                              {(appInfo.canSubmitProof ||
                                appInfo.canClaim ||
                                appInfo.warning) && (
                                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 animate-pulse">
                                  <Zap className="w-3 h-3 mr-1 inline" />
                                  Action
                                </span>
                              )}
                            </div>
                          </div>
                          <p className="text-slate-400 text-xs md:text-lg mb-1.5 line-clamp-1">
                            {briefData.brief.description}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              <span>
                                {format(
                                  new Date(briefData.brief.creationTime * 1000),
                                  "MMM d"
                                )}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <DollarSign className="w-3 h-3" />
                              <span>{budget.toFixed(2)} cUSD</span>
                            </div>
                            {briefData.brief.timingInfo.timeRemaining && (
                              <div className="flex items-center gap-1">
                                <Timer className="w-3 h-3" />
                                <span
                                  className={
                                    briefData.brief.timingInfo.isUrgent
                                      ? "text-orange-400"
                                      : ""
                                  }
                                >
                                  {formatTimeRemaining(
                                    briefData.brief.timingInfo.timeRemaining
                                  )}{" "}
                                  left
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Next Action Banner */}
                      {appInfo.nextAction && (
                        <div
                          className={`p-2 rounded-lg border ${
                            appInfo.warning
                              ? "bg-orange-500/10 border-orange-500/20"
                              : "bg-slate-900/50 border-slate-700/50"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-2 h-2 rounded-full ${
                                appInfo.warning
                                  ? "bg-orange-400"
                                  : "bg-emerald-400"
                              }`}
                            ></div>
                            <span className="text-sm text-slate-300">
                              {appInfo.nextAction}
                            </span>
                          </div>
                          {appInfo.warning && (
                            <div className="flex items-center gap-2 mt-1">
                              <AlertCircle className="w-3 h-3 text-orange-400" />
                              <span className="text-xs text-orange-400">
                                {appInfo.warning}
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {isExpanded && (
                        <motion.div
                          className="mt-2 pl-8"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          transition={{ duration: 0.2 }}
                        >
                          {briefData.application.isSelected && (
                            <div className="flex flex-col gap-2 mb-2">
                              <div className="flex items-center gap-1.5">
                                <span
                                  className={`px-2 py-0.5 text-xs font-medium rounded-full border ${getProofStatusColor(
                                    appInfo.proofStatus
                                  )}`}
                                >
                                  {appInfo.proofStatus
                                    .replace("_", " ")
                                    .toUpperCase()}
                                </span>
                                <span
                                  className={`px-2 py-0.5 text-xs font-medium rounded-full border ${getPaymentStatusColor(
                                    appInfo.paymentStatus
                                  )}`}
                                >
                                  {appInfo.paymentStatus
                                    .replace("_", " ")
                                    .toUpperCase()}
                                </span>
                              </div>
                              <div className="flex gap-2">
                                {briefData.application.proofLink ? (
                                  <a
                                    href={briefData.application.proofLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 px-2 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 rounded-md border border-emerald-500/30 text-xs"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <LinkIcon className="w-3 h-3" />
                                    View Proof
                                  </a>
                                ) : appInfo.canSubmitProof ? (
                                  <motion.button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedCampaign(briefData);
                                      setSelectedTask({
                                        name: briefData.brief.description,
                                      });
                                      setShowSubmitModal(true);
                                    }}
                                    className="flex items-center gap-1 px-2 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 rounded-md border border-emerald-500/30 text-xs"
                                    disabled={isSubmittingProof}
                                    whileTap={{ scale: 0.95 }}
                                  >
                                    {isSubmittingProof ? (
                                      "Submitting..."
                                    ) : (
                                      <>
                                        <Upload className="w-3 h-3" />
                                        Submit Proof
                                      </>
                                    )}
                                  </motion.button>
                                ) : null}

                                {appInfo.canClaim && (
                                  <motion.button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenClaimModal();
                                    }}
                                    className="flex items-center gap-1 px-2 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 rounded-md border border-emerald-500/30 text-xs"
                                    whileTap={{ scale: 0.95 }}
                                  >
                                    <CheckCircle className="w-3 h-3" />
                                    Claim Payment
                                  </motion.button>
                                )}
                              </div>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Transaction History */}
        <motion.div
          className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-lg overflow-hidden"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="p-3 sm:p-4 border-b border-slate-700/50 bg-gradient-to-r from-slate-800 to-slate-900">
            <div className="flex items-center justify-between">
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-amber-400" />
                Transactions
              </h2>
              <span className="text-xs text-slate-400">
                {transactionHistory.length}
              </span>
            </div>
          </div>

          {transactionHistory.length === 0 ? (
            <div className="p-6 text-center">
              <DollarSign className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <h3 className="text-base font-semibold text-white mb-1">
                No Transactions
              </h3>
              <p className="text-slate-400 text-xs">
                Earnings will appear here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {transactionHistory.map((tx, index) => (
                <motion.div
                  key={tx.id}
                  className="p-2.5 sm:p-3 transition-all duration-200"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                >
                  <div className="flex items-center gap-2">
                    <div className="p-1 bg-emerald-900/20 rounded-md border border-emerald-800/30">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-white truncate">
                        +{tx.amount.toFixed(2)} cUSD
                      </p>
                      <p className="text-[10px] text-slate-400 truncate">
                        From {tx.from}
                      </p>
                    </div>
                    <a
                      href={`https://explorer.celo.org/tx/${tx.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-400 hover:text-emerald-400 transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Sticky Browse Button */}
        <motion.div
          className="fixed bottom-9 right-9"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.3 }}
        >
          <Link href="/marketplace">
            <motion.button
              className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold px-3.5 py-2 rounded-full shadow-lg shadow-emerald-500/20"
              whileTap={{ scale: 0.95 }}
            >
              <Sparkles className="w-4 h-4" />
              Browse
            </motion.button>
          </Link>
        </motion.div>
      </div>

      {/* Modals */}
      {showSubmitModal && selectedCampaign && selectedTask && (
        <SubmitPostModal
          selectedCampaign={{
            id: selectedCampaign.briefId,
            title: selectedCampaign.brief.name,
            brand: selectedCampaign.brief.business,
          }}
          selectedTask={selectedTask}
          postLink={postLink}
          setPostLink={setPostLink}
          onSubmit={() => handleSubmitPost(selectedCampaign.briefId)}
          onClose={handleCloseModal}
          transactionStatus={txStatus}
          isSubmitting={isSubmittingProof}
        />
      )}

      {showClaimModal && (
        <ClaimPaymentsModal
          isOpen={showClaimModal}
          onClose={() => setShowClaimModal(false)}
        />
      )}
    </div>
  );
}
