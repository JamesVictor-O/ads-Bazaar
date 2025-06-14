"use client";
import { useState, useEffect } from "react";
import {
  Search,
  Target,
  Calendar,
  Users,
  Clock,
  Award,
  Check,
  UserCheck,
} from "lucide-react";
import { useGetAllBriefs, useUserProfile } from "@/hooks/adsBazaar";
import { useGetInfluencerApplications } from "@/hooks/useGetInfluncersApplication"; 
import ApplyModal from "@/components/modals/AdsApplicationModal";
import { useAccount } from "wagmi";
import { formatDistanceToNow } from "date-fns";
import { truncateAddress } from "@/utils/format";

const statusMap = {
  0: "Open",
  1: "Assigned",
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

interface Brief {
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
  const [categoryFilter, setCategoryFilter] = useState<string>("All Categories");
  const [budgetFilter, setBudgetFilter] = useState<string>("Budget: Any");
  const [showApplyModal, setShowApplyModal] = useState<boolean>(false);
  const [selectedBrief, setSelectedBrief] = useState<Brief | null>(null);
  const [applicationMessage, setApplicationMessage] = useState<string>("");
  const [applicationStatus, setApplicationStatus] = useState<
    Record<string, "applied" | "assigned" | null>
  >({});

  // Fetch briefs, user profile, and influencer applications
  const { briefs, isLoading } = useGetAllBriefs();
  const { address, isConnected } = useAccount();
  const { userProfile, isLoadingProfile } = useUserProfile();
    const {
    applications: influencerApplications = [],
    isLoading: isLoadingApplications,
  } = useGetInfluencerApplications(address as `0x${string}`);

  // Update application status based on fetched application

   useEffect(() => {
    if (!isLoadingApplications && influencerApplications) {
      const statusMap: Record<string, "applied" | "assigned" | null> = {};
      influencerApplications.forEach((app) => {
        // @ts-expect-error:Brief ID should be typed but API currently accepts any string
        statusMap[app.briefId] = app.isSelected ? "assigned" : "applied";
      });
      setApplicationStatus(statusMap);
    }
  }, [influencerApplications, isLoadingApplications]);


  // Loading state for the entire page
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

  // Determine button state for each brief
  const getButtonState = (brief: Brief) => {
    const status = applicationStatus[brief.id];
    const deadlinePassed = new Date(brief.selectionDeadline * 1000) < new Date();
    const isOpen = brief.status === 0;

    // Check if user has applied or been assigned
    if (status === "applied") {
      return {
        text: "Applied",
        disabled: true,
        onClick: () => {},
        variant: "blue",
        icon: <Check className="w-4 h-4 mr-1" />,
      };
    }
    if (status === "assigned") {
      return {
        text: "Assigned",
        disabled: true,
        onClick: () => {},
        variant: "emerald",
        icon: <UserCheck className="w-4 h-4 mr-1" />,
      };
    }

    // Check connection and profile status
    if (!isConnected) {
      return {
        text: "Connect Wallet to Apply",
        disabled: true,
        onClick: () => {},
        variant: "slate",
      };
    }
    if (isLoadingProfile) {
      return {
        text: "Loading...",
        disabled: true,
        onClick: () => {},
        variant: "slate",
      };
    }
    if (!userProfile?.isRegistered) {
      return {
        text: "Register as Influencer",
        disabled: false,
        onClick: () => (window.location.href = "/"),
        variant: "emerald",
      };
    }
    if (userProfile.isBusiness) {
      if (brief.business.toLowerCase() === address?.toLowerCase()) {
        return {
          text: "Your Campaign",
          disabled: true,
          onClick: () => {},
          variant: "slate",
        };
      }
      return {
        text: "Use Influencer Account",
        disabled: true,
        onClick: () => {},
        variant: "slate",
      };
    }

    // Check campaign status and deadline
    if (!isOpen || deadlinePassed) {
      return {
        text: deadlinePassed ? "Deadline Passed" : statusMap[brief.status],
        disabled: true,
        onClick: () => {},
        variant: "slate",
      };
    }

    return {
      text: "Apply Now",
      disabled: false,
      onClick: () => {
        setSelectedBrief(brief);
        setShowApplyModal(true);
      },
      variant: "emerald",
    };
  };

  // Filter briefs based on search and filter criteria
  const filteredBriefs = briefs.filter((brief) => {
    const budget = brief.budget;
    const matchesSearch =
      brief.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      brief.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      brief.requirements.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      categoryFilter === "All Categories" ||
      audienceMap[brief.targetAudience] === categoryFilter;
    const matchesBudget =
      budgetFilter === "Budget: Any" ||
      (budgetFilter === "Under 500 cUSD" && budget < 500) ||
      (budgetFilter === "500-1000 cUSD" && budget >= 500 && budget <= 1000) ||
      (budgetFilter === "1000-2000 cUSD" && budget > 1000 && budget <= 2000) ||
      (budgetFilter === "2000+ cUSD" && budget > 2000);
    return matchesSearch && matchesCategory && matchesBudget;
  });

  // Determine category badge color
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
      default:
        return "bg-slate-500/10 text-slate-400 border-slate-500/20";
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-900 pt-10 md:pt-28">
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white">Campaign Marketplace</h2>
          <p className="text-sm text-slate-400 mt-2">
            Discover campaigns that match your influencer profile
          </p>
        </div>

        {/* Search and Filter */}
        <div className="bg-slate-800/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 mb-8 shadow-lg shadow-emerald-500/10">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Input */}
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
            {/* Category and Budget Filters */}
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

        {/* Brief List */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredBriefs.map((brief) => {
            const category = audienceMap[brief.targetAudience] || "Other";
            const status = statusMap[brief.status] || "Unknown";
            const isOpen = brief.status === 0;
            const deadlinePassed = new Date(brief.selectionDeadline * 1000) < new Date();
            const buttonState = getButtonState(brief);
            const applicationsCount = brief.applicationCount || 0;

            return (
              <div
                key={brief.id}
                className="bg-slate-800/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300"
              >
                {/* Header with category and budget */}
                <div className="p-5 border-b border-slate-700/50">
                  <div className="flex justify-between items-start">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getCategoryColor(category)}`}
                    >
                      {category}
                    </span>
                    <span className="inline-flex items-center px-4 py-1 rounded-full text-sm font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {brief.budget.toLocaleString()} cUSD
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-white mt-3 line-clamp-2">
                    {brief.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    by {truncateAddress(brief.business)}
                  </p>
                </div>

                {/* Campaign details */}
                <div className="p-5">
                  <p className="text-sm text-slate-300 mb-4 line-clamp-3">
                    {brief.description}
                  </p>
                  <p className="text-sm text-slate-400 mb-4 line-clamp-3">
                    <strong>Requirements:</strong> {brief.requirements}
                  </p>

                  {/* Status and deadline */}
                  <div className="flex items-center justify-between mb-4">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        isOpen && !deadlinePassed
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : "bg-slate-500/10 text-slate-400 border-slate-500/20"
                      } border`}
                    >
                      {isOpen && !deadlinePassed ? "Open" : status}
                    </span>
                    <div className="flex items-center text-xs text-slate-400">
                      <Clock className="w-4 h-4 mr-1" />
                      {deadlinePassed ? (
                        <span>
                          Closed{" "}
                          {formatDistanceToNow(
                            new Date(brief.selectionDeadline * 1000),
                            { addSuffix: true }
                          )}
                        </span>
                      ) : (
                        <span>
                          Closes in{" "}
                          {formatDistanceToNow(
                            new Date(brief.selectionDeadline * 1000)
                          )}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Stats grid */}
                  <div className="grid grid-cols-2 gap-3 text-xs mb-4">
                    <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-700/50">
                      <div className="flex items-center text-slate-400 mb-1">
                        <Users className="w-4 h-4 mr-1" />
                        <span>Influencers</span>
                      </div>
                      <div className="font-semibold text-white">
                        {brief.selectedInfluencersCount}/{brief.maxInfluencers}
                      </div>
                    </div>
                    <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-700/50">
                      <div className="flex items-center text-slate-400 mb-1">
                        <Award className="w-4 h-4 mr-1" />
                        <span>Applications</span>
                      </div>
                      <div className="font-semibold text-white">
                        {applicationsCount}
                      </div>
                    </div>
                    <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-700/50">
                      <div className="flex items-center text-slate-400 mb-1">
                        <Calendar className="w-4 h-4 mr-1" />
                        <span>Duration</span>
                      </div>
                      <div className="font-semibold text-white">
                        {Math.ceil(brief.promotionDuration / 86400)} days
                      </div>
                    </div>
                    <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-700/50">
                      <div className="flex items-center text-slate-400 mb-1">
                        <Target className="w-4 h-4 mr-1" />
                        <span>Audience</span>
                      </div>
                      <div className="font-semibold text-white truncate">
                        {category}
                      </div>
                    </div>
                  </div>

                  {/* Apply button */}
                  <button
                    onClick={buttonState.onClick}
                    className={`w-full py-3 px-4 rounded-xl text-sm font-medium flex items-center justify-center transition-all duration-200 shadow-md ${
                      buttonState.variant === "emerald" && !buttonState.disabled
                        ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700 shadow-emerald-500/25"
                        : buttonState.variant === "blue"
                        ? "bg-blue-500/10 text-blue-400 border border-blue-500/20 cursor-not-allowed"
                        : buttonState.variant === "emerald" &&
                          buttonState.disabled
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 cursor-not-allowed"
                        : "bg-slate-500/10 text-slate-400 border border-slate-500/20 cursor-not-allowed"
                    }`}
                    disabled={buttonState.disabled}
                  >
                    {buttonState.icon && buttonState.icon}
                    {buttonState.text}
                  </button>
                </div>
              </div>
            );
          })}
          {filteredBriefs.length === 0 && (
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
          setShowApplyModal={setShowApplyModal}
          selectedBrief={
            selectedBrief
              ? {
                  id: selectedBrief.id,
                  title: selectedBrief.title,
                  description: selectedBrief.description,
                  business: selectedBrief.business,
                  budget: selectedBrief.budget,
                  requirements: selectedBrief.requirements || "No specific requirements",
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

