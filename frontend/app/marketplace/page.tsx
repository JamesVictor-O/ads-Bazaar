"use client";

import { useState } from "react";
import { Search, CheckCircle, Target, Calendar, Users, MessageCircle } from "lucide-react";

// Mock data for campaigns
const campaigns = [
  {
    id: 1,
    category: "Tech",
    title: "Celo Mobile Banking Promo",
    brand: "CeloYield Finance",
    budget: 1800,
    description: "Promote our mobile banking app to crypto enthusiasts through Farcaster posts and X threads.",
    audience: "Crypto enthusiasts, 18-35",
    duration: "2 weeks",
    deliverables: 4,
    requirements: "Min 10K followers, 3+ crypto posts",
    applications: [],
  },
  {
    id: 2,
    category: "Lifestyle",
    title: "Eco-Friendly Product Line",
    brand: "Green Earth Co.",
    budget: 1200,
    description: "Showcase our eco-friendly home products through creative Farcaster and Lens content.",
    audience: "Eco-conscious, 25-45",
    duration: "3 weeks",
    deliverables: 3,
    requirements: "5K+ followers, sustainability focus",
    applications: [],
  },
  {
    id: 3,
    category: "Fashion",
    title: "Summer Collection Launch",
    brand: "Trendy Styles",
    budget: 2200,
    description: "Highlight our summer fashion collection with photoshoots and styling tips on Farcaster and X.",
    audience: "Fashion lovers, 18-30",
    duration: "1 month",
    deliverables: 5,
    requirements: "8K+ followers, fashion content",
    applications: [],
  },
  {
    id: 4,
    category: "Food",
    title: "Healthy Meal Kit Promotion",
    brand: "Fresh Eats Delivery",
    budget: 1500,
    description: "Create engaging content showcasing our meal kit preparation and dishes on Farcaster.",
    audience: "Food enthusiasts, 25-40",
    duration: "2 weeks",
    deliverables: 3,
    requirements: "5K+ followers, food content",
    applications: [],
  },
];

export default function Marketplace() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All Categories");
  const [budgetFilter, setBudgetFilter] = useState("Budget: Any");
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [applicationMessage, setApplicationMessage] = useState("");
  const [mockCampaigns, setMockCampaigns] = useState(campaigns);

  const handleApply = () => {
    if (applicationMessage.trim()) {
      setMockCampaigns((prev) =>
        prev.map((campaign) =>
          campaign.id === selectedCampaign.id
            ? {
                ...campaign,
                applications: [
                  ...campaign.applications,
                  {
                    address: "0x123...abc", // Mock wallet address
                    username: "crypto_guru", // Mock Farcaster username
                    message: applicationMessage,
                  },
                ],
              }
            : campaign
        )
      );
      setShowApplyModal(false);
      setApplicationMessage("");
      alert("Application submitted successfully!"); // Replace with toast in production
    }
  };

  const filteredCampaigns = mockCampaigns.filter((campaign) => {
    const matchesSearch = campaign.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      campaign.brand.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "All Categories" || campaign.category === categoryFilter;
    const matchesBudget = budgetFilter === "Budget: Any" ||
      (budgetFilter === "Under 500 cUSD" && campaign.budget < 500) ||
      (budgetFilter === "500-1000 cUSD" && campaign.budget >= 500 && campaign.budget <= 1000) ||
      (budgetFilter === "1000-2000 cUSD" && campaign.budget > 1000 && campaign.budget <= 2000) ||
      (budgetFilter === "2000+ cUSD" && campaign.budget > 2000);
    return matchesSearch && matchesCategory && matchesBudget;
  });

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <div className="p-4 sm:p-6">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">Campaign Marketplace</h2>
          <p className="text-sm text-gray-600 mt-1">
            Discover campaigns that match your influencer profile.
          </p>
        </div>

        {/* Search and Filter */}
        <div className="bg-white shadow rounded-lg p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-grow">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
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
                <option>Tech</option>
                <option>Lifestyle</option>
                <option>Fashion</option>
                <option>Food</option>
                <option>Beauty</option>
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

        {/* Campaign List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCampaigns.map((campaign) => (
            <div key={campaign.id} className="bg-white shadow rounded-lg p-4">
              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span
                      className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${
                        campaign.category === "Tech" ? "bg-blue-100 text-blue-800" :
                        campaign.category === "Lifestyle" ? "bg-green-100 text-green-800" :
                        campaign.category === "Fashion" ? "bg-purple-100 text-purple-800" :
                        campaign.category === "Food" ? "bg-yellow-100 text-yellow-800" :
                        "bg-pink-100 text-pink-800"
                      }`}
                    >
                      {campaign.category}
                    </span>
                    <h3 className="text-sm font-medium text-gray-900 mt-2">{campaign.title}</h3>
                    <p className="text-xs text-gray-500">{campaign.brand}</p>
                  </div>
                  <span className="text-sm font-medium text-green-600">{campaign.budget} cUSD</span>
                </div>
                <p className="text-xs text-gray-600 line-clamp-3">{campaign.description}</p>
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                  <div className="flex items-center">
                    <Target size={12} className="text-gray-400 mr-1" />
                    <span>{campaign.audience.split(",")[0]}</span>
                  </div>
                  <div className="flex items-center">
                    <Users size={12} className="text-gray-400 mr-1" />
                    <span>{campaign.audience.split(",")[1]}</span>
                  </div>
                  <div className="flex items-center">
                    <Calendar size={12} className="text-gray-400 mr-1" />
                    <span>{campaign.duration}</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle size={12} className="text-gray-400 mr-1" />
                    <span>{campaign.deliverables} deliverables</span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedCampaign(campaign);
                    setShowApplyModal(true);
                  }}
                  className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 text-sm"
                >
                  Apply Now
                </button>
              </div>
            </div>
          ))}
          {filteredCampaigns.length === 0 && (
            <p className="text-sm text-gray-600 col-span-full text-center">No campaigns match your filters.</p>
          )}
        </div>
      </div>

      {/* Apply Modal */}
      {showApplyModal && selectedCampaign && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-auto">
            <h2 className="text-xl font-medium mb-4 text-gray-700">Apply for {selectedCampaign.title}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-lg font-medium text-gray-700">Campaign Details</label>
                <p className="text-base text-gray-600">{selectedCampaign.brand} - {selectedCampaign.budget} cUSD</p>
                <p className="text-base text-gray-500 mt-1">{selectedCampaign.requirements}</p>
              </div>
              <div>
                <label className="block text-base font-medium text-gray-700">Application Message</label>
                <textarea
                  value={applicationMessage}
                  onChange={(e) => setApplicationMessage(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-sm text-gray-600"
                  rows={4}
                  placeholder="Why are you a great fit for this campaign?"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowApplyModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleApply}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                disabled={!applicationMessage.trim()}
              >
                Submit Application
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}