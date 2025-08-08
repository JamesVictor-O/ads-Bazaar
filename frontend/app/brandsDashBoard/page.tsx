"use client";

import { useState, useEffect, useMemo } from "react";
import { useAccount } from "wagmi";
import { Brief } from "@/types";
import { SubmissionsModal } from "@/components/modals/SubmissionsModal";
import ApplicationsModal from "@/components/modals/ApplicationsModal";
import CreateCampaignModal from "@/components/modals/CreateCampaignModal";
import CreateSparkModal from "@/components/modals/CreateSparkModal";
import { NetworkStatus } from "@/components/NetworkStatus";
import { Toaster, toast } from "react-hot-toast";
import { useEnsureNetwork } from "@/hooks/useEnsureNetwork";
import { useDivviIntegration } from "@/hooks/useDivviIntegration";
import {
  Users,
  Briefcase,
  DollarSign,
  Search,
  Plus,
  Calendar,
  Clock,
  CheckCircle,
  Filter,
  MoreVertical,
  Activity,
  AlertTriangle,
  Loader2,
  Wifi,
  WifiOff,
  XCircle,
  Trash2,
  Ban,
  Zap,
  Bell,
  Flag,
  Crown,
  CheckSquare,
  ChevronDown,
  ArrowRightLeft,
  FileText,
  Wallet,
} from "lucide-react";
import { getUserStatusColor, getUserStatusLabel } from "@/utils/format";
import { format } from "date-fns";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import ShareCampaignButton from "@/components/ShareCampaignButton";
import { CurrencyConverterModal } from "@/components/modals/CurrencyConverterModal";
import { WalletFundingModal } from "@/components/modals/WalletFundingModal";
import { SupportedCurrency, MENTO_TOKENS } from "@/lib/mento-simple";
import { formatCurrency, fromWei } from "@/utils/format";
import {
  getStatusColor,
  formatTimeRemaining,
  isActionUrgent,
  getActionPriority,
} from "@/utils/campaignUtils";
import { CampaignStatus } from "@/types";
import { createBrandDashboardSuccessHandler } from "@/utils/transactionUtils";

// Import custom hooks
import {
  useUserProfile,
  useBriefApplications,
  useCompleteCampaign,
  useGetBusinessBriefs,
  useCancelAdBrief,
  useExpireCampaign,
  useStartCampaignWithPartialSelection,
  useCancelCampaignWithCompensation,
} from "../../hooks/adsBazaar";
import { useMultiCurrencyCampaignCreation } from "../../hooks/useMultiCurrencyAdsBazaar";
import { useContractEventListener } from "../../hooks/useContractEventListener";

const BrandDashboard = () => {
  const { address, isConnected } = useAccount();
  const { isCorrectChain, currentNetwork } = useEnsureNetwork();
  const { generateDivviReferralTag, trackTransaction } = useDivviIntegration();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCreateSparkModal, setShowCreateSparkModal] = useState(false);
  const [showApplicationsModal, setShowApplicationsModal] = useState(false);
  const [showSubmissionsModal, setShowSubmissionsModal] = useState(false);
  const [selectedBrief, setSelectedBrief] = useState<Brief | null>(null);
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showCancelConfirm, setShowCancelConfirm] = useState<string | null>(
    null
  );
  const [showExpireConfirm, setShowExpireConfirm] = useState<string | null>(
    null
  );
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [expandedBriefId, setExpandedBriefId] = useState<string | null>(null);

  // New state for expandable descriptions
  const [expandedDescriptions, setExpandedDescriptions] = useState<Set<string>>(
    new Set()
  );

  // State for partial campaign management
  const [showStartPartialConfirm, setShowStartPartialConfirm] = useState<string | null>(null);
  const [showCancelWithCompensationModal, setShowCancelWithCompensationModal] = useState<string | null>(null);

  // Currency converter modal state
  const [showCurrencyConverter, setShowCurrencyConverter] = useState(false);
  const [showWalletFunding, setShowWalletFunding] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    requirements: "",
    budget: "",
    currency: "cUSD" as SupportedCurrency,
    promotionDuration: "604800", // 7 days in seconds
    maxInfluencers: "5",
    targetAudience: "0",
    applicationPeriod: "432000", // 5 days default
    proofSubmissionGracePeriod: "172800", // 2 days default (max)
    verificationPeriod: "259200", // 3 days default
    selectionGracePeriod: "86400", // 1 day default
  });

  const { userProfile, isLoadingProfile, refetchProfile } = useUserProfile();
  const {
    briefs: fetchedBriefs,
    isLoading,
    refetch: refetchBriefs,
  } = useGetBusinessBriefs(address as `0x${string}`);
  const briefs = useMemo(
    () => (address ? fetchedBriefs : []),
    [address, fetchedBriefs]
  );
  const { applications, isLoadingApplications, refetchApplications } =
    useBriefApplications(selectedBrief?.id || "0x0");

  // Legacy campaign creation removed - now using unified multi-currency system only

  // Multi-currency campaign creation
  const { 
    createCampaignWithToken, 
    isCreating: isCreatingMultiCurrency,
    isSuccess: isMultiCurrencyCreateSuccess,
    isError: isMultiCurrencyCreateError,
    error: multiCurrencyCreateError
  } = useMultiCurrencyCampaignCreation();

  const {
    completeCampaign,
    isPending: isCompletingCampaign,
    isSuccess: isCompleteSuccess,
    isError: isCompleteError,
    error: completeError,
    hash: completeHash,
  } = useCompleteCampaign();

  const {
    cancelBrief,
    isPending: isCancelingBrief,
    isSuccess: isCancelSuccess,
    isError: isCancelError,
    error: cancelError,
    hash: cancelHash,
  } = useCancelAdBrief();

  const {
    expireCampaign,
    isPending: isExpiringBrief,
    isSuccess: isExpireSuccess,
    isError: isExpireError,
    error: expireError,
    hash: expireHash,
  } = useExpireCampaign();

  const {
    startCampaignWithPartialSelection,
    isPending: isStartingPartialCampaign,
    isSuccess: isStartPartialSuccess,
    isError: isStartPartialError,
    error: startPartialError,
    hash: startPartialHash,
  } = useStartCampaignWithPartialSelection();

  const {
    cancelCampaignWithCompensation,
    isPending: isCancelingWithCompensation,
    isSuccess: isCancelWithCompensationSuccess,
    isError: isCancelWithCompensationError,
    error: cancelWithCompensationError,
    hash: cancelWithCompensationHash,
  } = useCancelCampaignWithCompensation();

  // Set up real-time contract event listeners for automatic refresh
  const { isListening } = useContractEventListener({
    onCampaignCreated: () => {
      console.log("Real-time campaign created event - refreshing dashboard");
      refetchBriefs();
      refetchProfile();
      toast.success("Campaign created! Dashboard updated.", { duration: 3000 });
    },
    onCampaignCancelled: () => {
      console.log("Real-time campaign cancelled event - refreshing dashboard");
      refetchBriefs();
      refetchProfile();
      toast.success("Campaign cancelled! Dashboard updated.", { duration: 3000 });
    },
    onCampaignExpired: () => {
      console.log("Real-time campaign expired event - refreshing dashboard");
      refetchBriefs();
      refetchProfile();
      toast.success("Campaign expired! Dashboard updated.", { duration: 3000 });
    },
    onCampaignCompleted: () => {
      console.log("Real-time campaign completed event - refreshing dashboard");
      refetchBriefs();
      refetchProfile();
      toast.success("Campaign completed! Dashboard updated.", { duration: 3000 });
    },
    enabled: isConnected && isCorrectChain
  });

  // Function to toggle description expansion
  const toggleDescription = (briefId: string) => {
    setExpandedDescriptions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(briefId)) {
        newSet.delete(briefId);
      } else {
        newSet.add(briefId);
      }
      return newSet;
    });
  };

  // Function to check if description should show expand button
  const shouldShowExpandButton = (description: string) => {
    return description.length > 120; // Show expand button if description is longer than 120 characters
  };

  // Function to get truncated description
  const getTruncatedDescription = (description: string) => {
    if (description.length <= 120) return description;
    return description.substring(0, 120) + "...";
  };

  // Legacy createHash tracking removed - multi-currency campaigns handle tracking internally

  // Refetch user profile when component mounts or address changes
  useEffect(() => {
    if (isConnected && address && refetchProfile) {
      refetchProfile();
    }
  }, [isConnected, address, refetchProfile]);

  // Listen for global dashboard refresh events
  useEffect(() => {
    const handleDashboardRefresh = () => {
      console.log("Global refresh event received in brand dashboard");
      refetchBriefs();
      refetchApplications();
      refetchProfile();
    };

    window.addEventListener('dashboardRefresh', handleDashboardRefresh);
    return () => {
      window.removeEventListener('dashboardRefresh', handleDashboardRefresh);
    };
  }, [refetchBriefs, refetchApplications, refetchProfile]);

  useEffect(() => {
    if (completeHash) {
      console.log(
        "DIVVI: Hash available from complete campaign:",
        completeHash
      );
      trackTransaction(completeHash);
    }
  }, [completeHash, trackTransaction]);

  useEffect(() => {
    if (cancelHash) {
      console.log("DIVVI: Hash available from cancel campaign:", cancelHash);
      trackTransaction(cancelHash);
    }
  }, [cancelHash, trackTransaction]);

  useEffect(() => {
    if (expireHash) {
      console.log("DIVVI: Hash available from expire campaign:", expireHash);
      trackTransaction(expireHash);
    }
  }, [expireHash, trackTransaction]);

  useEffect(() => {
    if (startPartialHash) {
      console.log("DIVVI: Hash available from start partial campaign:", startPartialHash);
      trackTransaction(startPartialHash);
    }
  }, [startPartialHash, trackTransaction]);

  useEffect(() => {
    if (cancelWithCompensationHash) {
      console.log("DIVVI: Hash available from cancel with compensation:", cancelWithCompensationHash);
      trackTransaction(cancelWithCompensationHash);
    }
  }, [cancelWithCompensationHash, trackTransaction]);

  // Handle campaign operation success states and refresh data
  useEffect(() => {
    if (isCompleteSuccess) {
      console.log("Campaign completed successfully, refreshing data");
      refetchBriefs();
      refetchProfile();
    }
  }, [isCompleteSuccess, refetchBriefs, refetchProfile]);

  useEffect(() => {
    if (isCancelSuccess) {
      console.log("Campaign cancelled successfully, refreshing data");
      refetchBriefs();
      refetchProfile();
    }
  }, [isCancelSuccess, refetchBriefs, refetchProfile]);

  useEffect(() => {
    if (isExpireSuccess) {
      console.log("Campaign expired successfully, refreshing data");
      refetchBriefs();
      refetchProfile();
    }
  }, [isExpireSuccess, refetchBriefs, refetchProfile]);

  useEffect(() => {
    if (isStartPartialSuccess) {
      console.log("Partial campaign started successfully, refreshing data");
      refetchBriefs();
      refetchProfile();
    }
  }, [isStartPartialSuccess, refetchBriefs, refetchProfile]);

  useEffect(() => {
    if (isCancelWithCompensationSuccess) {
      console.log("Campaign cancelled with compensation successfully, refreshing data");
      refetchBriefs();
      refetchProfile();
    }
  }, [isCancelWithCompensationSuccess, refetchBriefs, refetchProfile]);

  // Computed dashboard data
  const dashboardData = useMemo(() => {
    if (!briefs) return null;

    const activeBriefs = briefs.filter(
      (brief) =>
        brief.status === CampaignStatus.OPEN ||
        brief.status === CampaignStatus.ASSIGNED
    );
    const completedBriefs = briefs.filter(
      (brief) => brief.status === CampaignStatus.COMPLETED
    );
    
    // Calculate budget by currency
    const budgetByCurrency = briefs.reduce((acc, brief) => {
      const currency = brief.currency || "cUSD"; // Default to cUSD for legacy campaigns
      acc[currency] = (acc[currency] || 0) + brief.budget;
      return acc;
    }, {} as Record<string, number>);
    
    // Get primary currency (highest total budget) for main display
    const primaryCurrency = Object.keys(budgetByCurrency).reduce((a, b) => 
      budgetByCurrency[a] > budgetByCurrency[b] ? a : b, "cUSD"
    );
    
    const totalBudget = briefs.reduce((sum, brief) => sum + brief.budget, 0);
    const totalInfluencers = briefs.reduce(
      (sum, brief) => sum + brief.selectedInfluencersCount,
      0
    );

    const urgentActions = briefs
      .filter((brief) => isActionUrgent(brief))
      .map((brief) => ({
        campaignId: brief.id,
        campaignName: brief.name,
        action: brief.statusInfo.nextAction || "Action needed",
        priority: getActionPriority(brief),
        dueDate: brief.timingInfo.currentDeadline,
        warning: brief.statusInfo.warning,
      }));

    return {
      activeBriefs,
      completedBriefs,
      totalBudget,
      budgetByCurrency,
      primaryCurrency,
      totalInfluencers,
      urgentActions: urgentActions || [],
    };
  }, [briefs]);

  // Handle multi-currency campaign creation success with automatic refresh
  useEffect(() => {
    if (isMultiCurrencyCreateSuccess) {
      console.log("Multi-currency campaign created successfully, refreshing data");
      
      // Use standardized success handler
      createBrandDashboardSuccessHandler([
        () => setShowCreateModal(false),
        () => refetchBriefs(),
        () => refetchProfile(),
        () => setFormData({
          name: "",
          description: "",
          requirements: "",
          budget: "",
          currency: "cUSD" as SupportedCurrency,
          promotionDuration: "604800",
          maxInfluencers: "5",
          targetAudience: "0",
          applicationPeriod: "432000",
          proofSubmissionGracePeriod: "172800",
          verificationPeriod: "259200",
          selectionGracePeriod: "86400",
        })
      ])();
    }

    if (isMultiCurrencyCreateError) {
      console.error("Multi-currency campaign creation failed:", multiCurrencyCreateError);
      // Error toast is already handled in the hook
    }
  }, [isMultiCurrencyCreateSuccess, isMultiCurrencyCreateError, multiCurrencyCreateError, refetchBriefs, refetchProfile]);

  useEffect(() => {
    if (isCompleteSuccess) {
      toast.success("Campaign completed and funds released successfully!");
      
      // Use standardized success handler
      createBrandDashboardSuccessHandler([
        () => refetchApplications(),
        () => refetchBriefs(),
        () => setShowSubmissionsModal(false)
      ])();
    }

    if (isCompleteError) {
      toast.error(
        `Failed to complete campaign: ${
          completeError?.message || "Unknown error"
        }`
      );
    }
  }, [
    isCompleteSuccess,
    isCompleteError,
    completeError,
    refetchApplications,
    refetchBriefs,
  ]);

  useEffect(() => {
    if (isCancelSuccess) {
      toast.success("Campaign cancelled successfully!");
      
      // Use standardized success handler
      createBrandDashboardSuccessHandler([
        () => setShowCancelConfirm(null),
        () => refetchBriefs()
      ])();
    }

    if (isCancelError) {
      toast.error(
        `Failed to cancel campaign: ${cancelError?.message || "Unknown error"}`
      );
      setShowCancelConfirm(null);
    }
  }, [isCancelSuccess, isCancelError, cancelError, refetchBriefs]);

  useEffect(() => {
    if (isExpireSuccess) {
      toast.success("Campaign expired successfully!");
      
      // Use standardized success handler
      createBrandDashboardSuccessHandler([
        () => setShowExpireConfirm(null),
        () => refetchBriefs()
      ])();
    }

    if (isExpireError) {
      toast.error(
        `Failed to expire campaign: ${expireError?.message || "Unknown error"}`
      );
      setShowExpireConfirm(null);
    }
  }, [isExpireSuccess, isExpireError, expireError, refetchBriefs]);

  useEffect(() => {
    if (isStartPartialSuccess) {
      toast.success("Campaign started with partial selection successfully!");
      
      // Use standardized success handler
      createBrandDashboardSuccessHandler([
        () => setShowStartPartialConfirm(null),
        () => refetchBriefs()
      ])();
    }

    if (isStartPartialError) {
      toast.error(
        `Failed to start campaign with partial selection: ${startPartialError?.message || "Unknown error"}`
      );
      setShowStartPartialConfirm(null);
    }
  }, [isStartPartialSuccess, isStartPartialError, startPartialError, refetchBriefs]);

  useEffect(() => {
    if (isCancelWithCompensationSuccess) {
      toast.success("Campaign cancelled with compensation successfully!");
      
      // Use standardized success handler
      createBrandDashboardSuccessHandler([
        () => setShowCancelWithCompensationModal(null),
        () => refetchBriefs()
      ])();
    }

    if (isCancelWithCompensationError) {
      toast.error(
        `Failed to cancel campaign with compensation: ${cancelWithCompensationError?.message || "Unknown error"}`
      );
      setShowCancelWithCompensationModal(null);
    }
  }, [isCancelWithCompensationSuccess, isCancelWithCompensationError, cancelWithCompensationError, refetchBriefs]);

  // Enhanced filtering logic
  const filteredBriefs = briefs.filter((brief) => {
    const matchesSearch = brief.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    const matchesFilter =
      selectedFilter === "all" ||
      (selectedFilter === "active" &&
        (brief.status === CampaignStatus.OPEN ||
          brief.status === CampaignStatus.ASSIGNED)) ||
      (selectedFilter === "completed" &&
        brief.status === CampaignStatus.COMPLETED) ||
      (selectedFilter === "urgent" && isActionUrgent(brief));

    const matchesPriority =
      priorityFilter === "all" || getActionPriority(brief) === priorityFilter;

    return matchesSearch && matchesFilter && matchesPriority;
  });

  const isFormValid = () => {
    return (
      formData.name.trim() !== "" &&
      formData.description.trim() !== "" &&
      formData.requirements.trim() !== "" &&
      formData.budget.trim() !== "" &&
      Number(formData.budget) > 0 &&
      Number(formData.promotionDuration) >= 86400 &&
      Number(formData.maxInfluencers) >= 1 &&
      Number(formData.maxInfluencers) <= 10 &&
      Number(formData.applicationPeriod) >= 86400 &&
      Number(formData.applicationPeriod) <= 1209600 && // Max 14 days
      Number(formData.proofSubmissionGracePeriod) >= 86400 &&
      Number(formData.proofSubmissionGracePeriod) <= 172800 && // Max 2 days
      Number(formData.verificationPeriod) >= 86400 &&
      Number(formData.verificationPeriod) <= 432000 // Max 5 days
    );
  };

  const handleCreateCampaign = async (
    referralTag?: `0x${string}`
  ): Promise<string> => {
    console.log("DIVVI: Creating campaign with referral tag:", referralTag);

    if (!isFormValid()) {
      toast.error("Please fill in all required fields correctly");
      return Promise.reject("Form is invalid");
    }

    try {
      // Use unified multi-currency flow for ALL currencies including cUSD
      console.log(`Creating campaign with ${formData.currency} using unified multi-currency contract`);
      
      const campaignData = {
        name: formData.name,
        description: formData.description,
        requirements: formData.requirements,
        budget: formData.budget,
        promotionDuration: Number(formData.promotionDuration),
        maxInfluencers: Number(formData.maxInfluencers),
        targetAudience: Number(formData.targetAudience),
        applicationPeriod: Number(formData.applicationPeriod),
        proofSubmissionGracePeriod: Number(formData.proofSubmissionGracePeriod),
        verificationPeriod: Number(formData.verificationPeriod),
        selectionGracePeriod: Number(formData.selectionGracePeriod),
      };

      const result = await createCampaignWithToken(campaignData, formData.currency, referralTag);
      console.log("DIVVI: Unified campaign result:", result);
      
      // The automatic refresh will be handled by the useEffect listening to isMultiCurrencyCreateSuccess
      // This ensures proper state management and avoids race conditions
      
      return typeof result === "string" ? result : "";
    } catch (error) {
      console.error("Error creating campaign:", error);
      toast.error(
        `Failed to create campaign: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      return Promise.reject(
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  };

  const handleReleaseFunds = async (
    briefId: string,
    referralTag?: `0x${string}`
  ) => {
    console.log("DIVVI: Releasing funds with referral tag:", referralTag);

    try {
      const result = await completeCampaign(
        briefId as `0x${string}`,
        referralTag
      );
      console.log("DIVVI: Release funds result:", result);
      return result;
    } catch (error) {
      console.error("Error releasing funds:", error);
      toast.error(
        `Failed to release funds: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      throw error;
    }
  };

  const handleCancelCampaign = async (briefId: string) => {
    console.log("DIVVI: Cancelling campaign for briefId:", briefId);

    try {
      // Generate Divvi referral tag
      const referralTag = generateDivviReferralTag();
      console.log(
        "DIVVI: About to cancel campaign with referral tag:",
        referralTag
      );

      const result = await cancelBrief(briefId as `0x${string}`, referralTag);
      console.log("DIVVI: Cancel campaign result:", result);
      return result;
    } catch (error) {
      console.error("Error canceling campaign:", error);
      toast.error(
        `Failed to cancel campaign: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      throw error;
    }
  };

  const handleExpireCampaign = async (briefId: string) => {
    console.log("🔥 EXPIRE DEBUG: Starting expire process for briefId:", briefId);
    
    // Find the campaign to debug its state
    const campaign = briefs.find(b => b.id === briefId);
    console.log("🔥 EXPIRE DEBUG: Campaign found:", campaign);
    console.log("🔥 EXPIRE DEBUG: Campaign status:", campaign?.status);
    console.log("🔥 EXPIRE DEBUG: Campaign statusInfo:", campaign?.statusInfo);
    console.log("🔥 EXPIRE DEBUG: Can expire?", campaign?.statusInfo?.canExpire);

    if (!campaign) {
      toast.error("Campaign not found");
      return;
    }

    if (!campaign.statusInfo?.canExpire) {
      toast.error("Campaign cannot be expired in its current state");
      return;
    }

    try {
      // Generate Divvi referral tag
      const referralTag = generateDivviReferralTag();
      console.log("🔥 EXPIRE DEBUG: About to expire campaign with referral tag:", referralTag);

      const result = await expireCampaign(
        briefId as `0x${string}`,
        referralTag
      );
      console.log("🔥 EXPIRE DEBUG: Expire campaign result:", result);
      return result;
    } catch (error) {
      console.error("🔥 EXPIRE DEBUG: Error expiring campaign:", error);
      
      // More detailed error logging
      if (error instanceof Error) {
        console.error("🔥 EXPIRE DEBUG: Error message:", error.message);
        console.error("🔥 EXPIRE DEBUG: Error stack:", error.stack);
      }
      
      toast.error(
        `Failed to expire campaign: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      throw error;
    }
  };

  const canCancelCampaign = (brief: Brief): boolean => {
    return (
      brief.status === CampaignStatus.OPEN &&
      brief.selectedInfluencersCount === 0
    );
  };

  // Check if campaign can be started with partial selection
  const canStartPartialCampaign = (brief: Brief): boolean => {
    const now = Date.now() / 1000;
    const selectionDeadline = brief.selectionDeadline;
    return (
      brief.status === CampaignStatus.OPEN &&
      brief.selectedInfluencersCount > 0 &&
      brief.selectedInfluencersCount < brief.maxInfluencers &&
      now > selectionDeadline
    );
  };

  // Check if campaign can be cancelled with compensation
  const canCancelWithCompensation = (brief: Brief): boolean => {
    const now = Date.now() / 1000;
    const selectionDeadline = brief.selectionDeadline;
    return (
      brief.status === CampaignStatus.OPEN &&
      brief.selectedInfluencersCount > 0 &&
      now > selectionDeadline
    );
  };

  const handleStartPartialCampaign = async (briefId: string) => {
    try {
      const referralTag = generateDivviReferralTag();
      await startCampaignWithPartialSelection(
        briefId as `0x${string}`,
        referralTag
      );
    } catch (error) {
      console.error("Error starting partial campaign:", error);
      // Error will be handled by useEffect, but we keep this for immediate feedback
      toast.error("Failed to initiate partial campaign start");
    }
  };

  const handleCancelWithCompensation = async (briefId: string) => {
    try {
      const brief = briefs.find(b => b.id === briefId);
      if (!brief) return;
      
      // Calculate 10% of budget divided equally among selected influencers
      const compensationPerInfluencer = (Number(brief.budget) * 0.1 / brief.selectedInfluencersCount).toFixed(2);
      
      const referralTag = generateDivviReferralTag();
      await cancelCampaignWithCompensation(briefId as `0x${string}`, compensationPerInfluencer, referralTag);
    } catch (error) {
      console.error("Error cancelling with compensation:", error);
      // Error will be handled by useEffect, but we keep this for immediate feedback
      toast.error("Failed to initiate campaign cancellation");
    }
  };

  const handleCreateCampaignClick = () => {
    if (!isConnected) {
      toast.error("Please connect your wallet first");
      return;
    }
    if (!isCorrectChain) {
      toast.error(`Please switch to ${currentNetwork.name} first`);
      return;
    }
    setShowCreateModal(true);
  };

  // Show loading state while profile is being fetched
  if (isLoadingProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <motion.div
          className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl md:rounded-2xl p-6 md:p-8 max-w-sm w-full text-center"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="animate-spin rounded-full h-8 w-8 md:h-12 md:w-12 border-t-2 border-b-2 border-emerald-500 mx-auto mb-4 md:mb-6"></div>
          <h2 className="text-lg md:text-xl font-semibold text-white mb-2 md:mb-3">
            Loading Profile...
          </h2>
          <p className="text-slate-400 text-sm md:text-base">
            Please wait while we fetch your account information.
          </p>
        </motion.div>
      </div>
    );
  }

  if (!userProfile?.isRegistered || !userProfile?.isBusiness) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <motion.div
          className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl md:rounded-2xl p-6 md:p-8 max-w-sm w-full text-center"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl md:rounded-2xl flex items-center justify-center mx-auto mb-4 md:mb-6">
            <Briefcase className="w-6 h-6 md:w-8 md:h-8 text-white" />
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-white mb-3 md:mb-4">
            Business Account Required
          </h2>
          <p className="text-slate-400 text-sm md:text-base mb-6 md:mb-8 leading-relaxed">
            You need to register as a business to access the brand dashboard and
            create campaigns.
          </p>
          <Link href="/">
            <motion.button
              className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold py-2.5 px-4 md:py-3 md:px-6 rounded-lg md:rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all duration-200 shadow-lg shadow-emerald-500/20 text-sm md:text-base"
              whileTap={{ scale: 0.95 }}
            >
              Register as Business
            </motion.button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pt-20 sm:pt-24 md:pt-40">
      <Toaster position="top-right" />

      <div className="px-4 md:px-6 lg:px-8 pb-8 max-w-7xl mx-auto">
        {/* Network Status */}
        {isConnected && !isCorrectChain && (
          <div className="mb-8">
            <NetworkStatus className="bg-slate-800/60 border-amber-500/50" />
          </div>
        )}

        {/* Connection Status Indicator */}
        <div className="mb-6 flex items-center justify-end">
          <div className="flex items-center gap-3 text-sm">
            {isConnected ? (
              <>
                <Wifi className="w-5 h-5 text-emerald-400" />
                <span className="text-emerald-400 font-medium">Connected</span>
                {isCorrectChain ? (
                  <span className="text-emerald-400">
                    • {currentNetwork.name}
                  </span>
                ) : (
                  <span className="text-amber-400">• Wrong Network</span>
                )}
              </>
            ) : (
              <>
                <WifiOff className="w-5 h-5 text-red-400" />
                <span className="text-red-400 font-medium">Not Connected</span>
              </>
            )}
          </div>
        </div>

        {/* Header Section */}
        <motion.div
          className="mb-6 md:mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex flex-col gap-4 md:gap-6">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 md:gap-4 mb-2 md:mb-3">
                <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold text-white">
                  Welcome,{" "}
                  <span className="bg-gradient-to-r from-emerald-400 to-emerald-600 bg-clip-text text-transparent">
                    {userProfile?.username || "Brand"}
                  </span>
                </h1>
                {/* Business Status Badge */}
                {userProfile?.status !== undefined && (
                  <span
                    className={`inline-flex items-center px-2 py-1 md:px-4 md:py-2 rounded-full text-xs md:text-sm font-medium border ${getUserStatusColor(
                      userProfile.status
                    )}`}
                  >
                    <Crown className="w-3 h-3 md:w-5 md:h-5 mr-1 md:mr-2" />
                    {getUserStatusLabel(userProfile.status)}
                  </span>
                )}
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 md:gap-6">
                <p className="text-sm md:text-xl text-slate-400">
                  Manage your campaigns and track performance
                </p>
                {userProfile?.totalEscrowed !== undefined && (
                  <span className="text-xs md:text-sm text-slate-500 bg-slate-800/50 px-2 py-1 md:px-3 md:py-1 rounded-full">
                    Total invested:{" "}
                    {formatCurrency(fromWei(userProfile.totalEscrowed), "cUSD")}
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-3 md:gap-4">
              {/* Search */}
              <div className="relative w-full">
                <Search className="absolute left-3 md:left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4 md:w-5 md:h-5" />
                <input
                  type="text"
                  placeholder="Search campaigns..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 md:pl-12 md:pr-4 md:py-3 bg-slate-800/50 border border-slate-700/50 rounded-lg md:rounded-xl text-sm md:text-base text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:bg-slate-800/80 transition-all backdrop-blur-sm"
                />
              </div>

              {/* Filters and Button Row */}
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Filters */}
                <div className="flex gap-2 md:gap-3 flex-1">
                  <div className="relative flex-1 sm:flex-none">
                    <select
                      value={selectedFilter}
                      onChange={(e) => setSelectedFilter(e.target.value)}
                      className="w-full appearance-none bg-slate-800/50 border border-slate-700/50 rounded-lg md:rounded-xl px-3 py-2.5 md:px-4 md:py-3 text-sm md:text-base text-white focus:outline-none focus:border-emerald-500/50 cursor-pointer backdrop-blur-sm"
                    >
                      <option value="all">All Campaigns</option>
                      <option value="active">Active</option>
                      <option value="completed">Completed</option>
                      <option value="urgent">Needs Attention</option>
                    </select>
                    <Filter className="absolute right-2.5 md:right-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-3 h-3 md:w-4 md:h-4 pointer-events-none" />
                  </div>

                  <div className="relative flex-1 sm:flex-none">
                    <select
                      value={priorityFilter}
                      onChange={(e) => setPriorityFilter(e.target.value)}
                      className="w-full appearance-none bg-slate-800/50 border border-slate-700/50 rounded-lg md:rounded-xl px-3 py-2.5 md:px-4 md:py-3 text-sm md:text-base text-white focus:outline-none focus:border-emerald-500/50 cursor-pointer backdrop-blur-sm"
                    >
                      <option value="all">All Priority</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                    <Flag className="absolute right-2.5 md:right-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-3 h-3 md:w-4 md:h-4 pointer-events-none" />
                  </div>
                </div>

                {/* Buttons Group */}
                <div className="flex gap-2 md:gap-3 flex-shrink-0">
                  {/* Create Spark Campaign Button */}
                  <motion.button
                    onClick={() => setShowCreateSparkModal(true)}
                    disabled={!isConnected || !isCorrectChain}
                    className={`flex items-center justify-center gap-2 px-3 py-2.5 md:px-4 md:py-3 rounded-lg md:rounded-xl font-semibold transition-all duration-200 shadow-lg text-xs md:text-sm ${
                      !isConnected || !isCorrectChain
                        ? "bg-slate-600/50 text-slate-400 cursor-not-allowed border border-slate-600/50"
                        : "bg-gradient-to-r from-yellow-400 to-orange-500 text-white hover:from-yellow-500 hover:to-orange-600 shadow-yellow-500/20"
                    }`}
                    whileTap={
                      isConnected && isCorrectChain ? { scale: 0.95 } : {}
                    }
                  >
                    {!isConnected ? (
                      <>
                        <AlertTriangle className="w-3 h-3 md:w-4 md:h-4" />
                        <span className="hidden lg:inline">Connect</span>
                      </>
                    ) : !isCorrectChain ? (
                      <>
                        <AlertTriangle className="w-3 h-3 md:w-4 md:h-4" />
                        <span className="hidden lg:inline">Wrong Network</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-3 h-3 md:w-4 md:h-4" />
                        <span className="hidden sm:inline">Spark</span>
                      </>
                    )}
                  </motion.button>

                  {/* Create Campaign Button */}
                  <motion.button
                    onClick={handleCreateCampaignClick}
                    disabled={!isConnected || !isCorrectChain}
                    className={`flex items-center justify-center gap-2 px-4 py-2.5 md:px-6 md:py-3 rounded-lg md:rounded-xl font-semibold transition-all duration-200 shadow-lg text-sm md:text-base ${
                      !isConnected || !isCorrectChain
                        ? "bg-slate-600/50 text-slate-400 cursor-not-allowed border border-slate-600/50"
                        : "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700 shadow-emerald-500/20"
                    }`}
                    whileTap={
                      isConnected && isCorrectChain ? { scale: 0.95 } : {}
                    }
                  >
                    {!isConnected ? (
                      <>
                        <AlertTriangle className="w-4 h-4 md:w-5 md:h-5" />
                        <span className="hidden sm:inline">Connect Wallet</span>
                        <span className="sm:hidden">Connect</span>
                      </>
                    ) : !isCorrectChain ? (
                      <>
                        <AlertTriangle className="w-4 h-4 md:w-5 md:h-5" />
                        <span className="hidden sm:inline">Wrong Network</span>
                        <span className="sm:hidden">Wrong Net</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 md:w-5 md:h-5 group-hover:rotate-90 transition-transform duration-200" />
                        <span className="hidden sm:inline">New Campaign</span>
                        <span className="sm:hidden">New</span>
                      </>
                    )}
                  </motion.button>

                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Urgent Actions Alert */}
        {dashboardData?.urgentActions &&
          dashboardData.urgentActions.length > 0 && (
            <motion.div
              className="mb-6 md:mb-8 bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20 rounded-xl md:rounded-2xl p-4 md:p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-start gap-3 md:gap-4">
                <div className="p-2 md:p-3 bg-orange-500/20 rounded-lg md:rounded-xl border border-orange-500/30">
                  <Bell className="w-5 h-5 md:w-6 md:h-6 text-orange-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg md:text-xl font-semibold text-white mb-2 md:mb-3">
                    Urgent Actions Required
                  </h3>
                  <div className="space-y-2 md:space-y-3">
                    {dashboardData?.urgentActions
                      .slice(0, 3)
                      .map((action, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 md:p-4 bg-slate-800/50 rounded-lg md:rounded-xl"
                        >
                          <div>
                            <p className="font-medium text-white mb-0.5 md:mb-1 text-sm md:text-base">
                              {action.campaignName}
                            </p>
                            <p className="text-xs md:text-sm text-orange-400">
                              {action.action}
                            </p>
                          </div>
                          <span
                            className={`px-2 py-1 md:px-3 md:py-1 text-xs font-medium rounded-full ${
                              action.priority === "high"
                                ? "bg-red-500/20 text-red-400"
                                : action.priority === "medium"
                                ? "bg-orange-500/20 text-orange-400"
                                : "bg-yellow-500/20 text-yellow-400"
                            }`}
                          >
                            {action.priority}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}


        {/* Currency Converter Button */}
        <motion.div
          className="mb-6 md:mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <button
            onClick={() => setShowCurrencyConverter(true)}
            className="w-full bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-xl p-4 hover:from-emerald-500/20 hover:to-teal-500/20 transition-all duration-300"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/20 rounded-lg">
                  <ArrowRightLeft className="w-5 h-5 text-emerald-400" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-white">Currency Converter</h3>
                  <p className="text-sm text-slate-400">View rates and plan multi-currency campaigns</p>
                </div>
              </div>
              <ChevronDown className="w-5 h-5 text-slate-400 transform rotate-[-90deg]" />
            </div>
          </button>
        </motion.div>

        {/* Fund Wallet Button */}
        <motion.div
          className="mb-6 md:mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <button
            onClick={() => setShowWalletFunding(true)}
            className="w-full bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-xl p-6 hover:from-emerald-500/20 hover:to-teal-500/20 transition-all duration-300 group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-500/20 rounded-xl group-hover:bg-emerald-500/30 transition-colors">
                  <Wallet className="w-6 h-6 text-emerald-400" />
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors">
                    Fund Wallet with Local Currency
                  </h3>
                  <p className="text-sm text-slate-400">
                    Add Naira, M-Pesa, SEPA, and more • Get stablecoins instantly • 96% lower fees
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <div className="text-sm text-slate-400">6 Currencies</div>
                  <div className="text-xs text-emerald-400">2.5-3.5% fees</div>
                </div>
                <ChevronDown className="w-5 h-5 text-slate-400 transform rotate-[-90deg] group-hover:text-emerald-400 transition-colors" />
              </div>
            </div>
          </button>
        </motion.div>
        
        {/* Multi-Currency Summary */}
        {dashboardData?.budgetByCurrency && Object.keys(dashboardData.budgetByCurrency).length > 1 && (
          <motion.div
            className="mb-6 md:mb-8 bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl md:rounded-2xl p-4 md:p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h3 className="text-lg md:text-xl font-bold text-white mb-4">
              Multi-Currency Portfolio
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
              {Object.entries(dashboardData.budgetByCurrency).map(([currency, amount]) => (
                <div
                  key={currency}
                  className="bg-slate-700/30 rounded-lg p-3 border border-slate-600/50"
                >
                  <div className="text-center">
                    <div className="text-sm font-medium text-slate-400 mb-1">
                      {currency}
                    </div>
                    <div className="text-base md:text-lg font-bold text-white">
                      {formatCurrency(amount, currency as SupportedCurrency, 0)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
        
        <div className="mb-6 md:mb-8"></div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-10">
          {[
            {
              icon: Activity,
              color: "blue-400",
              value: dashboardData?.activeBriefs.length || 0,
              label: "Active Campaigns",
              subtext: `${
                dashboardData?.urgentActions.length || 0
              } need attention`,
            },
            {
              icon: CheckCircle,
              color: "green-400",
              value: dashboardData?.completedBriefs.length || 0,
              label: "Completed Campaigns",
              subtext: "Successfully finished",
            },
            {
              icon: DollarSign,
              color: "emerald-400",
              value: formatCurrency(
                dashboardData?.budgetByCurrency?.[dashboardData.primaryCurrency] || 0, 
                dashboardData?.primaryCurrency as SupportedCurrency || "cUSD", 
                0
              ),
              label: `Total Budget (${dashboardData?.primaryCurrency || "cUSD"})`,
              subtext: Object.keys(dashboardData?.budgetByCurrency || {}).length > 1 ? 
                `${Object.keys(dashboardData?.budgetByCurrency || {}).length} currencies` : 
                "Across all campaigns",
            },
            {
              icon: Users,
              color: "orange-400",
              value: dashboardData?.totalInfluencers || 0,
              label: "Active Influencers",
              subtext: "Currently working",
            },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl md:rounded-2xl p-3 md:p-6 hover:bg-slate-800/70 transition-all duration-200"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <div className="flex items-start justify-between mb-2 md:mb-4">
                <div
                  className={`p-2 md:p-3 bg-gradient-to-br from-${stat.color}/20 to-${stat.color}/30 rounded-lg md:rounded-xl border border-${stat.color}/20`}
                >
                  <stat.icon
                    className={`w-4 h-4 md:w-6 md:h-6 text-${stat.color}`}
                  />
                </div>
              </div>
              <div className="space-y-0.5 md:space-y-1">
                <p className="text-lg md:text-2xl font-bold text-white">
                  {stat.value}
                </p>
                <p className="text-slate-400 text-xs md:text-base">
                  {stat.label}
                </p>
                <p className="text-slate-500 text-xs md:text-sm">
                  {stat.subtext}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Enhanced Campaigns List */}
        <motion.div
          className="space-y-4 md:space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-xl md:text-2xl font-bold text-white">
              Your Campaigns
            </h2>
            <span className="text-slate-400 text-sm md:text-base">
              {filteredBriefs.length} campaigns
            </span>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12 md:py-20">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-6 w-6 md:h-8 md:w-8 border-b-2 border-emerald-500 mb-3 md:mb-4"></div>
                <p className="text-slate-400 text-sm md:text-base">
                  Loading campaigns...
                </p>
              </div>
            </div>
          ) : filteredBriefs.length === 0 ? (
            <div className="text-center py-12 md:py-20">
              <Briefcase className="w-12 h-12 md:w-16 md:h-16 text-slate-600 mx-auto mb-4 md:mb-6" />
              <h3 className="text-lg md:text-2xl font-semibold text-white mb-2 md:mb-3">
                No campaigns found
              </h3>
              <p className="text-slate-400 max-w-md mx-auto leading-relaxed text-sm md:text-base">
                {searchTerm
                  ? "Try adjusting your search or filter criteria."
                  : "Create your first campaign to get started with influencer marketing."}
              </p>
            </div>
          ) : (
            <div className="space-y-4 md:space-y-6">
              {filteredBriefs.map((brief, index) => {
                const isUrgent = isActionUrgent(brief);
                const priority = getActionPriority(brief);
                const isExpanded = expandedBriefId === brief.id;
                const isDescriptionExpanded = expandedDescriptions.has(
                  brief.id
                );
                const showExpandButton = shouldShowExpandButton(
                  brief.description
                );

                return (
                  <motion.div
                    key={brief.id}
                    className="group relative bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl overflow-hidden hover:border-slate-600/50 transition-all duration-300"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    whileHover={{ y: -2 }}
                  >
                    {/* Status indicator line */}
                    <div
                      className={`absolute top-0 left-0 right-0 h-1 ${
                        brief.status === CampaignStatus.CANCELLED
                          ? "bg-red-500"
                          : isUrgent
                          ? "bg-orange-500"
                          : "bg-emerald-500"
                      }`}
                    />

                    {/* Main Content */}
                    <div className="relative p-4 space-y-4">
                      {/* Header Section */}
                      <div className="flex items-start gap-3">
                       

                        <div className="flex-1 min-w-0">
                          {/* Title and Status Row */}
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex-1 min-w-0">
                              <h3 className="text-lg font-bold text-white leading-tight mb-1 group-hover:text-emerald-100 transition-colors line-clamp-2">
                                {brief.name}
                              </h3>
                              <div className="flex items-center gap-2 text-xs text-slate-400">
                                <Calendar className="w-3 h-3" />
                                <span>
                                  {format(
                                    new Date(brief.creationTime * 1000),
                                    "MMM d"
                                  )}
                                </span>
                              </div>
                            </div>

                            {/* Status Badges - Mobile Optimized */}
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              {/* Main Status */}
                              <div
                                className={`px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(
                                  brief.status
                                )}`}
                              >
                                {brief.status === CampaignStatus.CANCELLED && (
                                  <Ban className="w-3 h-3 mr-1 inline" />
                                )}
                                <span>
                                  {brief.statusInfo.statusLabel.slice(0, 6)}
                                </span>
                              </div>

                              {/* Priority Badge */}
                              {isUrgent && (
                                <div
                                  className={`flex items-center px-2 py-1 text-xs font-semibold rounded-full border ${
                                    priority === "high"
                                      ? "bg-red-500/20 text-red-300 border-red-500/40"
                                      : priority === "medium"
                                      ? "bg-orange-500/20 text-orange-300 border-orange-500/40"
                                      : "bg-yellow-500/20 text-yellow-300 border-yellow-500/40"
                                  }`}
                                >
                                  <Zap className="w-3 h-3 mr-1 animate-pulse" />
                                  <span>!</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Description Section */}
                          <div className="mb-3">
                            <p className="text-slate-300 text-sm leading-relaxed line-clamp-2">
                              {isDescriptionExpanded
                                ? brief.description
                                : getTruncatedDescription(brief.description)}
                            </p>
                            {showExpandButton && (
                              <motion.button
                                onClick={() => toggleDescription(brief.id)}
                                className="mt-2 inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 transition-colors font-medium"
                                whileTap={{ scale: 0.95 }}
                              >
                                <FileText className="w-3 h-3" />
                                {isDescriptionExpanded
                                  ? "Show less"
                                  : "Show more"}
                                <motion.div
                                  animate={{
                                    rotate: isDescriptionExpanded ? 180 : 0,
                                  }}
                                  transition={{ duration: 0.2 }}
                                >
                                  <ChevronDown className="w-3 h-3" />
                                </motion.div>
                              </motion.button>
                            )}
                          </div>

                          {/* Metrics Row - Mobile Optimized */}
                          <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
                            {brief.timingInfo.currentDeadline &&
                              brief.timingInfo.timeRemaining && (
                                <div className="flex items-center gap-1.5">
                                  <Clock className="w-3 h-3" />
                                  <span
                                    className={
                                      brief.timingInfo.isUrgent
                                        ? "text-orange-300 font-medium"
                                        : ""
                                    }
                                  >
                                    {formatTimeRemaining(
                                      brief.timingInfo.timeRemaining
                                    )}
                                  </span>
                                </div>
                              )}
                            <div className="flex items-center gap-1.5">
                              <Users className="w-3 h-3" />
                              <span>
                                {brief.selectedInfluencersCount}/
                                {brief.maxInfluencers}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Next Action Alert - Mobile Optimized */}
                      {brief.statusInfo.nextAction && (
                        <div
                          className={`relative p-3 rounded-lg border ${
                            isUrgent
                              ? "bg-orange-500/10 border-orange-500/30"
                              : "bg-blue-500/10 border-blue-500/30"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-2 h-2 rounded-full ${
                                isUrgent ? "bg-orange-400" : "bg-blue-400"
                              }`}
                            />
                            <span className="text-white font-semibold text-sm">
                              {brief.statusInfo.nextAction}
                            </span>
                          </div>
                          {brief.statusInfo.warning && (
                            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-white/10">
                              <AlertTriangle className="w-3 h-3 text-orange-400" />
                              <span className="text-orange-300 text-xs">
                                {brief.statusInfo.warning.replace(
                                  /auto.?approval/gi,
                                  "campaign completion"
                                )}
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Budget & Progress Section - Mobile Optimized */}
                      <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg border border-slate-600/50">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <div className="text-lg font-bold text-white">
                              {formatCurrency(brief.budget, brief.currency as SupportedCurrency || "cUSD")}
                            </div>
                            {brief.currency && MENTO_TOKENS[brief.currency as SupportedCurrency] && (
                              <span className="text-lg">
                                {MENTO_TOKENS[brief.currency as SupportedCurrency]?.flag}
                              </span>
                            )}
                          </div>
                          <div className="text-slate-400 text-xs">
                            {brief.selectedInfluencersCount > 0
                              ? `${formatCurrency(
                                  brief.progressInfo.budgetPerSpot, 
                                  brief.currency as SupportedCurrency || "cUSD"
                                )} per influencer`
                              : `${formatCurrency(
                                  brief.progressInfo.budgetPerSpot,
                                  brief.currency as SupportedCurrency || "cUSD"
                                )} per spot`}
                          </div>
                        </div>

                        <div className="text-right space-y-1.5">
                          <div className="text-slate-400 text-xs">
                            <span className="text-white font-semibold">
                              {brief.progressInfo.spotsFilledPercentage}%
                            </span>{" "}
                            filled
                          </div>
                          <div className="w-20 h-1.5 bg-slate-600/50 rounded-full overflow-hidden">
                            <motion.div
                              className="h-full bg-emerald-500"
                              initial={{ width: 0 }}
                              animate={{
                                width: `${brief.progressInfo.spotsFilledPercentage}%`,
                              }}
                              transition={{ duration: 1.2, delay: 0.5 }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Expandable Requirements Section - Mobile Optimized */}
                    <div className="border-t border-slate-700/30 bg-slate-900/20">
                      <motion.button
                        onClick={() =>
                          setExpandedBriefId(isExpanded ? null : brief.id)
                        }
                        className="w-full p-3 flex items-center justify-between text-left hover:bg-white/5 transition-all duration-300 group/button"
                        whileTap={{ scale: 0.998 }}
                      >
                        <div className="flex items-center gap-2">
                          <CheckSquare className="w-4 h-4 text-slate-400 group-hover/button:text-emerald-400 transition-colors" />
                          <span className="text-slate-300 font-semibold text-sm group-hover/button:text-white transition-colors">
                            Requirements
                          </span>
                        </div>
                        <motion.div
                          animate={{ rotate: isExpanded ? 180 : 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <ChevronDown className="w-4 h-4 text-slate-400 group-hover/button:text-emerald-400 transition-colors" />
                        </motion.div>
                      </motion.button>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.4 }}
                            className="overflow-hidden"
                          >
                            <div className="px-4 pb-4">
                              <div className="bg-slate-700/30 p-3 rounded-lg border border-slate-600/50">
                                <p className="text-slate-200 leading-relaxed text-sm">
                                  {brief.requirements ||
                                    "No specific requirements"}
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Action Buttons - Mobile Optimized */}
                    <div className="p-3 pt-0">
                      <div className="flex flex-col gap-2">
                        {/* Primary Actions */}
                        <div className="flex gap-2">
                          <motion.button
                            onClick={() => {
                              setSelectedBrief(brief);
                              setShowApplicationsModal(true);
                            }}
                            disabled={brief.status === CampaignStatus.CANCELLED}
                            className={`relative flex-1 font-semibold py-2.5 px-3 rounded-lg border transition-all duration-300 text-sm ${
                              brief.status === CampaignStatus.CANCELLED
                                ? "bg-slate-700/30 text-slate-500 border-slate-600/30 cursor-not-allowed"
                                : "bg-slate-700/50 hover:bg-slate-700 text-white border-slate-600/50 hover:border-slate-500"
                            }`}
                            whileTap={
                              brief.status !== CampaignStatus.CANCELLED
                                ? { scale: 0.95 }
                                : {}
                            }
                          >
                            Applications
                            {applications.length > 0 &&
                              brief.status !== CampaignStatus.CANCELLED && (
                                <span className="absolute -top-1 -right-1 bg-emerald-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-bold">
                                  {applications.length}
                                </span>
                              )}
                          </motion.button>

                          <motion.button
                            onClick={() => {
                              setSelectedBrief(brief);
                              setShowSubmissionsModal(true);
                            }}
                            disabled={brief.status === CampaignStatus.CANCELLED}
                            className={`flex-1 font-semibold py-2.5 px-3 rounded-lg border transition-all duration-300 text-sm ${
                              brief.status === CampaignStatus.CANCELLED
                                ? "bg-slate-700/30 text-slate-500 border-slate-600/30 cursor-not-allowed"
                                : "bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border-emerald-500/40 hover:border-emerald-500/60"
                            }`}
                            whileTap={
                              brief.status !== CampaignStatus.CANCELLED
                                ? { scale: 0.95 }
                                : {}
                            }
                          >
                            Submissions
                          </motion.button>
                        </div>

                        {/* Secondary Actions - Mobile Optimized */}
                        <div className="flex items-center justify-between">
                          <div className="flex gap-1">
                            <ShareCampaignButton
                              campaign={brief}
                              className="flex-shrink-0"
                            />

                            {/* Action Buttons */}
                            {brief.statusInfo.canExpire && (
                              <motion.button
                                onClick={() => {
                                  toast.error("Expire campaign function is currently being updated. Please use cancel campaign instead.");
                                }}
                                disabled={true}
                                className="p-2 bg-gray-600/20 text-gray-400 rounded-lg border border-gray-500/40 transition-all duration-300 font-medium opacity-50 cursor-not-allowed"
                                whileTap={{ scale: 0.95 }}
                                title="Expire Campaign (Currently Unavailable)"
                              >
                                <Clock className="w-4 h-4" />
                              </motion.button>
                            )}

                            {canCancelCampaign(brief) && (
                              <motion.button
                                onClick={() => setShowCancelConfirm(brief.id)}
                                disabled={isCancelingBrief}
                                className="p-2 bg-red-600/20 hover:bg-red-600/30 text-red-300 rounded-lg border border-red-500/40 hover:border-red-500/60 transition-all duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                whileTap={{ scale: 0.95 }}
                                title="Cancel Campaign"
                              >
                                {isCancelingBrief ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Trash2 className="w-4 h-4" />
                                )}
                              </motion.button>
                            )}

                            {canStartPartialCampaign(brief) && (
                              <motion.button
                                onClick={() =>
                                  setShowStartPartialConfirm(brief.id)
                                }
                                disabled={isStartingPartialCampaign}
                                className="p-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 rounded-lg border border-emerald-500/40 hover:border-emerald-500/60 transition-all duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                whileTap={{ scale: 0.95 }}
                                title="Start with Partial Selection"
                              >
                                {isStartingPartialCampaign ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Zap className="w-4 h-4" />
                                )}
                              </motion.button>
                            )}

                            {canCancelWithCompensation(brief) && (
                              <motion.button
                                onClick={() =>
                                  setShowCancelWithCompensationModal(brief.id)
                                }
                                disabled={isCancelingWithCompensation}
                                className="p-2 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 rounded-lg border border-amber-500/40 hover:border-amber-500/60 transition-all duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                whileTap={{ scale: 0.95 }}
                                title="Cancel with Compensation"
                              >
                                {isCancelingWithCompensation ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Ban className="w-4 h-4" />
                                )}
                              </motion.button>
                            )}
                          </div>

                          <motion.button
                            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all duration-300"
                            whileTap={{ scale: 0.95 }}
                          >
                            <MoreVertical className="w-4 h-4" />
                          </motion.button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <motion.div
          className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-slate-800/95 backdrop-blur-xl border border-slate-700/50 rounded-xl md:rounded-2xl p-4 md:p-8 max-w-md mx-auto shadow-2xl shadow-red-500/10 w-full"
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
          >
            <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-6">
              <div className="p-2 md:p-3 bg-red-500/10 rounded-xl md:rounded-2xl border border-red-500/20">
                <XCircle className="w-6 h-6 md:w-8 md:h-8 text-red-400" />
              </div>
              <div>
                <h3 className="text-lg md:text-xl font-bold text-white">
                  Cancel Campaign
                </h3>
                <p className="text-sm md:text-base text-slate-400">
                  This action cannot be undone
                </p>
              </div>
            </div>

            <p className="text-slate-300 mb-6 md:mb-8 leading-relaxed text-sm md:text-base">
              Are you sure you want to cancel this campaign? The budget will be
              refunded to your wallet.
            </p>

            <div className="flex gap-3 md:gap-4">
              <button
                onClick={() => setShowCancelConfirm(null)}
                disabled={isCancelingBrief}
                className="flex-1 px-4 py-2.5 md:px-6 md:py-3 font-medium text-slate-300 bg-slate-700/50 rounded-lg md:rounded-xl border border-slate-600/50 hover:bg-slate-700 transition-all disabled:opacity-50 text-sm md:text-base"
              >
                Keep Campaign
              </button>
              <button
                onClick={() => {
                  if (showCancelConfirm) {
                    handleCancelCampaign(showCancelConfirm);
                  }
                }}
                disabled={isCancelingBrief}
                className="flex-1 px-4 py-2.5 md:px-6 md:py-3 font-medium text-white bg-gradient-to-r from-red-500 to-red-600 rounded-lg md:rounded-xl hover:from-red-600 hover:to-red-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm md:text-base"
              >
                {isCancelingBrief ? (
                  <>
                    <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" />
                    <span className="hidden sm:inline">Canceling...</span>
                    <span className="sm:hidden">...</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 md:w-5 md:h-5" />
                    <span className="hidden sm:inline">Cancel Campaign</span>
                    <span className="sm:hidden">Cancel</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Expire Confirmation Modal */}
      {showExpireConfirm && (
        <motion.div
          className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-slate-800/95 backdrop-blur-xl border border-slate-700/50 rounded-xl md:rounded-2xl p-4 md:p-8 max-w-md mx-auto shadow-2xl shadow-orange-500/10 w-full"
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
          >
            <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-6">
              <div className="p-2 md:p-3 bg-orange-500/10 rounded-xl md:rounded-2xl border border-orange-500/20">
                <Clock className="w-6 h-6 md:w-8 md:h-8 text-orange-400" />
              </div>
              <div>
                <h3 className="text-lg md:text-xl font-bold text-white">
                  Expire Campaign
                </h3>
                <p className="text-sm md:text-base text-slate-400">
                  Campaign past deadline
                </p>
              </div>
            </div>

            <p className="text-slate-300 mb-6 md:mb-8 leading-relaxed text-sm md:text-base">
              Are you sure you want to expire this campaign? The remaining
              budget will be refunded to your wallet. This action cannot be
              undone.
            </p>

            <div className="flex gap-3 md:gap-4">
              <button
                onClick={() => setShowExpireConfirm(null)}
                disabled={isExpiringBrief}
                className="flex-1 px-4 py-2.5 md:px-6 md:py-3 font-medium text-slate-300 bg-slate-700/50 rounded-lg md:rounded-xl border border-slate-600/50 hover:bg-slate-700 transition-all disabled:opacity-50 text-sm md:text-base"
              >
                Keep Campaign
              </button>
              <button
                onClick={() => {
                  if (showExpireConfirm) {
                    handleExpireCampaign(showExpireConfirm);
                  }
                }}
                disabled={isExpiringBrief}
                className="flex-1 px-4 py-2.5 md:px-6 md:py-3 font-medium text-white bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg md:rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm md:text-base"
              >
                {isExpiringBrief ? (
                  <>
                    <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" />
                    <span className="hidden sm:inline">Expiring...</span>
                    <span className="sm:hidden">...</span>
                  </>
                ) : (
                  <>
                    <Clock className="w-4 h-4 md:w-5 md:h-5" />
                    <span className="hidden sm:inline">Expire Campaign</span>
                    <span className="sm:hidden">Expire</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Start Partial Campaign Confirmation Modal */}
      {showStartPartialConfirm && (
        <motion.div
          className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-slate-800/95 backdrop-blur-xl border border-slate-700/50 rounded-xl md:rounded-2xl p-4 md:p-8 max-w-md mx-auto shadow-2xl shadow-emerald-500/10 w-full"
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
          >
            <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-6">
              <div className="p-2 md:p-3 bg-emerald-500/10 rounded-xl md:rounded-2xl border border-emerald-500/20">
                <Zap className="w-6 h-6 md:w-8 md:h-8 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-lg md:text-xl font-bold text-white">
                  Start with Partial Selection
                </h3>
                <p className="text-sm md:text-base text-slate-400">
                  Proceed with selected influencers
                </p>
              </div>
            </div>

            <p className="text-slate-300 mb-6 md:mb-8 leading-relaxed text-sm md:text-base">
              Start the campaign with the currently selected influencers. Unused
              budget will be refunded automatically.
            </p>

            <div className="flex gap-3 md:gap-4">
              <button
                onClick={() => setShowStartPartialConfirm(null)}
                disabled={isStartingPartialCampaign}
                className="flex-1 px-4 py-2.5 md:px-6 md:py-3 font-medium text-slate-300 bg-slate-700/50 rounded-lg md:rounded-xl border border-slate-600/50 hover:bg-slate-700 transition-all disabled:opacity-50 text-sm md:text-base"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (showStartPartialConfirm) {
                    handleStartPartialCampaign(showStartPartialConfirm);
                  }
                }}
                disabled={isStartingPartialCampaign}
                className="flex-1 px-4 py-2.5 md:px-6 md:py-3 font-medium text-white bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-lg md:rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm md:text-base"
              >
                {isStartingPartialCampaign ? (
                  <>
                    <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" />
                    <span className="hidden sm:inline">Starting...</span>
                    <span className="sm:hidden">...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 md:w-5 md:h-5" />
                    <span className="hidden sm:inline">Start Campaign</span>
                    <span className="sm:hidden">Start</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Cancel with Compensation Modal */}
      {showCancelWithCompensationModal && (
        <motion.div
          className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-slate-800/95 backdrop-blur-xl border border-slate-700/50 rounded-xl md:rounded-2xl p-4 md:p-8 max-w-md mx-auto shadow-2xl shadow-amber-500/10 w-full"
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
          >
            <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-6">
              <div className="p-2 md:p-3 bg-amber-500/10 rounded-xl md:rounded-2xl border border-amber-500/20">
                <Ban className="w-6 h-6 md:w-8 md:h-8 text-amber-400" />
              </div>
              <div>
                <h3 className="text-lg md:text-xl font-bold text-white">
                  Cancel with Compensation
                </h3>
                <p className="text-sm md:text-base text-slate-400">
                  Compensate selected influencers
                </p>
              </div>
            </div>

            <p className="text-slate-300 mb-4 leading-relaxed text-sm md:text-base">
              Cancel the campaign and provide fair compensation to selected influencers for their time.
            </p>

            {showCancelWithCompensationModal && (() => {
              const brief = briefs.find(b => b.id === showCancelWithCompensationModal);
              if (!brief) return null;
              
              const totalCompensation = Number(brief.budget) * 0.1;
              const compensationPerInfluencer = totalCompensation / brief.selectedInfluencersCount;
              const remainingRefund = Number(brief.budget) - totalCompensation;
              
              return (
                <div className="mb-6 bg-slate-900/50 border border-slate-700/50 rounded-xl p-4">
                  <h4 className="text-sm font-medium text-slate-300 mb-3">Compensation Breakdown</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Total Budget:</span>
                      <span className="text-white">{formatCurrency(Number(brief.budget), brief.currency as SupportedCurrency || "cUSD")}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Selected Influencers:</span>
                      <span className="text-white">{brief.selectedInfluencersCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Compensation per Influencer:</span>
                      <span className="text-amber-400 font-medium">{formatCurrency(compensationPerInfluencer, brief.currency as SupportedCurrency || "cUSD")}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Total Compensation (10%):</span>
                      <span className="text-amber-400 font-medium">{formatCurrency(totalCompensation, brief.currency as SupportedCurrency || "cUSD")}</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-700/50 pt-2">
                      <span className="text-slate-400">Refund to You:</span>
                      <span className="text-emerald-400 font-medium">{formatCurrency(remainingRefund, brief.currency as SupportedCurrency || "cUSD")}</span>
                    </div>
                  </div>
                </div>
              );
            })()}

            <div className="flex gap-3 md:gap-4">
              <button
                onClick={() => {
                  setShowCancelWithCompensationModal(null);
                }}
                disabled={isCancelingWithCompensation}
                className="flex-1 px-4 py-2.5 md:px-6 md:py-3 font-medium text-slate-300 bg-slate-700/50 rounded-lg md:rounded-xl border border-slate-600/50 hover:bg-slate-700 transition-all disabled:opacity-50 text-sm md:text-base"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (showCancelWithCompensationModal) {
                    handleCancelWithCompensation(showCancelWithCompensationModal);
                  }
                }}
                disabled={isCancelingWithCompensation}
                className="flex-1 px-4 py-2.5 md:px-6 md:py-3 font-medium text-white bg-gradient-to-r from-amber-500 to-amber-600 rounded-lg md:rounded-xl hover:from-amber-600 hover:to-amber-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm md:text-base"
              >
                {isCancelingWithCompensation ? (
                  <>
                    <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" />
                    <span className="hidden sm:inline">Processing...</span>
                    <span className="sm:hidden">...</span>
                  </>
                ) : (
                  <>
                    <Ban className="w-4 h-4 md:w-5 md:h-5" />
                    <span className="hidden sm:inline">
                      Cancel & Compensate
                    </span>
                    <span className="sm:hidden">Confirm</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {showCreateModal && (
        <CreateCampaignModal
          formData={formData}
          setFormData={setFormData}
          isCreatingBrief={isCreatingMultiCurrency}
          isFormValid={isFormValid()}
          onCreateCampaign={handleCreateCampaign}
          onClose={() => setShowCreateModal(false)}
          isCreateSuccess={isMultiCurrencyCreateSuccess}
          isCreateError={isMultiCurrencyCreateError}
          createError={multiCurrencyCreateError}
        />
      )}

      {showApplicationsModal && selectedBrief && (
        <ApplicationsModal
          selectedBrief={selectedBrief}
          applications={applications || []}
          isLoadingApplications={isLoadingApplications}
          onClose={() => setShowApplicationsModal(false)}
          onAssignSuccess={() => {
            // Refresh applications data after successful assignment
            refetchApplications();
          }}
        />
      )}

      {showSubmissionsModal && selectedBrief && (
        <SubmissionsModal
          selectedBrief={selectedBrief}
          applications={applications || []}
          isLoadingApplications={isLoadingApplications}
          isCompletingCampaign={isCompletingCampaign}
          onReleaseFunds={handleReleaseFunds}
          onClose={() => setShowSubmissionsModal(false)}
        />
      )}

      {/* Currency Converter Modal */}
      <CurrencyConverterModal
        isOpen={showCurrencyConverter}
        onClose={() => setShowCurrencyConverter(false)}
        userType="brand"
      />

      {/* Wallet Funding Modal */}
      {showWalletFunding && (
        <WalletFundingModal
          onClose={() => setShowWalletFunding(false)}
        />
      )}

      {/* Create Spark Modal */}
      {showCreateSparkModal && (
        <CreateSparkModal
          isOpen={showCreateSparkModal}
          onClose={() => setShowCreateSparkModal(false)}
          onSuccess={() => {
            // Refresh dashboard data after successful spark creation
            refetchBriefs();
            refetchProfile();
          }}
        />
      )}
    </div>
  );
};

export default BrandDashboard;
