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
  Star,
  DollarSign,
  ArrowRight,
  Eye,
  Zap,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { useGetAllBriefs, useUserProfile } from "@/hooks/adsBazaar";
import { useGetInfluencerApplications } from "@/hooks/useGetInfluncersApplication";
import ApplyModal from "@/components/modals/AdsApplicationModal";
import { NetworkStatus } from "@/components/NetworkStatus";
import { useAccount, usePublicClient } from "wagmi";
import { useEnsureNetwork } from "@/hooks/useEnsureNetwork";
import { format } from "date-fns";
import { truncateAddress } from "@/utils/format";
import { motion } from "framer-motion";
import {
  Brief,
  CampaignStatus,
  TargetAudience,
  CampaignPhase,
  AUDIENCE_LABELS,
  InfluencerApplication,
  DisputeStatus,
} from "@/types";
import {
  getStatusColor,
  getPhaseColor,
  formatTimeRemaining,
  isActionUrgent,
  getPhaseLabel,
} from "@/utils/campaignUtils";
import toast from "react-hot-toast";
import { Address } from "viem";
import { CONTRACT_ADDRESS } from "@/lib/contracts";
import ABI from "@/lib/AdsBazaar.json";
import { ApplicationStatus } from "@/types";

const statusMap = {
  0: "Open",
  1: "In Progress",
  2: "Completed",
  3: "Cancelled",
  4: "Expired",
};

export default function Marketplace() {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [categoryFilter, setCategoryFilter] =
    useState<string>("All Categories");
  const [budgetFilter, setBudgetFilter] = useState<string>("Budget: Any");
  const [statusFilter, setStatusFilter] = useState<string>("Active Only");
  const [showApplyModal, setShowApplyModal] = useState<boolean>(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Brief | null>(null);
  const [applicationMessage, setApplicationMessage] = useState<string>("");
  const [applicationStatus, setApplicationStatus] = useState<
    Record<string, "applied" | "assigned" | null>
  >({});
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);
  const [refreshCount, setRefreshCount] = useState(0);

  const { address, isConnected } = useAccount();
  const { isCorrectChain, currentNetwork } = useEnsureNetwork();
  const { userProfile, isLoadingProfile } = useUserProfile();

  const publicClient = usePublicClient();

  // State to track all applications for the current user
  const [applications, setApplications] = useState<{
    [briefId: string]: InfluencerApplication;
  }>({});
  const [applicationStatuses, setApplicationStatuses] = useState<
    ApplicationStatus[]
  >([]);

  const [userApplications, setUserApplications] = useState<{
    [briefId: string]: "applied" | "assigned" | null;
  }>({});

  // Fetch all campaigns
  const { briefs: allBriefs, isLoading } = useGetAllBriefs();

  // Filter campaigns based on status filter
  const activeBriefs = allBriefs.filter((brief) => {
    if (statusFilter === "Active Only") {
      return (
        brief.status === CampaignStatus.OPEN ||
        brief.status === CampaignStatus.ASSIGNED
      );
    }
    return true; // Show all if "All Campaigns" is selected
  });

  const {
    applications: influencerApplications = [],
    isLoading: isLoadingApplications,
    error: applicationsError,
  } = useGetInfluencerApplications(address as `0x${string}`);

  const computeApplicationStatus = (
    application: InfluencerApplication,
    briefData: any[]
  ) => {
    const currentTime = Math.floor(Date.now() / 1000);
    const promotionEndTime = Number(briefData[9]); // from contract
    const proofSubmissionDeadline = Number(briefData[10]);

    let status: ApplicationStatus["status"] = "applied";
    let nextAction = "";
    let canSubmitProof = false;
    let canClaim = false;

    if (application.hasClaimed) {
      status = "paid";
      nextAction = "Payment received";
    } else if (application.isApproved) {
      status = "approved";
      nextAction = "Ready to claim payment";
      canClaim = true;
    } else if (application.proofLink) {
      status = "proof_submitted";
      nextAction = "Awaiting approval";
    } else if (application.isSelected) {
      status = "selected";
      if (
        currentTime >= promotionEndTime &&
        currentTime <= proofSubmissionDeadline
      ) {
        nextAction = "Submit proof of work";
        canSubmitProof = true;
      } else if (currentTime < promotionEndTime) {
        nextAction = "Campaign in progress";
      } else {
        nextAction = "Proof submission deadline passed";
      }
    } else {
      status = "applied";
      nextAction = "Awaiting selection";
    }

    return { status, nextAction, canSubmitProof, canClaim };
  };

  // Function to refresh application status
  const refreshApplicationStatus = useCallback(
    async (influencerAddress?: string) => {
      const targetAddress = influencerAddress || address;

      if (!publicClient || !targetAddress) {
        console.warn("Cannot refresh: missing client or address");
        return;
      }

      setIsRefreshing(true);

      try {
        console.log(`Refreshing application status for ${targetAddress}...`);

        // Step 1: Get all brief IDs this influencer has applied to
        const appliedBriefIds = (await publicClient.readContract({
          address: CONTRACT_ADDRESS,
          abi: ABI.abi,
          functionName: "getInfluencerApplications",
          args: [targetAddress as Address],
        })) as string[];

        if (!appliedBriefIds || appliedBriefIds.length === 0) {
          console.log("No applications found for this influencer");
          setUserApplications({});
          setApplicationStatuses([]);
          return;
        }

        console.log(`Found ${appliedBriefIds.length} applied campaigns`);

        // Step 2: Fetch current application data for each brief
        const updatedApplications: {
          [briefId: string]: "applied" | "assigned";
        } = {};
        const statusesData: ApplicationStatus[] = [];

        for (const briefId of appliedBriefIds) {
          try {
            // Get application details
            const applicationData = (await publicClient.readContract({
              address: CONTRACT_ADDRESS,
              abi: ABI.abi,
              functionName: "getBriefApplications",
              args: [briefId],
            })) as {
              influencers: string[];
              messages: string[];
              timestamps: bigint[];
              isSelected: boolean[];
              hasClaimed: boolean[];
              proofLinks: string[];
              isApproved: boolean[];
            };

            if (applicationData?.influencers) {
              // Find this influencer's application
              const influencerIndex = applicationData.influencers.findIndex(
                (addr: string) =>
                  addr.toLowerCase() === targetAddress.toLowerCase()
              );

              if (influencerIndex !== -1) {
                const isSelected = applicationData.isSelected[influencerIndex];
                updatedApplications[briefId] = isSelected ? "assigned" : "applied";

                console.log(
                  `Updated application for campaign ${briefId}: ${updatedApplications[briefId]}`
                );
              }
            }
          } catch (error) {
            console.error(
              `Error fetching application for brief ${briefId}:`,
              error
            );
          }
        }

        // Step 3: Update state with fresh data
        setUserApplications(updatedApplications);

        console.log(
          `Refresh complete: ${
            Object.keys(updatedApplications).length
          } applications updated`
        );
      } catch (error) {
        console.error("Error refreshing application status:", error);
      } finally {
        setIsRefreshing(false);
      }
    },
    [publicClient, address]
  );

  useEffect(() => {
    refreshApplicationStatus();
  }, [refreshApplicationStatus]);

  // Auto-refresh every 30 seconds when connected
  useEffect(() => {
    if (!isConnected || !userProfile?.isInfluencer) return;

    const interval = setInterval(() => {
      if (!isRefreshing) {
        refreshApplicationStatus();
      }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [
    isConnected,
    userProfile?.isInfluencer,
    isRefreshing,
    refreshApplicationStatus,
  ]);

  // Refresh when wallet connects
  useEffect(() => {
    if (isConnected && userProfile?.isInfluencer) {
      refreshApplicationStatus();
    }
  }, [isConnected, userProfile?.isInfluencer]);


  const handleApplicationSuccess = useCallback(() => {
    // Immediately refresh the application status after successful application
    setTimeout(() => {
      refreshApplicationStatus();
    }, 1000); // Small delay to allow blockchain state to update
  }, [refreshApplicationStatus]);

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
  const getButtonState = (campaign: Brief) => {
    const status = userApplications[campaign.id]; 
    const { statusInfo, timingInfo } = campaign;

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
        text: "Connect Wallet",
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
        text: "Business Account",
        disabled: true,
        onClick: () => {},
        variant: "disabled",
      };
    }

    if (!statusInfo.canApply) {
      return {
        text: timingInfo.hasExpired
          ? "Deadline Passed"
          : statusMap[campaign.status],
        disabled: true,
        onClick: () => {},
        variant: "closed",
      };
    }

    return {
      text: timingInfo.isUrgent ? "Apply Now - Urgent!" : "Apply Now",
      disabled: false,
      onClick: () => {
        setSelectedCampaign(campaign);
        setShowApplyModal(true);
      },
      variant: timingInfo.isUrgent ? "urgent" : "apply",
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
      campaign.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      campaign.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      campaign.requirements.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      categoryFilter === "All Categories" ||
      AUDIENCE_LABELS[campaign.targetAudience] === categoryFilter;
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
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-emerald-400">
                    {
                      Object.values(userApplications).filter(
                        (s) => s === "applied"
                      ).length
                    }
                  </div>
                  <div className="text-xs">Applied</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-400">
                    {
                      Object.values(userApplications).filter(
                        (s) => s === "assigned"
                      ).length
                    }
                  </div>
                  <div className="text-xs">Assigned</div>
                </div>
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
                {Object.entries(AUDIENCE_LABELS).map(([value, label]) => (
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
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full lg:w-48 pl-4 pr-8 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all duration-200"
              >
                <option>Active Only</option>
                <option>All Campaigns</option>
              </select>
            </div>
          </div>
        </div>

        {/* Enhanced Campaign Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredCampaigns.map((campaign) => {
            const category =
              AUDIENCE_LABELS[campaign.targetAudience] || "Other";
            const buttonState = getButtonState(campaign);
            const userApplicationStatus = applicationStatus[campaign.id];

            return (
              <motion.div
                key={campaign.id}
                className="bg-slate-800/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -5 }}
              >
                {/* Enhanced Header with Status Indicators */}
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

                      {/* Phase indicator */}
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getPhaseColor(
                          campaign.timingInfo.phase
                        )}`}
                      >
                        {getPhaseLabel(campaign.timingInfo.phase)}
                      </span>

                      {/* New badge */}
                      {campaign.timingInfo.isNew && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          <TrendingUp className="w-3 h-3 mr-1" />
                          New
                        </span>
                      )}

                      {/* Urgent badge */}
                      {campaign.timingInfo.isUrgent && (
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
                          {userApplicationStatus === "assigned" ? (
                            <>
                              <Star className="w-3 h-3 mr-1" />
                              Assigned
                            </>
                          ) : (
                            <>
                              <Check className="w-3 h-3 mr-1" />
                              Applied
                            </>
                          )}
                        </span>
                      )}
                    </div>

                    <span className="inline-flex items-center px-4 py-1 rounded-full text-sm font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <DollarSign className="w-4 h-4 mr-1" />
                      {campaign.budget.toLocaleString()}
                    </span>
                  </div>

                  <h3 className="text-lg font-semibold text-white mt-3 line-clamp-2">
                    {campaign.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    by {truncateAddress(campaign.business)}
                  </p>

                  {/* Creation date and timing info */}
                  <div className="flex items-center justify-between mt-2 text-xs text-slate-500">
                    <span>
                      Created{" "}
                      {format(new Date(campaign.creationTime * 1000), "MMM d")}
                    </span>
                    {campaign.timingInfo.currentDeadline &&
                      campaign.timingInfo.timeRemaining && (
                        <span
                          className={
                            campaign.timingInfo.isUrgent
                              ? "text-orange-400"
                              : ""
                          }
                        >
                          {formatTimeRemaining(
                            campaign.timingInfo.timeRemaining
                          )}{" "}
                          left
                        </span>
                      )}
                  </div>
                </div>

                {/* Campaign details */}
                <div className="p-5">
                  <p className="text-sm text-slate-300 mb-4 line-clamp-3">
                    {campaign.description}
                  </p>

                  {/* Status and next action */}
                  {campaign.statusInfo.nextAction && (
                    <div className="mb-4 p-3 bg-slate-900/50 rounded-lg border border-slate-700/50">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                        <span className="text-sm text-slate-300">
                          {campaign.statusInfo.nextAction}
                        </span>
                      </div>
                      {campaign.statusInfo.warning && (
                        <div className="flex items-center gap-2 mt-2">
                          <AlertTriangle className="w-3 h-3 text-orange-400" />
                          <span className="text-xs text-orange-400">
                            {campaign.statusInfo.warning}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

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
                      </div>
                      <div className="w-full bg-slate-700/50 rounded-full h-1.5 mt-1">
                        <div
                          className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-1.5 rounded-full transition-all duration-300"
                          style={{
                            width: `${campaign.progressInfo.spotsFilledPercentage}%`,
                          }}
                        />
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
                        {campaign.progressInfo.budgetPerSpot.toFixed(0)} cUSD
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
                    {!buttonState.disabled && !buttonState.icon && (
                      <ArrowRight className="w-4 h-4 ml-1" />
                    )}
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
                No campaigns found
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
                  title: selectedCampaign.name,
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
