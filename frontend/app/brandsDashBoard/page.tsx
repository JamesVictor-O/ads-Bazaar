"use client";

import { useState, useEffect, useMemo } from "react";
import { useAccount } from "wagmi";
import { Brief } from "@/types";
import { SubmissionsModal } from "@/components/modals/SubmissionsModal";
import ApplicationsModal from "@/components/modals/ApplicationsModal";
import CreateCampaignModal from "@/components/modals/CreateCampaignModal";
import { NetworkStatus } from "@/components/NetworkStatus";
import { Toaster, toast } from "react-hot-toast";
import { useEnsureNetwork } from "@/hooks/useEnsureNetwork";
import { useDivviIntegration } from "@/hooks/useDivviIntegration";
import {
  Users,
  Briefcase,
  DollarSign,
  Search,
  Plus,
  Calendar,
  Clock,
  CheckCircle,
  Filter,
  MoreVertical,
  Activity,
  Target,
  AlertTriangle,
  Loader2,
  Wifi,
  WifiOff,
  XCircle,
  Trash2,
  Ban,
  Zap,
  Bell,
  Flag,
  Crown,
  CheckSquare,
  ChevronDown,
  FileText,
} from "lucide-react";
import { getUserStatusColor, getUserStatusLabel } from "@/utils/format";
import { format } from "date-fns";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { formatCurrency, fromWei } from "@/utils/format";
import {
  getStatusColor,
  getPhaseColor,
  formatTimeRemaining,
  isActionUrgent,
  getActionPriority,
  getPhaseLabel,
} from "@/utils/campaignUtils";
import { CampaignStatus } from "@/types";

// Import custom hooks
import {
  useUserProfile,
  useBriefApplications,
  useCreateAdBrief,
  useCompleteCampaign,
  useGetBusinessBriefs,
  useCancelAdBrief,
  useExpireCampaign,
} from "../../hooks/adsBazaar";

const BrandDashboard = () => {
  const { address, isConnected } = useAccount();
  const { isCorrectChain, currentNetwork } = useEnsureNetwork();
  const { generateDivviReferralTag, trackTransaction } = useDivviIntegration();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showApplicationsModal, setShowApplicationsModal] = useState(false);
  const [showSubmissionsModal, setShowSubmissionsModal] = useState(false);
  const [selectedBrief, setSelectedBrief] = useState<Brief | null>(null);
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showCancelConfirm, setShowCancelConfirm] = useState<string | null>(
    null
  );
  const [showExpireConfirm, setShowExpireConfirm] = useState<string | null>(
    null
  );
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [expandedBriefId, setExpandedBriefId] = useState<string | null>(null);
  
  // New state for expandable descriptions
  const [expandedDescriptions, setExpandedDescriptions] = useState<Set<string>>(new Set());
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    requirements: "",
    budget: "",
    promotionDuration: "604800", // 7 days in seconds
    maxInfluencers: "5",
    targetAudience: "0",
    applicationPeriod: "432000", // 5 days default
    proofSubmissionGracePeriod: "172800", // 2 days default
    verificationPeriod: "259200", // 3 days default
  });

  const { userProfile, refetchProfile } = useUserProfile();
  const { briefs: fetchedBriefs, isLoading, refetch: refetchBriefs } = useGetBusinessBriefs(
    address as `0x${string}`
  );
  const briefs = useMemo(
    () => (address ? fetchedBriefs : []),
    [address, fetchedBriefs]
  );
  const { applications, isLoadingApplications, refetchApplications } =
    useBriefApplications(selectedBrief?.id || "0x0");

  const {
    createBrief,
    isPending: isCreatingBrief,
    isSuccess: isCreateSuccess,
    isError: isCreateError,
    error: createError,
    hash: createHash,
  } = useCreateAdBrief();

  const {
    completeCampaign,
    isPending: isCompletingCampaign,
    isSuccess: isCompleteSuccess,
    isError: isCompleteError,
    error: completeError,
    hash: completeHash,
  } = useCompleteCampaign();

  const {
    cancelBrief,
    isPending: isCancelingBrief,
    isSuccess: isCancelSuccess,
    isError: isCancelError,
    error: cancelError,
    hash: cancelHash,
  } = useCancelAdBrief();

  const {
    expireCampaign,
    isPending: isExpiringBrief,
    isSuccess: isExpireSuccess,
    isError: isExpireError,
    error: expireError,
    hash: expireHash,
  } = useExpireCampaign();

  // Function to toggle description expansion
  const toggleDescription = (briefId: string) => {
    setExpandedDescriptions(prev => {
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

  // Track transactions when hash becomes available
  useEffect(() => {
    if (createHash) {
      console.log('DIVVI: Hash available from create campaign:', createHash);
      trackTransaction(createHash);
    }
  }, [createHash, trackTransaction]);

  // Refetch user profile when component mounts or address changes
  useEffect(() => {
    if (isConnected && address && refetchProfile) {
      refetchProfile();
    }
  }, [isConnected, address, refetchProfile]);

  useEffect(() => {
    if (completeHash) {
      console.log('DIVVI: Hash available from complete campaign:', completeHash);
      trackTransaction(completeHash);
    }
  }, [completeHash, trackTransaction]);

  useEffect(() => {
    if (cancelHash) {
      console.log('DIVVI: Hash available from cancel campaign:', cancelHash);
      trackTransaction(cancelHash);
    }
  }, [cancelHash, trackTransaction]);

  useEffect(() => {
    if (expireHash) {
      console.log('DIVVI: Hash available from expire campaign:', expireHash);
      trackTransaction(expireHash);
    }
  }, [expireHash, trackTransaction]);

  // Computed dashboard data
  const dashboardData = useMemo(() => {
  if (!briefs) return null;

  const activeBriefs = briefs.filter(
    (brief) =>
      brief.status === CampaignStatus.OPEN ||
      brief.status === CampaignStatus.ASSIGNED
  );
  const completedBriefs = briefs.filter(
    (brief) => brief.status === CampaignStatus.COMPLETED
  );
  const totalBudget = briefs.reduce((sum, brief) => sum + brief.budget, 0);
  const totalInfluencers = briefs.reduce(
    (sum, brief) => sum + brief.selectedInfluencersCount,
    0
  );

  const urgentActions = briefs
    .filter((brief) => isActionUrgent(brief))
    .map((brief) => ({
      campaignId: brief.id,
      campaignName: brief.name,
      action: brief.statusInfo.nextAction || "Action needed",
      priority: getActionPriority(brief),
      dueDate: brief.timingInfo.currentDeadline,
      warning: brief.statusInfo.warning,
    }));

  return {
    activeBriefs,
    completedBriefs,
    totalBudget,
    totalInfluencers,
    urgentActions: urgentActions || [],
  };
}, [briefs]);

  useEffect(() => {
    if (isCreateSuccess) {
      toast.success("Campaign created successfully!");
      setShowCreateModal(false);
      setFormData({
        name: "",
        description: "",
        requirements: "",
        budget: "",
        promotionDuration: "604800",
        maxInfluencers: "5",
        targetAudience: "0",
        applicationPeriod: "432000", // 5 days default
        proofSubmissionGracePeriod: "172800", // 2 days default
        verificationPeriod: "259200", // 3 days default
      });
      // Refetch the campaigns to show the new one immediately
      setTimeout(() => {
        refetchBriefs();
      }, 1000); // Small delay to ensure blockchain transaction is processed
    }

    if (isCreateError) {
      toast.error(
        `Failed to create campaign: ${createError?.message || "Unknown error"}`
      );
    }
  }, [isCreateSuccess, isCreateError, createError, refetchBriefs]);

  useEffect(() => {
    if (isCompleteSuccess) {
      toast.success("Campaign completed and funds released successfully!");
      refetchApplications();
      // Also refetch briefs to update campaign status
      setTimeout(() => {
        refetchBriefs();
      }, 1000);
      setShowSubmissionsModal(false);
    }

    if (isCompleteError) {
      toast.error(
        `Failed to complete campaign: ${
          completeError?.message || "Unknown error"
        }`
      );
    }
  }, [isCompleteSuccess, isCompleteError, completeError, refetchApplications, refetchBriefs]);

  useEffect(() => {
    if (isCancelSuccess) {
      toast.success("Campaign cancelled successfully!");
      setShowCancelConfirm(null);
      // Refetch briefs to remove the cancelled campaign from the list
      setTimeout(() => {
        refetchBriefs();
      }, 1000);
    }

    if (isCancelError) {
      toast.error(
        `Failed to cancel campaign: ${cancelError?.message || "Unknown error"}`
      );
      setShowCancelConfirm(null);
    }
  }, [isCancelSuccess, isCancelError, cancelError, refetchBriefs]);

  useEffect(() => {
    if (isExpireSuccess) {
      toast.success("Campaign expired successfully!");
      setShowExpireConfirm(null);
      // Refetch briefs to update the campaign status
      setTimeout(() => {
        refetchBriefs();
      }, 1000);
    }

    if (isExpireError) {
      toast.error(
        `Failed to expire campaign: ${expireError?.message || "Unknown error"}`
      );
      setShowExpireConfirm(null);
    }
  }, [isExpireSuccess, isExpireError, expireError, refetchBriefs]);

  // Enhanced filtering logic
  const filteredBriefs = briefs.filter((brief) => {
    const matchesSearch = brief.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    const matchesFilter =
      selectedFilter === "all" ||
      (selectedFilter === "active" &&
        (brief.status === CampaignStatus.OPEN ||
          brief.status === CampaignStatus.ASSIGNED)) ||
      (selectedFilter === "completed" &&
        brief.status === CampaignStatus.COMPLETED) ||
      (selectedFilter === "urgent" && isActionUrgent(brief));

    const matchesPriority =
      priorityFilter === "all" || getActionPriority(brief) === priorityFilter;

    return matchesSearch && matchesFilter && matchesPriority;
  });

  const isFormValid = () => {
    return (
      formData.name.trim() !== "" &&
      formData.description.trim() !== "" &&
      formData.requirements.trim() !== "" &&
      formData.budget.trim() !== "" &&
      Number(formData.budget) > 0 &&
      Number(formData.promotionDuration) >= 86400 &&
      Number(formData.maxInfluencers) >= 1 &&
      Number(formData.maxInfluencers) <= 10 &&
      Number(formData.applicationPeriod) >= 86400 &&
      Number(formData.proofSubmissionGracePeriod) >= 86400 &&
      Number(formData.verificationPeriod) >= 86400 &&
      Number(formData.verificationPeriod) <= 432000 // Max 5 days
    );
  };

  const handleCreateCampaign = async (referralTag?: `0x${string}`): Promise<string> => {
    console.log('DIVVI: Creating campaign with referral tag:', referralTag);

    if (!isFormValid()) {
      toast.error("Please fill in all required fields correctly");
      return Promise.reject("Form is invalid");
    }

    try {
      const result = await createBrief(
        formData.name,
        formData.description,
        formData.requirements,
        formData.budget,
        Number(formData.promotionDuration),
        Number(formData.maxInfluencers),
        Number(formData.targetAudience),
        Number(formData.applicationPeriod),
        Number(formData.proofSubmissionGracePeriod),
        Number(formData.verificationPeriod),
        referralTag
      );
      console.log('DIVVI: Create campaign result:', result);
      // If createBrief returns a string (e.g., campaign ID), return it
      return typeof result === "string" ? result : "";
    } catch (error) {
      console.error("Error creating campaign:", error);
      toast.error(
        `Failed to create campaign: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      return Promise.reject(
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  };

  const handleReleaseFunds = async (briefId: string, referralTag?: `0x${string}`) => {
    console.log('DIVVI: Releasing funds with referral tag:', referralTag);

    try {
      const result = await completeCampaign(briefId as `0x${string}`, referralTag);
      console.log('DIVVI: Release funds result:', result);
      return result;
    } catch (error) {
      console.error("Error releasing funds:", error);
      toast.error(
        `Failed to release funds: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      throw error;
    }
  };

  const handleCancelCampaign = async (briefId: string) => {
    console.log('DIVVI: Cancelling campaign for briefId:', briefId);

    try {
      // Generate Divvi referral tag
      const referralTag = generateDivviReferralTag();
      console.log('DIVVI: About to cancel campaign with referral tag:', referralTag);

      const result = await cancelBrief(briefId as `0x${string}`, referralTag);
      console.log('DIVVI: Cancel campaign result:', result);
      return result;
    } catch (error) {
      console.error("Error canceling campaign:", error);
      toast.error(
        `Failed to cancel campaign: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      throw error;
    }
  };

  const handleExpireCampaign = async (briefId: string) => {
    console.log('DIVVI: Expiring campaign for briefId:', briefId);

    try {
      // Generate Divvi referral tag
      const referralTag = generateDivviReferralTag();
      console.log('DIVVI: About to expire campaign with referral tag:', referralTag);

      const result = await expireCampaign(briefId as `0x${string}`, referralTag);
      console.log('DIVVI: Expire campaign result:', result);
      return result;
    } catch (error) {
      console.error("Error expiring campaign:", error);
      toast.error(
        `Failed to expire campaign: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      throw error;
    }
  };

  const canCancelCampaign = (brief: Brief): boolean => {
    return (
      brief.status === CampaignStatus.OPEN &&
      brief.selectedInfluencersCount === 0
    );
  };

  const handleCreateCampaignClick = () => {
    if (!isConnected) {
      toast.error("Please connect your wallet first");
      return;
    }
    if (!isCorrectChain) {
      toast.error(`Please switch to ${currentNetwork.name} first`);
      return;
    }
    setShowCreateModal(true);
  };

  if (!userProfile?.isRegistered || !userProfile?.isBusiness) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <motion.div
          className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl md:rounded-2xl p-6 md:p-8 max-w-sm w-full text-center"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl md:rounded-2xl flex items-center justify-center mx-auto mb-4 md:mb-6">
            <Briefcase className="w-6 h-6 md:w-8 md:h-8 text-white" />
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-white mb-3 md:mb-4">
            Business Account Required
          </h2>
          <p className="text-slate-400 text-sm md:text-base mb-6 md:mb-8 leading-relaxed">
            You need to register as a business to access the brand dashboard and
            create campaigns.
          </p>
          <Link href="/">
            <motion.button
              className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold py-2.5 px-4 md:py-3 md:px-6 rounded-lg md:rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all duration-200 shadow-lg shadow-emerald-500/20 text-sm md:text-base"
              whileTap={{ scale: 0.95 }}
            >
              Register as Business
            </motion.button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pt-20 sm:pt-24 md:pt-40">
      <Toaster position="top-right" />

      <div className="px-4 md:px-6 lg:px-8 pb-8 max-w-7xl mx-auto">
        {/* Network Status */}
        {isConnected && !isCorrectChain && (
          <div className="mb-8">
            <NetworkStatus className="bg-slate-800/60 border-amber-500/50" />
          </div>
        )}

        {/* Connection Status Indicator */}
        <div className="mb-6 flex items-center justify-end">
          <div className="flex items-center gap-3 text-sm">
            {isConnected ? (
              <>
                <Wifi className="w-5 h-5 text-emerald-400" />
                <span className="text-emerald-400 font-medium">Connected</span>
                {isCorrectChain ? (
                  <span className="text-emerald-400">
                    • {currentNetwork.name}
                  </span>
                ) : (
                  <span className="text-amber-400">• Wrong Network</span>
                )}
              </>
            ) : (
              <>
                <WifiOff className="w-5 h-5 text-red-400" />
                <span className="text-red-400 font-medium">Not Connected</span>
              </>
            )}
          </div>
        </div>

        {/* Header Section */}
        <motion.div
          className="mb-6 md:mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex flex-col gap-4 md:gap-6">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 md:gap-4 mb-2 md:mb-3">
                <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold text-white">
                  Brand Dashboard
                </h1>
                {/* Business Status Badge */}
                {userProfile?.status !== undefined && (
                  <span
                    className={`inline-flex items-center px-2 py-1 md:px-4 md:py-2 rounded-full text-xs md:text-sm font-medium border ${getUserStatusColor(
                      userProfile.status
                    )}`}
                  >
                    <Crown className="w-3 h-3 md:w-5 md:h-5 mr-1 md:mr-2" />
                    {getUserStatusLabel(userProfile.status)}
                  </span>
                )}
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 md:gap-6">
                <p className="text-sm md:text-xl text-slate-400">
                  Manage your campaigns and track performance
                </p>
                {userProfile?.totalEscrowed !== undefined && (
                  <span className="text-xs md:text-sm text-slate-500 bg-slate-800/50 px-2 py-1 md:px-3 md:py-1 rounded-full">
                    Total invested:{" "}
                    {formatCurrency(fromWei(userProfile.totalEscrowed), "cUSD")}
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-3 md:gap-4">
              {/* Search */}
              <div className="relative w-full">
                <Search className="absolute left-3 md:left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4 md:w-5 md:h-5" />
                <input
                  type="text"
                  placeholder="Search campaigns..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 md:pl-12 md:pr-4 md:py-3 bg-slate-800/50 border border-slate-700/50 rounded-lg md:rounded-xl text-sm md:text-base text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:bg-slate-800/80 transition-all backdrop-blur-sm"
                />
              </div>

              {/* Filters and Button Row */}
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Filters */}
                <div className="flex gap-2 md:gap-3 flex-1">
                  <div className="relative flex-1 sm:flex-none">
                    <select
                      value={selectedFilter}
                      onChange={(e) => setSelectedFilter(e.target.value)}
                      className="w-full appearance-none bg-slate-800/50 border border-slate-700/50 rounded-lg md:rounded-xl px-3 py-2.5 md:px-4 md:py-3 text-sm md:text-base text-white focus:outline-none focus:border-emerald-500/50 cursor-pointer backdrop-blur-sm"
                    >
                      <option value="all">All Campaigns</option>
                      <option value="active">Active</option>
                      <option value="completed">Completed</option>
                      <option value="urgent">Needs Attention</option>
                    </select>
                    <Filter className="absolute right-2.5 md:right-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-3 h-3 md:w-4 md:h-4 pointer-events-none" />
                  </div>

                  <div className="relative flex-1 sm:flex-none">
                    <select
                      value={priorityFilter}
                      onChange={(e) => setPriorityFilter(e.target.value)}
                      className="w-full appearance-none bg-slate-800/50 border border-slate-700/50 rounded-lg md:rounded-xl px-3 py-2.5 md:px-4 md:py-3 text-sm md:text-base text-white focus:outline-none focus:border-emerald-500/50 cursor-pointer backdrop-blur-sm"
                    >
                      <option value="all">All Priority</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                    <Flag className="absolute right-2.5 md:right-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-3 h-3 md:w-4 md:h-4 pointer-events-none" />
                  </div>
                </div>

                {/* Create Campaign Button */}
                <motion.button
                  onClick={handleCreateCampaignClick}
                  disabled={!isConnected || !isCorrectChain}
                  className={`flex items-center justify-center gap-2 px-4 py-2.5 md:px-6 md:py-3 rounded-lg md:rounded-xl font-semibold transition-all duration-200 shadow-lg text-sm md:text-base ${
                    !isConnected || !isCorrectChain
                      ? "bg-slate-600/50 text-slate-400 cursor-not-allowed border border-slate-600/50"
                      : "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700 shadow-emerald-500/20"
                  }`}
                  whileTap={
                    isConnected && isCorrectChain ? { scale: 0.95 } : {}
                  }
                >
                  {!isConnected ? (
                    <>
                      <AlertTriangle className="w-4 h-4 md:w-5 md:h-5" />
                      <span className="hidden sm:inline">Connect Wallet</span>
                      <span className="sm:hidden">Connect</span>
                    </>
                  ) : !isCorrectChain ? (
                    <>
                      <AlertTriangle className="w-4 h-4 md:w-5 md:h-5" />
                      <span className="hidden sm:inline">Wrong Network</span>
                      <span className="sm:hidden">Wrong Net</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 md:w-5 md:h-5 group-hover:rotate-90 transition-transform duration-200" />
                      <span className="hidden sm:inline">New Campaign</span>
                      <span className="sm:hidden">New</span>
                    </>
                  )}
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Urgent Actions Alert */}
        {dashboardData?.urgentActions &&
          dashboardData.urgentActions.length > 0 && (
            <motion.div
              className="mb-6 md:mb-8 bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20 rounded-xl md:rounded-2xl p-4 md:p-6"
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
                    Urgent Actions Required
                  </h3>
                  <div className="space-y-2 md:space-y-3">
                    {dashboardData?.urgentActions
                      .slice(0, 3)
                      .map((action, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 md:p-4 bg-slate-800/50 rounded-lg md:rounded-xl"
                        >
                          <div>
                            <p className="font-medium text-white mb-0.5 md:mb-1 text-sm md:text-base">
                              {action.campaignName}
                            </p>
                            <p className="text-xs md:text-sm text-orange-400">
                              {action.action}
                            </p>
                          </div>
                          <span
                            className={`px-2 py-1 md:px-3 md:py-1 text-xs font-medium rounded-full ${
                              action.priority === "high"
                                ? "bg-red-500/20 text-red-400"
                                : action.priority === "medium"
                                ? "bg-orange-500/20 text-orange-400"
                                : "bg-yellow-500/20 text-yellow-400"
                            }`}
                          >
                            {action.priority}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-10">
          {[
            {
              icon: Activity,
              color: "blue-400",
              value: dashboardData?.activeBriefs.length || 0,
              label: "Active Campaigns",
              subtext: `${
                dashboardData?.urgentActions.length || 0
              } need attention`,
            },
            {
              icon: CheckCircle,
              color: "green-400",
              value: dashboardData?.completedBriefs.length || 0,
              label: "Completed Campaigns",
              subtext: "Successfully finished",
            },
            {
              icon: DollarSign,
              color: "emerald-400",
              value: formatCurrency(dashboardData?.totalBudget || 0, "cUSD", 0),
              label: "Total Budget",
              subtext: "Across all campaigns",
            },
            {
              icon: Users,
              color: "orange-400",
              value: dashboardData?.totalInfluencers || 0,
              label: "Active Influencers",
              subtext: "Currently working",
            },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl md:rounded-2xl p-3 md:p-6 hover:bg-slate-800/70 transition-all duration-200"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <div className="flex items-start justify-between mb-2 md:mb-4">
                <div
                  className={`p-2 md:p-3 bg-gradient-to-br from-${stat.color}/20 to-${stat.color}/30 rounded-lg md:rounded-xl border border-${stat.color}/20`}
                >
                  <stat.icon
                    className={`w-4 h-4 md:w-6 md:h-6 text-${stat.color}`}
                  />
                </div>
              </div>
              <div className="space-y-0.5 md:space-y-1">
                <p className="text-lg md:text-2xl font-bold text-white">
                  {stat.value}
                </p>
                <p className="text-slate-400 text-xs md:text-base">
                  {stat.label}
                </p>
                <p className="text-slate-500 text-xs md:text-sm">
                  {stat.subtext}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Enhanced Campaigns List */}
        <motion.div
          className="space-y-4 md:space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-xl md:text-2xl font-bold text-white">
              Your Campaigns
            </h2>
            <span className="text-slate-400 text-sm md:text-base">
              {filteredBriefs.length} campaigns
            </span>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12 md:py-20">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-6 w-6 md:h-8 md:w-8 border-b-2 border-emerald-500 mb-3 md:mb-4"></div>
                <p className="text-slate-400 text-sm md:text-base">
                  Loading campaigns...
                </p>
              </div>
            </div>
          ) : filteredBriefs.length === 0 ? (
            <div className="text-center py-12 md:py-20">
              <Briefcase className="w-12 h-12 md:w-16 md:h-16 text-slate-600 mx-auto mb-4 md:mb-6" />
              <h3 className="text-lg md:text-2xl font-semibold text-white mb-2 md:mb-3">
                No campaigns found
              </h3>
              <p className="text-slate-400 max-w-md mx-auto leading-relaxed text-sm md:text-base">
                {searchTerm
                  ? "Try adjusting your search or filter criteria."
                  : "Create your first campaign to get started with influencer marketing."}
              </p>
            </div>
          ) : (
            <div className="space-y-4 md:space-y-6">
              {filteredBriefs.map((brief, index) => {
                const isUrgent = isActionUrgent(brief);
                const priority = getActionPriority(brief);
                const isExpanded = expandedBriefId === brief.id;
                const isDescriptionExpanded = expandedDescriptions.has(brief.id);
                const showExpandButton = shouldShowExpandButton(brief.description);

                return (
                  <motion.div
                    key={brief.id}
                    className="bg-white/5 backdrop-blur-sm border border-slate-700/50 rounded-xl md:rounded-2xl overflow-hidden hover:bg-white/10 transition-all duration-300 hover:border-slate-600/50"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    whileHover={{ y: -2 }}
                  >
                    {/* Header */}
                    <div className="p-4 md:p-8">
                      <div className="flex items-start gap-3 md:gap-6 mb-4 md:mb-6">
                        <div className="p-2 md:p-4 bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 rounded-lg md:rounded-2xl border border-emerald-500/30">
                          <Target className="w-5 h-5 md:w-8 md:h-8 text-emerald-400" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 md:gap-6 mb-3 md:mb-4">
                            <h3 className="text-lg md:text-2xl font-bold text-white leading-tight">
                              {brief.name}
                            </h3>

                            <div className="flex items-center gap-1 md:gap-3 flex-shrink-0 flex-wrap">
                              {/* Status badge */}
                              <span
                                className={`px-2 py-1 md:px-4 md:py-2 text-xs md:text-sm font-medium rounded-full border ${getStatusColor(
                                  brief.status
                                )}`}
                              >
                                {brief.status === CampaignStatus.CANCELLED && (
                                  <Ban className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2 inline" />
                                )}
                                <span className="hidden sm:inline">
                                  {brief.statusInfo.statusLabel}
                                </span>
                                <span className="sm:hidden">
                                  {brief.statusInfo.statusLabel.slice(0, 6)}
                                </span>
                              </span>

                              {/* Phase badge - hide on very small screens */}
                              <span
                                className={`hidden sm:inline-flex px-2 py-1 md:px-4 md:py-2 text-xs md:text-sm font-medium rounded-full border ${getPhaseColor(
                                  brief.timingInfo.phase
                                )}`}
                              >
                                {getPhaseLabel(brief.timingInfo.phase)}
                              </span>

                              {/* Priority badge */}
                              {isUrgent && (
                                <span
                                  className={`px-2 py-1 md:px-4 md:py-2 text-xs md:text-sm font-medium rounded-full animate-pulse ${
                                    priority === "high"
                                      ? "bg-red-500/20 text-red-400 border border-red-500/30"
                                      : priority === "medium"
                                      ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                                      : "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                                  }`}
                                >
                                  <Zap className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2 inline" />
                                  <span className="hidden sm:inline">
                                    {priority.toUpperCase()}
                                  </span>
                                  <span className="sm:hidden">!</span>
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Expandable Description */}
                          <div className="mb-3 md:mb-6">
                            <div className="text-slate-300 text-sm md:text-lg leading-relaxed">
                              {isDescriptionExpanded 
                                ? brief.description 
                                : getTruncatedDescription(brief.description)
                              }
                            </div>
                            
                            {showExpandButton && (
                              <motion.button
                                onClick={() => toggleDescription(brief.id)}
                                className="mt-2 flex items-center gap-1 text-xs md:text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
                                whileTap={{ scale: 0.95 }}
                              >
                                <FileText className="w-3 h-3 md:w-4 md:h-4" />
                                <span>{isDescriptionExpanded ? "Show less" : "Show more"}</span>
                                <motion.div
                                  animate={{ rotate: isDescriptionExpanded ? 180 : 0 }}
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
                                Created{" "}
                                {format(
                                  new Date(brief.creationTime * 1000),
                                  "MMM d, yyyy"
                                )}
                              </span>
                              <span className="sm:hidden">
                                {format(
                                  new Date(brief.creationTime * 1000),
                                  "MMM d"
                                )}
                              </span>
                            </div>
                            {brief.timingInfo.currentDeadline &&
                              brief.timingInfo.timeRemaining && (
                                <div className="flex items-center gap-1 md:gap-2">
                                  <Clock className="w-3 h-3 md:w-5 md:h-5" />
                                  <span
                                    className={
                                      brief.timingInfo.isUrgent
                                        ? "text-orange-400"
                                        : ""
                                    }
                                  >
                                    {formatTimeRemaining(
                                      brief.timingInfo.timeRemaining
                                    )}{" "}
                                    <span className="hidden sm:inline">
                                      left
                                    </span>
                                  </span>
                                </div>
                              )}
                            <div className="flex items-center gap-1 md:gap-2">
                              <Users className="w-3 h-3 md:w-5 md:h-5" />
                              <span>
                                {brief.selectedInfluencersCount}/
                                {brief.maxInfluencers}
                                <span className="hidden sm:inline">
                                  {" "}
                                  influencers
                                </span>
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Next Action Alert */}
                      {brief.statusInfo.nextAction && (
                      <div className={`p-3 md:p-6 rounded-xl md:rounded-2xl border mb-4 md:mb-6 ${
                        isUrgent
                          ? "bg-orange-500/5 border-orange-500/20"
                          : "bg-blue-500/5 border-blue-500/20"
                      }`}>
                        <div className="flex items-center gap-2 md:gap-4">
                          <div className={`w-2 h-2 md:w-3 md:h-3 rounded-full ${
                            isUrgent ? "bg-orange-400" : "bg-blue-400"
                          }`}></div>
                          <span className="text-slate-200 font-medium text-sm md:text-lg">
                            {brief.statusInfo.nextAction}
                          </span>
                        </div>
                        {brief.statusInfo.warning && (
                          <div className="flex items-center gap-2 md:gap-3 mt-2 md:mt-3">
                            <AlertTriangle className="w-4 h-4 md:w-5 md:h-5 text-orange-400" />
                            <span className="text-orange-400 text-sm md:text-base">
                      
                              {brief.statusInfo.warning.replace(/auto.?approval/gi, 'campaign completion')}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                      {/* Budget & Progress */}
                      <div className="flex items-center justify-between pt-4 md:pt-6 border-t border-slate-700/30">
                        <div>
                          <div className="text-xl md:text-3xl font-bold text-white mb-1 md:mb-2">
                            {formatCurrency(brief.budget)}
                          </div>
                          <div className="text-slate-400 text-xs md:text-sm">
                            {brief.selectedInfluencersCount > 0
                              ? `${formatCurrency(
                                  brief.progressInfo.budgetPerSpot
                                )} per influencer`
                              : `${formatCurrency(
                                  brief.progressInfo.budgetPerSpot
                                )} per spot`}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-slate-400 mb-2 md:mb-3 text-xs md:text-sm">
                            Progress: {brief.progressInfo.spotsFilledPercentage}
                            %
                          </div>
                          <div className="w-24 md:w-40 h-2 md:h-3 bg-slate-700/50 rounded-full overflow-hidden">
                            <motion.div
                              className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400"
                              initial={{ width: 0 }}
                              animate={{
                                width: `${brief.progressInfo.spotsFilledPercentage}%`,
                              }}
                              transition={{ duration: 1, delay: 0.5 }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Expandable Requirements Section */}
                    <div className="border-t border-slate-700/30">
                      <motion.button
                        onClick={() =>
                          setExpandedBriefId(isExpanded ? null : brief.id)
                        }
                        className="w-full p-3 md:p-6 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
                        whileTap={{ scale: 0.995 }}
                      >
                        <div className="flex items-center gap-2 md:gap-4">
                          <CheckSquare className="w-4 h-4 md:w-6 md:h-6 text-slate-400" />
                          <span className="text-slate-300 font-medium text-sm md:text-lg">
                            Campaign Requirements
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
                              <p className="text-slate-200 leading-relaxed bg-slate-800/30 p-3 md:p-6 rounded-xl md:rounded-2xl border border-slate-700/50 text-sm md:text-lg">
                                {brief.requirements ||
                                  "No specific requirements"}
                              </p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Action Buttons */}
                    <div className="p-4 pt-0 md:p-8 md:pt-0">
                      <div className="flex gap-2 md:gap-4">
                        <motion.button
                          onClick={() => {
                            setSelectedBrief(brief);
                            setShowApplicationsModal(true);
                          }}
                          disabled={brief.status === CampaignStatus.CANCELLED}
                          className={`relative flex-1 font-medium py-2.5 px-3 md:py-4 md:px-6 rounded-lg md:rounded-xl border transition-all text-sm md:text-base ${
                            brief.status === CampaignStatus.CANCELLED
                              ? "bg-slate-600/30 text-slate-500 border-slate-600/30 cursor-not-allowed"
                              : "bg-slate-700/50 hover:bg-slate-700 text-white border-slate-600/50 hover:border-slate-500"
                          }`}
                          whileTap={
                            brief.status !== CampaignStatus.CANCELLED
                              ? { scale: 0.95 }
                              : {}
                          }
                        >
                          Applications
                          {applications.length > 0 &&
                            brief.status !== CampaignStatus.CANCELLED && (
                              <span className="absolute -top-1 -right-1 md:-top-2 md:-right-2 bg-emerald-500 text-white text-xs rounded-full h-4 w-4 md:h-6 md:w-6 flex items-center justify-center font-bold shadow-sm">
                                {applications.length}
                              </span>
                            )}
                        </motion.button>

                        <motion.button
                          onClick={() => {
                            setSelectedBrief(brief);
                            setShowSubmissionsModal(true);
                          }}
                          disabled={brief.status === CampaignStatus.CANCELLED}
                          className={`flex-1 font-medium py-2.5 px-3 md:py-4 md:px-6 rounded-lg md:rounded-xl border transition-all text-sm md:text-base ${
                            brief.status === CampaignStatus.CANCELLED
                              ? "bg-slate-600/30 text-slate-500 border-slate-600/30 cursor-not-allowed"
                              : "bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border-emerald-500/30 hover:border-emerald-500/50"
                          }`}
                          whileTap={
                            brief.status !== CampaignStatus.CANCELLED
                              ? { scale: 0.95 }
                              : {}
                          }
                        >
                          Submissions
                        </motion.button>

                        {/* Expire Campaign Button */}
                        {brief.statusInfo.canExpire && (
                          <motion.button
                            onClick={() => setShowExpireConfirm(brief.id)}
                            disabled={isExpiringBrief}
                            className="px-2.5 py-2.5 md:px-4 md:py-4 bg-orange-600/20 hover:bg-orange-600/30 text-orange-400 rounded-lg md:rounded-xl border border-orange-500/30 hover:border-orange-500/50 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 md:gap-2"
                            whileTap={{ scale: 0.95 }}
                            title="Expire Campaign"
                          >
                            {isExpiringBrief ? (
                              <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" />
                            ) : (
                              <Clock className="w-4 h-4 md:w-5 md:h-5" />
                            )}
                          </motion.button>
                        )}

                        {/* Cancel Campaign Button */}
                        {canCancelCampaign(brief) && (
                          <motion.button
                            onClick={() => setShowCancelConfirm(brief.id)}
                            disabled={isCancelingBrief}
                            className="px-2.5 py-2.5 md:px-4 md:py-4 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg md:rounded-xl border border-red-500/30 hover:border-red-500/50 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 md:gap-2"
                            whileTap={{ scale: 0.95 }}
                            title="Cancel Campaign"
                          >
                            {isCancelingBrief ? (
                              <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4 md:w-5 md:h-5" />
                            )}
                          </motion.button>
                        )}

                        <motion.button
                          className="p-2.5 md:p-4 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg md:rounded-xl transition-all"
                          whileTap={{ scale: 0.95 }}
                        >
                          <MoreVertical className="w-4 h-4 md:w-5 md:h-5" />
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <motion.div
          className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-slate-800/95 backdrop-blur-xl border border-slate-700/50 rounded-xl md:rounded-2xl p-4 md:p-8 max-w-md mx-auto shadow-2xl shadow-red-500/10 w-full"
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
          >
            <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-6">
              <div className="p-2 md:p-3 bg-red-500/10 rounded-xl md:rounded-2xl border border-red-500/20">
                <XCircle className="w-6 h-6 md:w-8 md:h-8 text-red-400" />
              </div>
              <div>
                <h3 className="text-lg md:text-xl font-bold text-white">
                  Cancel Campaign
                </h3>
                <p className="text-sm md:text-base text-slate-400">
                  This action cannot be undone
                </p>
              </div>
            </div>

            <p className="text-slate-300 mb-6 md:mb-8 leading-relaxed text-sm md:text-base">
              Are you sure you want to cancel this campaign? The budget will be
              refunded to your wallet.
            </p>

            <div className="flex gap-3 md:gap-4">
              <button
                onClick={() => setShowCancelConfirm(null)}
                disabled={isCancelingBrief}
                className="flex-1 px-4 py-2.5 md:px-6 md:py-3 font-medium text-slate-300 bg-slate-700/50 rounded-lg md:rounded-xl border border-slate-600/50 hover:bg-slate-700 transition-all disabled:opacity-50 text-sm md:text-base"
              >
                Keep Campaign
              </button>
              <button
                onClick={() => {
                  if (showCancelConfirm) {
                    handleCancelCampaign(showCancelConfirm);
                  }
                }}
                disabled={isCancelingBrief}
                className="flex-1 px-4 py-2.5 md:px-6 md:py-3 font-medium text-white bg-gradient-to-r from-red-500 to-red-600 rounded-lg md:rounded-xl hover:from-red-600 hover:to-red-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm md:text-base"
              >
                {isCancelingBrief ? (
                  <>
                    <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" />
                    <span className="hidden sm:inline">Canceling...</span>
                    <span className="sm:hidden">...</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 md:w-5 md:h-5" />
                    <span className="hidden sm:inline">Cancel Campaign</span>
                    <span className="sm:hidden">Cancel</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Expire Confirmation Modal */}
      {showExpireConfirm && (
        <motion.div
          className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-slate-800/95 backdrop-blur-xl border border-slate-700/50 rounded-xl md:rounded-2xl p-4 md:p-8 max-w-md mx-auto shadow-2xl shadow-orange-500/10 w-full"
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
          >
            <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-6">
              <div className="p-2 md:p-3 bg-orange-500/10 rounded-xl md:rounded-2xl border border-orange-500/20">
                <Clock className="w-6 h-6 md:w-8 md:h-8 text-orange-400" />
              </div>
              <div>
                <h3 className="text-lg md:text-xl font-bold text-white">
                  Expire Campaign
                </h3>
                <p className="text-sm md:text-base text-slate-400">
                  Campaign past deadline
                </p>
              </div>
            </div>

            <p className="text-slate-300 mb-6 md:mb-8 leading-relaxed text-sm md:text-base">
              Are you sure you want to expire this campaign? The remaining budget will be
              refunded to your wallet. This action cannot be undone.
            </p>

            <div className="flex gap-3 md:gap-4">
              <button
                onClick={() => setShowExpireConfirm(null)}
                disabled={isExpiringBrief}
                className="flex-1 px-4 py-2.5 md:px-6 md:py-3 font-medium text-slate-300 bg-slate-700/50 rounded-lg md:rounded-xl border border-slate-600/50 hover:bg-slate-700 transition-all disabled:opacity-50 text-sm md:text-base"
              >
                Keep Campaign
              </button>
              <button
                onClick={() => {
                  if (showExpireConfirm) {
                    handleExpireCampaign(showExpireConfirm);
                  }
                }}
                disabled={isExpiringBrief}
                className="flex-1 px-4 py-2.5 md:px-6 md:py-3 font-medium text-white bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg md:rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm md:text-base"
              >
                {isExpiringBrief ? (
                  <>
                    <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" />
                    <span className="hidden sm:inline">Expiring...</span>
                    <span className="sm:hidden">...</span>
                  </>
                ) : (
                  <>
                    <Clock className="w-4 h-4 md:w-5 md:h-5" />
                    <span className="hidden sm:inline">Expire Campaign</span>
                    <span className="sm:hidden">Expire</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {showCreateModal && (
        <CreateCampaignModal
          formData={formData}
          setFormData={setFormData}
          isCreatingBrief={isCreatingBrief}
          isFormValid={isFormValid()}
          onCreateCampaign={handleCreateCampaign}
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {showApplicationsModal && selectedBrief && (
        <ApplicationsModal
          selectedBrief={selectedBrief}
          applications={applications || []}
          isLoadingApplications={isLoadingApplications}
          onClose={() => setShowApplicationsModal(false)}
          onAssignSuccess={() => {
            // Refresh applications data after successful assignment
            refetchApplications();
          }}
        />
      )}

      {showSubmissionsModal && selectedBrief && (
        <SubmissionsModal
          selectedBrief={selectedBrief}
          applications={applications || []}
          isLoadingApplications={isLoadingApplications}
          isCompletingCampaign={isCompletingCampaign}
          onReleaseFunds={handleReleaseFunds}
          onClose={() => setShowSubmissionsModal(false)}
        />
      )}
    </div>
  );
};

export default BrandDashboard;