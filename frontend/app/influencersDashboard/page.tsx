"use client";


import { useState } from "react";
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
  Eye
} from "lucide-react";

export default function InfluencerDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");

  // Sample applied campaigns data
  const appliedCampaigns = [
    {
      id: 1,
      title: "Summer Product Launch",
      brand: "EcoTech Solutions",
      budget: 1500,
      audience: "Tech enthusiasts, 18-35",
      status: "Under Review",
      appliedDate: "May 5, 2025",
    },
    {
      id: 2,
      title: "Brand Awareness Campaign",
      brand: "Healthy Bytes",
      budget: 2000,
      audience: "Health & fitness, 25-45",
      status: "Accepted",
      appliedDate: "May 2, 2025",
    },
    {
      id: 3,
      title: "Product Review Series",
      brand: "Style Sphere",
      budget: 1200,
      audience: "Fashion enthusiasts, 20-40",
      status: "Rejected",
      appliedDate: "April 28, 2025",
    },
  ];

  // Sample active campaigns (campaigns where the influencer was accepted)
  const activeCampaigns = [
    {
      id: 1,
      title: "Brand Awareness Campaign",
      brand: "Healthy Bytes",
      budget: 2000,
      progress: 40,
      deadline: "May 20, 2025",
      tasks: [
        { name: "Initial post", status: "completed" },
        { name: "Story series", status: "in progress" },
        { name: "Final review video", status: "pending" }
      ]
    },
    {
      id: 2,
      title: "Winter Collection Preview",
      brand: "Urban Trends",
      budget: 1800,
      progress: 75,
      deadline: "May 15, 2025",
      tasks: [
        { name: "Unboxing video", status: "completed" },
        { name: "Styling photos", status: "completed" },
        { name: "Review post", status: "in progress" }
      ]
    }
  ];

  // Sample earnings data
  const earningsData = {
    thisMonth: 3250,
    lastMonth: 2800,
    pending: 1800,
    ytd: 12450
  };

  // Sample notifications
  const notifications = [
    {
      id: 1,
      type: "message",
      content: "Healthy Bytes sent you a message about your campaign",
      time: "2 hours ago"
    },
    {
      id: 2,
      type: "application",
      content: "Your application for Summer Product Launch was received",
      time: "1 day ago"
    },
    {
      id: 3,
      type: "payment",
      content: "Payment of 1,500 cUSD has been processed",
      time: "2 days ago"
    }
  ];

  // Sample performance metrics
  const performanceMetrics = {
    engagement: "4.8%",
    reach: "45.2K",
    impressions: "68.9K",
    conversionRate: "3.2%"
  };

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

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      {/* Main Content */}
      <main className="flex-grow px-6">
        {activeTab === "dashboard" && (
          <div className=" mx-auto px-4 py-8">
            {/* Welcome Section */}
            <div className="mb-8 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-300 mb-2">
                  Welcome back, Alex!
                </h2>
                <p className="text-gray-200">
                  Here's what's happening with your campaigns and earnings.
                </p>
              </div>
            
            </div>

            {/* Earnings and Performance Stats */}
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
                      {earningsData.pending} cUSD
                    </h3>
                  </div>
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <Clock size={20} className="text-blue-600" />
                  </div>
                </div>
                <p className="text-blue-600 text-sm mt-4 flex items-center">
                  <Clock size={16} className="mr-1" />
                  Expected within 7 days
                </p>
              </div>
            </div>

            {/* Current Campaigns and Tasks */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* Active Campaigns */}
              <div className="lg:col-span-2">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-gray-300">
                    Active Campaigns
                  </h3>
                  <a
                    href="#"
                    className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center"
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
                      <div className="mb-4">
                        <div className="flex justify-between mb-1">
                          <span className="text-xs text-gray-500">Progress</span>
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
                      <button className="mt-4 w-full bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700 transition flex items-center justify-center">
                        Manage Campaign
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notifications and Updates */}
              <div>
                <h3 className="text-xl font-bold text-gray-300 mb-4">
                  Recent Notifications
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

            {/* Applied Campaigns and Performance Metrics */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Applied Campaigns */}
              <div className="lg:col-span-2">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-gray-300">
                    Applied Campaigns
                  </h3>
                  <a
                    href="#"
                    className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center"
                  >
                    Browse More <ChevronRight size={16} className="ml-1" />
                  </a>
                </div>
                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Campaign
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Budget
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Applied
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Status
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {appliedCampaigns.map((campaign) => (
                          <tr key={campaign.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {campaign.title}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {campaign.brand}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {campaign.budget} cUSD
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {campaign.appliedDate}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(campaign.status)}`}>
                                {campaign.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <a href="#" className="text-indigo-600 hover:text-indigo-900">
                                View Details
                              </a>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Performance Metrics */}
              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-4">
                  Performance Metrics
                </h3>
                <div className="bg-white rounded-lg shadow p-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center text-gray-500 text-sm mb-1">
                        <Star size={14} className="mr-1 text-yellow-500" />
                        <span>Engagement Rate</span>
                      </div>
                      <div className="text-2xl font-bold text-gray-800">{performanceMetrics.engagement}</div>
                      <p className="text-green-600 text-xs mt-1 flex items-center">
                        <TrendingUp size={12} className="mr-1" />
                        +0.7% from last month
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center text-gray-500 text-sm mb-1">
                        <Users size={14} className="mr-1 text-blue-500" />
                        <span>Reach</span>
                      </div>
                      <div className="text-2xl font-bold text-gray-800">{performanceMetrics.reach}</div>
                      <p className="text-green-600 text-xs mt-1 flex items-center">
                        <TrendingUp size={12} className="mr-1" />
                        +3.2K from last month
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center text-gray-500 text-sm mb-1">
                        <Eye size={14} className="mr-1 text-purple-500" />
                        <span>Impressions</span>
                      </div>
                      <div className="text-2xl font-bold text-gray-800">{performanceMetrics.impressions}</div>
                      <p className="text-green-600 text-xs mt-1 flex items-center">
                        <TrendingUp size={12} className="mr-1" />
                        +5.4K from last month
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center text-gray-500 text-sm mb-1">
                        <Target size={14} className="mr-1 text-red-500" />
                        <span>Conversion Rate</span>
                      </div>
                      <div className="text-2xl font-bold text-gray-800">{performanceMetrics.conversionRate}</div>
                      <p className="text-green-600 text-xs mt-1 flex items-center">
                        <TrendingUp size={12} className="mr-1" />
                        +0.3% from last month
                      </p>
                    </div>
                  </div>
                  <button className="mt-4 w-full bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700 transition flex items-center justify-center">
                    View Full Analytics
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

       
      </main>
    </div>
  );
}