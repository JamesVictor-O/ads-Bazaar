"use client";

import { useState, useEffect } from "react";
import {
  Search,
  CheckCircle,
  Target,
  Calendar,
  Users,
  Clock,
  AlertCircle,
  Award,
  Check,
  UserCheck,
} from "lucide-react";
import { useGetAllBriefs, useUserProfile } from "@/hooks/adsBazaar";
import ApplyModal from "@/components/modals/AdsApplicationModal";
import { useGetAllId } from "@/hooks/adsBazaar";
import { useGetInfluencerApplications } from "@/hooks/useGetInfluncersApplication";
import { useAccount } from "wagmi";
import { formatDistanceToNow } from "date-fns";
import { truncateAddress } from "@/utils/format";

// Status and audience mappings
const statusMap = {
  0: "Open",
  1: "Assigned",
  2: "Completed",
  3: "Cancelled",
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
  budget: number;
  status: number;
  applicationDeadline: number;
  promotionDuration: number;
  promotionStartTime: number;
  promotionEndTime: number;
  maxInfluencers: number;
  selectedInfluencersCount: number;
  targetAudience: number;
  verificationDeadline: number;
  requirements?: string;
  applicationsCount?: number;
}

export default function Marketplace() {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [categoryFilter, setCategoryFilter] =
    useState<string>("All Categories");
  const [budgetFilter, setBudgetFilter] = useState<string>("Budget: Any");
  const [showApplyModal, setShowApplyModal] = useState<boolean>(false);
  const [selectedBrief, setSelectedBrief] = useState<any>(null);
  const [applicationMessage, setApplicationMessage] = useState<string>("");
  const [applicationStatus, setApplicationStatus] = useState<
    Record<string, "applied" | "assigned" | null>
  >({});
  const { data } = useGetAllId();

  const { briefs, isLoading } = useGetAllBriefs();
  const { address, isConnected } = useAccount();
  const { userProfile, isLoadingProfile: isProfileLoading } = useUserProfile();
  const {
    applications: influencerApplications = [],
    isLoading: isLoadingApplications,
  } = useGetInfluencerApplications(address);

  useEffect(() => {
    if (!isLoadingApplications && influencerApplications) {
      const statusMap: Record<string, "applied" | "assigned" | null> = {};

      influencerApplications.forEach((app) => {
        statusMap[app.briefId] = app.isSelected ? "assigned" : "applied";
      });

      setApplicationStatus(statusMap);
    }
  }, [influencerApplications, isLoadingApplications]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading campaigns...</p>
        </div>
      </div>
    );
  }

  const getButtonState = (brief: Brief) => {
    // Check application status first
    const status = applicationStatus[brief.id];
    if (status === "assigned") {
      return {
        text: "Assigned",
        disabled: true,
        onClick: () => {},
        variant: "green",
        icon: <UserCheck className="w-4 h-4 mr-1" />,
      };
    }
    if (status === "applied") {
      return {
        text: "Applied",
        disabled: true,
        onClick: () => {},
        variant: "blue",
        icon: <Check className="w-4 h-4 mr-1" />,
      };
    }

    // Rest of your existing conditions
    if (!isConnected) {
      return {
        text: "Connect Wallet to Apply",
        disabled: true,
        onClick: () => {},
        variant: "gray",
      };
    }

    if (isProfileLoading) {
      return {
        text: "Loading...",
        disabled: true,
        onClick: () => {},
        variant: "gray",
      };
    }

    if (!userProfile?.isRegistered) {
      return {
        text: "Register as Influencer",
        disabled: false,
        onClick: () => (window.location.href = "/"),
        variant: "indigo",
      };
    }

    if (userProfile.isBusiness) {
      if (brief.business.toLowerCase() === address?.toLowerCase()) {
        return {
          text: "Your Campaign",
          disabled: true,
          onClick: () => {},
          variant: "gray",
        };
      }
      return {
        text: "Use Influencer Account",
        disabled: true,
        onClick: () => {},
        variant: "gray",
      };
    }

    const deadlinePassed =
      new Date(brief.applicationDeadline * 1000) < new Date();
    if (brief.status !== 0 || deadlinePassed) {
      return {
        text: deadlinePassed ? "Deadline Passed" : "Closed",
        disabled: true,
        onClick: () => {},
        variant: "gray",
      };
    }

    return {
      text: "Apply Now",
      disabled: false,
      onClick: () => {
        setSelectedBrief(brief);
        setShowApplyModal(true);
      },
      variant: "indigo",
    };
  };

  const filteredBriefs = briefs.filter((brief) => {
    const budget = brief.budget;
    const matchesSearch =
      brief.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      brief.description.toLowerCase().includes(searchQuery.toLowerCase());
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

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Tech":
        return "bg-blue-100 text-blue-800";
      case "Fashion":
        return "bg-purple-100 text-purple-800";
      case "Food":
        return "bg-yellow-100 text-yellow-800";
      case "Fitness":
        return "bg-red-100 text-red-800";
      case "Travel":
        return "bg-green-100 text-green-800";
      case "Gaming":
        return "bg-indigo-100 text-indigo-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <div className="p-4 sm:p-6">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">
            Campaign Marketplace
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Discover campaigns that match your influencer profile
          </p>
        </div>

        {/* Search and Filter */}
        <div className="bg-white shadow rounded-lg p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-grow">
              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="Search campaigns..."
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full sm:w-40 pl-3 pr-8 py-2 border border-gray-300 rounded-md text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
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
                className="w-full sm:w-40 pl-3 pr-8 py-2 border border-gray-300 rounded-md text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBriefs.map((brief) => {
            const category = audienceMap[brief.targetAudience] || "Other";
            const status = statusMap[brief.status] || "Unknown";
            const isOpen = brief.status === 0;
            const deadlinePassed =
              new Date(brief.applicationDeadline * 1000) < new Date();
            const buttonState = getButtonState(brief);
            const applicationsCount = brief.applicationsCount || 0;

            return (
              <div
                key={brief.id}
                className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-100 hover:shadow-xl transition-shadow duration-300"
              >
                {/* Header with category and budget */}
                <div className="p-4 border-b border-gray-100">
                  <div className="flex justify-between items-start">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(
                        category
                      )}`}
                    >
                      {category}
                    </span>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-indigo-100 text-indigo-800">
                      {brief.budget.toLocaleString()} cUSD
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mt-2 line-clamp-2">
                    {brief.title}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    by {truncateAddress(brief.business)}
                  </p>
                </div>

                {/* Campaign details */}
                <div className="p-4">
                  <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                    {brief.description}
                  </p>

                  {/* Status and deadline */}
                  <div className="flex items-center justify-between mb-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        isOpen && !deadlinePassed
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {isOpen && !deadlinePassed
                        ? "Open"
                        : deadlinePassed
                        ? "Closed"
                        : status}
                    </span>
                    <div className="flex items-center text-xs text-gray-500">
                      <Clock className="w-3 h-3 mr-1" />
                      {deadlinePassed ? (
                        <span>
                          Closed{" "}
                          {formatDistanceToNow(
                            new Date(brief.applicationDeadline * 1000),
                            { addSuffix: true }
                          )}
                        </span>
                      ) : (
                        <span>
                          Closes in{" "}
                          {formatDistanceToNow(
                            new Date(brief.applicationDeadline * 1000)
                          )}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Stats grid */}
                  <div className="grid grid-cols-2 gap-3 text-xs mb-4">
                    <div className="bg-gray-50 p-2 rounded-lg">
                      <div className="flex items-center text-gray-500 mb-1">
                        <Users className="w-3 h-3 mr-1" />
                        <span>Influencers</span>
                      </div>
                      <div className="font-semibold">
                        {brief.selectedInfluencersCount}/{brief.maxInfluencers}
                      </div>
                    </div>
                    <div className="bg-gray-50 p-2 rounded-lg">
                      <div className="flex items-center text-gray-500 mb-1">
                        <Award className="w-3 h-3 mr-1" />
                        <span>Applications</span>
                      </div>
                      <div className="font-semibold">{applicationsCount}</div>
                    </div>
                    <div className="bg-gray-50 p-2 rounded-lg">
                      <div className="flex items-center text-gray-500 mb-1">
                        <Calendar className="w-3 h-3 mr-1" />
                        <span>Duration</span>
                      </div>
                      <div className="font-semibold">
                        {Math.ceil(brief.promotionDuration / 86400)} days
                      </div>
                    </div>
                    <div className="bg-gray-50 p-2 rounded-lg">
                      <div className="flex items-center text-gray-500 mb-1">
                        <Target className="w-3 h-3 mr-1" />
                        <span>Audience</span>
                      </div>
                      <div className="font-semibold truncate">{category}</div>
                    </div>
                  </div>

                  {/* Requirements (if any) */}
                  {brief.requirements && (
                    <div className="mb-4">
                      <div className="flex items-center text-xs text-gray-500 mb-1">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        <span>Requirements</span>
                      </div>
                      <p className="text-xs text-gray-600 line-clamp-2">
                        {brief.requirements}
                      </p>
                    </div>
                  )}

                  {/* Apply button */}
                  <button
                    onClick={buttonState.onClick}
                    className={`w-full py-2 px-4 rounded-lg text-sm font-medium transition-colors flex items-center justify-center ${
                      buttonState.variant === "indigo"
                        ? "bg-indigo-600 text-white hover:bg-indigo-700"
                        : buttonState.variant === "blue"
                        ? "bg-blue-100 text-blue-800 cursor-not-allowed"
                        : buttonState.variant === "green"
                        ? "bg-green-100 text-green-800 cursor-not-allowed"
                        : "bg-gray-100 text-gray-600 cursor-not-allowed"
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
              <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">
                No campaigns found
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Try adjusting your search or filter criteria
              </p>
            </div>
          )}
        </div>
      </div>

      {userProfile?.isRegistered && userProfile.isInfluencer && (
        <ApplyModal
          showApplyModal={showApplyModal}
          setShowApplyModal={setShowApplyModal}
          selectedBrief={
            selectedBrief
              ? {
                  id: selectedBrief.id,
                  title: selectedBrief.title,
                  business: selectedBrief.business,
                  budget: selectedBrief.budget,
                  requirements:
                    selectedBrief.requirements || "No specific requirements",
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
