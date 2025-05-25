"use client";

import { useState, useEffect } from "react";
import { SubmitPostModal } from "../../components/modals/SubmitPostModal";
import { Transaction } from "@/types";
import { motion } from "framer-motion";
import {
  Briefcase,
  DollarSign,
  Calendar,
  Clock,
  CheckCircle,
  Link as LinkIcon,
  ExternalLink,
  AlertCircle,
  Shield,
  Clock3,
  CheckSquare,
  Sparkles,
  Award,
  TrendingUp,
  Target,
  User
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useProfile } from "@farcaster/auth-kit";
import { useAccount } from "wagmi";
import { format, formatDistanceToNow } from "date-fns";
import {
  useUserProfile,
  useIsInfluencerVerified,
  useSubmitProof,
} from "../../hooks/adsBazaar";
import { Toaster, toast } from "react-hot-toast";
import { useInfluencerDashboard } from "@/hooks/useInfluencerDashboard";
import Link from "next/link";

// Define precise interfaces
interface Application {
  isApproved: boolean;
  isSelected: boolean;
  hasClaimed: boolean;
  proofLink?: string;
}

interface Brief {
  briefId: string;
  brief: {
    name: string;
    description: string;
    business: string;
    budget: string;
    applicationDeadline: string | number;
    verificationDeadline: string | number;
    status: number;
  };
  application: Application;
}

interface Task {
  name: string;
}

interface PaymentStatus {
  label: string;
  classes: string;
}

interface SubmitProofResult {
  hash?: string;
}

type TxStage =
  | "idle"
  | "error"
  | "success"
  | "preparing"
  | "confirming"
  | "mining";

export default function InfluencerDashboard() {
  const { status } = useSession();
  const router = useRouter();
  const { isConnected, address } = useAccount();
  const {
    profile: { username, displayName, pfpUrl },
  } = useProfile();
  const [isMounted, setIsMounted] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Brief | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [postLink, setPostLink] = useState("");
  const [transactionHistory, setTransactionHistory] = useState<Transaction[]>(
    []
  );
 
  const [txStatus, setTxStatus] = useState<{
    stage: TxStage;
    message: string;
    hash: string | undefined;
  }>({
    stage: "idle",
    message: "",
    hash: undefined,
  });

  // Get user profile data
  const { userProfile, isLoadingProfile } = useUserProfile();

  // Get verification status
  const { isVerified } = useIsInfluencerVerified();

  // Get dashboard data
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

  // Generate transaction history
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
          amount: Number(brief.brief.budget) / 1e18,
          from: brief.brief.business,
          date: format(new Date(), "yyyy-MM-dd"),
          txHash: `${brief.briefId.slice(0, 10)}...${brief.briefId.slice(-6)}`,
          status: "confirmed",
        }));
      setTransactionHistory(txHistory);
    }
  }, [assignedBriefs]);

  const handleSubmitPost = async (briefId: string): Promise<void> => {
    if (!postLink) {
      toast.error("Please enter a valid post link");
      return;
    }

    setTxStatus({
      stage: "preparing",
      message: "Preparing transaction...",
      hash: undefined,
    });

    try {
      const result: SubmitProofResult = await submitProof(briefId, postLink);
      if (result?.hash) {
        setTxStatus({
          stage: "confirming",
          message: "Confirm transaction in your wallet",
          hash: result.hash,
        });
      }
    } catch (error: unknown) {
      console.error("Submit proof error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "An unexpected error occurred";
      setTxStatus({
        stage: "error",
        message: errorMessage,
        hash: undefined,
      });
      toast.error(errorMessage);
    }
  };

  const handleClaimFunds = (briefId: string): void => {
    console.log("Claiming funds for brief:", briefId);
    toast("Claim funds feature coming soon!");
  };

  const handleCloseModal = () => {
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

  const getTaskStatusIcon = (application: Application): JSX.Element => {
    if (application.proofLink) {
      return <CheckCircle size={16} className="text-green-500" />;
    }
    return <AlertCircle size={16} className="text-gray-400" />;
  };

  const getStatusBadge = (
    application: Application,
    briefStatus: number
  ): JSX.Element => {
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

  const getPaymentStatus = (application: Application): PaymentStatus => {
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

  const canSubmitProof = (brief: Brief): boolean => {
    return (
      brief.application.isSelected &&
      brief.brief.status === 1 &&
      !brief.application.proofLink
    );
  };

  const totalEarned = transactionHistory.reduce(
    (sum, tx) => sum + tx.amount,
    0
  );

  const potentialEarnings = assignedBriefs
    ? assignedBriefs
        .filter((b) => b.application.isSelected || b.application.isApproved)
        .filter((b) => !b.application.hasClaimed)
        .reduce((sum, b) => sum + Number(b.brief.budget) / 1e18, 0)
    : 0;

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

  if (!userProfile?.isRegistered || !userProfile?.isInfluencer) {
    return (
      <div className="min-h-screen bg-gradient-to-br  from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pt-28 md:pt-36">
      <Toaster position="top-right" />

      <div className="px-4 sm:px-6 lg:px-8 pb-8">
        {/* Header Section */}
          <motion.div
          className="mb-10"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center overflow-hidden">
                {pfpUrl ? (
                  <img src={pfpUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                )}
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2">
                  Hi, <span className="bg-gradient-to-r from-emerald-400 to-emerald-600 bg-clip-text text-transparent">
                    {username || displayName || "Creator"}
                  </span>
                  {isVerified && (
                    <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      <Shield className="w-3 h-3 mr-1" /> Verified
                    </span>
                  )}
                </h1>
                <p className="text-base sm:text-lg text-slate-300 mt-1">Manage your collaborations and earnings</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/selfVerification">
                <motion.button
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600/80 hover:bg-emerald-700 rounded-xl transition-all shadow-sm"
                  whileTap={{ scale: 0.95 }}
                >
                  Verify Profile <ExternalLink className="w-4 h-4" />
                </motion.button>
              </Link>
              <Link href={`/influencer/${address}`}>
                <motion.button
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-200 bg-slate-800/50 hover:bg-slate-800 rounded-xl border border-slate-700/50 transition-all shadow-sm"
                  whileTap={{ scale: 0.95 }}
                >
                  Public Profile <ExternalLink className="w-4 h-4" />
                </motion.button>
              </Link>
              <Link href="/marketplace">
                <motion.button
                  className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold px-4 py-2 rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-md shadow-emerald-500/25"
                  whileTap={{ scale: 0.95 }}
                >
                  <Sparkles className="w-4 h-4" /> Browse Campaigns
                </motion.button>
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 mb-10"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          {[
            { icon: Briefcase, value: appliedBriefs?.length || 0, label: "Applications", color: "blue-400" },
            { icon: Award, value: assignedBriefs?.length || 0, label: "Selected", color: "emerald-400" },
            { icon: DollarSign, value: totalEarned.toFixed(2), label: "Earned (cUSD)", color: "purple-400" },
            { icon: TrendingUp, value: potentialEarnings.toFixed(2), label: "Potential (cUSD)", color: "amber-400" },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              className="bg-slate-800/60 backdrop-blur-md border border-slate-700/50 rounded-xl p-4 sm:p-5 hover:bg-slate-800/80 transition-all duration-200 shadow-sm"
              whileHover={{ scale: 1.02 }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 * index }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 bg-${stat.color}/10 rounded-lg border border-${stat.color}/20`}>
                  <stat.icon className={`w-5 h-5 text-${stat.color}`} />
                </div>
              </div>
              <p className="text-xl sm:text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-sm text-slate-300">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                    You haven&apos;t applied to any campaigns yet. Discover
                    exciting collaborations that match your creative style.
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
                    // @ts-expect-error:Brief ID should be typed but API currently accepts any string
                    const paymentStatus = getPaymentStatus(brief.application);
                    const budget = Number(brief.brief.budget) / 1e18;

                    return (
                      <div
                        key={brief.briefId}
                        className="p-6 hover:bg-slate-800/30 transition-all duration-200 group"
                      >
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
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
                                  {brief.application && (
                                    <span>
                                      {getStatusBadge(
                                        brief.application,
                                        brief.brief.status
                                      )}
                                    </span>
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
                                    <Calendar className="w-4 h-4" />
                                    <span>
                                      {format(
                                        new Date(verificationDeadline),
                                        "MMM d, yyyy"
                                      )}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <DollarSign className="w-4 h-4" />
                                    <span>{budget.toFixed(2)} cUSD</span>
                                  </div>
                                </div>

                                {brief.application &&
                                  brief.application.isSelected && (
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
                                          ) : // @ts-expect-error:Brief ID should be typed but API currently accepts any string
                                          canSubmitProof(brief) ? (
                                            <button
                                              onClick={() => {
                                                // @ts-expect-error:Brief ID should be typed but API currently accepts any string
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

                            {brief.application &&
                              brief.application.isApproved &&
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
          onSubmit={() => handleSubmitPost(selectedCampaign.briefId)}
          onClose={handleCloseModal}
          transactionStatus={txStatus}
          isSubmitting={isSubmittingProof}
        />
      )}
    </div>
  );
}
