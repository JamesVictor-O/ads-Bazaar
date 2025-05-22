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
  Sparkles,
  Award,
  TrendingUp,
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
  useSubmitProof,
} from "../../hooks/adsBazaar";
import { toast } from "react-hot-toast";

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
  const [txStatus, setTxStatus] = useState({
    stage: "idle",
    message: "",
    hash: undefined,
  });

  // Get user profile data
  const { userProfile, isLoadingProfile } = useUserProfile();

  // Get verification status
  const { isVerified, isLoadingVerification } = useIsInfluencerVerified();

  // Get dashboard data from the new hook
  const { appliedBriefs, assignedBriefs, isLoading, error, refetch } =
    useInfluencerDashboard();
  console.log("appliedBriefs", appliedBriefs);
  console.log("assignedBriefs", assignedBriefs);

  const {
    submitProof,
    isPending: isSubmittingProof,
    isSuccess: isSubmittingSuccess,
    isError: isSubmittingError,
    error: submitError,
  } = useSubmitProof();

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

  // Handle submission state changes
  useEffect(() => {
    if (
      isSubmittingProof &&
      txStatus.stage !== "mining" &&
      txStatus.stage !== "confirming"
    ) {
      setTxStatus({
        stage: "mining",
        message: "Transaction submitted. Waiting for confirmation...",
        hash: txStatus.hash,
      });
    }
  }, [isSubmittingProof, txStatus.stage, txStatus.hash]);

  useEffect(() => {
    if (isSubmittingSuccess && txStatus.stage !== "success") {
      setTxStatus({
        stage: "success",
        message: "Proof submitted successfully!",
        hash: txStatus.hash,
      });
      toast.success("Proof submitted successfully!");
      refetch();
      // Close modal after short delay to show success
      setTimeout(() => {
        setShowSubmitModal(false);
        setPostLink("");
        setTxStatus({ stage: "idle", message: "", hash: undefined });
        setSelectedCampaign(null);
        setSelectedTask(null);
      }, 2000);
    }
  }, [isSubmittingSuccess, txStatus.stage, txStatus.hash, refetch]);

  useEffect(() => {
    if (isSubmittingError && txStatus.stage !== "error") {
      setTxStatus({
        stage: "error",
        message:
          submitError?.message || "Transaction failed. Please try again.",
        hash: txStatus.hash,
      });
      toast.error(submitError?.message || "Transaction failed");
    }
  }, [isSubmittingError, submitError, txStatus.stage, txStatus.hash]);

  // Generate transaction history from assigned briefs with approved applications
  useEffect(() => {
    if (assignedBriefs && assignedBriefs.length > 0) {
      const txHistory = assignedBriefs
        .filter(
          (brief) =>
            brief.application.isApproved && brief.application.hasClaimed
        )
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

  const handleSubmitPost = async (briefId, taskName) => {
    if (!postLink) {
      toast.error("Please enter a valid post link");
      return;
    }

    // Reset any previous error states
    setTxStatus({
      stage: "preparing",
      message: "Preparing transaction...",
      hash: undefined,
    });

    try {
      // This will trigger the mutation
      const result = await submitProof(briefId, postLink);

      // If we get a hash back immediately, update the status
      if (result?.hash) {
        setTxStatus({
          stage: "confirming",
          message: "Confirm transaction in your wallet",
          hash: result.hash,
        });
      }
    } catch (error) {
      console.error("Submit proof error:", error);
      setTxStatus({
        stage: "error",
        message: error?.message || "An unexpected error occurred",
        hash: undefined,
      });
      toast.error(error?.message || "Failed to submit proof");
    }
  };

  const handleClaimFunds = (briefId) => {
    console.log("Claiming funds for brief:", briefId);
    toast.info("Claim funds feature coming soon!");

    // Here you would call your contract function to claim funds
    // For example:
    // claimFunds(briefId);

    // Refresh data after claiming
    // refetch();
  };

  const handleCloseModal = () => {
    // Don't allow closing modal during transaction
    if (
      txStatus.stage !== "idle" &&
      txStatus.stage !== "error" &&
      txStatus.stage !== "success"
    ) {
      return;
    }

    setShowSubmitModal(false);
    setSelectedCampaign(null);
    setSelectedTask(null);
    setPostLink("");
    setTxStatus({ stage: "idle", message: "", hash: undefined });
  };

  const getTaskStatusIcon = (application) => {
    if (application.proofLink) {
      return <CheckCircle size={16} className="text-green-500" />;
    }
    return <AlertCircle size={16} className="text-gray-400" />;
  };

  const getStatusBadge = (application, briefStatus) => {
    if (application.isApproved) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckSquare size={12} className="mr-1" />
          Approved
        </span>
      );
    } else if (application.isSelected && briefStatus === 1) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          <CheckCircle size={12} className="mr-1" />
          Assigned
        </span>
      );
    } else if (application.isSelected) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <CheckCircle size={12} className="mr-1" />
          Selected
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
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
        classes: "bg-green-100 text-green-800",
      };
    } else if (application.isApproved) {
      return {
        label: "Ready to Claim",
        classes: "bg-blue-100 text-blue-800",
      };
    } else {
      return {
        label: "Pending",
        classes: "bg-yellow-100 text-yellow-800",
      };
    }
  };

  // Helper function to check if submit button should be shown
  const canSubmitProof = (brief) => {
    // Only show submit button when:
    // 1. User is selected for the brief
    // 2. Brief status is ASSIGNED (1) - meaning all slots are filled
    // 3. User hasn't already submitted proof
    return (
      brief.application.isSelected &&
      brief.brief.status === 1 && // ASSIGNED status
      !brief.application.proofLink
    );
  };

  // Calculate total earnings
  const totalEarned = transactionHistory.reduce(
    (sum, tx) => sum + tx.amount,
    0
  );

  // Calculate potential earnings
  const potentialEarnings = assignedBriefs
    ? assignedBriefs
        .filter((b) => b.application.isSelected || b.application.isApproved)
        .filter((b) => !b.application.hasClaimed)
        .reduce((sum, b) => sum + Number(b.brief.budget) / 1e18, 0)
    : 0;

  // Updated loading condition - only show loading if essential data is still loading
  const isInitialLoading =
    !isMounted ||
    status === "loading" ||
    isLoadingProfile ||
    (isLoading && appliedBriefs === undefined && assignedBriefs === undefined);

  if (isInitialLoading) {
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50 pt-3">
      <main className="container mx-auto px-4 sm:px-6 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-10 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div className="relative">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute -left-2 -top-2 w-16 h-16 bg-indigo-100 rounded-full mix-blend-multiply filter blur-xl opacity-30"></div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 relative">
                  Welcome back,{" "}
                  <span className="bg-gradient-to-r from-indigo-600  bg-clip-text ">
                    {username || displayName || "Influencer"}
                  </span>
                </h1>
              </div>
              {isVerified && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-800 border border-emerald-200 shadow-sm">
                  <Shield size={14} className="mr-1" />
                  Verified Creator
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 mt-2 ml-1 font-light">
              Manage your creative collaborations and track your earnings
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Link
              href={`/influencer/${address}`}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors flex items-center group"
            >
              View Public Profile
              <ExternalLink
                size={14}
                className="ml-1 opacity-70 group-hover:opacity-100 transition-opacity"
              />
            </Link>
            <Link href="/marketplace">
              <button className="px-4 py-2 text-sm bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg flex items-center">
                <Sparkles size={14} className="mr-2" />
                Browse Campaigns
              </button>
            </Link>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
            <div className="flex items-center">
              <div className="rounded-lg bg-indigo-100 p-3 mr-4 group-hover:bg-indigo-200 transition-colors">
                <Briefcase className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Applications
                </p>
                <p className="text-xl font-bold text-gray-800 mt-1">
                  {appliedBriefs?.length || 0}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
            <div className="flex items-center">
              <div className="rounded-lg bg-green-100 p-3 mr-4 group-hover:bg-green-200 transition-colors">
                <Award className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Selected
                </p>
                <p className="text-xl font-bold text-gray-800 mt-1">
                  {assignedBriefs?.length || 0}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
            <div className="flex items-center">
              <div className="rounded-lg bg-amber-100 p-3 mr-4 group-hover:bg-amber-200 transition-colors">
                <DollarSign className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Earned
                </p>
                <p className="text-xl font-bold text-gray-800 mt-1">
                  {totalEarned.toFixed(2)} cUSD
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
            <div className="flex items-center">
              <div className="rounded-lg bg-purple-100 p-3 mr-4 group-hover:bg-purple-200 transition-colors">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Potential Earnings
                </p>
                <p className="text-xl font-bold text-gray-800 mt-1">
                  {potentialEarnings.toFixed(2)} cUSD
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Campaign Applications - Takes 2/3 width on large screens */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                  <Briefcase className="h-5 w-5 text-indigo-500 mr-2" />
                  Your Campaigns
                </h2>
                <div className="text-sm text-indigo-600 hover:text-indigo-800 transition-colors flex items-center">
                  View All
                  <ExternalLink size={14} className="ml-1" />
                </div>
              </div>

              {isLoading && appliedBriefs === undefined ? (
                <div className="bg-white rounded-lg p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500 mx-auto mb-3"></div>
                  <p className="text-sm text-gray-500">
                    Loading applications...
                  </p>
                </div>
              ) : !appliedBriefs || appliedBriefs.length === 0 ? (
                <div className="bg-gradient-to-br from-gray-50 to-indigo-50 rounded-xl p-8 text-center border border-gray-200">
                  <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4 opacity-70" />
                  <h3 className="text-lg font-medium text-gray-700 mb-2">
                    No Active Campaigns
                  </h3>
                  <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
                    You haven't applied to any campaigns yet. Discover exciting
                    collaborations that match your creative style.
                  </p>
                  <Link href="/marketplace">
                    <button className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg">
                      Explore Marketplace
                    </button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {appliedBriefs.map((brief) => {
                    const applicationDeadline =
                      Number(brief.brief.applicationDeadline) * 1000;
                    const verificationDeadline =
                      Number(brief.brief.verificationDeadline) * 1000;

                    const paymentStatus = getPaymentStatus(brief.application);
                    const budget = Number(brief.brief.budget) / 1e18;

                    return (
                      <div
                        key={brief.briefId}
                        className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow group"
                      >
                        <div className="flex flex-col gap-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-base font-semibold text-gray-800 group-hover:text-indigo-600 transition-colors">
                                  {brief.brief.name}
                                </h3>
                                {getStatusBadge(
                                  brief.application,
                                  brief.brief.status
                                )}
                              </div>
                              <p className="text-xs text-gray-500 font-light">
                                Brand:{" "}
                                <span className="font-medium text-gray-700">
                                  {brief.brief.business}
                                </span>
                              </p>
                            </div>
                            <span className="text-base font-semibold bg-gradient-to-r  bg-clip-text ">
                              {budget.toFixed(2)} cUSD
                            </span>
                          </div>

                          <div className="flex flex-wrap gap-2 text-xs">
                            <span className="flex items-center bg-gray-50 rounded-full px-3 py-1 text-gray-600">
                              <Calendar size={12} className="mr-1 opacity-70" />
                              {format(new Date(applicationDeadline), "MMM d")}
                            </span>
                            <span className="flex items-center bg-gray-50 rounded-full px-3 py-1 text-gray-600">
                              <Clock size={12} className="mr-1 opacity-70" />
                              {formatDistanceToNow(
                                new Date(applicationDeadline),
                                { addSuffix: true }
                              )}
                            </span>
                          </div>

                          <div className="text-xs text-gray-500 mt-1">
                            <div className="flex items-center">
                              <span className="font-medium mr-1">
                                Contract:
                              </span>
                              <a
                                href={`https://explorer.celo.org/address/${brief.briefId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-indigo-600 hover:underline truncate"
                              >
                                {`${brief.briefId.slice(
                                  0,
                                  6
                                )}...${brief.briefId.slice(-4)}`}
                              </a>
                              <button
                                className="ml-1 text-gray-400 hover:text-indigo-600 transition-colors"
                                onClick={() =>
                                  navigator.clipboard.writeText(brief.briefId)
                                }
                              >
                                <Copy size={12} />
                              </button>
                            </div>
                          </div>

                          {brief.application.isSelected && (
                            <div className="mt-2">
                              <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center">
                                  {getTaskStatusIcon(brief.application)}
                                  <span className="ml-2 text-sm font-medium text-gray-700">
                                    Content Submission
                                  </span>
                                  {brief.brief.status !== 1 && (
                                    <span className="ml-2 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                                      Waiting for assignment...
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  {brief.application.proofLink ? (
                                    <a
                                      href={brief.application.proofLink}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-white bg-gradient-to-r from-indigo-600 to-purple-600 px-3 py-1.5 rounded-lg hover:shadow-md transition-all text-xs flex items-center"
                                    >
                                      <LinkIcon size={12} className="mr-1" />
                                      View Content
                                    </a>
                                  ) : canSubmitProof(brief) ? (
                                    <button
                                      onClick={() => {
                                        setSelectedCampaign(brief);
                                        setSelectedTask({
                                          name: brief.brief.description,
                                        });
                                        setShowSubmitModal(true);
                                      }}
                                      className="text-white bg-gradient-to-r from-indigo-600 to-purple-600 px-3 py-1.5 rounded-lg hover:shadow-md transition-all text-xs flex items-center"
                                      disabled={isSubmittingProof}
                                    >
                                      {isSubmittingProof ? (
                                        "Submitting..."
                                      ) : (
                                        <>
                                          <LinkIcon
                                            size={12}
                                            className="mr-1"
                                          />
                                          Submit Content
                                        </>
                                      )}
                                    </button>
                                  ) : brief.application.isSelected &&
                                    brief.brief.status !== 1 ? (
                                    <span className="text-xs text-gray-500 italic">
                                      Submit when assigned
                                    </span>
                                  ) : null}
                                </div>
                              </div>
                            </div>
                          )}

                          <div className="text-sm text-gray-600 border-t pt-3 mt-2">
                            <p className="font-medium mb-1 text-gray-700">
                              Your Pitch:
                            </p>
                            <p className="italic font-light">
                              {brief.application.message}
                            </p>
                          </div>

                          <div className="flex justify-between items-center pt-2 mt-1">
                            <span
                              className={`text-xs px-3 py-1 rounded-full ${paymentStatus.classes}`}
                            >
                              {paymentStatus.label}
                            </span>
                            {brief.application.isApproved &&
                              !brief.application.hasClaimed && (
                                <button
                                  onClick={() =>
                                    handleClaimFunds(brief.briefId)
                                  }
                                  className="text-sm bg-gradient-to-r from-green-600 to-teal-600 text-white px-3 py-1 rounded-lg hover:shadow-md transition-all flex items-center"
                                >
                                  <CheckCircle size={14} className="mr-1" />
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
          </div>

          {/* Transactions - Takes 1/3 width on large screens */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                  <DollarSign className="h-5 w-5 text-amber-500 mr-2" />
                  Transaction History
                </h2>
                <div className="text-sm text-indigo-600 hover:text-indigo-800 transition-colors flex items-center">
                  View All
                  <ExternalLink size={14} className="ml-1" />
                </div>
              </div>
              {transactionHistory.length === 0 ? (
                <div className="bg-gradient-to-br from-gray-50 to-indigo-50 rounded-xl p-6 text-center border border-gray-200">
                  <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4 opacity-70" />
                  <h3 className="text-lg font-medium text-gray-700 mb-2">
                    No Transactions Yet
                  </h3>
                  <p className="text-sm text-gray-500 mb-1">
                    Your completed earnings will appear here
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {transactionHistory.map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
                    >
                      <div className="rounded-full bg-green-100 p-2 mr-3 group-hover:bg-green-200 transition-colors">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-800 truncate">
                          +{tx.amount.toFixed(2)} cUSD
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          From {tx.from}
                        </p>
                      </div>
                      <div className="flex items-center ml-2">
                        <a
                          href={`https://explorer.celo.org/tx/${tx.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:text-indigo-800 text-xs"
                          title="View on explorer"
                        >
                          <ExternalLink size={14} />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Submit Post Link Modal */}
      {showSubmitModal && selectedCampaign && selectedTask && (
        <SubmitPostModal
          selectedCampaign={{
            id: selectedCampaign.briefId,
            title: selectedCampaign.brief.name,
            brand: selectedCampaign.brief.business,
          }}
          selectedTask={selectedTask}
          postLink={postLink}
          setPostLink={setPostLink}
          onSubmit={() =>
            handleSubmitPost(selectedCampaign.briefId, selectedTask.name)
          }
          onClose={handleCloseModal}
          transactionStatus={txStatus}
          isSubmitting={isSubmittingProof}
        />
      )}
    </div>
  );
}
