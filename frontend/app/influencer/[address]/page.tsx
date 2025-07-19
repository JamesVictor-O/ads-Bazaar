"use client";

import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { useState, useEffect } from "react";
import {
  Shield,
  Copy,
  Users,
  Award,
  Globe,
  Sparkles,
  CheckCircle,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  Eye,
  Share2,
  Verified,
  ArrowLeft,
  UserCheck,
  SkipForward,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Toaster, toast } from "react-hot-toast";
import { useIsInfluencerVerified, useUserProfile, useGetInfluencerProfile, useSelectInfluencer, useBriefApplications } from "@/hooks/adsBazaar";
import { SocialMediaCard } from "@/components/ui/SocialMediaCard";
import { getUserStatusLabel, formatNumber } from "@/utils/format";
import Image from "next/image";
import Link from "next/link";
import { UserDisplay } from "@/components/ui/UserDisplay";
import { withNetworkGuard } from "@/components/WithNetworkGuard";
import { useDivviIntegration } from "@/hooks/useDivviIntegration";





// Simple Social Tab Content - Shows social media from blockchain data
function SocialTabContent({
  socialMediaData,
  userAddress,
  isOwner,
}: {
  socialMediaData: any;
  userAddress: string;
  isOwner: boolean;
}) {
  return (
    <motion.div
      key="social"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      {/* Social Media Card */}
      <SocialMediaCard 
        profileData={socialMediaData}
        userAddress={userAddress}
        isOwner={isOwner}
      />
    </motion.div>
  );
}

// Main Component  
function EnhancedInfluencerProfileComponent({
  guardedAction,
}: {
  guardedAction?: (action: () => Promise<void>) => Promise<void>;
}) {
  const { address: profileAddress } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { address: connectedAddress, isConnected } = useAccount();
  const [isOwner, setIsOwner] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "overview" | "social" | "activity"
  >("overview");
  
  // Navigation context from applications modal
  const fromApplications = searchParams.get('from') === 'applications';
  const briefId = searchParams.get('briefId');
  const currentAppIndex = parseInt(searchParams.get('appIndex') || '0');
  
  // Campaign assignment functionality
  const { selectInfluencer, isPending: isAssigning } = useSelectInfluencer();
  const { applications, isLoadingApplications } = useBriefApplications(briefId as `0x${string}`);
  const { generateDivviReferralTag } = useDivviIntegration();
  
  // Check campaign capacity and current application status
  const currentApplication = applications && applications[currentAppIndex];
  const selectedCount = applications ? applications.filter(app => app.isSelected).length : 0;
  // We'll need to get campaign details from another source or pass maxInfluencers via URL
  // For now, using a fallback - this should be passed from the applications modal
  const maxInfluencers = parseInt(searchParams.get('maxInfluencers') || '1');
  const spotsRemaining = maxInfluencers - selectedCount;
  const canAssign = spotsRemaining > 0 && currentApplication && !currentApplication.isSelected;

  // Fetch blockchain data
  const { userProfile, isLoadingProfile } = useUserProfile(
    profileAddress as `0x${string}`
  );
  const { isVerified, isLoadingVerification } = useIsInfluencerVerified(
    profileAddress as `0x${string}`
  );
  const { data: influencerProfile } = useGetInfluencerProfile(
    profileAddress as `0x${string}`
  );


  // Check if connected wallet owns this profile
  useEffect(() => {
    if (isConnected && connectedAddress && profileAddress) {
      const ownerStatus =
        connectedAddress.toLowerCase() ===
        (profileAddress as string).toLowerCase();
      setIsOwner(ownerStatus);
    }
  }, [isConnected, connectedAddress, profileAddress]);


  const handleCopy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(label);
      toast.success(`${label} copied!`);
      setTimeout(() => setCopiedText(null), 2000);
    } catch (_error) {
      toast.error("Failed to copy");
      console.log(_error)
    }
  };

  const handleBackToApplications = () => {
    // Close this tab/window and return focus to applications modal
    if (window.history.length > 1) {
      router.back();
    } else {
      window.close();
    }
  };

  const handleAssignCampaign = async () => {
    if (!guardedAction) {
      toast.error('Network configuration error. Please refresh and try again.');
      return;
    }

    if (!briefId || !applications || applications.length === 0) {
      toast.error('Campaign data not available');
      return;
    }

    if (!currentApplication) {
      toast.error('Application not found');
      return;
    }

    if (currentApplication.isSelected) {
      toast.error('Influencer already selected for this campaign');
      return;
    }

    if (spotsRemaining <= 0) {
      toast.error('Campaign has reached maximum number of influencers');
      return;
    }

    await guardedAction(async () => {
      try {
        // Generate Divvi referral tag for transaction tracking
        const referralTag = generateDivviReferralTag();
        console.log('DIVVI: About to assign campaign with referral tag:', referralTag);
        
        await selectInfluencer(briefId as `0x${string}`, currentAppIndex, referralTag);
        toast.success('Campaign assigned successfully!');
        
        // Wait a moment for blockchain update, then navigate back
        setTimeout(() => {
          handleBackToApplications();
        }, 2000);
      } catch (error) {
        console.error('Assignment error:', error);
        toast.error('Failed to assign campaign. Please try again.');
      }
    });
  };

  const handleNextApplication = () => {
    if (!applications || applications.length === 0) {
      toast.error('No applications data available');
      return;
    }

    const nextIndex = currentAppIndex + 1;
    if (nextIndex >= applications.length) {
      toast('This is the last application');
      return;
    }

    // Navigate to next application
    const nextApplication = applications[nextIndex];
    router.push(`/influencer/${nextApplication.influencer}?from=applications&briefId=${briefId}&appIndex=${nextIndex}`);
  };

  const isLoading = isLoadingProfile || isLoadingVerification;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4">
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className="relative w-16 h-16 mx-auto mb-4"
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <div className="absolute inset-0 rounded-full border-4 border-emerald-500/20"></div>
            <div className="absolute inset-0 rounded-full border-t-4 border-emerald-500"></div>
          </motion.div>
          <p className="text-slate-400 text-lg font-medium">
            Loading profile...
          </p>
          <div className="flex justify-center mt-3">
            <div className="flex space-x-1">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 bg-emerald-500 rounded-full"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                />
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!userProfile?.isRegistered || !userProfile?.isInfluencer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <motion.div
          className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 max-w-sm w-full text-center"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">
            Profile Not Found
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed mb-8">
            This address is not registered as an influencer on AdsBazaar.
          </p>
          <Link href="/marketplace">
            <motion.button
              className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-lg shadow-emerald-500/20"
              whileTap={{ scale: 0.95 }}
            >
              Explore Marketplace
            </motion.button>
          </Link>
        </motion.div>
      </div>
    );
  }

  // Parse profile data from blockchain
  const socialMediaData = influencerProfile ? JSON.parse(influencerProfile as string) : {};
  const displayName = socialMediaData?.name || "Influencer";
  const bio = socialMediaData?.bio || "Digital creator and influencer";
  const pfpUrl = socialMediaData?.avatar;

  const stats = [
    {
      icon: Users,
      value: userProfile?.completedCampaigns || 0,
      label: "Campaigns",
      color: "text-emerald-400",
    },
    {
      icon: Award,
      value: getUserStatusLabel(userProfile?.status || 0),
      label: "Status",
      color: "text-purple-400",
    },
    {
      icon: Sparkles,
      value: isVerified ? "Verified" : "Unverified",
      label: "Creator",
      color: isVerified ? "text-emerald-400" : "text-amber-400",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Toaster position="top-center" />

      {/* Scrollable Container */}
      <div className="max-w-lg mx-auto min-h-screen overflow-y-auto">
        {/* Applications Navigation Header */}
        {fromApplications && (
          <div className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-xl border-b border-slate-700/50 px-4 py-3">
            <div className="flex items-center justify-between">
              <motion.button
                onClick={handleBackToApplications}
                className="flex items-center gap-2 px-3 py-2 bg-slate-800/60 hover:bg-slate-800 text-slate-300 rounded-lg transition-all text-sm font-medium"
                whileTap={{ scale: 0.95 }}
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Applications
              </motion.button>
              
              <div className="flex items-center gap-2">
                <span className="text-slate-400 text-sm">
                  Application #{currentAppIndex + 1}
                  {applications && ` of ${applications.length}`}
                </span>
                {applications && applications[currentAppIndex]?.isSelected && (
                  <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-full">
                    Selected
                  </span>
                )}
                <motion.button
                  onClick={handleNextApplication}
                  disabled={!applications || currentAppIndex >= applications.length - 1}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-600/10 hover:bg-blue-600/20 disabled:bg-slate-600/10 text-blue-400 disabled:text-slate-500 rounded-lg transition-all text-sm font-medium disabled:cursor-not-allowed"
                  whileTap={{ scale: 0.95 }}
                >
                  Next
                  <SkipForward className="w-4 h-4" />
                </motion.button>
              </div>
            </div>
          </div>
        )}
        
        {/* Header Section with Hero Design */}
        <div className="relative">
          {/* Professional Background Pattern */}
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-blue-500/3 to-slate-500/5"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.05),transparent_50%)]"></div>

          <div className="relative px-4 pt-20 sm:pt-24 md:pt-28 pb-6">

            {/* Profile Header */}
            <motion.div
              className="text-center mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              {/* Avatar with Enhanced Design */}
              <div className="relative inline-block mb-6">
                <div className="relative w-24 h-24 mx-auto">
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 p-1">
                    <div className="w-full h-full rounded-full overflow-hidden bg-slate-800">
                      {pfpUrl ? (
                        <Image
                          src={pfpUrl}
                          alt={displayName}
                          width={96}
                          height={96}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-400 to-emerald-600">
                          <Users className="w-10 h-10 text-white" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Verification Badge */}
                  {isVerified && (
                    <motion.div
                      className="absolute -bottom-1 -right-1 w-8 h-8 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full border-3 border-slate-900 flex items-center justify-center shadow-lg"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", duration: 0.6, delay: 0.3 }}
                    >
                      <Shield className="w-4 h-4 text-white" />
                    </motion.div>
                  )}

                </div>
              </div>

              {/* Name and Username */}
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                {displayName}
              </h1>

              {/* Enhanced status and verification */}
              <div className="flex items-center justify-center gap-3 mb-4">
                <span
                  className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold border ${
                    isVerified
                      ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-lg shadow-emerald-500/20"
                      : "bg-amber-500/20 text-amber-400 border-amber-500/40"
                  }`}
                >
                  {isVerified ? (
                    <>
                      <Verified className="w-4 h-4 mr-2" />
                      Verified Creator
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4 mr-2" />
                      Unverified
                    </>
                  )}
                </span>
                
                {/* Business-focused badge */}
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/40">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Available for Campaigns
                </span>

              </div>

              {/* Address */}
              <div className="flex items-center justify-center gap-2 mb-4">
                <span className="bg-slate-800/60 px-3 py-1.5 rounded-lg text-sm text-slate-300 border border-slate-700/50">
                  <UserDisplay address={profileAddress as string} className="text-emerald-400" />
                </span>
                <button
                  onClick={() =>
                    handleCopy(profileAddress as string, "Address")
                  }
                  className="text-slate-500 hover:text-emerald-400 transition-colors p-1.5 rounded-lg hover:bg-slate-800/50"
                >
                  {copiedText === "Address" ? (
                    <CheckCircle className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>

              {/* Bio */}
              <p className="text-slate-300 text-base sm:text-lg leading-relaxed max-w-md mx-auto">
                {bio}
              </p>
            </motion.div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-4 mb-6">
          <div className="flex bg-slate-800/50 rounded-2xl p-1 border border-slate-700/50">
            {[
              { key: "overview", label: "Overview", icon: Eye },
              { key: "social", label: "Social", icon: Globe },
              { key: "activity", label: "Activity", icon: TrendingUp },
            ].map((tab) => (
              <motion.button
                key={tab.key}
                onClick={() =>
                  setActiveTab(tab.key as "overview" | "social" | "activity")
                }
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all ${
                  activeTab === tab.key
                    ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/20"
                    : "text-slate-400 hover:text-white hover:bg-slate-700/50"
                }`}
                whileTap={{ scale: 0.95 }}
              >
                <tab.icon className="w-4 h-4" />
                <span className="text-sm">{tab.label}</span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="px-4 pb-8">
          <AnimatePresence mode="wait">
            {activeTab === "overview" && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-4">
                  {stats.map((stat, index) => (
                    <motion.div
                      key={stat.label}
                      className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-4 text-center"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      <div className="flex justify-center mb-3">
                        <div className="p-2 bg-slate-700/50 rounded-xl">
                          <stat.icon className={`w-5 h-5 ${stat.color}`} />
                        </div>
                      </div>
                      <p className="text-xl font-bold text-white mb-1">
                        {stat.value}
                      </p>
                      <p className="text-slate-400 text-sm">{stat.label}</p>
                    </motion.div>
                  ))}
                </div>

                {/* Performance Metrics for Business */}
                <div className="bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border border-emerald-500/20 rounded-2xl p-6 mb-6">
                  <h3 className="text-white font-semibold text-lg mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-emerald-400" />
                    Campaign Performance
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-emerald-400">
                        {userProfile?.completedCampaigns || 0}
                      </div>
                      <div className="text-slate-400 text-sm">Completed Campaigns</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-400">
                        {isVerified ? "100%" : "95%"}
                      </div>
                      <div className="text-slate-400 text-sm">Success Rate</div>
                    </div>
                  </div>
                </div>

                {/* Social Media Card */}
                <SocialMediaCard 
                  profileData={influencerProfile as string}
                  userAddress={profileAddress as string}
                  isOwner={isOwner}
                />
              </motion.div>
            )}

            {activeTab === "social" && (
              <SocialTabContent
                socialMediaData={influencerProfile as string}
                userAddress={profileAddress as string}
                isOwner={isOwner}
              />
            )}

            {activeTab === "activity" && (
              <motion.div
                key="activity"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 text-center">
                  <TrendingUp className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Activity Coming Soon
                  </h3>
                  <p className="text-slate-400">
                    Campaign activity and engagement stats will appear here.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Action Buttons - Fixed at bottom */}
        <div className="sticky bottom-0 bg-gradient-to-t from-slate-900 via-slate-900/95 to-transparent p-4 border-t border-slate-700/50">
          <div className="space-y-4">
            {/* Campaign Assignment Actions - Show when from applications */}
            {fromApplications && (
              <div className="space-y-3">
                {/* Campaign Status Info */}
                <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-xl p-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Campaign Capacity:</span>
                    <span className="text-white font-medium">
                      {selectedCount} / {maxInfluencers} selected
                    </span>
                  </div>
                  {spotsRemaining <= 0 && (
                    <div className="mt-2 text-xs text-amber-400 bg-amber-500/10 px-3 py-2 rounded-lg border border-amber-500/20">
                      ⚠ Campaign has reached maximum capacity
                    </div>
                  )}
                  {currentApplication?.isSelected && (
                    <div className="mt-2 text-xs text-emerald-400 bg-emerald-500/10 px-3 py-2 rounded-lg border border-emerald-500/20">
                      ✓ This creator is already assigned to this campaign
                    </div>
                  )}
                </div>
                
                {/* Assignment Button */}
                <motion.button
                  onClick={handleAssignCampaign}
                  disabled={isAssigning || isLoadingApplications || !canAssign}
                  className={`w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl font-semibold transition-all shadow-lg ${
                    canAssign
                      ? "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-emerald-500/20"
                      : "bg-slate-600 text-slate-400 cursor-not-allowed"
                  }`}
                  whileTap={{ scale: isAssigning || !canAssign ? 1 : 0.95 }}
                >
                  {isAssigning ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        <CheckCircle className="w-5 h-5" />
                      </motion.div>
                      Assigning Campaign...
                    </>
                  ) : !canAssign ? (
                    currentApplication?.isSelected ? (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        Already Assigned
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-5 h-5" />
                        Campaign Full
                      </>
                    )
                  ) : (
                    <>
                      <UserCheck className="w-5 h-5" />
                      Assign Campaign to This Creator
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </motion.button>
              </div>
            )}
            
            {/* Owner Dashboard Link */}
            {isOwner && !fromApplications && (
              <Link href="/influencersDashboard">
                <motion.button
                  className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-2xl font-semibold transition-all shadow-lg shadow-emerald-500/20"
                  whileTap={{ scale: 0.95 }}
                >
                  <TrendingUp className="w-5 h-5" />
                  Go to Dashboard
                  <ArrowRight className="w-5 h-5" />
                </motion.button>
              </Link>
            )}

            {/* Standard Action Buttons */}
            {!fromApplications && (
              <div className="flex gap-3">
                <motion.button
                  onClick={() =>
                    handleCopy(
                      typeof window !== "undefined"
                        ? `${window.location.origin}/influencer/${profileAddress}`
                        : "",
                      "Profile Link"
                    )
                  }
                  className="flex-1 flex items-center justify-center gap-3 px-4 py-3 bg-slate-800/60 hover:bg-slate-800 text-slate-300 rounded-xl border border-slate-600/50 transition-all font-medium"
                  whileTap={{ scale: 0.95 }}
                >
                  {copiedText === "Profile Link" ? (
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <Share2 className="w-5 h-5" />
                  )}
                  Share Profile
                </motion.button>

                <Link href="/marketplace" className="flex-1">
                  <motion.button
                    className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl transition-all font-medium shadow-lg shadow-blue-500/20"
                    whileTap={{ scale: 0.95 }}
                  >
                    <Users className="w-5 h-5" />
                    Hire Creator
                  </motion.button>
                </Link>
              </div>
            )}
            
            {/* Secondary Actions when from applications */}
            {fromApplications && (
              <div className="flex gap-3">
                <motion.button
                  onClick={() =>
                    handleCopy(
                      typeof window !== "undefined"
                        ? `${window.location.origin}/influencer/${profileAddress}`
                        : "",
                      "Profile Link"
                    )
                  }
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-slate-800/60 hover:bg-slate-800 text-slate-300 rounded-lg transition-all text-sm font-medium"
                  whileTap={{ scale: 0.95 }}
                >
                  {copiedText === "Profile Link" ? (
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Share2 className="w-4 h-4" />
                  )}
                  Share
                </motion.button>
                
                <motion.button
                  onClick={handleNextApplication}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 rounded-lg transition-all text-sm font-medium"
                  whileTap={{ scale: 0.95 }}
                >
                  Next Application
                  <SkipForward className="w-4 h-4" />
                </motion.button>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

// Export with network guard for blockchain functionality
export default withNetworkGuard(EnhancedInfluencerProfileComponent);
