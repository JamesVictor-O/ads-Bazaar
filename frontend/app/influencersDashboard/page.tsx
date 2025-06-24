"use client";

import { useState, useEffect } from "react";
import SubmitPostModal from "@/components/modals/SubmitPostModal";
import ClaimPaymentsModal from "@/components/modals/ClaimPaymentsModal";
import { Transaction } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import {
  Briefcase,
  DollarSign,
  Calendar,
  TrendingUp,
  CheckCircle,
  ExternalLink,
  AlertCircle,
  Shield,
  CheckSquare,
  Sparkles,
  User,
  Timer,
  Star,
  Award,
  Zap,
  ArrowRight,
  Upload,
  Bell,
  Edit3,
  Eye,
  ChevronDown,
  FileText,
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
import { useDivviIntegration } from "@/hooks/useDivviIntegration";
import Link from "next/link";
import Image from "next/image";
import { formatEther } from "viem";
import { Brief, Application, CampaignStatus } from "@/types";
import {
  computeApplicationInfo,
  getPhaseColor,
  formatTimeRemaining,
  getPhaseLabel,
} from "@/utils/campaignUtils";
import {
  getUserStatusColor,
  getUserStatusLabel,
  truncateAddress,
} from "@/utils/format";

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
  const { trackTransaction } = useDivviIntegration();

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

  // New state for expandable descriptions
  const [expandedDescriptions, setExpandedDescriptions] = useState<Set<string>>(
    new Set()
  );

  // Enhanced state for tracking resubmissions
  const [isResubmission, setIsResubmission] = useState(false);
  const [existingProofLink, setExistingProofLink] = useState("");

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
    hash: submitHash,
  } = useSubmitProof();

  // Function to toggle description expansion
  const toggleDescription = (briefId: string) => {
    setExpandedDescriptions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(briefId)) {
        newSet.delete(briefId);
      } else {
        newSet.add(briefId);
      }
      return newSet;
    });
  };

  // Function to check if description should show expand button
  const shouldShowExpandButton = (description: string) => {
    return description.length > 120; // Show expand button if description is longer than 120 characters
  };

  // Function to get truncated description
  const getTruncatedDescription = (description: string) => {
    if (description.length <= 120) return description;
    return description.substring(0, 120) + "...";
  };

  // Track transaction when hash becomes available
  useEffect(() => {
    if (submitHash) {
      console.log("DIVVI: Hash available from submit proof:", submitHash);
      trackTransaction(submitHash);
    }
  }, [submitHash, trackTransaction]);

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
        message: isResubmission ? "Updating proof..." : "Submitting post...",
        hash: txStatus.hash,
      });
    }
  }, [isSubmittingProof, txStatus.stage, txStatus.hash, isResubmission]);

  useEffect(() => {
    if (isSubmittingSuccess && txStatus.stage !== "success") {
      setTxStatus({
        stage: "success",
        message: isResubmission
          ? "Proof updated successfully!"
          : "Post submitted successfully!",
        hash: txStatus.hash,
      });
      toast.success(
        isResubmission
          ? "Proof updated successfully!"
          : "Post submitted successfully!"
      );
      // Only refetch once, after a brief delay to ensure transaction is processed
      setTimeout(() => {
        refetch();
        setShowSubmitModal(false);
        setPostLink("");
        setTxStatus({ stage: "idle", message: "", hash: undefined });
        setSelectedCampaign(null);
        setSelectedTask(null);
        setIsResubmission(false);
        setExistingProofLink("");
      }, 1500);
    }
  }, [
    isSubmittingSuccess,
    txStatus.stage,
    txStatus.hash,
    refetch,
    isResubmission,
  ]);

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

  const handleSubmitPost = async (
    briefId: string,
    referralTag?: `0x${string}`
  ): Promise<void> => {
    console.log("DIVVI: Submitting proof with referral tag:", referralTag);

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
      const result: SubmitProofResult = await submitProof(
        briefId,
        postLink,
        referralTag
      );
      console.log("DIVVI: Submit proof result:", result);
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
    setIsResubmission(false);
    setExistingProofLink("");
  };

  // Enhanced submit proof handler with resubmission support
  const handleSubmitProofClick = (
    briefData: ApplicationWithBrief,
    isUpdate: boolean = false
  ) => {
    setSelectedCampaign(briefData);
    setSelectedTask({
      name: briefData.brief.description,
    });

    if (isUpdate && briefData.application.proofLink) {
      setIsResubmission(true);
      setExistingProofLink(briefData.application.proofLink);
      setPostLink(""); // Start with empty so user can enter new link
    } else {
      setIsResubmission(false);
      setExistingProofLink("");
      setPostLink("");
    }

    setShowSubmitModal(true);
  };

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
          <div className="animate-spin rounded-full h-6 w-6 md:h-8 md:w-8 border-t-2 border-b-2 border-emerald-500 mx-auto mb-3 md:mb-4"></div>
          <p className="text-slate-400 text-sm md:text-base">
            Loading dashboard...
          </p>
        </motion.div>
      </div>
    );
  }

  if (!userProfile?.isRegistered || !userProfile?.isInfluencer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <motion.div
          className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl md:rounded-2xl p-6 md:p-8 max-w-sm w-full text-center"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
        >
          <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl md:rounded-2xl flex items-center justify-center mx-auto mb-4 md:mb-6">
            <Briefcase className="w-6 h-6 md:w-8 md:h-8 text-white" />
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-white mb-3 md:mb-4">
            Influencer Account Required
          </h2>
          <p className="text-slate-400 leading-relaxed mb-6 md:mb-8 text-sm md:text-base">
            Register as an influencer to access the dashboard and apply for
            campaigns.
          </p>
          <Link href="/">
            <motion.button
              className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold py-2.5 px-4 md:py-3 md:px-6 rounded-lg md:rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-lg shadow-emerald-500/20 text-sm md:text-base"
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
          className="text-center p-6 md:p-8 max-w-sm w-full"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
        >
          <AlertCircle className="h-10 w-10 md:h-12 md:w-12 text-red-400 mx-auto mb-3 md:mb-4" />
          <h2 className="text-lg md:text-xl font-bold text-white mb-2 md:mb-3">
            Error Loading Dashboard
          </h2>
          <p className="text-slate-400 mb-4 md:mb-6 text-sm md:text-base">
            {error}
          </p>
          <motion.button
            onClick={refetch}
            className="px-4 py-2.5 md:px-6 md:py-3 bg-emerald-600 text-white rounded-lg md:rounded-xl hover:bg-emerald-700 transition-all text-sm md:text-base"
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

      <div className="px-4 md:px-6 lg:px-8 pb-8 max-w-7xl mx-auto">
        {/* Enhanced Header Section with Prominent Verification Status */}
        <motion.div
          className="mb-6 md:mb-10"
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex flex-col gap-4 md:gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 md:gap-6">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center overflow-hidden relative">
                {pfpUrl ? (
                  <Image
                    src={pfpUrl}
                    alt="Profile"
                    width={64}
                    height={64}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-8 h-8 md:w-10 md:h-10 text-white" />
                )}
                {/* Verification Badge Overlay on Avatar */}
                {isVerified && (
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 md:w-8 md:h-8 bg-emerald-500 rounded-full border-2 border-slate-900 flex items-center justify-center">
                    <Shield className="w-3 h-3 md:w-4 md:h-4 text-white" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 md:gap-3 mb-2 md:mb-2">
                  <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white flex items-center gap-2 md:gap-3">
                    Hi,{" "}
                    <span className="bg-gradient-to-r from-emerald-400 to-emerald-600 bg-clip-text text-transparent">
                      {username || displayName || "Influencer"}
                    </span>
                  </h1>

                  <div className="flex flex-row items-center">
                    {/* Enhanced Verification Status Badge */}
                    {isVerified ? (
                      <motion.span
                        className="inline-flex items-center px-3 py-1.5 md:px-4 md:py-2 rounded-full text-xs md:text-sm font-semibold bg-gradient-to-r from-emerald-500/20 to-emerald-400/20 text-emerald-400 border border-emerald-500/40 shadow-lg shadow-emerald-500/20"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.3, delay: 0.2 }}
                      >
                        <Shield className="w-3 h-3 md:w-4 md:h-4 mr-1.5 md:mr-2" />
                        <span className="hidden sm:inline">
                          Verified Creator
                        </span>
                        <span className="sm:hidden">Verified</span>
                        <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full ml-2 animate-pulse"></div>
                      </motion.span>
                    ) : (
                      <motion.span
                        className="inline-flex items-center px-3 py-1.5 md:px-4 md:py-2 rounded-full text-xs md:text-sm font-medium bg-amber-500/10 text-amber-400 border border-amber-500/30"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.3, delay: 0.2 }}
                      >
                        <AlertCircle className="w-3 h-3 md:w-4 md:h-4 mr-1.5 md:mr-2" />
                        <span className="hidden sm:inline">Unverified</span>
                        <span className="sm:hidden">Unverified</span>
                      </motion.span>
                    )}

                    {/* Enhanced Status Badge */}
                    {userProfile?.status !== undefined && (
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 md:gap-3 ml-2">
                        <span
                          className={`inline-flex items-center px-3 py-1.5 md:px-4 md:py-2 rounded-full font-medium border text-sm md:text-base ${getUserStatusColor(
                            userProfile.status
                          )}`}
                        >
                          <Award className="w-4 h-4 md:w-5 md:h-5 mr-1.5 md:mr-2" />
                          {getUserStatusLabel(userProfile.status)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <span className="text-slate-400 text-xs md:text-sm">
                  {userProfile.completedCampaigns} campaigns completed
                </span>

                <p className="text-lg md:text-xl text-slate-400">
                  {stats.urgentActions > 0
                    ? `${stats.urgentActions} action${
                        stats.urgentActions !== 1 ? "s" : ""
                      } needed`
                    : "All caught up! 🎉"}
                </p>
              </div>
            </div>

            {/* Action Buttons Row */}
            <div className="flex flex-wrap gap-2 md:gap-3">
              {isVerified && (
                <motion.div
                  className="flex items-center gap-2 px-3 py-2 md:px-4 md:py-2.5 bg-emerald-600/10 text-emerald-400 rounded-lg md:rounded-xl border border-emerald-500/20 text-sm md:text-base"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.3 }}
                >
                  <CheckCircle className="w-4 h-4 md:w-5 md:h-5" />
                  <span className="hidden sm:inline font-medium">
                    Verification Complete
                  </span>
                  <span className="sm:hidden font-medium">Verified ✓</span>
                </motion.div>
              )}

              <Link href={`/influencer/${address}`}>
                <motion.button
                  className="flex items-center gap-1.5 md:gap-2 px-3 py-2 md:px-4 md:py-2.5 font-medium text-slate-300 bg-slate-800/50 hover:bg-slate-800 rounded-lg md:rounded-xl border border-slate-700/50 transition-all shadow-sm text-sm md:text-base"
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.4 }}
                >
                  Profile <ExternalLink className="w-3 h-3 md:w-4 md:h-4" />
                </motion.button>
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Verification Status Card */}
        <motion.div
          className="bg-slate-800/60 backdrop-blur-md border border-slate-700/50 rounded-xl md:rounded-2xl mb-5 p-3 md:p-6 transition-all duration-200 shadow-sm relative col-span-2 lg:col-span-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.3 }}
        >
          <div className="flex md:items-center flex-col md:flex-row justify-between">
            <div className="flex items-center gap-3 md:gap-4">
              <div
                className={`p-2 hidden md:block md:p-3 rounded-lg md:rounded-xl border ${
                  isVerified
                    ? "bg-emerald-500/10 border-emerald-500/20"
                    : "bg-amber-500/10 border-amber-500/20"
                }`}
              >
                <Shield
                  className={`w-4 h-4 md:w-6 md:h-6 ${
                    isVerified ? "text-emerald-400" : "text-amber-400"
                  }`}
                />
              </div>
              <div>
                <p
                  className={`text-lg md:text-xl font-bold mb-0.5 ${
                    isVerified ? "text-emerald-400" : "text-amber-400"
                  }`}
                >
                  {isVerified
                    ? "✓ Verified Creator"
                    : " Boost Your Profile with Self Verification"}
                </p>
                <p className="text-slate-400 text-xs md:text-sm">
                  {isVerified
                    ? "You have access to premium campaigns and higher rates"
                    : "Get verified to increase your credibility, unlock premium campaigns, and earn up to 30% more! Verified creators get priority access to exclusive opportunities."}
                </p>
              </div>
            </div>

            {!isVerified && (
              <Link href="/selfVerification">
                <motion.button
                  className="flex items-center gap-1.5 md:gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-gradient-to-r from-amber-500 to-orange-500 my-2 text-white rounded-lg md:rounded-xl font-medium transition-all text-sm md:text-base"
                  whileTap={{ scale: 0.95 }}
                >
                  <span className="">Get Verified Now</span>
                  <ArrowRight className="w-3 h-3 md:w-4 md:h-4" />
                </motion.button>
              </Link>
            )}
          </div>

          {/* Verification Benefits Bar */}
          <div className="mt-3 md:mt-4 flex flex-wrap gap-2 md:gap-3 text-xs md:text-sm">
            <span
              className={`px-2 py-1 rounded-full ${
                isVerified
                  ? "bg-emerald-500/20 text-emerald-400"
                  : "bg-slate-700/50 text-slate-500"
              }`}
            >
              {isVerified ? "✓" : "○"} Premium Campaigns
            </span>
            <span
              className={`px-2 py-1 rounded-full ${
                isVerified
                  ? "bg-emerald-500/20 text-emerald-400"
                  : "bg-slate-700/50 text-slate-500"
              }`}
            >
              {isVerified ? "✓" : "○"} 30% Higher Rates
            </span>
            <span
              className={`px-2 py-1 rounded-full ${
                isVerified
                  ? "bg-emerald-500/20 text-emerald-400"
                  : "bg-slate-700/50 text-slate-500"
              }`}
            >
              {isVerified ? "✓" : "○"} Priority Support
            </span>
            <span
              className={`px-2 py-1 rounded-full ${
                isVerified
                  ? "bg-emerald-500/20 text-emerald-400"
                  : "bg-slate-700/50 text-slate-500"
              }`}
            >
              {isVerified ? "✓" : "○"} Exclusive Access
            </span>
          </div>
        </motion.div>

        {/* Urgent Actions Alert */}
        {stats.urgentActions > 0 && (
          <motion.div
            className="mb-6 md:mb-8 bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-500/20 rounded-xl md:rounded-2xl p-4 md:p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-start gap-3 md:gap-4">
              <div className="p-2 md:p-3 bg-orange-500/20 rounded-lg md:rounded-xl border border-orange-500/30">
                <Bell className="w-5 h-5 md:w-6 md:h-6 text-orange-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg md:text-xl font-semibold text-white mb-2 md:mb-3">
                  Action Required
                </h3>
                <p className="text-orange-400 mb-3 md:mb-4 text-sm md:text-base">
                  You have {stats.urgentActions} campaign
                  {stats.urgentActions !== 1 ? "s" : ""} that need
                  {stats.urgentActions === 1 ? "s" : ""} your attention
                </p>
              </div>
              <motion.button
                onClick={() => setFilter("urgent")}
                className="px-3 py-2 md:px-4 md:py-2.5 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 rounded-lg md:rounded-xl font-medium transition-all text-sm md:text-base"
                whileTap={{ scale: 0.95 }}
              >
                <span className="hidden sm:inline">View All</span>
                <span className="sm:hidden">View</span>
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* Filter Tabs */}
        <div className="mb-6 md:mb-8">
          <div className="flex flex-wrap gap-2 md:gap-3">
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
                onClick={() =>
                  setFilter(
                    tab.key as "all" | "active" | "completed" | "urgent"
                  )
                }
                className={`px-3 py-2 md:px-6 md:py-3 rounded-lg md:rounded-xl font-medium transition-all text-sm md:text-base ${
                  filter === tab.key
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : "bg-slate-800/50 text-slate-400 border border-slate-700/50 hover:bg-slate-800"
                }`}
                whileTap={{ scale: 0.95 }}
              >
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">
                  {tab.key === "all"
                    ? "All"
                    : tab.key === "active"
                    ? "Active"
                    : tab.key === "completed"
                    ? "Done"
                    : "Action"}
                </span>
                {tab.count > 0 && (
                  <span className="ml-1.5 md:ml-3 px-1.5 py-0.5 md:px-2 md:py-1 bg-slate-600/50 rounded-full text-xs">
                    {tab.count}
                  </span>
                )}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Enhanced Stats Grid with Verification Status */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-10">
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
              className="bg-slate-800/60 backdrop-blur-md border border-slate-700/50 rounded-xl md:rounded-2xl p-3 md:p-6 transition-all duration-200 shadow-sm relative"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: 0.05 * index }}
            >
              <div className="flex items-center justify-between mb-2 md:mb-4">
                <div
                  className={`p-2 md:p-3 bg-${stat.color}/10 rounded-lg md:rounded-xl border border-${stat.color}/20`}
                >
                  <stat.icon
                    className={`w-4 h-4 md:w-6 md:h-6 text-${stat.color}`}
                  />
                </div>
                {stat.hasClaimable && !stat.isLoading && (
                  <motion.button
                    onClick={handleOpenClaimModal}
                    className="p-1.5 md:p-2 rounded-full bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    title="Claim rewards"
                  >
                    <DollarSign className="w-3 h-3 md:w-4 md:h-4 text-amber-400" />
                  </motion.button>
                )}
              </div>
              <p className="text-lg md:text-2xl font-bold text-white mb-0.5 md:mb-1">
                {stat.isLoading ? (
                  <span className="animate-pulse">...</span>
                ) : (
                  stat.value
                )}
              </p>
              <p className="text-slate-400 text-xs md:text-base">
                {stat.label}
              </p>

              {stat.hasClaimable && !stat.isLoading && (
                <motion.button
                  onClick={handleOpenClaimModal}
                  className="w-full mt-2 md:mt-4 py-1.5 md:py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg md:rounded-xl flex items-center justify-center gap-1.5 md:gap-2 font-medium text-sm md:text-base"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <DollarSign className="w-3 h-3 md:w-4 md:h-4" />
                  <span className="hidden sm:inline">Claim All</span>
                  <span className="sm:hidden">Claim</span>
                </motion.button>
              )}
            </motion.div>
          ))}
        </div>

        {/* Enhanced Campaigns List with Resubmission Support */}
        <motion.div
          className="space-y-4 md:space-y-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2 md:gap-3">
              <Briefcase className="w-6 h-6 md:w-8 md:h-8 text-emerald-400" />{" "}
              Campaigns
            </h2>
            <span className="text-slate-400 text-sm md:text-base">
              {filteredCampaigns.length} of {appliedBriefs?.length || 0}
            </span>
          </div>

          {isLoading && appliedBriefs === undefined ? (
            <div className="flex items-center justify-center py-12 md:py-20">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-6 w-6 md:h-8 md:w-8 border-b-2 border-emerald-500 mb-3 md:mb-4"></div>
                <p className="text-slate-400 text-sm md:text-base">
                  Loading...
                </p>
              </div>
            </div>
          ) : !filteredCampaigns || filteredCampaigns.length === 0 ? (
            <div className="text-center py-12 md:py-20">
              <Briefcase className="w-12 h-12 md:w-16 md:h-16 text-slate-600 mx-auto mb-4 md:mb-6" />
              <h3 className="text-lg md:text-2xl font-semibold text-white mb-2 md:mb-3">
                {filter === "all" ? "No Campaigns" : `No ${filter} campaigns`}
              </h3>
              <p className="text-slate-400 max-w-md mx-auto leading-relaxed text-sm md:text-base">
                {filter === "all"
                  ? "Apply to campaigns to get started."
                  : "Try changing the filter or apply to more campaigns."}
              </p>
            </div>
          ) : (
            <div className="space-y-4 md:space-y-6">
              {filteredCampaigns.map((briefData, index) => {
                const appInfo = computeApplicationInfo(
                  briefData.application,
                  briefData.brief
                );
                const isExpanded = expandedBriefId === briefData.briefId;
                const budget = briefData.brief.budget;
                const hasProof = !!briefData.application.proofLink;
                const isDescriptionExpanded = expandedDescriptions.has(
                  briefData.briefId
                );
                const showExpandButton = shouldShowExpandButton(
                  briefData.brief.description
                );

                // Use the computed application info instead of simple checks
                const canSubmitProof = appInfo.canSubmitProof;
                const canClaim = appInfo.canClaim;

                return (
                  <motion.div
                    key={briefData.briefId}
                    className="bg-white/5 backdrop-blur-sm border border-slate-700/50 rounded-xl md:rounded-2xl overflow-hidden hover:bg-white/10 transition-all duration-300 hover:border-slate-600/50"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    whileHover={{ y: -2 }}
                  >
                    {/* Header */}
                    <div className="p-4 md:p-8">
                      <div className="flex items-start gap-3 md:gap-6 mb-4 md:mb-6">
                        <div className="p-2 md:p-4 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-lg md:rounded-2xl border border-blue-500/30">
                          <Briefcase className="w-5 h-5 md:w-8 md:h-8 text-blue-400" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 md:gap-6 mb-3 md:mb-4">
                            <div>
                              <h3 className="text-lg md:text-2xl font-bold text-white leading-tight mb-1 md:mb-2">
                                {briefData.brief.name}
                              </h3>
                              <p className="text-slate-400 font-medium text-sm md:text-base">
                                by {truncateAddress(briefData.brief.business)}
                              </p>
                            </div>

                            <div className="flex items-center gap-1 md:gap-3 flex-shrink-0 flex-wrap">
                              {briefData.application.isSelected && (
                                <span className="px-2 py-1 md:px-4 md:py-2 text-xs md:text-sm font-medium rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                                  <Star className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2 inline" />
                                  <span className="hidden sm:inline">
                                    Selected
                                  </span>
                                  <span className="sm:hidden">✓</span>
                                </span>
                              )}

                              {/* Campaign phase indicator */}
                              <span
                                className={`px-2 py-1 md:px-4 md:py-2 text-xs md:text-sm font-medium rounded-full border ${getPhaseColor(
                                  briefData.brief.timingInfo.phase
                                )}`}
                              >
                                <span className="hidden sm:inline">
                                  {getPhaseLabel(
                                    briefData.brief.timingInfo.phase
                                  )}
                                </span>
                                <span className="sm:hidden">
                                  {briefData.brief.timingInfo.phase}
                                </span>
                              </span>

                              {/* Urgent indicator */}
                              {(appInfo.canSubmitProof ||
                                appInfo.canClaim ||
                                appInfo.warning) && (
                                <span className="px-2 py-1 md:px-4 md:py-2 text-xs md:text-sm font-medium rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 animate-pulse">
                                  <Zap className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2 inline" />
                                  <span className="hidden sm:inline">
                                    Action
                                  </span>
                                  <span className="sm:hidden">!</span>
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Expandable Description */}
                          <div className="mb-4 md:mb-6">
                            <div className="text-slate-300 text-sm md:text-lg leading-relaxed">
                              {isDescriptionExpanded
                                ? briefData.brief.description
                                : getTruncatedDescription(
                                    briefData.brief.description
                                  )}
                            </div>

                            {showExpandButton && (
                              <motion.button
                                onClick={() =>
                                  toggleDescription(briefData.briefId)
                                }
                                className="mt-2 flex items-center gap-1 text-xs md:text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
                                whileTap={{ scale: 0.95 }}
                              >
                                <FileText className="w-3 h-3 md:w-4 md:h-4" />
                                <span>
                                  {isDescriptionExpanded
                                    ? "Show less"
                                    : "Show more"}
                                </span>
                                <motion.div
                                  animate={{
                                    rotate: isDescriptionExpanded ? 180 : 0,
                                  }}
                                  transition={{ duration: 0.2 }}
                                >
                                  <ChevronDown className="w-3 h-3 md:w-4 md:h-4" />
                                </motion.div>
                              </motion.button>
                            )}
                          </div>

                          {/* Metrics Row */}
                          <div className="flex items-center gap-3 md:gap-8 text-slate-400 text-xs md:text-sm">
                            <div className="flex items-center gap-1 md:gap-2">
                              <Calendar className="w-3 h-3 md:w-5 md:h-5" />
                              <span className="hidden sm:inline">
                                {new Date(
                                  briefData.brief.creationTime * 1000
                                ).toLocaleDateString()}
                              </span>
                              <span className="sm:hidden">
                                {new Date(
                                  briefData.brief.creationTime * 1000
                                ).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                })}
                              </span>
                            </div>

                            <div className="flex items-center gap-1 md:gap-2">
                              <DollarSign className="w-3 h-3 md:w-5 md:h-5" />
                              <span>{budget.toFixed(0)} cUSD</span>
                            </div>

                            {briefData.brief.timingInfo.timeRemaining && (
                              <div className="flex items-center gap-1 md:gap-2">
                                <Timer className="w-3 h-3 md:w-5 md:h-5" />
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
                                  <span className="hidden sm:inline">left</span>
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action Needed Alert - Use appInfo for proper messaging */}
                      {(canSubmitProof || canClaim || appInfo.warning) && (
                        <div className="p-3 md:p-6 rounded-xl md:rounded-2xl border bg-orange-500/5 border-orange-500/20 mb-4 md:mb-6">
                          <div className="flex items-center gap-3 md:gap-4">
                            <Zap className="w-5 h-5 md:w-6 md:h-6 text-orange-400" />
                            <div>
                              <p className="text-orange-300 font-medium text-sm md:text-lg">
                                {canSubmitProof
                                  ? "Ready to submit your content"
                                  : canClaim
                                  ? "Payment ready to claim"
                                  : appInfo.nextAction}
                              </p>
                              <p className="text-orange-400/70 text-xs md:text-sm">
                                {appInfo.warning ||
                                  (canSubmitProof
                                    ? "Upload your promotional content for review"
                                    : canClaim
                                    ? "Claim your earnings now"
                                    : "")}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Proof Status */}
                      {briefData.application.isSelected && (
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 md:gap-6 mb-4 md:mb-6">
                          <div className="flex items-center gap-2 md:gap-3">
                            <div
                              className={`w-3 h-3 md:w-4 md:h-4 rounded-full ${
                                briefData.application.isApproved
                                  ? "bg-emerald-400"
                                  : hasProof
                                  ? "bg-amber-400"
                                  : "bg-slate-500"
                              }`}
                            ></div>
                            <span className="text-slate-300 font-medium text-sm md:text-base">
                              {briefData.application.isApproved
                                ? "Content Approved"
                                : hasProof
                                ? "Under Review"
                                : appInfo.nextAction || "Awaiting Content"}
                            </span>
                          </div>

                          {briefData.application.hasClaimed && (
                            <div className="flex items-center gap-2 md:gap-3">
                              <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-emerald-400" />
                              <span className="text-emerald-400 font-medium text-sm md:text-base">
                                Payment Claimed
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Expandable Requirements */}
                    <div className="border-t border-slate-700/30">
                      <motion.button
                        onClick={() =>
                          setExpandedBriefId(
                            isExpanded ? null : briefData.briefId
                          )
                        }
                        className="w-full p-3 md:p-6 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
                        whileTap={{ scale: 0.995 }}
                      >
                        <div className="flex items-center gap-2 md:gap-4">
                          <CheckSquare className="w-4 h-4 md:w-6 md:h-6 text-slate-400" />
                          <span className="text-slate-300 font-medium text-sm md:text-lg">
                            Requirements & Actions
                          </span>
                        </div>
                        <motion.div
                          animate={{ rotate: isExpanded ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ChevronDown className="w-4 h-4 md:w-6 md:h-6 text-slate-400" />
                        </motion.div>
                      </motion.button>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden"
                          >
                            <div className="px-4 pb-4 md:px-8 md:pb-8">
                              <div className="bg-slate-800/30 p-3 md:p-6 rounded-xl md:rounded-2xl border border-slate-700/50 mb-4 md:mb-6">
                                <h4 className="text-slate-300 font-semibold mb-2 md:mb-3 text-sm md:text-lg">
                                  Campaign Requirements:
                                </h4>
                                <p className="text-slate-200 leading-relaxed text-sm md:text-base">
                                  {briefData.brief.requirements}
                                </p>
                              </div>

                              {/* Campaign Timeline for Selected Influencers */}
                              {briefData.application.isSelected && (
                                <div className="bg-slate-800/30 p-3 md:p-4 rounded-xl border border-slate-700/50 mb-4 md:mb-6">
                                  <div className="space-y-2 text-xs md:text-sm">
                                    <div className="mt-3 p-2 bg-blue-500/10 rounded border border-blue-500/20">
                                      <p className="text-blue-400 text-xs md:text-sm">
                                        ⏰ {appInfo.nextAction}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Action Buttons */}
                              <div className="flex flex-col sm:flex-row gap-2 md:gap-4">
                                {hasProof && (
                                  <motion.a
                                    href={briefData.application.proofLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 md:gap-3 px-3 py-2.5 md:px-6 md:py-4 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg md:rounded-xl border border-blue-500/30 transition-all font-medium text-sm md:text-base"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                  >
                                    <Eye className="w-4 h-4 md:w-5 md:h-5" />
                                    <span className="hidden sm:inline">
                                      View Submission
                                    </span>
                                    <span className="sm:hidden">View</span>
                                    <ExternalLink className="w-3 h-3 md:w-4 md:h-4" />
                                  </motion.a>
                                )}

                                {/* Submit/Update button - now properly controlled by timing */}
                                {canSubmitProof && (
                                  <motion.button
                                    onClick={() =>
                                      handleSubmitProofClick(
                                        briefData,
                                        hasProof
                                      )
                                    }
                                    className="flex items-center gap-2 md:gap-3 px-3 py-2.5 md:px-6 md:py-4 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 rounded-lg md:rounded-xl border border-emerald-500/30 transition-all font-medium text-sm md:text-base"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    disabled={isSubmittingProof}
                                  >
                                    {hasProof ? (
                                      <>
                                        <Edit3 className="w-4 h-4 md:w-5 md:h-5" />
                                        <span className="hidden sm:inline">
                                          Update Content
                                        </span>
                                        <span className="sm:hidden">
                                          Update
                                        </span>
                                      </>
                                    ) : (
                                      <>
                                        <Upload className="w-4 h-4 md:w-5 md:h-5" />
                                        <span className="hidden sm:inline">
                                          Submit Content
                                        </span>
                                        <span className="sm:hidden">
                                          Submit
                                        </span>
                                      </>
                                    )}
                                  </motion.button>
                                )}

                                {/* Timing message when can't submit yet */}
                                {briefData.application.isSelected &&
                                  !canSubmitProof &&
                                  !briefData.application.isApproved && (
                                    <div className="flex items-center gap-2 md:gap-3 px-3 py-2.5 md:px-6 md:py-4 bg-amber-600/10 text-amber-400 rounded-lg md:rounded-xl border border-amber-500/20 text-sm md:text-base">
                                      <Timer className="w-4 h-4 md:w-5 md:h-5" />
                                      <span className="text-xs md:text-sm">
                                        {appInfo.nextAction ||
                                          "Campaign not ready for submissions yet"}
                                      </span>
                                    </div>
                                  )}

                                {canClaim && (
                                  <motion.button
                                    onClick={handleOpenClaimModal}
                                    className="flex items-center gap-2 md:gap-3 px-3 py-2.5 md:px-6 md:py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg md:rounded-xl transition-all font-medium shadow-lg shadow-emerald-500/20 text-sm md:text-base"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                  >
                                    <DollarSign className="w-4 h-4 md:w-5 md:h-5" />
                                    <span className="hidden sm:inline">
                                      Claim {budget.toFixed(0)} cUSD
                                    </span>
                                    <span className="sm:hidden">Claim</span>
                                    <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
                                  </motion.button>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Transaction History */}
        <motion.div
          className="mt-6 md:mt-10 bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl md:rounded-2xl overflow-hidden"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="p-4 md:p-6 border-b border-slate-700/50 bg-gradient-to-r from-slate-800 to-slate-900">
            <div className="flex items-center justify-between">
              <h2 className="text-lg md:text-xl font-bold text-white flex items-center gap-2 md:gap-3">
                <DollarSign className="w-5 h-5 md:w-6 md:h-6 text-amber-400" />
                Transactions
              </h2>
              <span className="text-slate-400 text-sm md:text-base">
                {transactionHistory.length}
              </span>
            </div>
          </div>

          {transactionHistory.length === 0 ? (
            <div className="p-8 md:p-12 text-center">
              <DollarSign className="w-12 h-12 md:w-16 md:h-16 text-slate-600 mx-auto mb-4 md:mb-6" />
              <h3 className="text-lg md:text-xl font-semibold text-white mb-2 md:mb-3">
                No Transactions
              </h3>
              <p className="text-slate-400 text-sm md:text-base">
                Earnings will appear here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {transactionHistory.map((tx, index) => (
                <motion.div
                  key={tx.id}
                  className="p-4 md:p-6 transition-all duration-200"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                >
                  <div className="flex items-center gap-3 md:gap-4">
                    <div className="p-2 md:p-3 bg-emerald-900/20 rounded-lg md:rounded-xl border border-emerald-800/30">
                      <CheckCircle className="w-5 h-5 md:w-6 md:h-6 text-emerald-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white mb-0.5 md:mb-1 text-sm md:text-base">
                        +{tx.amount.toFixed(2)} cUSD
                      </p>
                      <p className="text-slate-400 truncate text-xs md:text-sm">
                        From {tx.from}
                      </p>
                    </div>
                    <a
                      href={`https://explorer.celo.org/tx/${tx.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-400 hover:text-emerald-400 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4 md:w-5 md:h-5" />
                    </a>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Sticky Browse Button */}
        <motion.div
          className="fixed bottom-6 right-6 md:bottom-12 md:right-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.3 }}
        >
          <Link href="/marketplace">
            <motion.button
              className="flex items-center gap-2 md:gap-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold px-4 py-3 md:px-6 md:py-4 rounded-full shadow-xl shadow-emerald-500/20 text-sm md:text-base"
              whileTap={{ scale: 0.95 }}
            >
              <Sparkles className="w-4 h-4 md:w-5 md:h-5" />
              <span className="hidden sm:inline">Browse Campaigns</span>
              <span className="sm:hidden">Browse</span>
            </motion.button>
          </Link>
        </motion.div>
      </div>

      {/* Enhanced Modals with Resubmission Support */}
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
          onSubmit={(referralTag) =>
            handleSubmitPost(
              selectedCampaign.briefId,
              referralTag as `0x${string}` | undefined
            )
          }
          onClose={handleCloseModal}
          transactionStatus={txStatus}
          isSubmitting={isSubmittingProof}
          existingProofLink={existingProofLink}
          isResubmission={isResubmission}
        />
      )}

      {showClaimModal && (
        <ClaimPaymentsModal
          isOpen={showClaimModal}
          onClose={() => setShowClaimModal(false)}
          onSuccess={handleClaimSuccess}
        />
      )}
    </div>
  );
}
