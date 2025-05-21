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

import { useInfluencerDashboard } from "@/hooks/useInfluencerDashboard";
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
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [postLink, setPostLink] = useState("");
  const [transactionHistory, setTransactionHistory] = useState([]);

  // Get user profile data
  const { userProfile, isLoadingProfile } = useUserProfile();

  // Get verification status
  const { isVerified, isLoadingVerification } = useIsInfluencerVerified();
  
  // Get dashboard data from the new hook
  const { appliedBriefs, assignedBriefs, isLoading, error, refetch } = useInfluencerDashboard();
  console.log("appliedBriefs", appliedBriefs);
  console.log("assignedBriefs", assignedBriefs);

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

  // Generate transaction history from assigned briefs with approved applications
  useEffect(() => {
    if (assignedBriefs && assignedBriefs.length > 0) {
      const txHistory = assignedBriefs
        .filter((brief) => brief.application.isApproved && brief.application.hasClaimed)
        .map((brief) => ({
          id: brief.briefId,
          type: "payment",
          amount: Number(brief.brief.budget) / 1e18, // Convert from wei
          from: brief.brief.business,
          date: format(new Date(), "yyyy-MM-dd"),
          txHash: `${brief.briefId.slice(0, 10)}...${brief.briefId.slice(-6)}`,
          status: "confirmed",
        }));

      setTransactionHistory(txHistory);
    }
  }, [assignedBriefs]);

  const handleSubmitPost = (briefId, taskName) => {
    // Update the application with the proof link
    console.log("Submitting proof link:", postLink, "for brief:", briefId);
    
    // Here you would call your contract function to submit the proof
    // For example:
    // submitProof(briefId, postLink);
    
    // For now, just close the modal
    setShowSubmitModal(false);
    setPostLink("");
    
    // Refresh data after submission
    refetch();
  };

  const handleClaimFunds = (briefId) => {
    console.log("Claiming funds for brief:", briefId);
    
    // Here you would call your contract function to claim funds
    // For example:
    // claimFunds(briefId);
    
    // Refresh data after claiming
    refetch();
  };

  const getTaskStatusIcon = (application) => {
    if (application.proofLink) {
      return <CheckCircle size={16} className="text-green-500" />;
    }
    return <AlertCircle size={16} className="text-gray-400" />;
  };

  const getStatusBadge = (application) => {
    if (application.isApproved) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckSquare size={12} className="mr-1" />
          Approved
        </span>
      );
    } else if (application.isSelected) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          <CheckCircle size={12} className="mr-1" />
          Selected
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <Clock3 size={12} className="mr-1" />
          Pending
        </span>
      );
    }
  };

  const getPaymentStatus = (application) => {
    if (application.hasClaimed) {
      return {
        label: "Paid",
        classes: "bg-green-100 text-green-800"
      };
    } else if (application.isApproved) {
      return {
        label: "Ready to Claim",
        classes: "bg-blue-100 text-blue-800"
      };
    } else {
      return {
        label: "Pending",
        classes: "bg-yellow-100 text-yellow-800"
      };
    }
  };

  // Calculate total earnings
  const totalEarned = transactionHistory.reduce((sum, tx) => sum + tx.amount, 0);

  // Calculate potential earnings
  const potentialEarnings = assignedBriefs
    ? assignedBriefs
        .filter(b => b.application.isSelected || b.application.isApproved)
        .filter(b => !b.application.hasClaimed)
        .reduce((sum, b) => sum + (Number(b.brief.budget) / 1e18), 0)
    : 0;

  if (!isMounted || status === "loading" || isLoading) {
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

  // If error occurred while fetching data
  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="text-center p-8 max-w-md">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={refetch} 
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Try Again
          </button>
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
                {appliedBriefs?.length || 0}
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
                {assignedBriefs?.length || 0}
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
                {totalEarned.toFixed(2)} cUSD
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
                {potentialEarnings.toFixed(2)} cUSD
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

          {(!appliedBriefs || appliedBriefs.length === 0) ? (
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
              {appliedBriefs.map((brief) => {
                // Convert deadlines and calculate human-readable time remaining
                const applicationDeadline = Number(brief.brief.applicationDeadline) * 1000;
                const verificationDeadline = Number(brief.brief.verificationDeadline) * 1000;
                
                const paymentStatus = getPaymentStatus(brief.application);
                const budget = Number(brief.brief.budget) / 1e18; // Convert from wei
                
                return (
                  <div
                    key={brief.briefId}
                    className="bg-white shadow rounded-lg p-4"
                  >
                    <div className="flex flex-col gap-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-medium text-gray-900">
                              {brief.brief.name}
                            </h3>
                            {getStatusBadge(brief.application)}
                          </div>
                          <p className="text-xs text-gray-500">
                            {brief.brief.business}
                          </p>
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {budget.toFixed(2)} cUSD
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 flex flex-wrap gap-2">
                        <span className="flex items-center">
                          <Calendar size={12} className="mr-1" />
                          {format(new Date(applicationDeadline), "MMM d, yyyy")}
                        </span>
                        <span className="flex items-center">
                          <Clock size={12} className="mr-1" />
                          {formatDistanceToNow(new Date(applicationDeadline), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">
                        <span className="flex items-center">
                          Contract:{" "}
                          <a
                            href={`https://explorer.celo.org/address/${brief.briefId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-1 text-indigo-600 hover:underline truncate"
                          >
                            {`${brief.briefId.slice(0, 10)}...${brief.briefId.slice(-6)}`}
                          </a>
                          <button 
                            className="ml-1 text-gray-400 hover:text-indigo-600"
                            onClick={() => navigator.clipboard.writeText(brief.briefId)}
                          >
                            <Copy size={12} />
                          </button>
                          <a
                            href={`https://explorer.celo.org/address/${brief.briefId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-1 text-gray-400 hover:text-indigo-600"
                          >
                            <ExternalLink size={12} />
                          </a>
                        </span>
                      </div>

                      {/* Only show tasks for selected applications */}
                      {brief.application.isSelected && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center">
                              {getTaskStatusIcon(brief.application)}
                              <span className="ml-2 text-xs">Farcaster post</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {brief.application.proofLink ? (
                                <a
                                  href={brief.application.proofLink}
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
                                    setSelectedCampaign(brief);
                                    setSelectedTask({ name: "Farcaster post" });
                                    setShowSubmitModal(true);
                                  }}
                                  className="text-white hover:text-gray-200 rounded bg-indigo-600 p-2 text-xs"
                                  disabled={!brief.application.isSelected}
                                >
                                  Submit Link
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Application message */}
                      <div className="text-xs text-gray-500 border-t pt-2 mt-1">
                        <p className="font-medium mb-1">
                          Your application message:
                        </p>
                        <p className="italic">{brief.application.message}</p>
                      </div>

                      <div className="flex justify-between items-center">
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${paymentStatus.classes}`}
                        >
                          Payment: {paymentStatus.label}
                        </span>
                        {brief.application.isApproved && !brief.application.hasClaimed && (
                          <button
                            onClick={() => handleClaimFunds(brief.briefId)}
                            className="text-green-600 hover:text-green-800 text-xs flex items-center"
                          >
                            <CheckCircle size={12} className="mr-1" />
                            Claim Funds
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
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
                        href={`https://explorer.celo.org/tx/${tx.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:text-indigo-800 text-xs truncate"
                      >
                        {tx.txHash}
                      </a>
                      <button 
                        className="text-gray-400 hover:text-indigo-600"
                        onClick={() => navigator.clipboard.writeText(tx.id)}
                      >
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
          selectedCampaign={{
            id: selectedCampaign.briefId,
            title: selectedCampaign.brief.name,
            brand: selectedCampaign.brief.business
          }}
          selectedTask={selectedTask}
          postLink={postLink}
          setPostLink={setPostLink}
          onSubmit={() =>
            handleSubmitPost(selectedCampaign.briefId, selectedTask.name)
          }
          onClose={() => {
            setShowSubmitModal(false);
            setSelectedCampaign(null);
            setSelectedTask(null);
            setPostLink("");
          }}
        />
      )}
    </div>
  );
}