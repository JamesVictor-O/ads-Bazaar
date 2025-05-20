"use client";

import { useState, useEffect } from "react";
import { SubmitPostModal } from "../../components/modals/SubmitPostModal";
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
  Shield,
  X,
  Clock3,
  CheckSquare,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useProfile } from "@farcaster/auth-kit";
import { useAccount } from "wagmi";
import { format, formatDistanceToNow } from "date-fns";
import {
  useUserProfile,
  useGetAllId,
  useIsInfluencerVerified,
  useInfluencerApplications,
} from "../../hooks/adsBazaar";
import Link from "next/link";

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
  const [campaigns, setCampaigns] = useState([]);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [postLink, setPostLink] = useState("");
  const [transactionHistory, setTransactionHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Get user profile data
  const { userProfile, isLoadingProfile } = useUserProfile();

  // Get verification status
  const { isVerified, isLoadingVerification } = useIsInfluencerVerified();

  // Get all briefs
  const {
    data: allBriefs,
    isLoading: isLoadingBriefs,
    rawData,
  } = useGetAllId();

  // Get influencer applications
  const { applicationIds, isLoadingApplications } = useInfluencerApplications();

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

  // Process applications and briefs when data is available
  useEffect(() => {
    const fetchCampaignData = async () => {
      if (
        !applicationIds ||
        !rawData ||
        isLoadingApplications ||
        isLoadingBriefs
      ) {
        return;
      }

      setLoading(true);

      try {
        // Filter out invalid applications first
        const validApplications = applicationIds.filter(
          (app) => app.briefId && !isNaN(Number(app.applicationIndex))
        );

        // Map applications to briefs
        const campaignData = validApplications
          .map((app) => {
            const briefId = app.briefId;
            const appIndex = Number(app.applicationIndex);

            // Find the matching brief from all briefs
            const matchingBrief = rawData.find((brief) => brief.id === briefId);

            if (!matchingBrief) {
              console.warn("Brief not found:", briefId);
              return null;
            }

            // Check if applications array exists and has the correct index
            if (
              !matchingBrief.applications ||
              !Array.isArray(matchingBrief.applications) ||
              !matchingBrief.applications[appIndex]
            ) {
              console.warn("Invalid application index:", {
                briefId,
                appIndex,
                applicationsLength: matchingBrief.applications?.length || 0,
              });
              return null;
            }

            // Get this influencer's application from the brief
            const application = matchingBrief.applications[appIndex];

            // Build campaign object with necessary data
            return {
              id: briefId,
              appIndex: appIndex,
              title: matchingBrief.title,
              brand: matchingBrief.brand,
              budget: Number(matchingBrief.budget) / 1e18, // Convert from wei
              deadline: new Date(
                Number(matchingBrief.deadline) * 1000
              ).toISOString(),
              status: getApplicationStatus(application),
              tasks: [
                {
                  name: "Farcaster post",
                  status: application.proofLink ? "completed" : "pending",
                  postLink: application.proofLink || "",
                },
              ],
              paymentStatus: application.hasClaimed
                ? "paid"
                : application.isApproved
                ? "ready"
                : "pending",
              contractAddress:
                matchingBrief.id.slice(0, 10) +
                "..." +
                matchingBrief.id.slice(-6),
              application: application,
            };
          })
          .filter(Boolean); // Remove any null entries

        // Sort campaigns by deadline
        campaignData.sort(
          (a, b) => new Date(a.deadline) - new Date(b.deadline)
        );

        setCampaigns(campaignData);

        // Generate transaction history from paid campaigns
        const txHistory = campaignData
          .filter((camp) => camp.paymentStatus === "paid")
          .map((camp) => ({
            id: camp.id,
            type: "payment",
            amount: camp.budget,
            from: camp.brand,
            date: format(new Date(), "yyyy-MM-dd"),
            txHash: `${camp.id.slice(0, 10)}...${camp.id.slice(-6)}`,
            status: "confirmed",
          }));

        setTransactionHistory(txHistory);
      } catch (err) {
        console.error("Error processing campaign data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCampaignData();
  }, [applicationIds, rawData, isLoadingApplications, isLoadingBriefs]);

  const getApplicationStatus = (application) => {
    if (application.isApproved) return "approved";
    if (application.isSelected) return "selected";
    return "pending";
  };

  const handleSubmitPost = (campaignId, taskName) => {
    // Here you would typically call a contract function to submit proof
    // For now, just update the UI
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
    // Here you would typically call a contract function to claim funds
    setCampaigns((prev) =>
      prev.map((campaign) =>
        campaign.id === campaignId
          ? { ...campaign, paymentStatus: "paid" }
          : campaign
      )
    );

    const campaign = campaigns.find((c) => c.id === campaignId);

    setTransactionHistory((prev) => [
      ...prev,
      {
        id: prev.length + 1,
        type: "payment",
        amount: campaign.budget,
        from: campaign.brand,
        date: format(new Date(), "yyyy-MM-dd"),
        txHash: `${campaignId.slice(0, 10)}...${campaignId.slice(-6)}`,
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

  const getStatusBadge = (status) => {
    switch (status) {
      case "approved":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckSquare size={12} className="mr-1" />
            Approved
          </span>
        );
      case "selected":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <CheckCircle size={12} className="mr-1" />
            Selected
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <X size={12} className="mr-1" />
            Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock3 size={12} className="mr-1" />
            Pending
          </span>
        );
    }
  };

  if (!isMounted || status === "loading" || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading your dashboard...</p>
        </div>
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
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">
                Welcome, {username || displayName || "Influencer"}
              </h1>
              {isVerified && (
                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-800">
                  <Shield size={12} className="mr-1" />
                  Verified
                </span>
              )}
              {isVerified === false && (
                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-600">
                  Unverified
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Manage your campaign applications and track earnings.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">{walletAddress}</span>
            <button className="px-3 py-1 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700">
              Browse Campaigns
            </button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white shadow rounded-lg p-4 flex items-center">
            <div className="rounded-md bg-indigo-50 p-2">
              <Briefcase className="h-5 w-5 text-indigo-600" />
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-500">Applications</p>
              <p className="text-lg font-semibold text-gray-900">
                {campaigns.length}
              </p>
            </div>
          </div>
          <div className="bg-white shadow rounded-lg p-4 flex items-center">
            <div className="rounded-md bg-green-50 p-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-500">Selected</p>
              <p className="text-lg font-semibold text-gray-900">
                {
                  campaigns.filter(
                    (c) => c.status === "selected" || c.status === "approved"
                  ).length
                }
              </p>
            </div>
          </div>
          <div className="bg-white shadow rounded-lg p-4 flex items-center">
            <div className="rounded-md bg-green-50 p-2">
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-500">Total Earned</p>
              <p className="text-lg font-semibold text-gray-900">
                {transactionHistory
                  .reduce((sum, tx) => sum + tx.amount, 0)
                  .toFixed(2)}{" "}
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
                Potential Earnings
              </p>
              <p className="text-lg font-semibold text-gray-900">
                {campaigns
                  .filter(
                    (c) => c.status === "selected" || c.status === "approved"
                  )
                  .filter((c) => c.paymentStatus !== "paid")
                  .reduce((sum, c) => sum + c.budget, 0)
                  .toFixed(2)}{" "}
                cUSD
              </p>
            </div>
          </div>
        </div>

        {/* Campaign Applications */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-900">
              Campaign Applications
            </h2>
            <button className="text-sm text-indigo-600 hover:text-indigo-800">
              View All
            </button>
          </div>

          {campaigns.length === 0 ? (
            <div className="bg-white shadow rounded-lg p-8 text-center">
              <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Applications Yet
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                You haven't applied to any campaigns yet.
              </p>
              <Link href="/marketplace">
                <button className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                  Browse Campaigns
                </button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {campaigns.map((campaign) => (
                <div
                  key={campaign.id}
                  className="bg-white shadow rounded-lg p-4"
                >
                  <div className="flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-medium text-gray-900">
                            {campaign.title}
                          </h3>
                          {getStatusBadge(campaign.status)}
                        </div>
                        <p className="text-xs text-gray-500">
                          {campaign.brand}
                        </p>
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {campaign.budget.toFixed(2)} cUSD
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 flex flex-wrap gap-2">
                      <span className="flex items-center">
                        <Calendar size={12} className="mr-1" />
                        {format(new Date(campaign.deadline), "MMM d, yyyy")}
                      </span>
                      <span className="flex items-center">
                        <Clock size={12} className="mr-1" />
                        {formatDistanceToNow(new Date(campaign.deadline), {
                          addSuffix: true,
                        })}
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

                    {/* Only show tasks for selected applications */}
                    {(campaign.status === "selected" ||
                      campaign.status === "approved") && (
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
                                    setSelectedTask(task);
                                    setShowSubmitModal(true);
                                  }}
                                  className="text-white hover:text-gray-200 rounded bg-indigo-600 p-2 text-xs"
                                  disabled={
                                    task.status === "completed" ||
                                    campaign.status !== "selected"
                                  }
                                >
                                  Submit Link
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Application message */}
                    <div className="text-xs text-gray-500 border-t pt-2 mt-1">
                      <p className="font-medium mb-1">
                        Your application message:
                      </p>
                      <p className="italic">{campaign.application.message}</p>
                    </div>

                    <div className="flex justify-between items-center">
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          campaign.paymentStatus === "paid"
                            ? "bg-green-100 text-green-800"
                            : campaign.paymentStatus === "ready"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        Payment: {campaign.paymentStatus}
                      </span>
                      {campaign.paymentStatus === "ready" && (
                        <button
                          onClick={() => simulateFundRelease(campaign.id)}
                          className="text-green-600 hover:text-green-800 text-xs flex items-center"
                        >
                          <CheckCircle size={12} className="mr-1" />
                          Claim Funds
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
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
              <div className="text-center py-8">
                <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-sm text-gray-500">No transactions yet.</p>
                <p className="text-xs text-gray-400 mt-2">
                  Completed campaigns will appear here
                </p>
              </div>
            ) : (
              transactionHistory.map((tx) => (
                <div
                  key={tx.id}
                  className="py-2 border-b border-gray-200 last:border-0"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {tx.amount.toFixed(2)} cUSD
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
      {showSubmitModal && selectedCampaign && selectedTask && (
        <SubmitPostModal
          selectedCampaign={selectedCampaign}
          selectedTask={selectedTask}
          postLink={postLink}
          setPostLink={setPostLink}
          onSubmit={() =>
            handleSubmitPost(selectedCampaign.id, selectedTask.name)
          }
          onClose={() => {
            setShowSubmitModal(false);
            setSelectedCampaign(null);
            setSelectedTask(null);
          }}
        />
      )}
    </div>
  );
}
