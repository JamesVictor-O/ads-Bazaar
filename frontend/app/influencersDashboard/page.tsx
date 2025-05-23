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
  ArrowUpRight,
  Target,
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
import { Toaster, toast } from "react-hot-toast";

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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center mx-auto mb-6">
            <Briefcase className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">
            Influencer Account Required
          </h2>
          <p className="text-slate-400 mb-8 leading-relaxed">
            You need to register as an influencer to access the influencer
            dashboard and apply for promotions.
          </p>
          <Link href="/">
            <button className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all duration-200 shadow-lg shadow-emerald-500/25">
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pt-28">
      <Toaster position="top-right" />

      <div className="px-4 sm:px-6 lg:px-8 pb-8">
        {/* Header Section */}
        <div className="mb-12">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-4xl lg:text-5xl font-bold text-white mb-3">
                Hi,{" "}
                <span className="bg-gradient-to-r from-emerald-400 bg-clip-text ">
                  {username || displayName || "Influencer"}
                </span>
                {isVerified && (
                  <span className="ml-3 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-emerald-900/50 text-emerald-400 border border-emerald-800/50">
                    <Shield className="w-4 h-4 mr-1" />
                    Verified Creator
                  </span>
                )}
              </h1>
              <p className="text-xl text-slate-400">
                Manage your creative collaborations and track earnings
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              {/* View Profile Link */}
              <Link
                href={`/influencer/${address}`}
                className="flex items-center gap-2 px-5 py-3 text-sm font-medium text-slate-300 hover:text-white bg-slate-800/50 hover:bg-slate-800/70 border border-slate-700/50 rounded-xl transition-all"
              >
                View Public Profile
                <ExternalLink className="w-4 h-4" />
              </Link>

              {/* Browse Campaigns Button */}
              <Link href="/marketplace">
                <button className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold px-6 py-3 rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all duration-200 shadow-lg shadow-emerald-500/25">
                  <Sparkles className="w-5 h-5" />
                  Browse Campaigns
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 hover:bg-slate-800/60 transition-all duration-200 group">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-xl border border-blue-500/20">
                <Briefcase className="w-6 h-6 text-blue-400" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-white">
                {appliedBriefs?.length || 0}
              </p>
              <p className="text-slate-400 font-medium">Applications</p>
            </div>
          </div>

          <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 hover:bg-slate-800/60 transition-all duration-200 group">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-xl border border-green-500/20">
                <Award className="w-6 h-6 text-green-400" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-white">
                {assignedBriefs?.length || 0}
              </p>
              <p className="text-slate-400 font-medium">Selected</p>
            </div>
          </div>

          <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 hover:bg-slate-800/60 transition-all duration-200 group">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 rounded-xl border border-emerald-500/20">
                <DollarSign className="w-6 h-6 text-emerald-400" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-white">
                {totalEarned.toFixed(2)}
              </p>
              <p className="text-slate-400 font-medium">Total Earned (cUSD)</p>
            </div>
          </div>

          <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 hover:bg-slate-800/60 transition-all duration-200 group">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-xl border border-purple-500/20">
                <TrendingUp className="w-6 h-6 text-purple-400" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-white">
                {potentialEarnings.toFixed(2)}
              </p>
              <p className="text-slate-400 font-medium">
                Potential Earnings (cUSD)
              </p>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Campaign Applications - Takes 2/3 width on large screens */}
          <div className="lg:col-span-2">
            <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl overflow-hidden">
              <div className="p-6 border-b border-slate-700/50">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-emerald-400" />
                    Your Campaigns
                  </h2>
                  <span className="text-slate-400">
                    {appliedBriefs?.length || 0} campaigns
                  </span>
                </div>
              </div>

              {isLoading && appliedBriefs === undefined ? (
                <div className="p-12 text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mb-4"></div>
                  <p className="text-slate-400">Loading applications...</p>
                </div>
              ) : !appliedBriefs || appliedBriefs.length === 0 ? (
                <div className="p-12 text-center">
                  <Briefcase className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">
                    No Active Campaigns
                  </h3>
                  <p className="text-slate-400 max-w-md mx-auto mb-6">
                    You haven't applied to any campaigns yet. Discover exciting
                    collaborations that match your creative style.
                  </p>
                  <Link href="/marketplace">
                    <button className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold px-6 py-3 rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all duration-200 shadow-lg shadow-emerald-500/25">
                      <Sparkles className="w-5 h-5" />
                      Explore Marketplace
                    </button>
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-slate-700/50">
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
                        className="p-6 hover:bg-slate-800/30 transition-all duration-200 group"
                      >
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                          {/* Campaign Info */}
                          <div className="flex-1">
                            <div className="flex items-start gap-4">
                              <div className="p-3 bg-gradient-to-br from-slate-700 to-slate-800 rounded-xl border border-slate-600/50 group-hover:border-emerald-500/30 transition-colors">
                                <Target className="w-5 h-5 text-slate-300" />
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-2">
                                  <h3 className="text-lg font-semibold text-white truncate">
                                    {brief.brief.name}
                                  </h3>
                                  {getStatusBadge(
                                    brief.application,
                                    brief.brief.status
                                  )}
                                </div>

                                <p className="text-slate-400 text-sm mb-3 line-clamp-2">
                                  {brief.brief.description}
                                </p>

                                <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400">
                                  <div className="flex items-center gap-1">
                                    <Calendar className="w-4 h-4" />
                                    <span>
                                      {format(
                                        new Date(applicationDeadline),
                                        "MMM d, yyyy"
                                      )}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    <span>
                                      {formatDistanceToNow(
                                        new Date(applicationDeadline),
                                        { addSuffix: true }
                                      )}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <DollarSign className="w-4 h-4" />
                                    <span>{budget.toFixed(2)} cUSD</span>
                                  </div>
                                </div>

                                {brief.application.isSelected && (
                                  <div className="mt-4">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        {getTaskStatusIcon(brief.application)}
                                        <span className="text-sm font-medium text-slate-300">
                                          Content Submission
                                        </span>
                                        {brief.brief.status !== 1 && (
                                          <span className="ml-2 text-xs text-amber-400 bg-amber-900/30 px-2 py-1 rounded-full border border-amber-800/50">
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
                                            className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 rounded-lg border border-emerald-500/30 hover:border-emerald-500/50 transition-all text-xs"
                                          >
                                            <LinkIcon className="w-3 h-3" />
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
                                            className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 rounded-lg border border-emerald-500/30 hover:border-emerald-500/50 transition-all text-xs"
                                            disabled={isSubmittingProof}
                                          >
                                            {isSubmittingProof ? (
                                              "Submitting..."
                                            ) : (
                                              <>
                                                <LinkIcon className="w-3 h-3" />
                                                Submit Content
                                              </>
                                            )}
                                          </button>
                                        ) : brief.application.isSelected &&
                                          brief.brief.status !== 1 ? (
                                          <span className="text-xs text-slate-500 italic">
                                            Submit when assigned
                                          </span>
                                        ) : null}
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Budget & Actions */}
                          <div className="flex flex-col items-end gap-4">
                            <div className="text-right">
                              <div className="text-2xl font-bold text-white mb-1">
                                {budget.toFixed(2)} cUSD
                              </div>
                              <span
                                className={`text-xs px-3 py-1 rounded-full ${paymentStatus.classes}`}
                              >
                                {paymentStatus.label}
                              </span>
                            </div>

                            {brief.application.isApproved &&
                              !brief.application.hasClaimed && (
                                <button
                                  onClick={() =>
                                    handleClaimFunds(brief.briefId)
                                  }
                                  className="flex items-center gap-1 px-4 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 rounded-lg border border-emerald-500/30 hover:border-emerald-500/50 transition-all text-sm font-medium"
                                >
                                  <CheckCircle className="w-4 h-4" />
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
            <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl overflow-hidden sticky top-6">
              <div className="p-6 border-b border-slate-700/50">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-amber-400" />
                    Transaction History
                  </h2>
                  <span className="text-slate-400">
                    {transactionHistory.length} transactions
                  </span>
                </div>
              </div>

              {transactionHistory.length === 0 ? (
                <div className="p-12 text-center">
                  <DollarSign className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">
                    No Transactions Yet
                  </h3>
                  <p className="text-slate-400">
                    Your completed earnings will appear here
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-700/50">
                  {transactionHistory.map((tx) => (
                    <div
                      key={tx.id}
                      className="p-4 hover:bg-slate-800/30 transition-all duration-200"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-emerald-900/20 rounded-lg border border-emerald-800/30">
                          <CheckCircle className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-white truncate">
                            +{tx.amount.toFixed(2)} cUSD
                          </p>
                          <p className="text-xs text-slate-400 truncate">
                            From {tx.from}
                          </p>
                        </div>
                        <a
                          href={`https://explorer.celo.org/tx/${tx.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-slate-400 hover:text-emerald-400 transition-colors"
                          title="View on explorer"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

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
