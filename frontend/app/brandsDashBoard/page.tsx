"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { SubmissionsModal } from "@/components/modals/ SubmissionsModal";
import { ApplicationsModal } from "@/components/modals/ApplicationsModal";
import { CreateCampaignModal } from "@/components/modals/CreateCampaignModal";
import { useRouter } from "next/navigation";
import { Toaster, toast } from "react-hot-toast";
import {
  Users,
  Briefcase,
  DollarSign,
  BarChart2,
  Search,
  Plus,
  Calendar,
  Clock,
  Tag,
  Globe,
  Link as LinkIcon,
  CheckCircle,
} from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";

// Import our custom hooks
import {
  useUserProfile,
  useBusinessBriefs,
  useBriefApplications,
  useCreateAdBrief,
  useCancelAdBrief,
  useSelectInfluencer,
  useCompleteCampaign,
} from "../../hooks/adsBazaar";

const BrandDashboard = () => {
  const router = useRouter();
  const { address } = useAccount();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showApplicationsModal, setShowApplicationsModal] = useState(false);
  const [showSubmissionsModal, setShowSubmissionsModal] = useState(false);
  const [selectedBrief, setSelectedBrief] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    budget: "",
    applicationDeadline: "",
    promotionDuration: "604800", // 7 days in seconds
    maxInfluencers: "5",
    targetAudience: "0", // Default target audience (0 = General)
    verificationPeriod: "86400", // 1 day in seconds
  });
  const {
    cancelBrief,
    isPending: isCancellingBrief,
    isSuccess: isCancelSuccess,
  } = useCancelAdBrief();

  // Get user profile data
  const { userProfile, isLoadingProfile } = useUserProfile();

  // Get all briefs created by this business
  const {
    briefs,
    isLoading: isLoadingBriefs,
    error: briefsError,
    refetch: refetchBriefs,
  } = useBusinessBriefs();

  // Get applications for the selected brief
  const { applications, isLoadingApplications, refetchApplications } =
    useBriefApplications(selectedBrief?.briefId || "0x0");

  // Contract interaction hooks
  const {
    createBrief,
    isPending: isCreatingBrief,
    isSuccess: isCreateSuccess,
    isError: isCreateError,
    error: createError,
  } = useCreateAdBrief();

  const {
    selectInfluencer,
    isPending: isSelectingInfluencer,
    isSuccess: isSelectSuccess,
    isError: isSelectError,
    error: selectError,
  } = useSelectInfluencer();

  const {
    completeCampaign,
    isPending: isCompletingCampaign,
    isSuccess: isCompleteSuccess,
    isError: isCompleteError,
    error: completeError,
  } = useCompleteCampaign();

  // Get total influencers from applications that are selected
  const totalInfluencers = briefs?.reduce((sum, brief) => {
    const briefApplications =
      applications?.filter((app) => app.isSelected) || [];
    return sum + briefApplications.length;
  }, 0);

  useEffect(() => {
    if (briefs) {
      console.log("Raw briefs data:", briefs);
      console.log("Formatted briefs:", briefs.map(formatBriefData));
    }
  }, [briefs]);

  // Effects for transaction states
  useEffect(() => {
    if (isCreateSuccess) {
      toast.success("Campaign created successfully!");
      setShowCreateModal(false);
      console.log("Triggering refetch of briefs after create success");
      refetchBriefs();
      router.push("/brandsDashBoard");
    }

    if (isCreateError) {
      toast.error(
        `Failed to create campaign: ${createError?.message || "Unknown error"}`
      );
    }
  }, [isCreateSuccess, isCreateError, createError, refetchBriefs, router]);

  useEffect(() => {
    if (isSelectSuccess) {
      toast.success("Influencer selected successfully!");
      refetchApplications();
    }

    if (isSelectError) {
      toast.error(
        `Failed to select influencer: ${
          selectError?.message || "Unknown error"
        }`
      );
    }
  }, [isSelectSuccess, isSelectError, selectError, refetchApplications]);

  useEffect(() => {
    if (isCompleteSuccess) {
      toast.success("Campaign completed and funds released successfully!");
      refetchBriefs();
      refetchApplications();
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
    refetchBriefs,
    refetchApplications,
  ]);

  // Convert blockchain data to a more readable format
  const formatBriefData = (brief) => {
    const statusMap = {
      OPEN: "active",
      ASSIGNED: "active",
      COMPLETED: "completed",
      CANCELLED: "cancelled",
    };
    return {
      ...brief,
      id: brief.briefId,
      name: brief.name,
      status: statusMap[brief.status] || "active",
      spent: 0, // This would need to be calculated based on approved payments
      budget: Number(brief.budget) / 10 ** 18, // Convert from wei to cUSD
      impressions: 0, // This would need to be tracked separately
      clicks: 0, // This would need to be tracked separately
      engagement: 0, // This would need to be tracked separately
      influencers: 0, // Will be updated from applications
      maxInfluencers: Number(brief.maxInfluencers),
      endDate: new Date(Number(brief.applicationDeadline) * 1000),
      isActive: brief.status === "ASSIGNED",
      isCompleted: brief.status === "COMPLETED",
      isCancelled: brief.status === "CANCELLED",
      applicationDeadline: brief.applicationDeadline,
      promotionDuration: brief.promotionDuration,
      promotionStartTime: brief.promotionStartTime,
      promotionEndTime: brief.promotionEndTime,
      verificationDeadline: brief.verificationDeadline,
    };
  };

  // Calculate stats from real data
  const formattedBriefs = briefs?.map(formatBriefData) || [];
  const activeBriefs =
    briefs?.filter(
      (brief) => brief.status === "OPEN" || brief.status === "ASSIGNED"
    ) || [];

  const completedBriefs = formattedBriefs.filter(
    (brief) => brief.status === "completed"
  );
  const totalBudget =
    briefs?.reduce((sum, brief) => sum + Number(brief.budget) / 10 ** 18, 0) ||
    0;

  // Update influencer counts for each brief
  const briefsWithInfluencerCounts = activeBriefs.map((brief) => {
    const briefApplications =
      applications?.filter((app) => app.isSelected) || [];
    const formatted = formatBriefData(brief);
    formatted.influencers = briefApplications.length;
    return formatted;
  });

  // Form validation function
  const isFormValid = () => {
    return (
      formData.name.trim() !== "" &&
      formData.description.trim() !== "" &&
      formData.budget.trim() !== "" &&
      formData.applicationDeadline.trim() !== ""
    );
  };

  const handleCreateCampaign = async () => {
    // Form validation is now handled by the isFormValid function
    if (!isFormValid()) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const deadline = Math.floor(
        new Date(formData.applicationDeadline).getTime() / 1000
      );

      await createBrief(
        formData.name,
        formData.description,
        formData.budget,
        deadline,
        parseInt(formData.promotionDuration),
        parseInt(formData.maxInfluencers),
        parseInt(formData.targetAudience),
        parseInt(formData.verificationPeriod)
      );

      // The success state will be handled in the useEffect
    } catch (error) {
      console.error("Error creating campaign:", error);
      toast.error(
        `Failed to create campaign: ${error.message || "Unknown error"}`
      );
    }
  };

  const handleAssignInfluencer = async (briefId, applicationIndex) => {
    try {
      await selectInfluencer(briefId, applicationIndex);
      // Success state handled in useEffect
    } catch (error) {
      console.error("Error assigning influencer:", error);
      toast.error(
        `Failed to assign influencer: ${error.message || "Unknown error"}`
      );
    }
  };

  const handleReleaseFunds = async (briefId) => {
    try {
      await completeCampaign(briefId);
      // Success state handled in useEffect
    } catch (error) {
      console.error("Error releasing funds:", error);
      toast.error(
        `Failed to release funds: ${error.message || "Unknown error"}`
      );
    }
  };

  if (briefsError) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center p-8 max-w-md">
          <h2 className="text-2xl font-bold mb-4">Error Loading Briefs</h2>
          <p className="mb-6">{briefsError.message}</p>
          <button
            onClick={() => refetchBriefs()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // If still loading, show a loading state
  if (isLoadingProfile || isLoadingBriefs) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  // If user is not registered or not a business, show a message
  if (!userProfile?.isRegistered || !userProfile?.isBusiness) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center p-8 max-w-md">
          <h2 className="text-2xl font-bold mb-4">Account Required</h2>
          <p className="mb-6">
            You need to register as a business to access the dashboard.
          </p>
          <Link href={"/"}>
            <button className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
              Register as Business
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Toaster position="top-right" />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gray-50">
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <h1 className="text-xl sm:text-3xl md:text-4xl font-semibold text-gray-900">
            Dashboard
          </h1>
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative w-full sm:w-auto">
              <Search
                size={16}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                className="w-full sm:w-64 pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="Search campaigns..."
              />
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="w-full sm:w-auto flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <Plus size={16} className="mr-2" />
              New Campaign
            </button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white shadow rounded-lg p-4">
            <div className="flex items-center">
              <div className="rounded-md bg-indigo-50 p-2">
                <Briefcase className="h-5 w-5 text-indigo-600" />
              </div>
              <div className="ml-3">
                <div className="text-xs md:text-base font-medium text-gray-500">
                  Active Campaigns
                </div>
                <div className="text-lg font-semibold text-gray-900">
                  {activeBriefs.length}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-4">
            <div className="flex items-center">
              <div className="rounded-md bg-green-50 p-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div className="ml-3">
                <div className="text-xs md:text-base font-medium text-gray-500">
                  Completed Campaigns
                </div>
                <div className="text-lg font-semibold text-gray-900">
                  {completedBriefs.length}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-4">
            <div className="flex items-center">
              <div className="rounded-md bg-blue-50 p-2">
                <DollarSign className="h-5 w-5 text-blue-600" />
              </div>
              <div className="ml-3">
                <div className="text-xs md:text-base font-medium text-gray-500">
                  Total Budget
                </div>
                <div className="text-lg font-semibold text-gray-900">
                  {totalBudget.toLocaleString()} cUSD
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-4">
            <div className="flex items-center">
              <div className="rounded-md bg-purple-50 p-2">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <div className="ml-3">
                <div className="text-xs md:text-base font-medium text-gray-500">
                  Total Influencers
                </div>
                <div className="text-lg font-semibold text-gray-900">
                  {totalInfluencers}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Campaign List */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">
              Active Campaigns
            </h2>
            <button className="text-sm text-indigo-600 hover:text-indigo-800">
              View All
            </button>
          </div>
          <div className="bg-white shadow rounded-md">
            {activeBriefs.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <p>No active campaigns. Create one to get started!</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {activeBriefs.map((brief) => {
                  const formattedBrief = formatBriefData(brief);
                  return (
                    <li key={brief.briefId} className="p-4">
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                              <Briefcase className="h-4 w-4 text-indigo-600" />
                            </div>
                            <div>
                              <div className="text-sm font-medium md:text-base text-gray-900">
                                {brief.name}
                              </div>
                              <div className="text-xs md:text-base text-gray-500 flex flex-wrap gap-2">
                                <span className="flex items-center">
                                  <Calendar size={12} className="mr-1" />
                                  {format(
                                    new Date(
                                      Number(brief.applicationDeadline) * 1000
                                    ),
                                    "MMM d, yyyy"
                                  )}
                                </span>
                                <span className="flex items-center">
                                  <Clock size={12} className="mr-1" />
                                  {Math.ceil(
                                    (new Date(
                                      Number(brief.applicationDeadline) * 1000
                                    ) -
                                      new Date()) /
                                      (1000 * 60 * 60 * 24)
                                  )}{" "}
                                  days left
                                </span>
                              </div>
                            </div>
                          </div>
                          <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                            Active
                          </span>
                        </div>
                        <div className="text-sm md:text-base text-gray-900">
                          {(0).toLocaleString()} /{" "}
                          {(Number(brief.budget) / 10 ** 18).toLocaleString()}{" "}
                          cUSD
                          <div className="text-xs text-gray-500">
                            {Math.round(
                              (0 / (Number(brief.budget) / 10 ** 18)) * 100
                            )}
                            % spent
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row justify-between text-xs text-gray-500 gap-2">
                          <div className="flex gap-3">
                            <span className="flex items-center">
                              <Users size={14} className="mr-1" />
                              0/{Number(brief.maxInfluencers)} influencers
                            </span>
                            <span className="flex items-center">
                              <BarChart2 size={14} className="mr-1" />0
                              impressions
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setSelectedBrief(brief);
                                setShowApplicationsModal(true);
                              }}
                              className="text-white bg-indigo-600 p-2 rounded hover:bg-indigo-700 hover:text-white font-medium"
                            >
                              Applications
                            </button>
                            <button
                              onClick={() => {
                                setSelectedBrief(brief);
                                setShowSubmissionsModal(true);
                              }}
                              className="text-white bg-indigo-600 p-2 rounded hover:bg-indigo-700 hover:text-white font-medium"
                            >
                              Submissions
                            </button>
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </main>

      {showCreateModal && (
        <CreateCampaignModal
          formData={formData}
          setFormData={setFormData}
          isCreatingBrief={isCreatingBrief}
          isFormValid={isFormValid()}
          onCreateCampaign={handleCreateCampaign}
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {showApplicationsModal && selectedBrief && (
        <ApplicationsModal
          selectedBrief={selectedBrief}
          applications={applications || []}
          isLoadingApplications={isLoadingApplications}
          isSelectingInfluencer={isSelectingInfluencer}
          onAssignInfluencer={handleAssignInfluencer}
          onClose={() => setShowApplicationsModal(false)}
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
    </div>
  );
};

export default BrandDashboard;
