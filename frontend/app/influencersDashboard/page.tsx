"use client";



import { useState, useEffect } from "react";

import {
  Search,
  TrendingUp,
  CheckCircle,
  DollarSign,
  Target,
  Calendar,
  ArrowRight,
  Clock,
  Users,
  Award,
  Star,
  MessageCircle,
  AlertCircle,
  Briefcase,
  ChevronRight,
  Bell,
  Eye,
  Wallet,
  Link,
  Copy,
  ExternalLink,
  Hash,
  Shield
} from "lucide-react";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useProfile } from '@farcaster/auth-kit';
import { useAccount,useBalance} from "wagmi";

export default function InfluencerDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const { data: session, status } = useSession();
  const router = useRouter();
    const [walletConnected, setWalletConnected] = useState(true);
  const [walletAddress, setWalletAddress] = useState("0x7A2D...F42B");
  const [isMounted, setIsMounted] = useState(false);
  const {isConnected, address} = useAccount();
  const [cUSDBalance, setCUSDBalance] = useState("1,350.75");

  const {
    isAuthenticated,
    profile: { username, fid, bio, displayName, pfpUrl },
  } = useProfile();
    
    const { data: celoBalance } = useBalance({
  address: address,
  // No token address needed for native token
  enabled: isConnected,
  watch: true,
})


useEffect(() => {
  setIsMounted(true);
  setWalletConnected(isConnected);
  if (address) {
    setWalletAddress(`${address.slice(0, 6)}...${address.slice(-4)}`);
  }
}, [isConnected, address]);
  // Sample applied campaigns data
  const appliedCampaigns = [
    {
      id: 1,
      title: "Promote DeFi Savings App",
      brand: "CeloYield Finance",
      budget: 1500,
      audience: "Crypto enthusiasts, 18-35",
      status: "Under Review",
      appliedDate: "May 5, 2025",
    },
    {
      id: 2,
      title: "NFT Collection Launch",
      brand: "MetaCreators",
      budget: 2000,
      audience: "NFT collectors, 25-45",
      status: "Accepted",
      appliedDate: "May 2, 2025",
    },
    {
      id: 3,
      title: "Sustainable DeFi Protocol",
      brand: "GreenDAO",
      budget: 1200,
      audience: "Eco-conscious crypto users, 20-40",
      status: "Rejected",
      appliedDate: "April 28, 2025",
    },
  ];

  // Sample active campaigns (campaigns where the influencer was accepted)
  const activeCampaigns = [
    {
      id: 1,
      title: "NFT Collection Launch",
      brand: "MetaCreators",
      budget: 2000,
      progress: 40,
      deadline: "May 20, 2025",
      contractAddress: "0x8bc3...5f2a",
      tasks: [
        { name: "Initial Farcaster cast", status: "completed" },
        { name: "Story series on Lens", status: "in progress" },
        { name: "Final review video", status: "pending" }
      ]
    },
    {
      id: 2,
      title: "Web3 Gaming Platform",
      brand: "PlayToEarn DAO",
      budget: 1800,
      progress: 75,
      deadline: "May 15, 2025",
      contractAddress: "0x3fe1...9d7c",
      tasks: [
        { name: "Demo gameplay cast", status: "completed" },
        { name: "Referral program post", status: "completed" },
        { name: "AMA session", status: "in progress" }
      ]
    }
  ];

  // Sample transaction history
  const transactionHistory = [
    {
      id: 1,
      type: "payment",
      amount: "1,200 cUSD",
      from: "PlayToEarn DAO",
      date: "May 10, 2025",
      txHash: "0x7fe3...8c4d",
      status: "confirmed"
    },
    {
      id: 2,
      type: "payment",
      amount: "800 cUSD",
      from: "DeFi Aggregator",
      date: "May 3, 2025",
      txHash: "0x2ab1...9e6f",
      status: "confirmed"
    },
    {
      id: 3,
      type: "contract",
      amount: "2,000 cUSD",
      from: "MetaCreators",
      date: "May 2, 2025",
      txHash: "0x9cd4...3b2a",
      status: "pending"
    }
  ];

  // Sample notifications
  const notifications = [
    {
      id: 1,
      type: "message",
      content: "MetaCreators sent you a message about your NFT campaign",
      time: "2 hours ago"
    },
    {
      id: 2,
      type: "application",
      content: "Your application for DeFi Savings App was received",
      time: "1 day ago"
    },
    {
      id: 3,
      type: "payment",
      content: "Payment of 1,200 cUSD has been confirmed on Celo blockchain",
      time: "2 days ago"
    }
  ];

  // Sample Farcaster metrics
  const farcasterMetrics = {
    engagement: "4.8%",
    reach: "45.2K",
    followers: "12.4K",
    recastRate: "6.2%"
  };

  // Campaign opportunities
  const campaignOpportunities = [
    {
      id: 1,
      title: "Celo DeFi Onboarding",
      brand: "Celo Foundation",
      budget: "3,000-4,000 cUSD",
      duration: "2 weeks",
      requirements: "Min 10K followers, 3+ crypto posts"
    },
    {
      id: 2,
      title: "NFT Community Growth",
      brand: "PixelVerse",
      budget: "1,500-2,500 cUSD",
      duration: "3 weeks",
      requirements: "NFT enthusiast audience, 5K+ followers"
    }
  ];

  // Status badge color mapping
  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case "accepted":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "under review":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  
    const getTransactionStatusIcon = (status) => {
    switch (status) {
      case "confirmed":
        return <CheckCircle size={16} className="text-green-500" />;
      case "pending":
        return <Clock size={16} className="text-yellow-500" />;
      case "failed":
        return <AlertCircle size={16} className="text-red-500" />;
      default:
        return null;
    }
  };

  // Task status icon mapping
  const getTaskStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return <CheckCircle size={16} className="text-green-500" />;
      case "in progress":
        return <Clock size={16} className="text-yellow-500" />;
      case "pending":
        return <AlertCircle size={16} className="text-gray-400" />;
      default:
        return null;
    }
  };
   if (!isMounted) {
    return null;
   }

  useEffect(() => {
    // If not authenticated, redirect to home
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);
   
  if (status === "loading") {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      {/* Main Content */}

      <main className="flex-grow px-6">
          <div className=" mx-auto px-4 py-8">
            {/* Welcome Section */}
            <div className="mb-8 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-300 mb-2">
                Farcaster ID: {session.user.id}
                </h2>
                <h2 className="text-2xl font-bold text-gray-300 mb-2">
                Farcaster Username: {session.user.name}
                </h2>
                <p className="text-gray-200">
                  Here's what's happening with your campaigns and earnings.
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {walletConnected ? (
                <div className="bg-gray-800 rounded-lg px-4 py-2 flex items-center">
                  <div>
                    <div className="flex items-center">
                      <span className="text-green-400 mr-2">●</span>
                      <span className="text-gray-300 font-medium">{walletAddress}</span>
                      <button className="ml-2 text-gray-400 hover:text-gray-300">
                        <Copy size={14} />
                      </button>
                    </div>
                    <div className="flex items-center mt-1 text-sm">
                      <span className="text-gray-400 mr-2">
                        {celoBalance?.formatted ? `${parseFloat(celoBalance.formatted).toFixed(2)} CELO` : '0.00 CELO'}
                      </span>
                      <span className="text-gray-400">{cUSDBalance} cUSD</span>
                    </div>
                  </div>
                </div>
              ) : (
                <button 
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center"
                  onClick={() => setWalletConnected(true)}
                >
                  <Wallet size={18} className="mr-2" />
                  Connect Wallet
                </button>
              )}
            </div>
          </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">


              <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-gray-500 text-sm">Active Campaigns</p>
                    <h3 className="text-2xl font-bold text-gray-800 mt-1">
                      {activeCampaigns.length}
                    </h3>
                  </div>
                  <div className="bg-green-100 p-2 rounded-lg">
                    <Briefcase size={20} className="text-green-600" />
                  </div>
                </div>
                <p className="text-green-600 text-sm mt-4 flex items-center">
                  <CheckCircle size={16} className="mr-1" />
                  {activeCampaigns.length} campaigns in progress
                </p>
              </div>

              <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-gray-500 text-sm">Pending Payment</p>
                    <h3 className="text-2xl font-bold text-gray-800 mt-1">
                      2,000 cUSD
                    </h3>
                  </div>
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <Clock size={20} className="text-blue-600" />
                  </div>
                </div>
                <p className="text-blue-600 text-sm mt-4 flex items-center">
                  <Clock size={16} className="mr-1" />
                  Smart contracts pending completion
                </p>
              </div>

              <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-gray-500 text-sm">Farcaster Followers</p>
                    <h3 className="text-2xl font-bold text-gray-800 mt-1">
                      {farcasterMetrics.followers}
                    </h3>
                  </div>
                  <div className="bg-purple-100 p-2 rounded-lg">
                    <Users size={20} className="text-purple-600" />
                  </div>
                </div>
                <p className="text-purple-600 text-sm mt-4 flex items-center">
                  <TrendingUp size={16} className="mr-1" />
                  +243 new followers this month
                </p>
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* Active Campaigns */}
              <div className="lg:col-span-2">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-gray-300">
                    Active Smart Contracts
                  </h3>
                  <a
                    href="#"
                    className="text-indigo-400 hover:text-indigo-300 text-sm font-medium flex items-center"
                  >
                    View All <ChevronRight size={16} className="ml-1" />
                  </a>
                </div>
                <div className="space-y-4">
                  {activeCampaigns.map(campaign => (
                    <div key={campaign.id} className="bg-white rounded-lg shadow p-5">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-semibold text-gray-900">{campaign.title}</h4>
                          <p className="text-sm text-gray-500">{campaign.brand}</p>
                        </div>
                        <span className="text-green-600 font-medium">{campaign.budget} cUSD</span>
                      </div>
                      <div className="mb-3 text-sm text-gray-500 flex items-center">
                        <Hash size={14} className="mr-1" />
                        Contract: <a href="#" className="ml-1 text-indigo-600 hover:underline">{campaign.contractAddress}</a>
                        <button className="ml-2 text-gray-400 hover:text-indigo-600">
                          <Copy size={14} />
                        </button>
                        <a href="#" className="ml-2 text-gray-400 hover:text-indigo-600">
                          <ExternalLink size={14} />
                        </a>
                      </div>
                      <div className="mb-4">
                        <div className="flex justify-between mb-1">
                          <span className="text-xs text-gray-500">Completion</span>
                          <span className="text-xs font-medium text-gray-700">{campaign.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-indigo-600 h-2 rounded-full" style={{ width: `${campaign.progress}%` }}></div>
                        </div>
                      </div>
                      <div className="mb-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Deadline: {campaign.deadline}</span>
                          <span className="font-medium text-gray-700">Tasks: {campaign.tasks.filter(t => t.status === "completed").length}/{campaign.tasks.length}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {campaign.tasks.map((task, idx) => (
                          <div key={idx} className="flex items-center justify-between text-sm">
                            <div className="flex items-center">
                              {getTaskStatusIcon(task.status)}
                              <span className="ml-2">{task.name}</span>
                            </div>
                            <span className="capitalize text-gray-500">{task.status}</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex space-x-2 mt-4">
                        <button className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700 transition flex items-center justify-center">
                          Submit Proof
                        </button>
                        <button className="flex-1 bg-gray-100 text-gray-800 py-2 px-4 rounded hover:bg-gray-200 transition flex items-center justify-center">
                          View Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notifications and Transactions */}
              <div>
                <h3 className="text-xl font-bold text-gray-300 mb-4">
                  Blockchain Transactions
                </h3>
                <div className="bg-white rounded-lg shadow p-5">
                  <div className="space-y-4">
                    {transactionHistory.map(tx => (
                      <div key={tx.id} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                        <div className="flex items-start">
                          <div className="mr-3">
                            {tx.type === "payment" ? (
                              <div className="bg-green-100 p-2 rounded-full">
                                <DollarSign size={16} className="text-green-600" />
                              </div>
                            ) : (
                              <div className="bg-blue-100 p-2 rounded-full">
                                <Shield size={16} className="text-blue-600" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between">
                              <p className="text-sm font-medium text-gray-900">{tx.amount}</p>
                              <div className="flex items-center">
                                {getTransactionStatusIcon(tx.status)}
                                <span className="ml-1 text-xs text-gray-500 capitalize">{tx.status}</span>
                              </div>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">From: {tx.from}</p>
                            <div className="flex items-center mt-1">
                              <p className="text-xs text-gray-400 truncate">Tx: {tx.txHash}</p>
                              <button className="ml-1 text-gray-400 hover:text-gray-600">
                                <Copy size={12} />
                              </button>
                              <a href="#" className="ml-1 text-gray-400 hover:text-gray-600">
                                <ExternalLink size={12} />
                              </a>
                            </div>
                            <p className="text-xs text-gray-400 mt-1">{tx.date}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button className="mt-4 w-full bg-gray-100 text-gray-800 py-2 px-4 rounded hover:bg-gray-200 transition flex items-center justify-center">
                    View All Transactions
                  </button>
                </div>

                {/* Notifications */}
                <h3 className="text-xl font-bold text-gray-300 mt-6 mb-4">
                  Notifications
                </h3>
                <div className="bg-white rounded-lg shadow p-5">
                  <div className="space-y-4">
                    {notifications.map(notification => (
                      <div key={notification.id} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                        <div className="flex items-start">
                          <div className="mr-3">
                            {notification.type === "message" && (
                              <div className="bg-blue-100 p-2 rounded-full">
                                <MessageCircle size={16} className="text-blue-600" />
                              </div>
                            )}
                            {notification.type === "application" && (
                              <div className="bg-yellow-100 p-2 rounded-full">
                                <Briefcase size={16} className="text-yellow-600" />
                              </div>
                            )}
                            {notification.type === "payment" && (
                              <div className="bg-green-100 p-2 rounded-full">
                                <DollarSign size={16} className="text-green-600" />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">{notification.content}</p>
                            <p className="text-xs text-gray-400 mt-1">{notification.time}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button className="mt-4 w-full bg-gray-100 text-gray-800 py-2 px-4 rounded hover:bg-gray-200 transition flex items-center justify-center">
                    View All Notifications
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recommended Campaigns */}
              <div className="lg:col-span-2">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-gray-300">
                    Recommended Campaign Opportunities
                  </h3>
                  <a
                    href="#"
                    className="text-indigo-400 hover:text-indigo-300 text-sm font-medium flex items-center"
                  >
                    Browse All <ChevronRight size={16} className="ml-1" />
                  </a>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {campaignOpportunities.map(opportunity => (
                    <div key={opportunity.id} className="bg-white rounded-lg shadow p-5">
                      <h4 className="font-semibold text-gray-900">{opportunity.title}</h4>
                      <p className="text-sm text-gray-500 mb-3">{opportunity.brand}</p>
                      <div className="space-y-2 mb-4">
                        <div className="flex items-start">
                          <DollarSign size={16} className="text-gray-400 mr-2 mt-0.5" />
                          <p className="text-sm text-gray-600">{opportunity.budget}</p>
                        </div>
                        <div className="flex items-start">
                          <Calendar size={16} className="text-gray-400 mr-2 mt-0.5" />
                          <p className="text-sm text-gray-600">{opportunity.duration}</p>
                        </div>
                        <div className="flex items-start">
                          <Users size={16} className="text-gray-400 mr-2 mt-0.5" />
                          <p className="text-sm text-gray-600">{opportunity.requirements}</p>
                        </div>
                      </div>
                      <button className="w-full bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700 transition flex items-center justify-center">
                        Apply Now
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Farcaster Metrics */}
              <div>
                <h3 className="text-xl font-bold text-gray-300 mb-4">
                  Farcaster Performance
                </h3>
                <div className="bg-white rounded-lg shadow p-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center text-gray-500 text-sm mb-1">
                        <Star size={14} className="mr-1 text-yellow-500" />
                        <span>Engagement Rate</span>
                      </div>
                      <div className="text-2xl font-bold text-gray-800">{farcasterMetrics.engagement}</div>
                      <p className="text-green-600 text-xs mt-1 flex items-center">
                        <TrendingUp size={12} className="mr-1" />
                        +0.7% from last month
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center text-gray-500 text-sm mb-1">
                        <Users size={14} className="mr-1 text-blue-500" />
                        <span>Followers</span>
                      </div>
                      <div className="text-2xl font-bold text-gray-800">{farcasterMetrics.followers}</div>
                      <p className="text-green-600 text-xs mt-1 flex items-center">
                        <TrendingUp size={12} className="mr-1" />
                        +243 this month
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center text-gray-500 text-sm mb-1">
                        <Eye size={14} className="mr-1 text-purple-500" />
                        <span>Reach</span>
                      </div>
                      <div className="text-2xl font-bold text-gray-800">{farcasterMetrics.reach}</div>
                      <p className="text-green-600 text-xs mt-1 flex items-center">
                        <TrendingUp size={12} className="mr-1" />
                        +5.4K from last month
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center text-gray-500 text-sm mb-1">
                        <MessageCircle size={14} className="mr-1 text-green-500" />
                        <span>Recast Rate</span>
                      </div>
                      <div className="text-2xl font-bold text-gray-800">{farcasterMetrics.recastRate}</div>
                      <p className="text-green-600 text-xs mt-1 flex items-center">
                        <TrendingUp size={12} className="mr-1" />
                        +0.3% from last month
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 p-4 bg-indigo-50 rounded-lg">
                    <h4 className="text-sm font-medium text-indigo-800 mb-2">Creator Tier: Silver</h4>
                    <div className="w-full bg-indigo-200 rounded-full h-2 mb-2">
                      <div className="bg-indigo-600 h-2 rounded-full" style={{ width: "65%" }}></div>
                    </div>
                    <p className="text-xs text-indigo-600">
                      Complete 3 more campaigns to reach Gold Tier
                    </p>
                  </div>
                  <button className="mt-4 w-full bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700 transition flex items-center justify-center">
                    View Detailed Analytics
                  </button>
                </div>
              </div>
            </div>
          </div>
      
      </main>
      
    </div>
  );
}