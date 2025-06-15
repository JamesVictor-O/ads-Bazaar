"use client";
import { useState, useEffect, useCallback } from "react";
import {
  Search,
  Target,
  Calendar,
  Users,
  Clock,
  Award,
  Check,
  UserCheck,
  AlertTriangle,
  Loader2,
  Wifi,
  WifiOff,
  XCircle,
  CheckCircle,
  Timer,
  TrendingUp,
} from "lucide-react";
import { useGetAllBriefs, useUserProfile } from "@/hooks/adsBazaar";
import { useGetInfluencerApplications } from "@/hooks/useGetInfluncersApplication";
import ApplyModal from "@/components/modals/AdsApplicationModal";
import { NetworkStatus } from "@/components/NetworkStatus";
import { useAccount } from "wagmi";
import { useEnsureNetwork } from "@/hooks/useEnsureNetwork";
import {
  formatDistanceToNow,
  format,
  isAfter,
  isBefore,
  addDays,
} from "date-fns";
import { truncateAddress } from "@/utils/format";
import { motion } from "framer-motion";

const statusMap = {
  0: "Open",
  1: "In Progress",
  2: "Completed",
  3: "Cancelled",
  4: "Expired",
};

const audienceMap = {
  0: "General",
  1: "Fashion",
  2: "Tech",
  3: "Gaming",
  4: "Fitness",
  5: "Beauty",
  6: "Food",
  7: "Travel",
  8: "Business",
  9: "Education",
  10: "Entertainment",
  11: "Sports",
  12: "Lifestyle",
  13: "Other",
};

interface Campaign {
  id: `0x${string}`;
  business: `0x${string}`;
  title: string;
  description: string;
  requirements: string;
  budget: number;
  status: number;
  promotionDuration: number;
  promotionStartTime: number;
  promotionEndTime: number;
  proofSubmissionDeadline: number;
  verificationDeadline: number;
  maxInfluencers: number;
  selectedInfluencersCount: number;
  targetAudience: number;
  creationTime: number;
  selectionDeadline: number;
  applicationCount: number;
}

export default function Marketplace() {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [categoryFilter, setCategoryFilter] =
    useState<string>("All Categories");
  const [budgetFilter, setBudgetFilter] = useState<string>("Budget: Any");
  const [showApplyModal, setShowApplyModal] = useState<boolean>(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(
    null
  );
  const [applicationMessage, setApplicationMessage] = useState<string>("");
  const [applicationStatus, setApplicationStatus] = useState<
    Record<string, "applied" | "assigned" | null>
  >({});
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const { address, isConnected } = useAccount();
  const { isCorrectChain, currentNetwork } = useEnsureNetwork();
  const { userProfile, isLoadingProfile } = useUserProfile();

  // Fetch all campaigns and filter out cancelled/expired ones
  const { briefs: allBriefs, isLoading } = useGetAllBriefs();

  // Filter out cancelled (3) and expired (4) campaigns
  const activeBriefs = allBriefs.filter(
    (brief) => brief.status !== 3 && brief.status !== 4
  );

  const {
    applications: influencerApplications = [],
    isLoading: isLoadingApplications,
    error: applicationsError,
  } = useGetInfluencerApplications(address as `0x${string}`);

  // Function to refresh application status
  const refreshApplicationStatus = useCallback(() => {
    if (!isLoadingApplications && influencerApplications) {
      setIsRefreshing(true);
      const statusMap: Record<string, "applied" | "assigned" | null> = {};
      influencerApplications.forEach((app) => {
        statusMap[app.briefId] = app.isSelected ? "assigned" : "applied";
      });
      setApplicationStatus(statusMap);
      setTimeout(() => setIsRefreshing(false), 500);
    }
  }, [influencerApplications, isLoadingApplications]);

  useEffect(() => {
    refreshApplicationStatus();
  }, [refreshApplicationStatus]);

  useEffect(() => {
    if (!showApplyModal) {
      const interval = setInterval(() => {
        refreshApplicationStatus();
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [showApplyModal, refreshApplicationStatus]);

  const handleApplicationSuccess = useCallback(() => {
    setTimeout(() => {
      refreshApplicationStatus();
    }, 2000);
  }, [refreshApplicationStatus]);

  // Enhanced campaign status logic
  const getCampaignStatus = (campaign: Campaign) => {
    const now = new Date();
    const selectionDeadline = new Date(campaign.selectionDeadline * 1000);
    const creationDate = new Date(campaign.creationTime * 1000);

    // Check if campaign is new (created within last 24 hours)
    const isNew =
      isAfter(now, creationDate) && isBefore(now, addDays(creationDate, 1));

    // Check if deadline is approaching (within 24 hours)
    const isUrgent =
      isAfter(now, addDays(selectionDeadline, -1)) &&
      isBefore(now, selectionDeadline);

    return {
      isNew,
      isUrgent,
      isActive: campaign.status === 0,
      isInProgress: campaign.status === 1,
      isCompleted: campaign.status === 2,
      deadlinePassed: isAfter(now, selectionDeadline),
      daysRemaining: Math.max(
        0,
        Math.ceil(
          (selectionDeadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        )
      ),
      hoursRemaining: Math.max(
        0,
        Math.ceil(
          (selectionDeadline.getTime() - now.getTime()) / (1000 * 60 * 60)
        )
      ),
    };
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-slate-900">
        <div className="text-center">
          <svg
            className="animate-spin h-12 w-12 text-emerald-500 mx-auto"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8h8a8 8 0 01-16 0z"
            />
          </svg>
          <p className="mt-4 text-slate-400">Loading campaigns...</p>
        </div>
      </div>
    );
  }

  // Enhanced button state logic
  const getButtonState = (campaign: Campaign) => {
    const status = applicationStatus[campaign.id];
    const campaignStatus = getCampaignStatus(campaign);

    if (status === "applied") {
      return {
        text: "Applied",
        disabled: true,
        onClick: () => {},
        variant: "applied",
        icon: <Check className="w-4 h-4 mr-1" />,
      };
    }
    if (status === "assigned") {
      return {
        text: "Assigned",
        disabled: true,
        onClick: () => {},
        variant: "assigned",
        icon: <UserCheck className="w-4 h-4 mr-1" />,
      };
    }

    if (!isConnected) {
      return {
        text: "Connect Wallet to Apply",
        disabled: true,
        onClick: () => {},
        variant: "disabled",
        icon: <AlertTriangle className="w-4 h-4 mr-1" />,
      };
    }
    if (!isCorrectChain) {
      return {
        text: `Switch to ${currentNetwork.name}`,
        disabled: true,
        onClick: () => {},
        variant: "network",
        icon: <AlertTriangle className="w-4 h-4 mr-1" />,
      };
    }
    if (isLoadingProfile) {
      return {
        text: "Loading...",
        disabled: true,
        onClick: () => {},
        variant: "loading",
        icon: <Loader2 className="w-4 h-4 mr-1 animate-spin" />,
      };
    }
    if (!userProfile?.isRegistered) {
      return {
        text: "Register as Influencer",
        disabled: false,
        onClick: () => (window.location.href = "/"),
        variant: "register",
      };
    }
    if (userProfile.isBusiness) {
      if (campaign.business.toLowerCase() === address?.toLowerCase()) {
        return {
          text: "Your Campaign",
          disabled: true,
          onClick: () => {},
          variant: "own",
        };
      }
      return {
        text: "Use Influencer Account",
        disabled: true,
        onClick: () => {},
        variant: "disabled",
      };
    }

    if (!campaignStatus.isActive || campaignStatus.deadlinePassed) {
      return {
        text: campaignStatus.deadlinePassed
          ? "Deadline Passed"
          : statusMap[campaign.status],
        disabled: true,
        onClick: () => {},
        variant: "closed",
      };
    }

    return {
      text: campaignStatus.isUrgent ? "Apply Now - Urgent!" : "Apply Now",
      disabled: false,
      onClick: () => {
        setSelectedCampaign(campaign);
        setShowApplyModal(true);
      },
      variant: campaignStatus.isUrgent ? "urgent" : "apply",
    };
  };

  // Enhanced button styling
  const getButtonStyles = (variant: string, disabled: boolean) => {
    const baseStyles =
      "w-full py-3 px-4 rounded-xl text-sm font-medium flex items-center justify-center transition-all duration-200 shadow-md";

    switch (variant) {
      case "apply":
        return `${baseStyles} bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700 shadow-emerald-500/25`;
      case "urgent":
        return `${baseStyles} bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600 shadow-orange-500/25 animate-pulse`;
      case "applied":
        return `${baseStyles} bg-blue-500/10 text-blue-400 border border-blue-500/20 cursor-not-allowed`;
      case "assigned":
        return `${baseStyles} bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 cursor-not-allowed`;
      case "register":
        return `${baseStyles} bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700 shadow-purple-500/25`;
      case "network":
        return `${baseStyles} bg-amber-500/10 text-amber-400 border border-amber-500/20 cursor-not-allowed`;
      case "loading":
        return `${baseStyles} bg-slate-600/50 text-slate-400 cursor-not-allowed`;
      default:
        return `${baseStyles} bg-slate-500/10 text-slate-400 border border-slate-500/20 cursor-not-allowed`;
    }
  };

  // Enhanced filtering logic
  const filteredCampaigns = activeBriefs.filter((campaign) => {
    const budget = campaign.budget;
    const matchesSearch =
      campaign.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      campaign.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      campaign.requirements.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      categoryFilter === "All Categories" ||
      audienceMap[campaign.targetAudience] === categoryFilter;
    const matchesBudget =
      budgetFilter === "Budget: Any" ||
      (budgetFilter === "Under 500 cUSD" && budget < 500) ||
      (budgetFilter === "500-1000 cUSD" && budget >= 500 && budget <= 1000) ||
      (budgetFilter === "1000-2000 cUSD" && budget > 1000 && budget <= 2000) ||
      (budgetFilter === "2000+ cUSD" && budget > 2000);
    return matchesSearch && matchesCategory && matchesBudget;
  });

  // Enhanced category color logic
  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Tech":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "Fashion":
        return "bg-purple-500/10 text-purple-400 border-purple-500/20";
      case "Food":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "Fitness":
        return "bg-red-500/10 text-red-400 border-red-500/20";
      case "Travel":
        return "bg-green-500/10 text-green-400 border-green-500/20";
      case "Gaming":
        return "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";
      case "Beauty":
        return "bg-pink-500/10 text-pink-400 border-pink-500/20";
      case "Business":
        return "bg-slate-500/10 text-slate-400 border-slate-500/20";
      case "Education":
        return "bg-cyan-500/10 text-cyan-400 border-cyan-500/20";
      case "Entertainment":
        return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
      case "Sports":
        return "bg-orange-500/10 text-orange-400 border-orange-500/20";
      case "Lifestyle":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      default:
        return "bg-slate-500/10 text-slate-400 border-slate-500/20";
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-900 pt-10 md:pt-28">
      <div className="p-6 lg:p-8">
        {/* Network Status */}
        {isConnected && !isCorrectChain && (
          <div className="mb-6">
            <NetworkStatus className="bg-slate-800/60 border-amber-500/50" />
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-3xl font-bold text-white">
                Campaign Marketplace
              </h2>
              <p className="text-sm text-slate-400 mt-2">
                Discover active campaigns that match your influencer profile
                {isRefreshing && (
                  <span className="ml-2 inline-flex items-center text-emerald-400">
                    <Loader2 className="w-3 h-3 animate-spin mr-1" />
                    Refreshing...
                  </span>
                )}
              </p>
            </div>

            {/* Quick Stats */}
            {isConnected && userProfile?.isInfluencer && (
              <div className="text-right text-sm text-slate-400">
                <div>
                  Applied:{" "}
                  {
                    Object.values(applicationStatus).filter(
                      (s) => s === "applied"
                    ).length
                  }
                </div>
                <div>
                  Assigned:{" "}
                  {
                    Object.values(applicationStatus).filter(
                      (s) => s === "assigned"
                    ).length
                  }
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-slate-800/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 mb-8 shadow-lg shadow-emerald-500/10">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-grow">
              <div className="relative">
                <Search
                  size={18}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all duration-200"
                  placeholder="Search campaigns..."
                />
              </div>
            </div>
            <div className="flex flex-col lg:flex-row gap-4">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full lg:w-48 pl-4 pr-8 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all duration-200"
              >
                <option>All Categories</option>
                {Object.entries(audienceMap).map(([value, label]) => (
                  <option key={value} value={label}>
                    {label}
                  </option>
                ))}
              </select>
              <select
                value={budgetFilter}
                onChange={(e) => setBudgetFilter(e.target.value)}
                className="w-full lg:w-48 pl-4 pr-8 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all duration-200"
              >
                <option>Budget: Any</option>
                <option>Under 500 cUSD</option>
                <option>500-1000 cUSD</option>
                <option>1000-2000 cUSD</option>
                <option>2000+ cUSD</option>
              </select>
            </div>
          </div>
        </div>

        {/* Enhanced Campaign Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredCampaigns.map((campaign) => {
            const category = audienceMap[campaign.targetAudience] || "Other";
            const status = statusMap[campaign.status] || "Unknown";
            const buttonState = getButtonState(campaign);
            const campaignStatus = getCampaignStatus(campaign);
            const userApplicationStatus = applicationStatus[campaign.id];

            return (
              <motion.div
                key={campaign.id}
                className="bg-slate-800/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -5 }}
              >
                {/* Enhanced Header */}
                <div className="p-5 border-b border-slate-700/50">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getCategoryColor(
                          category
                        )}`}
                      >
                        {category}
                      </span>

                      {/* New badge */}
                      {campaignStatus.isNew && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          <TrendingUp className="w-3 h-3 mr-1" />
                          New
                        </span>
                      )}

                      {/* Urgent badge */}
                      {campaignStatus.isUrgent && campaignStatus.isActive && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-500/20 text-orange-400 border border-orange-500/30 animate-pulse">
                          <Timer className="w-3 h-3 mr-1" />
                          Urgent
                        </span>
                      )}

                      {/* User status badge */}
                      {userApplicationStatus && (
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${
                            userApplicationStatus === "assigned"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                          }`}
                        >
                          {userApplicationStatus === "assigned"
                            ? "Assigned"
                            : "Applied"}
                        </span>
                      )}
                    </div>

                    <span className="inline-flex items-center px-4 py-1 rounded-full text-sm font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {campaign.budget.toLocaleString()} cUSD
                    </span>
                  </div>

                  <h3 className="text-lg font-semibold text-white mt-3 line-clamp-2">
                    {campaign.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    by {truncateAddress(campaign.business)}
                  </p>

                  {/* Creation date */}
                  <p className="text-xs text-slate-500 mt-1">
                    Created{" "}
                    {format(
                      new Date(campaign.creationTime * 1000),
                      "MMM d, yyyy"
                    )}
                  </p>
                </div>

                {/* Campaign details */}
                <div className="p-5">
                  <p className="text-sm text-slate-300 mb-4 line-clamp-3">
                    {campaign.description}
                  </p>
                  <p className="text-sm text-slate-400 mb-4 line-clamp-3">
                    <strong>Requirements:</strong> {campaign.requirements}
                  </p>

                  {/* Enhanced status and deadline */}
                  <div className="flex items-center justify-between mb-4">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        campaignStatus.isActive &&
                        !campaignStatus.deadlinePassed
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : campaignStatus.isInProgress
                          ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                          : campaignStatus.isCompleted
                          ? "bg-green-500/10 text-green-400 border-green-500/20"
                          : "bg-slate-500/10 text-slate-400 border-slate-500/20"
                      } border`}
                    >
                      {campaignStatus.isActive &&
                      !campaignStatus.deadlinePassed ? (
                        <>
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Open
                        </>
                      ) : (
                        status
                      )}
                    </span>

                    <div className="flex items-center text-xs text-slate-400">
                      <Clock className="w-4 h-4 mr-1" />
                      {campaignStatus.deadlinePassed ? (
                        <span className="text-red-400">
                          Closed{" "}
                          {formatDistanceToNow(
                            new Date(campaign.selectionDeadline * 1000),
                            { addSuffix: true }
                          )}
                        </span>
                      ) : campaignStatus.daysRemaining > 0 ? (
                        <span
                          className={
                            campaignStatus.isUrgent ? "text-orange-400" : ""
                          }
                        >
                          {campaignStatus.daysRemaining} day
                          {campaignStatus.daysRemaining !== 1 ? "s" : ""} left
                        </span>
                      ) : (
                        <span className="text-orange-400">
                          {campaignStatus.hoursRemaining} hour
                          {campaignStatus.hoursRemaining !== 1 ? "s" : ""} left
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Enhanced stats grid */}
                  <div className="grid grid-cols-2 gap-3 text-xs mb-4">
                    <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-700/50">
                      <div className="flex items-center text-slate-400 mb-1">
                        <Users className="w-4 h-4 mr-1" />
                        <span>Spots</span>
                      </div>
                      <div className="font-semibold text-white">
                        {campaign.selectedInfluencersCount}/
                        {campaign.maxInfluencers}
                        <span className="text-slate-400 ml-1">
                          (
                          {campaign.maxInfluencers -
                            campaign.selectedInfluencersCount}{" "}
                          left)
                        </span>
                      </div>
                    </div>
                    <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-700/50">
                      <div className="flex items-center text-slate-400 mb-1">
                        <Award className="w-4 h-4 mr-1" />
                        <span>Applications</span>
                      </div>
                      <div className="font-semibold text-white">
                        {campaign.applicationCount}
                      </div>
                    </div>
                    <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-700/50">
                      <div className="flex items-center text-slate-400 mb-1">
                        <Calendar className="w-4 h-4 mr-1" />
                        <span>Duration</span>
                      </div>
                      <div className="font-semibold text-white">
                        {Math.ceil(campaign.promotionDuration / 86400)} days
                      </div>
                    </div>
                    <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-700/50">
                      <div className="flex items-center text-slate-400 mb-1">
                        <Target className="w-4 h-4 mr-1" />
                        <span>Pay/Spot</span>
                      </div>
                      <div className="font-semibold text-white">
                        {(campaign.budget / campaign.maxInfluencers).toFixed(0)}{" "}
                        cUSD
                      </div>
                    </div>
                  </div>

                  {/* Apply button */}
                  <button
                    onClick={buttonState.onClick}
                    className={getButtonStyles(
                      buttonState.variant,
                      buttonState.disabled
                    )}
                    disabled={buttonState.disabled}
                  >
                    {buttonState.icon && buttonState.icon}
                    {buttonState.text}
                  </button>
                </div>
              </motion.div>
            );
          })}

          {filteredCampaigns.length === 0 && (
            <div className="col-span-full py-12 text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-slate-700/50 flex items-center justify-center mb-4">
                <Search className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-medium text-white">
                No active campaigns found
              </h3>
              <p className="text-sm text-slate-400 mt-2">
                Try adjusting your search or filter criteria
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Apply Modal */}
      {userProfile?.isRegistered && userProfile.isInfluencer && (
        <ApplyModal
          showApplyModal={showApplyModal}
          setShowApplyModal={(show) => {
            setShowApplyModal(show);
            if (!show) {
              setTimeout(() => {
                refreshApplicationStatus();
              }, 1000);
            }
          }}
          selectedBrief={
            selectedCampaign
              ? {
                  id: selectedCampaign.id,
                  title: selectedCampaign.title,
                  description: selectedCampaign.description,
                  business: selectedCampaign.business,
                  budget: selectedCampaign.budget,
                  requirements:
                    selectedCampaign.requirements || "No specific requirements",
                }
              : null
          }
          applicationMessage={applicationMessage}
          setApplicationMessage={setApplicationMessage}
        />
      )}
    </div>
  );
}
