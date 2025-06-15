"use client";

import { useState, useEffect, useMemo } from "react";
import { useAccount } from "wagmi";
import { Brief } from "@/types/index";
import { SubmissionsModal } from "@/components/modals/SubmissionsModal";
import { ApplicationsModal } from "@/components/modals/ApplicationsModal";
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
} from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { motion } from "framer-motion";

// Import custom hooks
import {
  useUserProfile,
  useBriefApplications,
  useCreateAdBrief,
  useSelectInfluencer,
  useCompleteCampaign,
  useGetBusinessBriefs,
} from "../../hooks/adsBazaar";

const BrandDashboard = () => {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { isCorrectChain, currentNetwork } = useEnsureNetwork();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showApplicationsModal, setShowApplicationsModal] = useState(false);
  const [showSubmissionsModal, setShowSubmissionsModal] = useState(false);
  const [selectedBrief, setSelectedBrief] = useState<Brief | null>(null);
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
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
    isSuccess: isSelectSuccess,
    isError: isSelectError,
    error: selectError,
  } = useSelectInfluencer();

  const {
    completeCampaign,
    isPending: isCompletingCampaign,
    isSuccess: isCompleteSuccess,
    isError: isCompleteError,
    error: completeError,
  } = useCompleteCampaign();

  interface StatusMap {
    [key: number]: string;
  }

  const getStatusString = (statusCode: number): string => {
    const statusMap: StatusMap = {
      0: "Active",
      1: "In Progress",
      2: "Completed",
      3: "Cancelled",
    };
    return statusMap[statusCode] || "Unknown";
  };

  const getStatusColor = (statusCode: number): string => {
    switch (statusCode) {
      case 0:
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case 1:
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case 2:
        return "bg-green-500/10 text-green-400 border-green-500/20";
      case 3:
        return "bg-red-500/10 text-red-400 border-red-500/20";
      case 4:
        return "bg-blue-400/10 text-blue-400 border-blue-500/20";
      default:
        return "bg-gray-500/10 text-gray-400 border-gray-500/20";
    }
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
    if (isSelectSuccess) {
      toast.success("Influencer selected successfully!");
      refetchApplications();
    }

    if (isSelectError) {
      toast.error(
        `Failed to select influencer: ${
          selectError?.message || "Unknown error"
        }`
      );
    }
  }, [isSelectSuccess, isSelectError, selectError, refetchApplications]);

  useEffect(() => {
    if (isCompleteSuccess) {
      toast.success("Campaign completed and funds released successfully!");
      refetchApplications();
    }

    if (isCompleteError) {
      toast.error(
        `Failed to complete campaign: ${
          completeError?.message || "Unknown error"
        }`
      );
    }
  }, [isCompleteSuccess, isCompleteError, completeError, refetchApplications]);

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

  // Filter briefs based on search and filter criteria
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
        {/* Network Status - Show when connected but wrong network */}
        {isConnected && !isCorrectChain && (
          <div className="mb-6">
            <NetworkStatus className="bg-slate-800/60 border-amber-500/50" />
          </div>
        )}

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
                className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold px-4 py-2 rounded-lg hover:from-emerald-600 hover:to-emerald-700 transition-all duration-200 shadow-md shadow-emerald-500/20 flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                whileTap={{ scale: 0.95 }}
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
              value: totalBudget.toLocaleString(),
              label: "Total Budget (cUSD)",
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
              filteredBriefs.map((brief, index) => (
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
                          <span
                            className={`px-2.5 py-0.5 text-xs font-medium rounded-full border ${getStatusColor(
                              brief.status
                            )}`}
                          >
                            {getStatusString(brief.status)}
                          </span>
                        </div>
                        <p className="text-slate-400 text-xs sm:text-sm mb-2 line-clamp-2">
                          {brief.description}
                        </p>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>
                              {format(
                                new Date(brief.selectionDeadline * 1000),
                                "MMM d, yyyy"
                              )}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            <span>
                              {Math.max(
                                0,
                                Math.ceil(
                                  (new Date(
                                    brief.selectionDeadline * 1000
                                  ).getTime() -
                                    new Date().getTime()) /
                                    (1000 * 60 * 60 * 24)
                                )
                              )}{" "}
                              days left
                            </span>
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
                          {brief.budget.toLocaleString()} cUSD
                        </div>
                        <div className="text-xs text-slate-400">
                          0 spent (0%)
                        </div>
                        <div className="w-20 h-1.5 bg-slate-700/50 rounded-full mt-1.5 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-300"
                            style={{ width: "0%" }}
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <motion.button
                          onClick={() => {
                            setSelectedBrief(brief);
                            setShowApplicationsModal(true);
                          }}
                          className="relative px-3 py-1.5 bg-slate-700/50 hover:bg-slate-700 text-white rounded-lg border border-slate-600/50 hover:border-slate-500 transition-all text-xs font-medium"
                          whileTap={{ scale: 0.95 }}
                        >
                          Applications
                          {applications.length > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 bg-emerald-500 text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center font-bold shadow-sm">
                              {applications.length}
                            </span>
                          )}
                        </motion.button>
                        <motion.button
                          onClick={() => {
                            setSelectedBrief(brief);
                            setShowSubmissionsModal(true);
                          }}
                          className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 rounded-lg border border-emerald-500/30 hover:border-emerald-500/50 transition-all text-xs font-medium"
                          whileTap={{ scale: 0.95 }}
                        >
                          Submissions
                        </motion.button>
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
              ))
            )}
          </div>
        </motion.div>
      </div>

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
