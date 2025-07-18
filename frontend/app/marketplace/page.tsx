"use client";
import { useState, useEffect, useCallback } from "react";
import {
  Search,
  Target,
  Calendar,
  Users,
  Award,
  Check,
  UserCheck,
  AlertTriangle,
  Loader2,
  Timer,
  TrendingUp,
  Star,
  DollarSign,
  ArrowRight,
  ChevronDown,
  FileText,
   SlidersHorizontal
} from "lucide-react";
import { useGetAllBriefs, useUserProfile } from "@/hooks/adsBazaar";
import ApplyModal from "@/components/modals/AdsApplicationModal";
import { NetworkStatus } from "@/components/NetworkStatus";
import { useAccount, usePublicClient } from "wagmi";
import { useEnsureNetwork } from "@/hooks/useEnsureNetwork";
import { format } from "date-fns";
import { truncateAddress, formatCurrency } from "@/utils/format";
import { UserDisplay } from "@/components/ui/UserDisplay";
import { motion } from "framer-motion";
import {
  Brief,
  CampaignStatus,
  AUDIENCE_LABELS,
  InfluencerApplication,
} from "@/types";
import {
  getPhaseColor,
  formatTimeRemaining,
  getPhaseLabel,
} from "@/utils/campaignUtils";
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
  const [applicationStatus] = useState<
    Record<string, "applied" | "assigned" | null>
  >({});
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // New state for expandable descriptions
  const [expandedDescriptions, setExpandedDescriptions] = useState<Set<string>>(
    new Set()
  );

  const { address, isConnected } = useAccount();
  const { isCorrectChain, currentNetwork } = useEnsureNetwork();
  const { userProfile, isLoadingProfile } = useUserProfile();
  const [showFilters, setShowFilters] = useState(false);

  const publicClient = usePublicClient();

  // State to track all applications for the current user
  const [] = useState<{
    [briefId: string]: InfluencerApplication;
  }>({});
  const [, setApplicationStatuses] = useState<ApplicationStatus[]>([]);

  const [userApplications, setUserApplications] = useState<{
    [briefId: string]: "applied" | "assigned" | null;
  }>({});

  // Fetch all campaigns
  const { briefs: allBriefs, isLoading } = useGetAllBriefs();

  // Filter campaigns based on status filter
  const activeBriefs = allBriefs.filter((brief) => {
    if (statusFilter === "Active Only") {
      // Only show OPEN campaigns that accept applications
      return brief.status === CampaignStatus.OPEN;
    }
    return true; // Show all if "All Campaigns" is selected
  });

  // Function to toggle description expansion
  const toggleDescription = (campaignId: string) => {
    setExpandedDescriptions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(campaignId)) {
        newSet.delete(campaignId);
      } else {
        newSet.add(campaignId);
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
          
          setUserApplications({});
          setApplicationStatuses([]);
          return;
        }



        // Step 2: Fetch current application data for each brief
        const updatedApplications: {
          [briefId: string]: "applied" | "assigned";
        } = {};

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
                updatedApplications[briefId] = isSelected
                  ? "assigned"
                  : "applied";

               
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
      } catch (error) {
        console.error("Error refreshing application status:", error);
      } finally {
        setIsRefreshing(false);
      }
    },
    [publicClient, address]
  );

  useEffect(() => {
    if (address && publicClient) {
      refreshApplicationStatus();
    }
  }, [address, publicClient]);

  // Auto-refresh every 30 seconds when connected
  useEffect(() => {
    if (!isConnected || !userProfile?.isInfluencer) return;

    const interval = setInterval(() => {
      if (!isRefreshing && address && publicClient) {
        refreshApplicationStatus();
      }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [
    isConnected,
    userProfile?.isInfluencer,
    isRefreshing,
    address,
    publicClient,
  ]);

  // Refresh when wallet connects
  useEffect(() => {
    if (isConnected && userProfile?.isInfluencer && address && publicClient) {
      refreshApplicationStatus();
    }
  }, [isConnected, userProfile?.isInfluencer, address, publicClient]);

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

    // For influencers who have already applied
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

    // Connection and network checks
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

    // Registration check
    if (!userProfile?.isRegistered) {
      return {
        text: "Register as Influencer",
        disabled: false,
        onClick: () => (window.location.href = "/"),
        variant: "register",
      };
    }

    // Business users
    if (userProfile.isBusiness) {
      if (campaign.business.toLowerCase() === address?.toLowerCase()) {
        // Campaign owner viewing their own campaign
        return {
          text: "Your Campaign",
          disabled: true,
          onClick: () => {},
          variant: "own",
        };
      }
      // Other business users - show appropriate status
      return {
        text: "Business Account",
        disabled: true,
        onClick: () => {},
        variant: "disabled",
      };
    }

    // Campaign status checks for influencers
    if (!statusInfo.canApply) {
      // Detailed status messages based on campaign phase and status
      let displayText = "Not Available";
      let variant = "closed";
      
      switch (campaign.status) {
        case CampaignStatus.COMPLETED:
          displayText = "Campaign Completed";
          break;
        case CampaignStatus.CANCELLED:
          displayText = "Campaign Cancelled";
          break;
        case CampaignStatus.EXPIRED:
          displayText = "Campaign Expired";
          break;
        case CampaignStatus.ASSIGNED:
          if (timingInfo.hasExpired) {
            displayText = "Campaign Finished";
          } else {
            displayText = "Influencers Selected";
          }
          break;
        case CampaignStatus.OPEN:
          // Campaign is open but can't apply - check why
          if (campaign.progressInfo.isFullyBooked) {
            displayText = "Campaign Full";
          } else if (timingInfo.hasExpired) {
            displayText = "Application Deadline Passed";
          } else if (timingInfo.phase === "preparation") {
            displayText = "Preparation Phase";
          } else if (timingInfo.phase === "promotion") {
            displayText = "Promotion Active";
          } else if (timingInfo.phase === "proof_submission") {
            displayText = "Proof Submission Phase";
          } else if (timingInfo.phase === "verification") {
            displayText = "Verification Phase";
          } else {
            displayText = "Not Accepting Applications";
          }
          break;
        default:
          displayText = statusMap[campaign.status] || "Not Available";
      }
      
      return {
        text: displayText,
        disabled: true,
        onClick: () => {},
        variant: variant,
      };
    }

    // Campaign is open and can accept applications
    if (campaign.progressInfo.isFullyBooked) {
      return {
        text: "Campaign Full",
        disabled: true,
        onClick: () => {},
        variant: "closed",
      };
    }

    // Available for application
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
  const getButtonStyles = (variant: string) => {
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
      case "own":
        return `${baseStyles} bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 cursor-not-allowed`;
      case "closed":
        return `${baseStyles} bg-slate-500/10 text-slate-400 border border-slate-500/20 cursor-not-allowed`;
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
    <div className="flex flex-col min-h-screen bg-slate-900 pt-20 md:pt-28">
      <div className="p-6 lg:p-8">
        {/* Network Status */}
        {isConnected && !isCorrectChain && (
          <div className="mb-6">
            <NetworkStatus className="bg-slate-800/60 border-amber-500/50" />
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            {/* Header Content */}
            <div className="flex items-center md:items-start justify-center flex-col">
              <h2 className="text-2xl md:text-3xl font-bold text-white">
                Campaign Marketplace
              </h2>
              <p className="text-lg text-slate-400 text-center mt-2">
                Discover active campaigns that match your influencer profile
              </p>
            </div>

            {/* Quick Stats - Mobile Optimized */}
            {isConnected && userProfile?.isInfluencer && (
              <div className="flex  justify-center md:justify-end">
                {/* Mobile: Stacked layout */}
                <div className="flex flex-row gap-2 sm:hidden">
                  <div className="flex items-center justify-center gap-2 bg-slate-800/40 backdrop-blur-sm rounded-full px-3 py-2 border border-slate-700/50">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                    <span className="text-base font-bold text-emerald-400">
                      {
                        Object.values(userApplications).filter(
                          (s) => s === "applied"
                        ).length
                      }
                    </span>
                    <span className="text-xs text-slate-400">Applied</span>
                  </div>
                  <div className="flex items-center justify-center gap-2 bg-slate-800/40 backdrop-blur-sm rounded-full px-3 py-2 border border-slate-700/50">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                    <span className="text-base font-bold text-blue-400">
                      {
                        Object.values(userApplications).filter(
                          (s) => s === "assigned"
                        ).length
                      }
                    </span>
                    <span className="text-xs text-slate-400">Assigned</span>
                  </div>
                </div>

                {/* Desktop/Tablet: Horizontal layout */}
                <div className="hidden sm:inline-flex items-center gap-4 bg-slate-800/40 backdrop-blur-sm rounded-full px-4 py-2 border border-slate-700/50">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                    <span className="text-lg font-bold text-emerald-400">
                      {
                        Object.values(userApplications).filter(
                          (s) => s === "applied"
                        ).length
                      }
                    </span>
                    <span className="text-xs text-slate-400">Applied</span>
                  </div>

                  <div className="w-px h-4 bg-slate-600"></div>

                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                    <span className="text-lg font-bold text-blue-400">
                      {
                        Object.values(userApplications).filter(
                          (s) => s === "assigned"
                        ).length
                      }
                    </span>
                    <span className="text-xs text-slate-400">Assigned</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-slate-800/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-3 mb-8">
          {/* Mobile-First Layout */}
          <div className="flex flex-col gap-3">
            {/* Search Bar + Filter Toggle */}
            <div className="flex gap-3">
              <div className="flex-grow relative">
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

              {/* Mobile Filter Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="lg:hidden flex items-center justify-center w-12 h-12 bg-slate-900/50 border border-slate-600/50 rounded-xl hover:bg-slate-800/70 transition-colors duration-200"
              >
                <SlidersHorizontal size={18} className="text-slate-400" />
              </button>
            </div>

            {/* Desktop Filters - Always Visible */}
            <div className="hidden lg:flex gap-4">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-48 pl-4 pr-8 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all duration-200"
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
                className="w-48 pl-4 pr-8 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all duration-200"
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
                className="w-48 pl-4 pr-8 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all duration-200"
              >
                <option>Active Only</option>
                <option>All Campaigns</option>
              </select>
            </div>

            {/* Mobile Filters - Collapsible */}
            {showFilters && (
              <div className="lg:hidden flex flex-col gap-3 pt-2 border-t border-slate-700/50">
                {/* Filter Chips Style */}
                <div className="flex flex-wrap gap-2">
                  <div className="flex-1 min-w-0">
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="w-full pl-3 pr-8 py-2.5 bg-slate-900/50 border border-slate-600/50 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all duration-200"
                    >
                      <option>All Categories</option>
                      {Object.entries(AUDIENCE_LABELS).map(([value, label]) => (
                        <option key={value} value={label}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex-1 min-w-0">
                    <select
                      value={budgetFilter}
                      onChange={(e) => setBudgetFilter(e.target.value)}
                      className="w-full pl-3 pr-8 py-2.5 bg-slate-900/50 border border-slate-600/50 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all duration-200"
                    >
                      <option>Any Budget</option>
                      <option>Under 500</option>
                      <option>500-1000</option>
                      <option>1000-2000</option>
                      <option>2000+</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-2">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="flex-1 pl-3 pr-8 py-2.5 bg-slate-900/50 border border-slate-600/50 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all duration-200"
                  >
                    <option>Active Only</option>
                    <option>All Campaigns</option>
                  </select>

                  {/* Clear Filters Button */}
                  <button
                    onClick={() => {
                      setCategoryFilter("All Categories");
                      setBudgetFilter("Budget: Any");
                      setStatusFilter("Active Only");
                    }}
                    className="px-4 py-2.5 bg-slate-700/50 hover:bg-slate-600/50 border border-slate-600/50 rounded-lg text-sm text-slate-300 transition-colors duration-200"
                  >
                    Clear
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Campaign Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredCampaigns.map((campaign: Brief) => {
            const category =
              AUDIENCE_LABELS[campaign.targetAudience] || "Other";
            const buttonState = getButtonState(campaign);
            const userApplicationStatus = applicationStatus[campaign.id];
            const isDescriptionExpanded = expandedDescriptions.has(campaign.id);
            const showExpandButton = shouldShowExpandButton(
              campaign.description
            );

            return (
              <motion.div
              key={campaign.id}
              className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden hover:bg-slate-800/70 transition-all duration-200 group"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {/* Streamlined Header */}
              <div className="p-4 pb-0">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-white mb-1 line-clamp-1 group-hover:text-emerald-400 transition-colors">
                      {campaign.name}
                    </h3>
                    <p className="text-sm text-slate-400">
                      by <UserDisplay address={campaign.business} className="text-emerald-400" />
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-3 ml-4">
                    {/* Status Badge */}
                    {userApplicationStatus && (
                      <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        userApplicationStatus === "assigned"
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "bg-blue-500/10 text-blue-400"
                      }`}>
                        {userApplicationStatus === "assigned" ? (
                          <><Star className="w-3 h-3" />Assigned</>
                        ) : (
                          <><Check className="w-3 h-3" />Applied</>
                        )}
                      </div>
                    )}
                    
                    {/* Budget */}
                    <div className="text-right">
                      <div className="text-lg font-bold text-white">
                        ${campaign.budget.toLocaleString()}
                      </div>
                      <div className="text-xs text-slate-400">
                        ${formatCurrency(campaign.progressInfo.budgetPerSpot)} per spot
                      </div>
                    </div>
                  </div>
                </div>
            
                {/* Category and Phase Tags */}
                <div className="flex items-center gap-2 mb-3">
                  <span className={`px-2 py-1 rounded-md text-xs font-medium ${getCategoryColor(category)}`}>
                    {category}
                  </span>
                  <span className={`px-2 py-1 rounded-md text-xs font-medium ${getPhaseColor(campaign.timingInfo.phase)}`}>
                    {getPhaseLabel(campaign.timingInfo.phase)}
                  </span>
                  
                  {/* Conditional badges */}
                  {campaign.timingInfo.isNew && (
                    <span className="px-2 py-1 rounded-md text-xs font-medium bg-emerald-500/20 text-emerald-400">
                      New
                    </span>
                  )}
                  {campaign.timingInfo.isUrgent && (
                    <span className="px-2 py-1 rounded-md text-xs font-medium bg-orange-500/20 text-orange-400">
                      Urgent
                    </span>
                  )}
                  
                  {/* Time remaining */}
                  {campaign.timingInfo.timeRemaining && (
                    <span className="ml-auto text-xs text-slate-400">
                      {formatTimeRemaining(campaign.timingInfo.timeRemaining)} left
                    </span>
                  )}
                </div>
              </div>
            
              {/* Description */}
              <div className="px-4 pb-3">
                <div className="text-sm text-slate-300 leading-relaxed">
                  {isDescriptionExpanded
                    ? campaign.description
                    : getTruncatedDescription(campaign.description)}
                </div>
                
                {showExpandButton && (
                  <button
                    onClick={() => toggleDescription(campaign.id)}
                    className="mt-2 text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
                  >
                    {isDescriptionExpanded ? "Show less" : "Show more"}
                  </button>
                )}
              </div>
            
              {/* Next Action Alert */}
              {campaign.statusInfo.nextAction && (
                <div className="mx-4 mb-3 p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-emerald-400">
                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></div>
                    {campaign.statusInfo.nextAction}
                  </div>
                  {campaign.statusInfo.warning && (
                    <div className="flex items-center gap-2 mt-2 text-xs text-orange-400">
                      <AlertTriangle className="w-3 h-3" />
                      {campaign.statusInfo.warning}
                    </div>
                  )}
                </div>
              )}
            
              {/* Stats Grid - Simplified */}
              <div className="px-4 pb-3">
                <div className="grid grid-cols-4 gap-3 text-center">
                  <div className="py-2">
                    <div className="text-sm font-semibold text-white">
                      {campaign.selectedInfluencersCount}/{campaign.maxInfluencers}
                    </div>
                    <div className="text-xs text-slate-400">Spots</div>
                  </div>
                  <div className="py-2">
                    <div className="text-sm font-semibold text-white">
                      {campaign.applicationCount}
                    </div>
                    <div className="text-xs text-slate-400">Applications</div>
                  </div>
                  <div className="py-2">
                    <div className="text-sm font-semibold text-white">
                      {Math.ceil(campaign.promotionDuration / 86400)}
                    </div>
                    <div className="text-xs text-slate-400">Days</div>
                  </div>
                  <div className="py-2">
                    <div className="text-sm font-semibold text-emerald-400">
                      {campaign.progressInfo.spotsFilledPercentage}%
                    </div>
                    <div className="text-xs text-slate-400">Filled</div>
                  </div>
                </div>
              </div>
            
              {/* Progress Bar */}
              <div className="px-4 pb-3">
                <div className="w-full bg-slate-700/50 rounded-full h-1">
                  <div
                    className="bg-emerald-500 h-1 rounded-full transition-all duration-300"
                    style={{ width: `${campaign.progressInfo.spotsFilledPercentage}%` }}
                  />
                </div>
              </div>
            
              {/* Action Button */}
              <div className="p-4 pt-0">
                <button
                  onClick={buttonState.onClick}
                  className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 ${getButtonStyles(buttonState.variant)}`}
                  disabled={buttonState.disabled}
                >
                  {buttonState.icon && buttonState.icon}
                  {buttonState.text}
                  {!buttonState.disabled && !buttonState.icon && (
                    <ArrowRight className="w-4 h-4" />
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
                  maxInfluencers: selectedCampaign.maxInfluencers,
                  requirements:
                    selectedCampaign.requirements || "No specific requirements",
                }
              : null
          }
          applicationMessage={applicationMessage}
          setApplicationMessage={setApplicationMessage}
          onSuccess={() => {
            // Immediately refresh application status on success
            refreshApplicationStatus();
            // Trigger dashboard refresh with delay for blockchain propagation
            setTimeout(() => {
              window.dispatchEvent(new CustomEvent("dashboardRefresh"));
            }, 2000);
          }}
        />
      )}
    </div>
  );
}