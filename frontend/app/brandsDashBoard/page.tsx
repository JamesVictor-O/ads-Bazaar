"use client";

import { useState } from "react";
import {
  Users, Briefcase, DollarSign, BarChart2, Search, Plus,
  Calendar, Clock, Tag, Globe, Link as LinkIcon, CheckCircle,
} from "lucide-react";
import { format } from "date-fns";

// Mock data for campaigns
const campaignData = [
  { id: 1, name: "Celo Mobile Banking Promo", status: "active", spent: 2430, budget: 5000, impressions: 154200, clicks: 2341, engagement: 873, influencers: 2, maxInfluencers: 5, endDate: new Date("2025-06-01") },
  { id: 2, name: "DeFi Wallet Launch", status: "pending", spent: 0, budget: 3000, impressions: 0, clicks: 0, engagement: 0, influencers: 0, maxInfluencers: 3, endDate: new Date("2025-07-01") },
  { id: 3, name: "NFT Collection Drop", status: "completed", spent: 1500, budget: 1500, impressions: 89700, clicks: 1204, engagement: 453, influencers: 2, maxInfluencers: 2, endDate: new Date("2025-04-01") },
  { id: 4, name: "Web3 Gaming Tournament", status: "active", spent: 1200, budget: 2500, impressions: 67800, clicks: 978, engagement: 325, influencers: 1, maxInfluencers: 3, endDate: new Date("2025-05-30") },
];

// Mock data for applications
const mockApplications = {
  1: [
    { address: "0x123...abc", username: "crypto_guru", followers: 12000, message: "Excited to promote Celo’s mobile banking! I have a strong DeFi audience." },
    { address: "0x456...def", username: "web3_queen", followers: 8000, message: "Perfect fit for my followers interested in fintech." },
    { address: "0x789...ghi", username: "blockchain_bro", followers: 5000, message: "Can create engaging content for this campaign." },
  ],
  4: [
    { address: "0xabc...123", username: "gamer_nft", followers: 15000, message: "My gaming audience will love this tournament!" },
  ],
};

// Mock data for assigned influencers and submissions
const mockSubmissions = {
  1: [
    { address: "0x111...xyz", username: "defi_star", postLink: "https://farcaster.com/defi_star/post/123", paid: false },
    { address: "0x222...uvw", username: "celo_fan", postLink: "https://x.com/celo_fan/status/456", paid: true },
  ],
  4: [
    { address: "0x333...rst", username: "game_king", postLink: "https://farcaster.com/game_king/post/789", paid: false },
  ],
};

const BrandDashboard = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showApplicationsModal, setShowApplicationsModal] = useState(false);
  const [showSubmissionsModal, setShowSubmissionsModal] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [formData, setFormData] = useState({ brief: "", budget: "", maxInfluencers: "", endDate: "" });
  const [mockCampaigns, setMockCampaigns] = useState(campaignData);

  const totalBudget = mockCampaigns.reduce((sum, item) => sum + item.budget, 0);
  const totalInfluencers = mockCampaigns.reduce((sum, item) => sum + item.influencers, 0);

  const handleCreateCampaign = () => {
    const newCampaign = {
      id: mockCampaigns.length + 1,
      name: formData.brief.slice(0, 20) + "...",
      status: "pending",
      spent: 0,
      budget: Number(formData.budget),
      impressions: 0,
      clicks: 0,
      engagement: 0,
      influencers: 0,
      maxInfluencers: Number(formData.maxInfluencers),
      endDate: new Date(formData.endDate),
    };
    setMockCampaigns([...mockCampaigns, newCampaign]);
    setShowCreateModal(false);
    setFormData({ brief: "", budget: "", maxInfluencers: "", endDate: "" });
  };

  const handleAssignInfluencer = (campaignId, applicantAddress) => {
    setMockCampaigns((prev) =>
      prev.map((campaign) =>
        campaign.id === campaignId && campaign.influencers < campaign.maxInfluencers
          ? { ...campaign, influencers: campaign.influencers + 1 }
          : campaign
      )
    );
    // Simulate adding to submissions (in reality, influencer submits post later)
    mockSubmissions[campaignId] = [
      ...(mockSubmissions[campaignId] || []),
      { address: applicantAddress, username: mockApplications[campaignId].find((a) => a.address === applicantAddress).username, postLink: "", paid: false },
    ];
  };

  const handleReleaseFunds = (campaignId, influencerAddress) => {
    // Mark influencer as paid and update campaign status
    mockSubmissions[campaignId] = mockSubmissions[campaignId].map((sub) =>
      sub.address === influencerAddress ? { ...sub, paid: true } : sub
    );
    const campaign = mockCampaigns.find((c) => c.id === campaignId);
    const payment = campaign.budget / campaign.maxInfluencers;
    setMockCampaigns((prev) =>
      prev.map((c) =>
        c.id === campaignId
          ? {
              ...c,
              spent: c.spent + payment,
              status:
                c.spent + payment >= c.budget ||
                mockSubmissions[campaignId].every((sub) => sub.paid)
                  ? "completed"
                  : c.status,
            }
          : c
      )
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gray-50">
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Dashboard</h1>
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative w-full sm:w-auto">
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                className="w-full sm:w-64 pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="Search campaigns..."
              />
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="w-full sm:w-auto flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <Plus size={16} className="mr-2" />
              New Campaign
            </button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Same as before, but with mobile-optimized padding and text sizes */}
          <div className="bg-white shadow rounded-lg p-4">
            <div className="flex items-center">
              <div className="rounded-md bg-indigo-50 p-2">
                <Briefcase className="h-5 w-5 text-indigo-600" />
              </div>
              <div className="ml-3">
                <div className="text-xs font-medium text-gray-500">Active Campaigns</div>
                <div className="text-lg font-semibold text-gray-900">
                  {mockCampaigns.filter((c) => c.status === "active").length}
                </div>
              </div>
            </div>
          </div>
          {/* Repeat for other stats, adjusted for mobile */}
        </div>

        {/* Campaign List */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">Active Campaigns</h2>
            <button className="text-sm text-indigo-600 hover:text-indigo-800">View All</button>
          </div>
          <div className="bg-white shadow rounded-md">
            <ul className="divide-y divide-gray-200">
              {mockCampaigns
                .filter((campaign) => campaign.status === "active")
                .map((campaign) => (
                  <li key={campaign.id} className="p-4">
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                            <Briefcase className="h-4 w-4 text-indigo-600" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{campaign.name}</div>
                            <div className="text-xs text-gray-500 flex flex-wrap gap-2">
                              <span className="flex items-center">
                                <Calendar size={12} className="mr-1" />
                                {format(campaign.endDate, "MMM d, yyyy")}
                              </span>
                              <span className="flex items-center">
                                <Clock size={12} className="mr-1" />
                                {Math.ceil((campaign.endDate - new Date()) / (1000 * 60 * 60 * 24))} days left
                              </span>
                            </div>
                          </div>
                        </div>
                        <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Active</span>
                      </div>
                      <div className="text-sm text-gray-900">
                        {campaign.spent.toLocaleString()} / {campaign.budget.toLocaleString()} cUSD
                        <div className="text-xs text-gray-500">
                          {Math.round((campaign.spent / campaign.budget) * 100)}% spent
                        </div>
                      </div>
                      <div className="relative h-2 bg-gray-200 rounded">
                        <div
                          style={{ width: `${Math.round((campaign.spent / campaign.budget) * 100)}%` }}
                          className="absolute h-2 bg-indigo-600 rounded"
                        />
                      </div>
                      <div className="flex flex-col sm:flex-row justify-between text-xs text-gray-500 gap-2">
                        <div className="flex gap-3">
                          <span className="flex items-center">
                            <Users size={14} className="mr-1" />
                            {campaign.influencers}/{campaign.maxInfluencers} influencers
                          </span>
                          <span className="flex items-center">
                            <BarChart2 size={14} className="mr-1" />
                            {campaign.impressions.toLocaleString()} impressions
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setSelectedCampaign(campaign);
                              setShowApplicationsModal(true);
                            }}
                            className="text-indigo-600 hover:text-indigo-900 font-medium"
                          >
                            Applications
                          </button>
                          <button
                            onClick={() => {
                              setSelectedCampaign(campaign);
                              setShowSubmissionsModal(true);
                            }}
                            className="text-indigo-600 hover:text-indigo-900 font-medium"
                          >
                            Submissions
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
            </ul>
          </div>
        </div>
      </main>

      {/* Create Campaign Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-auto">
            <h2 className="text-lg font-medium mb-4">Create Campaign</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Campaign Brief</label>
                <textarea
                  value={formData.brief}
                  onChange={(e) => setFormData({ ...formData, brief: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-sm"
                  rows={4}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Budget (cUSD)</label>
                <input
                  type="number"
                  value={formData.budget}
                  onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Max Influencers</label>
                <input
                  type="number"
                  value={formData.maxInfluencers}
                  onChange={(e) => setFormData({ ...formData, maxInfluencers: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">End Date</label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-sm"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCampaign}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Applications Modal */}
      {showApplicationsModal && selectedCampaign && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-auto max-h-[80vh] overflow-y-auto">
            <h2 className="text-lg font-medium mb-4">Applications for {selectedCampaign.name}</h2>
            <ul className="divide-y divide-gray-200">
              {(mockApplications[selectedCampaign.id] || []).map((applicant, index) => (
                <li key={index} className="py-4">
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{applicant.username}</p>
                        <p className="text-xs text-gray-500 truncate">{applicant.address}</p>
                        <p className="text-xs text-gray-500">Followers: {applicant.followers.toLocaleString()}</p>
                      </div>
                      {selectedCampaign.influencers < selectedCampaign.maxInfluencers && (
                        <button
                          onClick={() => handleAssignInfluencer(selectedCampaign.id, applicant.address)}
                          className="px-3 py-1 text-sm text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                          disabled={mockSubmissions[selectedCampaign.id]?.some(
                            (sub) => sub.address === applicant.address
                          )}
                        >
                          Assign
                        </button>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{applicant.message}</p>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowApplicationsModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submissions Modal */}
      {showSubmissionsModal && selectedCampaign && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-auto max-h-[80vh] overflow-y-auto">
            <h2 className="text-lg font-medium mb-4">Submissions for {selectedCampaign.name}</h2>
            <ul className="divide-y divide-gray-200">
              {(mockSubmissions[selectedCampaign.id] || []).map((submission, index) => (
                <li key={index} className="py-4">
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{submission.username}</p>
                        <p className="text-xs text-gray-500 truncate">{submission.address}</p>
                        {submission.postLink ? (
                          <a
                            href={submission.postLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center"
                          >
                            <LinkIcon size={14} className="mr-1" />
                            View Post
                          </a>
                        ) : (
                          <p className="text-xs text-gray-500">No post submitted</p>
                        )}
                      </div>
                      {!submission.paid && submission.postLink && (
                        <button
                          onClick={() => handleReleaseFunds(selectedCampaign.id, submission.address)}
                          className="px-3 py-1 text-sm text-white bg-green-600 rounded-md hover:bg-green-700 flex items-center"
                        >
                          <CheckCircle size={14} className="mr-1" />
                          Release Funds
                        </button>
                      )}
                      {submission.paid && (
                        <span className="text-xs text-green-600 flex items-center">
                          <CheckCircle size={14} className="mr-1" />
                          Paid
                        </span>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowSubmissionsModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BrandDashboard;