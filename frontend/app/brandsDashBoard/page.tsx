"use client";

import { useState, useEffect, useMemo } from "react";
import { useAccount } from "wagmi";
import { FormattedBriefData } from "@/types/index";
import { SubmissionsModal } from "@/components/modals/SubmissionsModal";
import ApplicationsModal from "@/components/modals/ApplicationsModal";
import CreateCampaignModal from "@/components/modals/CreateCampaignModal";
import { NetworkStatus } from "@/components/NetworkStatus";
import { useRouter } from "next/navigation";
import { Toaster, toast } from "react-hot-toast";
import { useEnsureNetwork } from "@/hooks/useEnsureNetwork";
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
  Timer,
  TrendingUp,
} from "lucide-react";
import { format, isAfter, addHours } from "date-fns";
import Link from "next/link";
import { motion } from "framer-motion";
import {

  getStatusColor,
  isCampaignUrgent,
  isCampaignNew,
  getTimeRemaining,
  formatCurrency,
} from "@/utils/format";

// Import custom hooks
import {
  useUserProfile,
  useBriefApplications,
  useCreateAdBrief,
  useCompleteCampaign,
  useGetBusinessBriefs,
  useCancelAdBrief,
  usePlatformStats
} from "../../hooks/adsBazaar";

import { useAllBriefApplicationCounts } from "../../hooks/useAllBriefApplicationCounts";

const BrandDashboard = () => {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { isCorrectChain, currentNetwork } = useEnsureNetwork();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showApplicationsModal, setShowApplicationsModal] = useState(false);
  const [showSubmissionsModal, setShowSubmissionsModal] = useState(false);
  const [selectedBrief, setSelectedBrief] = useState<FormattedBriefData | null>(
    null
  );
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showCancelConfirm, setShowCancelConfirm] = useState<string | null>(
    null
  );
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    requirements: "",
    budget: "",
    promotionDuration: "604800", // 7 days in seconds
    maxInfluencers: "5",
    targetAudience: "0",
  });

  const { userProfile } = useUserProfile();
  const { briefs: fetchedBriefs, isLoading } = useGetBusinessBriefs(
    address as `0x${string}`
  );
  const briefs = useMemo(
    () => (address ? fetchedBriefs : []),
    [address, fetchedBriefs]
  );

  
  // Fetch application counts for all briefs
  const { applicationCounts, isLoadingApplications: isLoadingAllApplications, errorApplications } =
    useAllBriefApplicationCounts(briefs);
  // Keep useBriefApplications for the ApplicationsModal
  const { applications, isLoadingApplications, refetchApplications } =
    useBriefApplications(selectedBrief?.id || "0x0");

  const {
    createBrief,
    isPending: isCreatingBrief,
    isSuccess: isCreateSuccess,
    isError: isCreateError,
    error: createError,
  } = useCreateAdBrief();

  const {
    completeCampaign,
    isPending: isCompletingCampaign,
    isSuccess: isCompleteSuccess,
    isError: isCompleteError,
    error: completeError,
  } = useCompleteCampaign();

  const {
    cancelBrief,
    isPending: isCancelingBrief,
    isSuccess: isCancelSuccess,
    isError: isCancelError,
    error: cancelError,
  } = useCancelAdBrief();

  interface StatusMap {
    [key: number]: string;
  }

  const getStatusString = (statusCode: number): string => {
    const statusMap: StatusMap = {
      0: "Active",
      1: "In Progress",
      2: "Completed",
      3: "Cancelled",
      4: "Expired",
    };
    return statusMap[statusCode] || "Unknown";
  };

  // Enhanced campaign status logic
  const getCampaignStatusInfo = (brief: FormattedBriefData) => {
    const now = new Date();
    const selectionDeadline = new Date(brief.selectionDeadline * 1000);
    const creationDate = new Date(brief.creationTime * 1000);

    return {
      isNew: isCampaignNew(brief.creationTime),
      isUrgent: isCampaignUrgent(brief.selectionDeadline) && brief.status === 0,
      isActive: brief.status === 0,
      isInProgress: brief.status === 1,
      isCompleted: brief.status === 2,
      isCancelled: brief.status === 3,
      isExpired: brief.status === 4,
      deadlinePassed: isAfter(now, selectionDeadline),
      timeRemaining: getTimeRemaining(brief.selectionDeadline),
      createdAt: creationDate,
      selectionDeadlineDate: selectionDeadline,
    };
  };

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
      });
      router.push("/brandsDashboard");
    }

    if (isCreateError) {
      toast.error(
        `Failed to create campaign: ${createError?.message || "Unknown error"}`
      );
    }
  }, [isCreateSuccess, isCreateError, createError, router]);

  useEffect(() => {
    if (isCompleteSuccess) {
      toast.success("Campaign completed and funds released successfully!");
      refetchApplications();
      setShowSubmissionsModal(false);
    }

    if (isCompleteError) {
      toast.error(
        `Failed to complete campaign: ${
          completeError?.message || "Unknown error"
        }`
      );
    }
  }, [isCompleteSuccess, isCompleteError, completeError, refetchApplications]);

  useEffect(() => {
    if (isCancelSuccess) {
      toast.success("Campaign cancelled successfully!");
      setShowCancelConfirm(null);
      router.refresh();
    }

    if (isCancelError) {
      toast.error(
        `Failed to cancel campaign: ${cancelError?.message || "Unknown error"}`
      );
      setShowCancelConfirm(null);
    }
  }, [isCancelSuccess, isCancelError, cancelError, router]);

  // Handle errors from application counts fetch
  useEffect(() => {
    if (errorApplications) {
      toast.error("Failed to load application counts");
    }
  }, [errorApplications]);

  // Updated statistics calculations
  const activeBriefs = briefs
    ? briefs.filter((brief) => brief.status === 0 || brief.status === 1)
    : [];
  const completedBriefs = briefs
    ? briefs.filter((brief) => brief.status === 2)
    : [];
  const totalBudget = briefs
    ? briefs.reduce((sum, brief) => sum + Number(brief.budget), 0)
    : 0;
  const totalInfluencers = briefs
    ? briefs.reduce(
        (sum, brief) => sum + Number(brief.selectedInfluencersCount),
        0
      )
    : 0;

  // Enhanced filtering logic
  const filteredBriefs = briefs.filter((brief) => {
    const matchesSearch = brief.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesFilter =
      selectedFilter === "all" ||
      (selectedFilter === "active" &&
        (brief.status === 0 || brief.status === 1)) ||
      (selectedFilter === "completed" && brief.status === 2);
    return matchesSearch && matchesFilter;
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
      Number(formData.maxInfluencers) <= 10
    );
  };

  const handleCreateCampaign = async () => {
    if (!isFormValid()) {
      toast.error("Please fill in all required fields correctly");
      return;
    }

    try {
      await createBrief(
        formData.name,
        formData.description,
        formData.requirements,
        formData.budget,
        Number(formData.promotionDuration),
        Number(formData.maxInfluencers),
        Number(formData.targetAudience)
      );
    } catch (error) {
      console.error("Error creating campaign:", error);
      toast.error(
        `Failed to create campaign: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  const handleReleaseFunds = async (briefId: string) => {
    try {
      await completeCampaign(briefId as `0x${string}`);
    } catch (error) {
      console.error("Error releasing funds:", error);
      toast.error(
        `Failed to release funds: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  const handleCancelCampaign = async (briefId: string) => {
    try {
      await cancelBrief(briefId as `0x${string}`);
    } catch (error) {
      console.error("Error canceling campaign:", error);
      toast.error(
        `Failed to cancel campaign: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  const canCancelCampaign = (brief: FormattedBriefData): boolean => {
    return brief.status === 0 && brief.selectedInfluencersCount === 0;
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
          className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 max-w-[90vw] sm:max-w-md text-center"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-lg flex items-center justify-center mx-auto mb-4">
            <Briefcase className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-3">
            Business Account Required
          </h2>
          <p className="text-slate-400 text-sm sm:text-base mb-6 leading-relaxed">
            You need to register as a business to access the brand dashboard and
            create campaigns.
          </p>
          <Link href="/">
            <motion.button
              className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold py-2.5 px-4 rounded-lg hover:from-emerald-600 hover:to-emerald-700 transition-all duration-200 shadow-md shadow-emerald-500/20"
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

      <div className="px-4 sm:px-6 md:px-8 pb-8">
        {/* Network Status */}
        {isConnected && !isCorrectChain && (
          <div className="mb-6">
            <NetworkStatus className="bg-slate-800/60 border-amber-500/50" />
          </div>
        )}

        {/* Connection Status Indicator */}
        <div className="mb-4 flex items-center justify-end">
          <div className="flex items-center gap-2 text-xs">
            {isConnected ? (
              <>
                <Wifi className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400">Connected</span>
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
                <WifiOff className="w-4 h-4 text-red-400" />
                <span className="text-red-400">Not Connected</span>
              </>
            )}
          </div>
        </div>

        {/* Header Section */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex flex-col gap-4 sm:gap-6">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
                Brand Dashboard
              </h1>
              <p className="text-base sm:text-lg text-slate-400">
                Manage your campaigns and track performance
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search campaigns..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500/50 focus:bg-slate-800/80 transition-all backdrop-blur-sm"
                />
              </div>

              {/* Filter */}
              <div className="relative">
                <select
                  value={selectedFilter}
                  onChange={(e) => setSelectedFilter(e.target.value)}
                  className="appearance-none bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500/50 cursor-pointer backdrop-blur-sm min-w-[120px]"
                >
                  <option value="all">All Campaigns</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                </select>
                <Filter className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-slate-400 w-3.5 h-3.5 pointer-events-none" />
              </div>

              {/* Create Campaign Button */}
              <motion.button
                onClick={handleCreateCampaignClick}
                disabled={!isConnected || !isCorrectChain}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 shadow-md ${
                  !isConnected || !isCorrectChain
                    ? "bg-slate-600/50 text-slate-400 cursor-not-allowed border border-slate-600/50"
                    : "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700 shadow-emerald-500/20"
                }`}
                whileTap={isConnected && isCorrectChain ? { scale: 0.95 } : {}}
              >
                {!isConnected ? (
                  <>
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-sm">Connect Wallet</span>
                  </>
                ) : !isCorrectChain ? (
                  <>
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-sm">Wrong Network</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" />
                    <span className="text-sm">New Campaign</span>
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 gap-4 sm:gap-6 mb-8">
          {[
            {
              icon: Activity,
              color: "blue-400",
              value: activeBriefs.length,
              label: "Active Campaigns",
            },
            {
              icon: CheckCircle,
              color: "green-400",
              value: completedBriefs.length,
              label: "Completed Campaigns",
            },
            {
              icon: DollarSign,
              color: "emerald-400",
              value: formatCurrency(totalBudget, "cUSD", 0),
              label: "Total Budget",
            },
            {
              icon: Users,
              color: "orange-400",
              value: totalInfluencers,
              label: "Active Influencers",
            },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-4 hover:bg-slate-800/70 transition-all duration-200"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <div className="flex items-start justify-between mb-3">
                <div
                  className={`p-2 bg-gradient-to-br from-${stat.color}/20 to-${stat.color}/30 rounded-lg border border-${stat.color}/20`}
                >
                  <stat.icon className={`w-5 h-5 text-${stat.color}`} />
                </div>
              </div>
              <div className="space-y-0.5">
                <p className="text-xl font-bold text-white">{stat.value}</p>
                <p className="text-slate-400 text-sm">{stat.label}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Campaigns List */}
        <motion.div
          className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="p-4 sm:p-5 border-b border-slate-700/50">
            <div className="flex items-center justify-between">
              <h2 className="text-xl sm:text-2xl font-bold text-white">
                Your Campaigns
              </h2>
              <span className="text-slate-400 text-sm">
                {filteredBriefs.length} campaigns
              </span>
            </div>
          </div>

          <div className="divide-y divide-slate-700/50">
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500 mb-3"></div>
                <p className="text-slate-400 text-sm">Loading campaigns...</p>
              </div>
            ) : filteredBriefs.length === 0 ? (
              <div className="p-8 text-center">
                <Briefcase className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-white mb-2">
                  No campaigns found
                </h3>
                <p className="text-slate-400 text-sm max-w-md mx-auto">
                  {searchTerm
                    ? "Try adjusting your search or filter criteria."
                    : "Create your first campaign to get started with influencer marketing."}
                </p>
              </div>
            ) : (
              filteredBriefs.map((brief, index) => {
                const campaignStatus = getCampaignStatusInfo(brief);
                // Get application count for this specific brief
                const applicationCount = applicationCounts[brief.id] || 0;

                return (
                  <motion.div
                    key={brief.id}
                    className="p-4 sm:p-5 hover:bg-slate-800/30 transition-all duration-200"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <div className="flex flex-col gap-4">
                      {/* Campaign Info */}
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-gradient-to-br from-slate-700 to-slate-800 rounded-lg border border-slate-600/50 hover:border-emerald-500/30 transition-colors">
                          <Target className="w-4 h-4 text-slate-300" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                            <h3 className="text-base sm:text-lg font-semibold text-white truncate">
                              {brief.name}
                            </h3>
                            <div className="flex items-center gap-2 flex-wrap">
                              {/* Status badge */}
                              <span
                                className={`px-2.5 py-0.5 text-xs font-medium rounded-full border ${getStatusColor(
                                  brief.status
                                )}`}
                              >
                                {brief.status === 3 && (
                                  <Ban className="w-3 h-3 mr-1 inline" />
                                )}
                                {getStatusString(brief.status)}
                              </span>

                              {/* New badge */}
                              {campaignStatus.isNew && (
                                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                  <TrendingUp className="w-3 h-3 mr-1 inline" />
                                  New
                                </span>
                              )}

                              {/* Urgent badge */}
                              {campaignStatus.isUrgent && (
                                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 animate-pulse">
                                  <Timer className="w-3 h-3 mr-1 inline" />
                                  Urgent
                                </span>
                              )}
                            </div>
                          </div>
                          <p className="text-slate-400 text-xs sm:text-sm mb-2 line-clamp-2">
                            {brief.description}
                          </p>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              <span>
                                Created{" "}
                                {format(
                                  campaignStatus.createdAt,
                                  "MMM d, yyyy"
                                )}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {campaignStatus.deadlinePassed ? (
                                <span className="text-red-400">
                                  Selection closed
                                </span>
                              ) : campaignStatus.timeRemaining.days > 0 ? (
                                <span>
                                  {campaignStatus.timeRemaining.days} day
                                  {campaignStatus.timeRemaining.days !== 1
                                    ? "s"
                                    : ""}{" "}
                                  left
                                </span>
                              ) : (
                                <span className="text-orange-400">
                                  {campaignStatus.timeRemaining.hours} hour
                                  {campaignStatus.timeRemaining.hours !== 1
                                    ? "s"
                                    : ""}{" "}
                                  left
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="w-3.5 h-3.5" />
                              <span>
                                {brief.selectedInfluencersCount}/
                                {brief.maxInfluencers} influencers
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Budget & Actions */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <div className="text-lg sm:text-xl font-bold text-white mb-1">
                            {formatCurrency(brief.budget)}
                          </div>
                          <div className="text-xs text-slate-400">
                            {brief.selectedInfluencersCount > 0
                              ? `${formatCurrency(
                                  brief.budget / brief.maxInfluencers
                                )} per influencer`
                              : `${formatCurrency(
                                  brief.budget / brief.maxInfluencers
                                )} per spot`}
                          </div>
                          <div className="w-20 h-1.5 bg-slate-700/50 rounded-full mt-1.5 overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-300"
                              style={{
                                width: `${
                                  (brief.selectedInfluencersCount /
                                    brief.maxInfluencers) *
                                  100
                                }%`,
                              }}
                            />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <motion.button
                            onClick={() => {
                              setSelectedBrief(brief);
                              setShowApplicationsModal(true);
                            }}
                            disabled={brief.status === 3}
                            className={`relative px-3 py-1.5 rounded-lg border transition-all text-xs font-medium ${
                              brief.status === 3
                                ? "bg-slate-600/30 text-slate-500 border-slate-600/30 cursor-not-allowed"
                                : "bg-slate-700/50 hover:bg-slate-700 text-white border-slate-600/50 hover:border-slate-500"
                            }`}
                            whileTap={brief.status !== 3 ? { scale: 0.95 } : {}}
                          >
                            Applications
                            {isLoadingAllApplications && brief.status !== 3 ? (
                              <span className="absolute -top-1.5 -right-1.5 bg-emerald-500/50 text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center font-bold shadow-sm">
                                <Loader2 className="w-3 h-3 animate-spin" />
                              </span>
                            ) : applicationCount > 0 && brief.status !== 3 ? (
                              <span className="absolute -top-1.5 -right-1.5 bg-emerald-500 text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center font-bold shadow-sm">
                                {applicationCount}
                              </span>
                            ) : null}
                          </motion.button>
                          <motion.button
                            onClick={() => {
                              setSelectedBrief(brief);
                              setShowSubmissionsModal(true);
                            }}
                            disabled={brief.status === 3}
                            className={`px-3 py-1.5 rounded-lg border transition-all text-xs font-medium ${
                              brief.status === 3
                                ? "bg-slate-600/30 text-slate-500 border-slate-600/30 cursor-not-allowed"
                                : "bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border-emerald-500/30 hover:border-emerald-500/50"
                            }`}
                            whileTap={brief.status !== 3 ? { scale: 0.95 } : {}}
                          >
                            Submissions
                          </motion.button>

                          {/* Cancel Campaign Button */}
                          {canCancelCampaign(brief) && (
                            <motion.button
                              onClick={() => setShowCancelConfirm(brief.id)}
                              disabled={isCancelingBrief}
                              className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg border border-red-500/30 hover:border-red-500/50 transition-all text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                              whileTap={{ scale: 0.95 }}
                              title="Cancel Campaign"
                            >
                              {isCancelingBrief ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Trash2 className="w-3 h-3" />
                              )}
                            </motion.button>
                          )}

                          <motion.button
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all"
                            whileTap={{ scale: 0.95 }}
                          >
                            <MoreVertical className="w-3.5 h-3.5" />
                          </motion.button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
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
            className="bg-slate-800/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 max-w-md mx-auto shadow-2xl shadow-red-500/10"
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-500/10 rounded-xl border border-red-500/20">
                <XCircle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  Cancel Campaign
                </h3>
                <p className="text-sm text-slate-400">
                  This action cannot be undone
                </p>
              </div>
            </div>

            <p className="text-slate-300 mb-6 leading-relaxed">
              Are you sure you want to cancel this campaign? The budget will be
              refunded to your wallet.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelConfirm(null)}
                disabled={isCancelingBrief}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-300 bg-slate-700/50 rounded-xl border border-slate-600/50 hover:bg-slate-700 transition-all disabled:opacity-50"
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
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-red-500 to-red-600 rounded-xl hover:from-red-600 hover:to-red-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isCancelingBrief ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Canceling...
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4" />
                    Cancel Campaign
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