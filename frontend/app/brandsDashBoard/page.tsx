"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { Brief } from "@/types/index";
// import { SubmissionsModal } from "@/components/modals/SubmissionsModal";
import { SubmissionsModal } from "@/components/modals/ SubmissionsModal";

import { ApplicationsModal } from "@/components/modals/ApplicationsModal";
import { CreateCampaignModal } from "@/components/modals/CreateCampaignModal";
import { useRouter } from "next/navigation";
import { Toaster, toast } from "react-hot-toast";
import {
  Users,
  Briefcase,
  DollarSign,
  BarChart2,
  Search,
  Plus,
  Calendar,
  Clock,
  CheckCircle,
  TrendingUp,
  Filter,
  MoreVertical,
  ArrowUpRight,
  Activity,
  Target,
} from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";

// Import custom hooks
import {
  useUserProfile,
  useBriefApplications,
  useCreateAdBrief,
  useCancelAdBrief,
  useSelectInfluencer,
  useCompleteCampaign,
  useGetBusinessBriefs,
} from "../../hooks/adsBazaar";

const BrandDashboard = () => {
  const router = useRouter();
  const { address } = useAccount();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showApplicationsModal, setShowApplicationsModal] = useState(false);
  const [showSubmissionsModal, setShowSubmissionsModal] = useState(false);
  const [selectedBrief, setSelectedBrief] = useState<Brief | null>(null);
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    budget: "",
    applicationDeadline: "",
    promotionDuration: "604800",
    maxInfluencers: "5",
    targetAudience: "0",
    verificationPeriod: "86400",
  });

  const {
    cancelBrief,
    isPending: isCancellingBrief,
    isSuccess: isCancelSuccess,
  } = useCancelAdBrief();

  const { userProfile, isLoadingProfile } = useUserProfile();
  const { briefs, isLoading, isError } = useGetBusinessBriefs(address);
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
    selectInfluencer,
    isPending: isSelectingInfluencer,
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

  // Create a map to store application counts for each brief
  const [applicationCounts, setApplicationCounts] = useState<{
    [key: string]: number;
  }>({});

  // Load application counts for all briefs
  useEffect(() => {
    if (briefs && briefs.length > 0) {
      briefs.forEach((brief) => {
        // This would need to be implemented to get application count for each brief
        // For now, using a placeholder - you'd need to add a hook or API call to get this data
        setApplicationCounts((prev) => ({
          ...prev,
          [brief.id]: Math.floor(Math.random() * 20), // Placeholder - replace with actual count
        }));
      });
    }
  }, [briefs]);

  const getStatusString = (statusCode) => {
    const statusMap = {
      0: "Active",
      1: "In Progress",
      2: "Completed",
      3: "Cancelled",
    };
    return statusMap[statusCode] || "Unknown";
  };

  const getStatusColor = (statusCode) => {
    const colorMap = {
      0: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      1: "bg-blue-500/10 text-blue-400 border-blue-500/20",
      2: "bg-green-500/10 text-green-400 border-green-500/20",
      3: "bg-red-500/10 text-red-400 border-red-500/20",
    };
    return (
      colorMap[statusCode] || "bg-gray-500/10 text-gray-400 border-gray-500/20"
    );
  };

  useEffect(() => {
    if (isCreateSuccess) {
      toast.success("Campaign created successfully!");
      setShowCreateModal(false);
      router.push("/brandsDashBoard");
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
  const filteredBriefs = briefs
    ? briefs.filter((brief) => {
        const matchesSearch = brief.title
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
        const matchesFilter =
          selectedFilter === "all" ||
          (selectedFilter === "active" &&
            (brief.status === 0 || brief.status === 1)) ||
          (selectedFilter === "completed" && brief.status === 2);
        return matchesSearch && matchesFilter;
      })
    : [];

  const isFormValid = () => {
    return (
      formData.name.trim() !== "" &&
      formData.description.trim() !== "" &&
      formData.budget.trim() !== "" &&
      formData.applicationDeadline.trim() !== ""
    );
  };

  const handleCreateCampaign = async () => {
    if (!isFormValid()) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const deadline = Math.floor(
        new Date(formData.applicationDeadline).getTime() / 1000
      );

      await createBrief(
        formData.name,
        formData.description,
        formData.budget,
        deadline,
        parseInt(formData.promotionDuration),
        parseInt(formData.maxInfluencers),
        parseInt(formData.targetAudience),
        parseInt(formData.verificationPeriod)
      );
    } catch (error) {
      console.error("Error creating campaign:", error);
      toast.error(
        `Failed to create campaign: ${error.message || "Unknown error"}`
      );
    }
  };

  const handleReleaseFunds = async (briefId) => {
    try {
      await completeCampaign(briefId);
    } catch (error) {
      console.error("Error releasing funds:", error);
      toast.error(
        `Failed to release funds: ${
          typeof error === "object" && error !== null && "message" in error
            ? (error as { message?: string }).message
            : "Unknown error"
        }`
      );
    }
  };

  if (!userProfile?.isRegistered || !userProfile?.isBusiness) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center mx-auto mb-6">
            <Briefcase className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">
            Business Account Required
          </h2>
          <p className="text-slate-400 mb-8 leading-relaxed">
            You need to register as a business to access the brand dashboard and
            create campaigns.
          </p>
          <Link href="/">
            <button className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all duration-200 shadow-lg shadow-emerald-500/25">
              Register as Business
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pt-28">
      <Toaster position="top-right" />

      <div className="px-4 sm:px-6 lg:px-8 pb-8">
        {/* Header Section */}
        <div className="mb-12">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-4xl lg:text-5xl font-bold text-white mb-3">
                Brand Dashboard
              </h1>
              <p className="text-xl text-slate-400">
                Manage your campaigns and track performance
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search campaigns..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full sm:w-80 pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500/50 focus:bg-slate-800/80 transition-all backdrop-blur-sm"
                />
              </div>

              {/* Filter */}
              <div className="relative">
                <select
                  value={selectedFilter}
                  onChange={(e) => setSelectedFilter(e.target.value)}
                  className="appearance-none bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500/50 cursor-pointer backdrop-blur-sm min-w-32"
                >
                  <option value="all">All Campaigns</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                </select>
                <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
              </div>

              {/* Create Campaign Button */}
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold px-6 py-3 rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all duration-200 shadow-lg shadow-emerald-500/25 flex items-center gap-2 group"
              >
                <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-200" />
                New Campaign
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 hover:bg-slate-800/60 transition-all duration-200 group">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-xl border border-blue-500/20">
                <Activity className="w-6 h-6 text-blue-400" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-white">
                {activeBriefs.length}
              </p>
              <p className="text-slate-400 font-medium">Active Campaigns</p>
            </div>
          </div>

          <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 hover:bg-slate-800/60 transition-all duration-200 group">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-xl border border-green-500/20">
                <CheckCircle className="w-6 h-6 text-green-400" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-white">
                {completedBriefs.length}
              </p>
              <p className="text-slate-400 font-medium">Completed Campaigns</p>
            </div>
          </div>

          <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 hover:bg-slate-800/60 transition-all duration-200 group">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 rounded-xl border border-emerald-500/20">
                <DollarSign className="w-6 h-6 text-emerald-400" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-white">
                {totalBudget.toLocaleString()}
              </p>
              <p className="text-slate-400 font-medium">Total Budget (cUSD)</p>
            </div>
          </div>

          <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 hover:bg-slate-800/60 transition-all duration-200 group">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-orange-500/20 to-orange-600/20 rounded-xl border border-orange-500/20">
                <Users className="w-6 h-6 text-orange-400" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-white">
                {totalInfluencers}
              </p>
              <p className="text-slate-400 font-medium">Active Influencers</p>
            </div>
          </div>
        </div>

        {/* Campaigns List */}
        <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-slate-700/50">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Your Campaigns</h2>
              <span className="text-slate-400">
                {filteredBriefs.length} campaigns
              </span>
            </div>
          </div>

          <div className="divide-y divide-slate-700/50">
            {isLoading ? (
              <div className="p-12 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mb-4"></div>
                <p className="text-slate-400">Loading campaigns...</p>
              </div>
            ) : filteredBriefs.length === 0 ? (
              <div className="p-12 text-center">
                <Briefcase className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">
                  No campaigns found
                </h3>
                <p className="text-slate-400 max-w-md mx-auto">
                  {searchTerm
                    ? "Try adjusting your search or filter criteria."
                    : "Create your first campaign to get started with influencer marketing."}
                </p>
              </div>
            ) : (
              filteredBriefs.map((brief) => (
                <div
                  key={brief.id}
                  className="p-6 hover:bg-slate-800/30 transition-all duration-200 group"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    {/* Campaign Info */}
                    <div className="flex-1">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-gradient-to-br from-slate-700 to-slate-800 rounded-xl border border-slate-600/50 group-hover:border-emerald-500/30 transition-colors">
                          <Target className="w-5 h-5 text-slate-300" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-white truncate">
                              {brief.title}
                            </h3>
                            <span
                              className={`px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(
                                brief.status
                              )}`}
                            >
                              {getStatusString(brief.status)}
                            </span>
                          </div>

                          <p className="text-slate-400 text-sm mb-3 line-clamp-2">
                            {brief.description}
                          </p>

                          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              <span>
                                {format(
                                  new Date(
                                    Number(brief.applicationDeadline) * 1000
                                  ),
                                  "MMM d, yyyy"
                                )}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              <span>
                                {Math.max(
                                  0,
                                  Math.ceil(
                                    (new Date(
                                      Number(brief.applicationDeadline) * 1000
                                    ).getTime() -
                                      new Date().getTime()) /
                                      (1000 * 60 * 60 * 24)
                                  )
                                )}{" "}
                                days left
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              <span>
                                {brief.selectedInfluencersCount}/
                                {Number(brief.maxInfluencers)} influencers
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Budget & Actions */}
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                      <div className="text-right">
                        <div className="text-2xl font-bold text-white mb-1">
                          {Number(brief.budget).toLocaleString()} cUSD
                        </div>
                        <div className="text-sm text-slate-400">
                          0 spent (0%)
                        </div>

                        {/* Progress Bar */}
                        <div className="w-24 h-2 bg-slate-700/50 rounded-full mt-2 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-300"
                            style={{ width: "0%" }}
                          />
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedBrief(brief);
                            setShowApplicationsModal(true);
                          }}
                          className="relative px-4 py-2 bg-slate-700/50 hover:bg-slate-700 text-white rounded-lg border border-slate-600/50 hover:border-slate-500 transition-all text-sm font-medium"
                        >
                          Applications
                          {applicationCounts[brief.id] > 0 && (
                            <span className="absolute -top-2 -right-2 bg-emerald-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold shadow-lg">
                              {applications.length}
                            </span>
                          )}
                        </button>
                        <button
                          onClick={() => {
                            setSelectedBrief(brief);
                            setShowSubmissionsModal(true);
                          }}
                          className="px-4 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 rounded-lg border border-emerald-500/30 hover:border-emerald-500/50 transition-all text-sm font-medium"
                        >
                          Submissions
                        </button>
                        <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
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
