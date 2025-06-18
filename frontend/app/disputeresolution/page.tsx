"use client";
import React, { useState, useEffect, useMemo } from "react";
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
  Shield,
  Ban,
  Loader2,
} from "lucide-react";
import { Toaster, toast } from "react-hot-toast";
import { format } from "date-fns";
import { useAccount, useReadContracts } from "wagmi";
import {
  useIsDisputeResolver,
  useResolveDispute,
} from "@/hooks/useDisputeResolution";
import { useGetAllBriefs } from "@/hooks/adsBazaar";
import { CONTRACT_ADDRESS } from "@/lib/contracts";
import ABI from "@/lib/AdsBazaar.json";
import { Brief, Application, DisputeStatus } from "@/types";
import { truncateAddress } from "@/utils/format";

interface DisputeData {
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
  disputeTimestamp: number;
}

interface Stats {
  totalDisputes: number;
  pendingDisputes: number;
  resolvedToday: number;
  avgResolutionTime: string;
}

const DISPUTE_RESOLUTION_DEADLINE = 2 * 24 * 60 * 60; // 2 days in seconds

const DisputeResolverDashboard: React.FC = () => {
  const [disputes, setDisputes] = useState<DisputeData[]>([]);
  const [filteredDisputes, setFilteredDisputes] = useState<DisputeData[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [selectedDispute, setSelectedDispute] = useState<DisputeData | null>(
    null
  );
  const [stats, setStats] = useState<Stats>({
    totalDisputes: 0,
    pendingDisputes: 0,
    resolvedToday: 0,
    avgResolutionTime: "0h",
  });
  const [isLoadingDisputes, setIsLoadingDisputes] = useState(true);

  const { address } = useAccount();
  const { isDisputeResolver, isLoadingResolver } =
    useIsDisputeResolver(address);
  const { briefs, isLoading: isLoadingBriefs } = useGetAllBriefs();
  const { resolveDispute, isResolving, resolveSuccess, resolveError } =
    useResolveDispute();

  // Fetch all disputes from blockchain
  useEffect(() => {
    const fetchDisputes = async () => {
      if (!briefs || briefs.length === 0) return;

      setIsLoadingDisputes(true);
      const disputeData: DisputeData[] = [];

      try {
        for (const brief of briefs) {
          // Get applications for each brief
          const response = await fetch(`/api/brief-applications/${brief.id}`);
          if (!response.ok) continue;

          const applicationsData = await response.json();
          if (!applicationsData.applications) continue;

          // Check each selected application for disputes
          for (const application of applicationsData.applications) {
            if (!application.isSelected || !application.proofLink) continue;

            try {
              // Get dispute details for this application
              const disputeResponse = await fetch(
                `/api/dispute-details/${brief.id}/${application.influencer}`
              );

              if (!disputeResponse.ok) continue;

              const disputeDetails = await disputeResponse.json();

              if (
                disputeDetails.disputeStatus === DisputeStatus.FLAGGED ||
                disputeDetails.disputeStatus === DisputeStatus.RESOLVED_VALID ||
                disputeDetails.disputeStatus === DisputeStatus.RESOLVED_INVALID
              ) {
                const dispute: DisputeData = {
                  id: `${brief.id}-${application.influencer}`,
                  briefId: brief.id,
                  influencer: application.influencer,
                  business: brief.business,
                  campaignTitle: brief.name,
                  flaggedDate: new Date(application.timestamp * 1000),
                  deadline: new Date(
                    (application.timestamp + DISPUTE_RESOLUTION_DEADLINE) * 1000
                  ),
                  reason:
                    disputeDetails.disputeReason ||
                    "Dispute reason not provided",
                  proofLink: application.proofLink,
                  status:
                    disputeDetails.disputeStatus === DisputeStatus.FLAGGED
                      ? "FLAGGED"
                      : disputeDetails.disputeStatus ===
                        DisputeStatus.RESOLVED_VALID
                      ? "RESOLVED_VALID"
                      : "RESOLVED_INVALID",
                  priority: determinePriority(
                    brief.budget,
                    application.timestamp
                  ),
                  category: determineCategory(
                    disputeDetails.disputeReason || ""
                  ),
                  amount: brief.budget / brief.maxInfluencers,
                  disputeTimestamp: application.timestamp,
                };

                disputeData.push(dispute);
              }
            } catch (err) {
              console.error(
                `Error fetching dispute for ${brief.id}-${application.influencer}:`,
                err
              );
            }
          }
        }

        setDisputes(disputeData);

        // Calculate stats
        const pending = disputeData.filter(
          (d) => d.status === "FLAGGED"
        ).length;
        const resolvedToday = disputeData.filter(
          (d) =>
            d.status !== "FLAGGED" &&
            new Date(d.flaggedDate).toDateString() === new Date().toDateString()
        ).length;

        setStats({
          totalDisputes: disputeData.length,
          pendingDisputes: pending,
          resolvedToday: resolvedToday,
          avgResolutionTime: "4.2h", // This would need to be calculated from historical data
        });
      } catch (err) {
        console.error("Error fetching disputes:", err);
        toast.error("Failed to load disputes");
      } finally {
        setIsLoadingDisputes(false);
      }
    };

    if (!isLoadingBriefs) {
      fetchDisputes();
    }
  }, [briefs, isLoadingBriefs]);

  // Helper functions
  const determinePriority = (
    budget: number,
    timestamp: number
  ): "HIGH" | "MEDIUM" | "LOW" => {
    const now = Date.now() / 1000;
    const timeSinceFlag = now - timestamp;
    const daysSinceFlag = timeSinceFlag / (24 * 60 * 60);

    if (budget > 1000 || daysSinceFlag > 1.5) return "HIGH";
    if (budget > 500 || daysSinceFlag > 1) return "MEDIUM";
    return "LOW";
  };

  const determineCategory = (reason: string): string => {
    const reasonLower = reason.toLowerCase();
    if (reasonLower.includes("quality") || reasonLower.includes("content"))
      return "Content Quality";
    if (reasonLower.includes("late") || reasonLower.includes("time"))
      return "Timeline";
    if (reasonLower.includes("copy") || reasonLower.includes("plagiar"))
      return "Plagiarism";
    if (reasonLower.includes("requirement")) return "Requirements";
    return "Other";
  };

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

  // Handle dispute resolution
  const handleResolveDispute = async (disputeId: string, isValid: boolean) => {
    const dispute = disputes.find((d) => d.id === disputeId);
    if (!dispute) {
      toast.error("Dispute not found");
      return;
    }

    try {
      await resolveDispute(
        dispute.briefId as `0x${string}`,
        dispute.influencer as `0x${string}`,
        isValid
      );

      // Update local state
      setDisputes((prev) =>
        prev.map((d) =>
          d.id === disputeId
            ? {
                ...d,
                status: isValid ? "RESOLVED_VALID" : "RESOLVED_INVALID",
              }
            : d
        )
      );

      toast.success(`Dispute resolved as ${isValid ? "valid" : "invalid"}`);
      setSelectedDispute(null);
    } catch (error) {
      console.error("Error resolving dispute:", error);
      toast.error("Failed to resolve dispute");
    }
  };

  // Handle resolve success
  useEffect(() => {
    if (resolveSuccess) {
      // Refresh disputes data
      window.location.reload();
    }
  }, [resolveSuccess]);

  // Handle resolve error
  useEffect(() => {
    if (resolveError) {
      toast.error(`Failed to resolve dispute: ${resolveError.message}`);
    }
  }, [resolveError]);

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

  // Show access control message for non-resolvers
  if (isLoadingResolver) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pt-20 sm:pt-24 md:pt-40 pb-20">
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
        </div>
      </div>
    );
  }

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
                {isDisputeResolver && (
                  <span className="ml-1 inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <Shield className="w-3 h-3 mr-1" />
                    Authorized Resolver
                  </span>
                )}
              </h1>
              <p className="text-xs sm:text-sm md:text-xl text-slate-400 mt-0.5">
                {isDisputeResolver
                  ? "Manage and resolve campaign disputes"
                  : "View public dispute resolution activity (read-only)"}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Access Control Notice for Non-Resolvers */}
        {!isDisputeResolver && (
          <motion.div
            className="mb-6 bg-blue-500/10 border border-blue-500/20 rounded-xl p-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg border border-blue-500/30">
                <Eye className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Public Transparency View
                </h3>
                <p className="text-sm text-blue-400">
                  You can view all dispute resolution activity for transparency.
                  Only authorized dispute resolvers can take action on disputes.
                </p>
              </div>
            </div>
          </motion.div>
        )}

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

          {isLoadingDisputes ? (
            <div className="p-6 text-center">
              <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mx-auto mb-2" />
              <h3 className="text-base font-semibold text-white mb-1">
                Loading Disputes
              </h3>
              <p className="text-slate-400 text-xs">
                Fetching dispute data from blockchain...
              </p>
            </div>
          ) : filteredDisputes.length === 0 ? (
            <div className="p-6 text-center">
              <Scale className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <h3 className="text-base font-semibold text-white mb-1">
                No Disputes
              </h3>
              <p className="text-slate-400 text-xs">
                {disputes.length === 0
                  ? "No disputes have been raised on the platform."
                  : "No disputes match the current filters."}
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
                            {truncateAddress(dispute.briefId)}
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
                        ${dispute.amount.toFixed(0)}
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
                          {isDisputeResolver ? "Review" : "View"}
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
            canResolve={isDisputeResolver}
            isResolving={isResolving}
          />
        )}
      </div>
    </div>
  );

export default DisputeResolverDashboard;
