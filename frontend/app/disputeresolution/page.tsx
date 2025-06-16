"use client";
import React, { useState, useEffect } from "react";
import DisputeResolutionModal from "@/components/modals/DisputeResolutionModal";
import { motion } from "framer-motion";
import {
  Scale,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  ExternalLink,
  TrendingUp,
  Eye,
} from "lucide-react";
import { Toaster, toast } from "react-hot-toast";
import { format } from "date-fns";

interface Dispute {
  id: string;
  briefId: string;
  influencer: string;
  business: string;
  campaignTitle: string;
  flaggedDate: Date;
  deadline: Date;
  reason: string;
  proofLink: string;
  status: "FLAGGED" | "RESOLVED_VALID" | "RESOLVED_INVALID";
  priority: "HIGH" | "MEDIUM" | "LOW";
  category: string;
  amount: number;
}

interface Stats {
  totalDisputes: number;
  pendingDisputes: number;
  resolvedToday: number;
  avgResolutionTime: string;
}

const DisputeResolverDashboard: React.FC = () => {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [filteredDisputes, setFilteredDisputes] = useState<Dispute[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [stats, setStats] = useState<Stats>({
    totalDisputes: 0,
    pendingDisputes: 0,
    resolvedToday: 0,
    avgResolutionTime: "0h",
  });

  // Mock data - replace with actual blockchain data
  useEffect(() => {
    const mockDisputes: Dispute[] = [
      {
        id: "1",
        briefId: "0x1234...abcd",
        influencer: "0x5678...efgh",
        business: "0x9abc...def0",
        campaignTitle: "Summer Fashion Collection Campaign",
        flaggedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        reason:
          "Content does not match campaign requirements. Posted content appears to be generic and not specifically about our summer collection.",
        proofLink: "https://instagram.com/post/12345",
        status: "FLAGGED",
        priority: "HIGH",
        category: "Content Quality",
        amount: 1500,
      },
      {
        id: "2",
        briefId: "0x2345...bcde",
        influencer: "0x6789...fghi",
        business: "0xabcd...ef01",
        campaignTitle: "Tech Product Review",
        flaggedDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        deadline: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
        reason: "Late submission and content quality issues",
        proofLink: "https://youtube.com/watch/67890",
        status: "FLAGGED",
        priority: "MEDIUM",
        category: "Timeline",
        amount: 800,
      },
      {
        id: "3",
        briefId: "0x3456...cdef",
        influencer: "0x789a...ghij",
        business: "0xbcde...f012",
        campaignTitle: "Food Delivery App Promotion",
        flaggedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        deadline: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
        reason: "Plagiarized content from another influencer",
        proofLink: "https://tiktok.com/@user/video/123",
        status: "RESOLVED_VALID",
        priority: "HIGH",
        category: "Plagiarism",
        amount: 2000,
      },
    ];

    setDisputes(mockDisputes);
    setFilteredDisputes(mockDisputes);

    // Calculate stats
    const pending = mockDisputes.filter((d) => d.status === "FLAGGED").length;
    const resolvedToday = mockDisputes.filter(
      (d) =>
        d.status !== "FLAGGED" &&
        new Date(d.flaggedDate).toDateString() === new Date().toDateString()
    ).length;

    setStats({
      totalDisputes: mockDisputes.length,
      pendingDisputes: pending,
      resolvedToday: resolvedToday,
      avgResolutionTime: "4.2h",
    });
  }, []);

  // Filter disputes based on search and filters
  useEffect(() => {
    let filtered = disputes;

    if (searchTerm) {
      filtered = filtered.filter(
        (dispute) =>
          dispute.campaignTitle
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          dispute.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
          dispute.briefId.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((dispute) => dispute.status === statusFilter);
    }

    if (priorityFilter !== "all") {
      filtered = filtered.filter(
        (dispute) => dispute.priority === priorityFilter
      );
    }

    setFilteredDisputes(filtered);
  }, [disputes, searchTerm, statusFilter, priorityFilter]);

  const handleResolveDispute = async (disputeId: string, isValid: boolean) => {
    console.log(
      `Resolving dispute ${disputeId} as ${isValid ? "valid" : "invalid"}`
    );

    // Simulate blockchain interaction
    setDisputes((prev) =>
      prev.map((dispute) =>
        dispute.id === disputeId
          ? {
              ...dispute,
              status: isValid ? "RESOLVED_VALID" : "RESOLVED_INVALID",
            }
          : dispute
      )
    );
    toast.success(`Dispute resolved as ${isValid ? "valid" : "invalid"}`);
    setSelectedDispute(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "FLAGGED":
        return "bg-amber-500/20 text-amber-400 border-amber-500/30";
      case "RESOLVED_VALID":
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
      case "RESOLVED_INVALID":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      default:
        return "bg-slate-700/50 text-slate-400 border-slate-700";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "HIGH":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      case "MEDIUM":
        return "bg-amber-500/20 text-amber-400 border-amber-500/30";
      case "LOW":
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
      default:
        return "bg-slate-700/50 text-slate-400 border-slate-700";
    }
  };

  const getTimeRemaining = (deadline: Date) => {
    const now = new Date();
    const diff = deadline.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (diff <= 0) return "Expired";
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h`;
    return "Expired";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pt-20 sm:pt-24 md:pt-40 pb-20">
      <Toaster position="top-right" />

      <div className="px-4 sm:px-6 md:px-8 py-8">
        {/* Header */}
        <motion.div
          className="mb-6"
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
              <Scale className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl md:text-3xl font-bold text-white flex items-center gap-1.5">
                AdsBazaar Dispute Resolution
                <span className="ml-1 inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Resolver
                </span>
              </h1>
              <p className="text-xs sm:text-sm md:text-xl text-slate-400 mt-0.5">
                Manage and resolve campaign disputes
              </p>
            </div>
          </div>
        </motion.div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            {
              icon: TrendingUp,
              value: stats.totalDisputes,
              label: "Total Disputes",
              color: "blue-400",
            },
            {
              icon: Clock,
              value: stats.pendingDisputes,
              label: "Pending",
              color: "amber-400",
            },
            {
              icon: CheckCircle,
              value: stats.resolvedToday,
              label: "Resolved Today",
              color: "emerald-400",
            },
            {
              icon: AlertTriangle,
              value: stats.avgResolutionTime,
              label: "Avg Resolution",
              color: "purple-400",
            },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              className="bg-slate-800/60 backdrop-blur-md border border-slate-700/50 rounded-lg p-2.5 transition-all duration-200 shadow-sm"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: 0.05 * index }}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div
                  className={`p-1 bg-${stat.color}/10 rounded-md border border-${stat.color}/20`}
                >
                  <stat.icon className={`w-3.5 h-3.5 text-${stat.color}`} />
                </div>
              </div>
              <p className="text-base font-bold text-white">{stat.value}</p>
              <p className="text-[10px] text-slate-400">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Filters and Search */}
        <motion.div
          className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-lg p-3 sm:p-4 mb-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search disputes..."
                className="w-full pl-10 pr-4 py-2 bg-slate-900/50 border border-slate-700/50 rounded-md text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-3">
              <select
                className="px-4 py-2 bg-slate-900/50 border border-slate-700/50 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="FLAGGED">Flagged</option>
                <option value="RESOLVED_VALID">Resolved Valid</option>
                <option value="RESOLVED_INVALID">Resolved Invalid</option>
              </select>
              <select
                className="px-4 py-2 bg-slate-900/50 border border-slate-700/50 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
              >
                <option value="all">All Priority</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Disputes Table */}
        <motion.div
          className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-lg overflow-hidden"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="p-3 sm:p-4 border-b border-slate-700/50 bg-gradient-to-r from-slate-800 to-slate-900">
            <div className="flex items-center justify-between">
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-1.5">
                <Scale className="w-5 h-5 text-emerald-400" />
                Disputes
              </h2>
              <span className="text-xs text-slate-400">
                {filteredDisputes.length}
              </span>
            </div>
          </div>
          {filteredDisputes.length === 0 ? (
            <div className="p-6 text-center">
              <Scale className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <h3 className="text-base font-semibold text-white mb-1">
                No Disputes
              </h3>
              <p className="text-slate-400 text-xs">
                No disputes match the current filters.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-700/50">
                <thead className="bg-slate-800/50">
                  <tr>
                    {[
                      "Campaign",
                      "Status",
                      "Priority",
                      "Amount",
                      "Deadline",
                      "Actions",
                    ].map((header) => (
                      <th
                        key={header}
                        className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {filteredDisputes.map((dispute, index) => (
                    <motion.tr
                      key={dispute.id}
                      className="hover:bg-slate-700/50"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: index * 0.05 }}
                    >
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-white">
                            {dispute.campaignTitle}
                          </div>
                          <div className="text-xs text-slate-400">
                            {dispute.briefId}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-[10px] font-semibold rounded-full ${getStatusColor(
                            dispute.status
                          )}`}
                        >
                          {dispute.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-[10px] font-semibold rounded-full ${getPriorityColor(
                            dispute.priority
                          )}`}
                        >
                          {dispute.priority}
                        </span>
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-white">
                        ${dispute.amount}
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-white">
                        {getTimeRemaining(dispute.deadline)}
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <motion.button
                          onClick={() => setSelectedDispute(dispute)}
                          className="flex items-center gap-1 px-2 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 rounded-md border border-emerald-500/30 text-xs"
                          whileTap={{ scale: 0.95 }}
                        >
                          <Eye className="w-3 h-3" />
                          Review
                        </motion.button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

        {/* Dispute Detail Modal */}
        {selectedDispute && (
          <DisputeResolutionModal
            dispute={selectedDispute}
            onResolveDispute={handleResolveDispute}
            onClose={() => setSelectedDispute(null)}
            getStatusColor={getStatusColor}
            getPriorityColor={getPriorityColor}
          />
        )}
      </div>
    </div>
  );
};

export default DisputeResolverDashboard;
