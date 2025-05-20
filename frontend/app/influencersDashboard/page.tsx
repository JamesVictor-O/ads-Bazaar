"use client";

import { useState, useEffect } from "react";
import {
  Briefcase,
  DollarSign,
  Calendar,
  Clock,
  CheckCircle,
  Link as LinkIcon,
  Users,
  ChevronRight,
  Copy,
  ExternalLink,
  AlertCircle,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useProfile } from "@farcaster/auth-kit";
import { useAccount } from "wagmi";
import { format } from "date-fns";
import { useUserProfile } from "../../hooks/adsBazaar";
import Link from "next/link";

// Mock data for active campaigns
const activeCampaigns = [
  {
    id: 1,
    title: "Celo Mobile Banking Promo",
    brand: "CeloYield Finance",
    budget: 1500,
    deadline: "2025-06-01",
    tasks: [
      {
        name: "Farcaster post",
        status: "completed",
        postLink: "https://farcaster.com/user/post/123",
      },
      { name: "X thread", status: "pending", postLink: "" },
    ],
    paymentStatus: "pending",
    contractAddress: "0x8bc3...5f2a",
  },
  {
    id: 2,
    title: "Web3 Gaming Tournament",
    brand: "PlayToEarn DAO",
    budget: 1800,
    deadline: "2025-05-30",
    tasks: [
      {
        name: "Farcaster cast",
        status: "completed",
        postLink: "https://farcaster.com/user/post/456",
      },
      {
        name: "Lens story",
        status: "completed",
        postLink: "https://lens.xyz/post/789",
      },
    ],
    paymentStatus: "paid",
    contractAddress: "0x3fe1...9d7c",
  },
];

// Mock data for transactions
const transactionHistory = [
  {
    id: 1,
    type: "payment",
    amount: 1800,
    from: "PlayToEarn DAO",
    date: "2025-05-10",
    txHash: "0x7fe3...8c4d",
    status: "confirmed",
  },
];

export default function InfluencerDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { isConnected, address } = useAccount();
  const {
    isAuthenticated,
    profile: { username, fid, bio, displayName, pfpUrl },
  } = useProfile();
  const [isMounted, setIsMounted] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [campaigns, setCampaigns] = useState(activeCampaigns);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [postLink, setPostLink] = useState("");
  // Get user profile data
  const { userProfile, isLoadingProfile } = useUserProfile();

  useEffect(() => {
    setIsMounted(true);
    if (isConnected && address) {
      setWalletAddress(`${address.slice(0, 6)}...${address.slice(-4)}`);
    }
  }, [isConnected, address]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  const handleSubmitPost = (campaignId, taskName) => {
    setCampaigns((prev) =>
      prev.map((campaign) =>
        campaign.id === campaignId
          ? {
              ...campaign,
              tasks: campaign.tasks.map((task) =>
                task.name === taskName
                  ? { ...task, status: "completed", postLink }
                  : task
              ),
            }
          : campaign
      )
    );
    setShowSubmitModal(false);
    setPostLink("");
  };

  const simulateFundRelease = (campaignId) => {
    setCampaigns((prev) =>
      prev.map((campaign) =>
        campaign.id === campaignId
          ? { ...campaign, paymentStatus: "paid" }
          : campaign
      )
    );
    setTransactionHistory((prev) => [
      ...prev,
      {
        id: prev.length + 1,
        type: "payment",
        amount: campaigns.find((c) => c.id === campaignId).budget,
        from: campaigns.find((c) => c.id === campaignId).brand,
        date: format(new Date(), "yyyy-MM-dd"),
        txHash: `0x${Math.random().toString(16).slice(2, 10)}...abcd`,
        status: "confirmed",
      },
    ]);
  };

  const getTaskStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return <CheckCircle size={16} className="text-green-500" />;
      case "pending":
        return <AlertCircle size={16} className="text-gray-400" />;
      default:
        return null;
    }
  };

  if (!isMounted || status === "loading") {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  // If user is not registered or not an influencer, show a message
  if (!userProfile?.isRegistered || !userProfile?.isInfluencer) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center p-8 max-w-md">
          <h2 className="text-2xl font-bold mb-4">Account Required</h2>
          <p className="mb-6">
            You need to register as an influencer to access the dashboard.
          </p>
          <Link href={"/"}>
            <button className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
              Register as Influencer
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pt-3">
      <main className="flex-grow p-4 sm:p-6">
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">
              Welcome, {username || displayName || "Influencer"}
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Manage your campaigns and track earnings.
            </p>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <div className="bg-white shadow rounded-lg p-4 flex items-center">
            <div className="rounded-md bg-indigo-50 p-2">
              <Briefcase className="h-5 w-5 text-indigo-600" />
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-500">
                Active Campaigns
              </p>
              <p className="text-lg font-semibold text-gray-900">
                {campaigns.length}
              </p>
            </div>
          </div>
          <div className="bg-white shadow rounded-lg p-4 flex items-center">
            <div className="rounded-md bg-green-50 p-2">
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-500">
                Total Earnings
              </p>
              <p className="text-lg font-semibold text-gray-900">
                {transactionHistory.reduce((sum, tx) => sum + tx.amount, 0)}{" "}
                cUSD
              </p>
            </div>
          </div>
          <div className="bg-white shadow rounded-lg p-4 flex items-center">
            <div className="rounded-md bg-purple-50 p-2">
              <Users className="h-5 w-5 text-purple-600" />
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-500">
                Farcaster Followers
              </p>
              <p className="text-lg font-semibold text-gray-900">12.4K</p>
            </div>
          </div>
        </div>

        {/* Active Campaigns */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-900">
              Active Campaigns
            </h2>
            <button className="text-sm text-indigo-600 hover:text-indigo-800">
              View All
            </button>
          </div>
          <div className="space-y-4">
            {campaigns.map((campaign) => (
              <div key={campaign.id} className="bg-white shadow rounded-lg p-4">
                <div className="flex flex-col gap-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">
                        {campaign.title}
                      </h3>
                      <p className="text-xs text-gray-500">{campaign.brand}</p>
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {campaign.budget} cUSD
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 flex flex-wrap gap-2">
                    <span className="flex items-center">
                      <Calendar size={12} className="mr-1" />
                      {format(new Date(campaign.deadline), "MMM d, yyyy")}
                    </span>
                    <span className="flex items-center">
                      <Clock size={12} className="mr-1" />
                      {Math.ceil(
                        (new Date(campaign.deadline) - new Date()) /
                          (1000 * 60 * 60 * 24)
                      )}{" "}
                      days left
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    <span className="flex items-center">
                      Contract:{" "}
                      <a
                        href="#"
                        className="ml-1 text-indigo-600 hover:underline truncate"
                      >
                        {campaign.contractAddress}
                      </a>
                      <button className="ml-1 text-gray-400 hover:text-indigo-600">
                        <Copy size={12} />
                      </button>
                      <a
                        href="#"
                        className="ml-1 text-gray-400 hover:text-indigo-600"
                      >
                        <ExternalLink size={12} />
                      </a>
                    </span>
                  </div>
                  <div className="space-y-2">
                    {campaign.tasks.map((task, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-sm"
                      >
                        <div className="flex items-center">
                          {getTaskStatusIcon(task.status)}
                          <span className="ml-2 text-xs">{task.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {task.status === "completed" && task.postLink ? (
                            <a
                              href={task.postLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-white bg-indigo-600 p-2 rounded hover:text-gray-200 flex items-center text-xs"
                            >
                              <LinkIcon size={12} className="mr-1" />
                              View
                            </a>
                          ) : (
                            <button
                              onClick={() => {
                                setSelectedCampaign(campaign);
                                setShowSubmitModal(true);
                              }}
                              className="text-white hover:text-gray-200 rounded  bg-indigo-600 p-2 text-xs"
                              disabled={task.status === "completed"}
                            >
                              Submit Link
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between items-center">
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        campaign.paymentStatus === "paid"
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      Payment: {campaign.paymentStatus}
                    </span>
                    {campaign.paymentStatus !== "paid" &&
                      campaign.tasks.every((t) => t.status === "completed") && (
                        <button
                          onClick={() => simulateFundRelease(campaign.id)}
                          className="text-green-600 hover:text-green-800 text-xs flex items-center"
                        >
                          <CheckCircle size={12} className="mr-1" />
                          Simulate Fund Release
                        </button>
                      )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Transactions */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-900">
              Recent Transactions
            </h2>
            <button className="text-sm text-indigo-600 hover:text-indigo-800">
              View All
            </button>
          </div>
          <div className="bg-white shadow rounded-lg p-4">
            {transactionHistory.length === 0 ? (
              <p className="text-sm text-gray-500">No transactions yet.</p>
            ) : (
              transactionHistory.map((tx) => (
                <div
                  key={tx.id}
                  className="py-2 border-b border-gray-200 last:border-0"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {tx.amount} cUSD
                      </p>
                      <p className="text-xs text-gray-500">From: {tx.from}</p>
                      <p className="text-xs text-gray-500">{tx.date}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 capitalize">
                        {tx.status}
                      </span>
                      <a
                        href="#"
                        className="text-indigo-600 hover:text-indigo-800 text-xs truncate"
                      >
                        {tx.txHash}
                      </a>
                      <button className="text-gray-400 hover:text-indigo-600">
                        <Copy size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* Submit Post Link Modal */}
      {showSubmitModal && selectedCampaign && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-auto">
            <h2 className="text-lg font-medium mb-4">Submit Post Link</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Campaign
                </label>
                <p className="text-sm text-gray-900">
                  {selectedCampaign.title}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Post Link
                </label>
                <input
                  type="url"
                  value={postLink}
                  onChange={(e) => setPostLink(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-sm"
                  placeholder="https://farcaster.com/post/..."
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  handleSubmitPost(
                    selectedCampaign.id,
                    selectedCampaign.tasks.find((t) => t.status === "pending")
                      ?.name
                  )
                }
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                disabled={!postLink}
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
