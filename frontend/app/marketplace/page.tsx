"use client";

import { useState } from "react";
import { Search, CheckCircle, Target, Calendar, Users } from "lucide-react";
import { useGetAllBriefs, useUserProfile } from "@/hooks/adsBazaar";
import ApplyModal from "@/components/modals/AdsApplicationModal";
import { useGetAllId } from "@/hooks/adsBazaar";
import { useAccount } from "wagmi";
// import { shortenAddress } from "@/utils/address";

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
  requirements?: string; // Add this if your brief has requirements
}

export default function Marketplace() {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [categoryFilter, setCategoryFilter] =
    useState<string>("All Categories");
  const [budgetFilter, setBudgetFilter] = useState<string>("Budget: Any");
  const [showApplyModal, setShowApplyModal] = useState<boolean>(false);
  const [selectedBrief, setSelectedBrief] = useState<any>(null);
  const [applicationMessage, setApplicationMessage] = useState<string>("");
  const { data } = useGetAllId();

  const { briefs, isLoading } = useGetAllBriefs();
  const { address, isConnected } = useAccount();
  const { userProfile, isLoadingProfile: isProfileLoading } = useUserProfile();

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

  console.log("Briefs data:", data);

  const getButtonState = (brief: Brief) => {
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
        onClick: () => (window.location.href = "/register"),
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

    if (brief.status !== 0) {
      return {
        text: "Closed",
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

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <div className="p-4 sm:p-6">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">
            Campaign Marketplace
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Discover campaigns that match your influencer profile.
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBriefs.map((brief) => {
            const category = audienceMap[brief.targetAudience] || "Other";
            const status = statusMap[brief.status] || "Unknown";
            const isOpen = brief.status === 0;
            const buttonState = getButtonState(brief);

            return (
              <div key={brief.id} className="bg-white shadow rounded-lg p-4">
                <div className="flex flex-col gap-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span
                        className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${
                          category === "Tech"
                            ? "bg-blue-100 text-blue-800"
                            : category === "Lifestyle"
                            ? "bg-green-100 text-green-800"
                            : category === "Fashion"
                            ? "bg-purple-100 text-purple-800"
                            : category === "Food"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-pink-100 text-pink-800"
                        }`}
                      >
                        {category}
                      </span>
                      <h3 className="text-sm font-medium text-gray-900 mt-2">
                        {brief.title}
                      </h3>
                      {/* <p className="text-xs text-gray-500">{shortenAddress(brief.business)}</p> */}
                    </div>
                    <span className="text-sm font-medium text-green-600">
                      {brief.budget} cUSD
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 line-clamp-3">
                    {brief.description}
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                    <div className="flex items-center">
                      <Target size={12} className="text-gray-400 mr-1" />
                      <span>{category} Audience</span>
                    </div>
                    <div className="flex items-center">
                      <Users size={12} className="text-gray-400 mr-1" />
                      <span>Max {brief.maxInfluencers} influencers</span>
                    </div>
                    <div className="flex items-center">
                      <Calendar size={12} className="text-gray-400 mr-1" />
                      <span>Status: {status}</span>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle size={12} className="text-gray-400 mr-1" />
                      <span>{brief.selectedInfluencersCount} selected</span>
                    </div>
                  </div>
                  <button
                    onClick={buttonState.onClick}
                    className={`w-full py-2 px-4 rounded-md text-sm ${
                      buttonState.variant === "indigo"
                        ? "bg-indigo-600 text-white hover:bg-indigo-700"
                        : "bg-gray-200 text-gray-600 cursor-not-allowed"
                    }`}
                    disabled={buttonState.disabled}
                  >
                    {buttonState.text}
                  </button>
                </div>
              </div>
            );
          })}
          {filteredBriefs.length === 0 && (
            <p className="text-sm text-gray-600 col-span-full text-center">
              No campaigns match your filters.
            </p>
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
