// frontend/app/influencer/[address]/page.tsx
"use client";

import { useParams } from "next/navigation";
import { useAccount } from "wagmi";
import { useState, useEffect } from "react";
import {
  Shield,
  ExternalLink,
  Copy,
  Users,
  MessageSquare,
  Award,
  Globe,
  Sparkles,
  CheckCircle,
  X,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  Loader2,
  Zap,
  Crown,
  Target,
  Eye,
  Share2,
  ChevronDown,
  Verified
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Toaster, toast } from "react-hot-toast";
import { useFarcasterProfile } from "@/hooks/useFarcasterProfile";
import { useFarcasterAuth } from "@/hooks/UseFarcasterAuth";
import { useIsInfluencerVerified, useUserProfile } from "@/hooks/adsBazaar";
import {
  getUserStatusLabel,
  formatNumber,
} from "@/utils/format";
import Image from "next/image";
import Link from "next/link";

// Farcaster Connect Component
function FarcasterConnectButton({ 
  address, 
  isOwner, 
  onConnectionSuccess 
}: { 
  address: string; 
  isOwner: boolean;
  onConnectionSuccess?: () => void;
}) {
  const { signIn, connect, isAuthenticated, user, isLoading, error, channelToken, url, validSignature } = useFarcasterAuth();
  const [showQR, setShowQR] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  // Handle successful authentication
  useEffect(() => {
    if (isAuthenticated && user && validSignature) {
      const storeConnection = async () => {
        try {
          setIsConnecting(true);
          
          // Store the FID mapping locally
          localStorage.setItem(`fid_${address}`, user.fid.toString());
          
          // Create a profile entry for immediate display
          const profileData = {
            fid: user.fid,
            username: user.username,
            displayName: user.displayName,
            bio: user.bio,
            pfpUrl: user.pfpUrl,
            followerCount: 0, // Will be updated when profile is fetched
            followingCount: 0,
            isVerified: false, // Will be updated when profile is fetched
          };
          
          // Store profile data temporarily
          localStorage.setItem(`profile_${address}`, JSON.stringify(profileData));
          
          toast.success(`Successfully connected Farcaster as @${user.username}!`);
          setShowQR(false);
          
          // Trigger refresh of the profile data
          if (onConnectionSuccess) {
            onConnectionSuccess();
          }
          
          // Refresh the page to show updated profile
          setTimeout(() => {
            window.location.reload();
          }, 1500);
          
        } catch (error) {
          console.error("Error storing connection:", error);
          toast.error("Connected but failed to save profile data");
        } finally {
          setIsConnecting(false);
        }
      };
      
      storeConnection();
    }
  }, [isAuthenticated, user, validSignature, address, onConnectionSuccess]);

  const handleConnect = async () => {
    if (!isOwner) {
      toast.error("You can only connect your own profile");
      return;
    }

    try {
      if (!isAuthenticated) {
        await signIn();
        setShowQR(true);
      } else if (channelToken && !validSignature) {
        await connect();
      }
    } catch (error) {
      toast.error("Failed to connect Farcaster");
      console.error("Farcaster auth error:", error);
    }
  };

  if (!isOwner) return null;

  if (isAuthenticated && user && validSignature) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <CheckCircle className="w-4 h-4 text-emerald-400" />
        <span className="text-emerald-400">
          {isConnecting ? "Connecting..." : `Connected as @${user.username}`}
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <motion.button
        onClick={handleConnect}
        disabled={isLoading || isConnecting}
        className="flex items-center gap-2 px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 rounded-lg border border-purple-500/30 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {(isLoading || isConnecting) ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Zap className="w-4 h-4" />
        )}
        {(isLoading || isConnecting) ? "Connecting..." : "Connect Farcaster"}
      </motion.button>

      {showQR && url && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-4 rounded-lg"
        >
          <p className="text-sm text-slate-600 mb-2 text-center">Scan with Warpcast</p>
          <div className="flex justify-center">
            <Image src={url} alt="Farcaster QR Code" className="w-32 h-32" />
          </div>
          <button
            onClick={() => setShowQR(false)}
            className="mt-2 w-full text-xs text-slate-500 hover:text-slate-700"
          >
            Cancel
          </button>
        </motion.div>
      )}

      {error && (
        <p className="text-red-400 text-xs">{error}</p>
      )}
    </div>
  );
}

export default function EnhancedInfluencerProfile() {
  const { address: profileAddress } = useParams();
  const { address: connectedAddress, isConnected } = useAccount();
  const [isOwner, setIsOwner] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [, setRefreshTrigger] = useState(0);
  const [activeTab, setActiveTab] = useState<'overview' | 'social' | 'activity'>('overview');
  const [showAllStats, setShowAllStats] = useState(false);

  // Fetch blockchain data
  const { userProfile, isLoadingProfile } = useUserProfile(
    profileAddress as `0x${string}`
  );
  const { isVerified, isLoadingVerification } = useIsInfluencerVerified(
    profileAddress as `0x${string}`
  );

  // Try to fetch Farcaster profile by address
  const {
    profile: farcasterProfile,
    isLoading: isFarcasterLoading,
  } = useFarcasterProfile(profileAddress as string);

  // Handle connection success
  const handleConnectionSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
  };

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
    } catch (error) {
      toast.error("Failed to copy");
      console.log(error)
    }
  };

  const isLoading =
    isLoadingProfile || isLoadingVerification || isFarcasterLoading;

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
          <p className="text-slate-400 text-lg font-medium">Loading profile...</p>
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

  const displayName =
    farcasterProfile?.displayName || farcasterProfile?.username || "Influencer";
  const bio = farcasterProfile?.bio || "Digital creator and influencer";
  const pfpUrl = farcasterProfile?.pfpUrl;

  const stats = [
    {
      icon: Users,
      value: farcasterProfile ? formatNumber(farcasterProfile.followerCount) : (userProfile?.completedCampaigns || 0),
      label: farcasterProfile ? "Followers" : "Campaigns",
      color: "text-emerald-400"
    },
    {
      icon: Target,
      value: farcasterProfile ? formatNumber(farcasterProfile.followingCount) : "4.9",
      label: farcasterProfile ? "Following" : "Rating",
      color: "text-blue-400"
    },
    {
      icon: Award,
      value: getUserStatusLabel(userProfile?.status || 0),
      label: "Status",
      color: "text-purple-400"
    },
    {
      icon: Sparkles,
      value: isVerified ? "Verified" : "Unverified",
      label: "Creator",
      color: isVerified ? "text-emerald-400" : "text-amber-400"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Toaster position="top-center" />

      {/* Scrollable Container */}
      <div className="max-w-lg mx-auto min-h-screen overflow-y-auto">
        {/* Header Section with Hero Design */}
        <div className="relative">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-blue-500/5 to-purple-500/10"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.1),transparent_50%)]"></div>
          
          <div className="relative px-4 pt-20 sm:pt-24 md:pt-28 pb-6">
            {/* Connect Farcaster Banner - Top Priority */}
            {!farcasterProfile && (
              <motion.div
                className="mb-6 bg-gradient-to-r from-purple-500/10 to-blue-500/10 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-4"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                      <MessageSquare className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">Connect Farcaster</h3>
                      <p className="text-slate-400 text-sm">Verify your social presence</p>
                    </div>
                  </div>
                  <FarcasterConnectButton 
                    address={profileAddress as string} 
                    isOwner={isOwner} 
                    onConnectionSuccess={handleConnectionSuccess}
                  />
                </div>
              </motion.div>
            )}

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

                  {/* Premium Badge */}
                  {isVerified && (
                    <motion.div
                      className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full border-2 border-slate-900 flex items-center justify-center"
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", duration: 0.6, delay: 0.4 }}
                    >
                      <Crown className="w-3 h-3 text-white" />
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Name and Username */}
              <h1 className="text-3xl font-bold text-white mb-2">
                {displayName}
              </h1>
              
              {/* Verification Status with Enhanced Design */}
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

                {/* Farcaster Username */}
                {farcasterProfile && (
                  <span className="flex items-center gap-2 text-slate-400 text-sm">
                    <MessageSquare className="w-4 h-4" />
                    @{farcasterProfile.username}
                  </span>
                )}
              </div>

              {/* Address */}
              <div className="flex items-center justify-center gap-2 mb-4">
                <span className="font-mono bg-slate-800/60 px-3 py-1.5 rounded-lg text-sm text-slate-300 border border-slate-700/50">
                  {`${(profileAddress as string).slice(0, 6)}...${(
                    profileAddress as string
                  ).slice(-4)}`}
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
              <p className="text-slate-300 text-lg leading-relaxed max-w-md mx-auto">
                {bio}
              </p>
            </motion.div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-4 mb-6">
          <div className="flex bg-slate-800/50 rounded-2xl p-1 border border-slate-700/50">
            {[
              { key: 'overview', label: 'Overview', icon: Eye },
              { key: 'social', label: 'Social', icon: Globe },
              { key: 'activity', label: 'Activity', icon: TrendingUp }
            ].map((tab) => (
              <motion.button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as 'overview' | 'social' | 'activity')}
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
            {activeTab === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                  {stats.slice(0, showAllStats ? stats.length : 4).map((stat, index) => (
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
                      <p className="text-slate-400 text-sm">
                        {stat.label}
                      </p>
                    </motion.div>
                  ))}
                </div>

                {stats.length > 4 && (
                  <button
                    onClick={() => setShowAllStats(!showAllStats)}
                    className="w-full flex items-center justify-center gap-2 py-3 text-slate-400 hover:text-emerald-400 transition-colors"
                  >
                    <span className="text-sm font-medium">
                      {showAllStats ? "Show Less" : "Show More Stats"}
                    </span>
                    <motion.div
                      animate={{ rotate: showAllStats ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </motion.div>
                  </button>
                )}
              </motion.div>
            )}

            {activeTab === 'social' && (
              <motion.div
                key="social"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                {/* Farcaster */}
                <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-purple-500/20 rounded-xl border border-purple-500/30">
                        <MessageSquare className="w-6 h-6 text-purple-400" />
                      </div>
                      <div>
                        <h3 className="text-white font-semibold text-lg">Farcaster</h3>
                        {farcasterProfile ? (
                          <p className="text-emerald-400 text-sm">@{farcasterProfile.username}</p>
                        ) : (
                          <p className="text-slate-400 text-sm">Not connected</p>
                        )}
                      </div>
                    </div>
                    {farcasterProfile ? (
                      <a
                        href={`https://warpcast.com/${farcasterProfile.username}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-3 bg-slate-600/50 rounded-xl hover:bg-slate-600 transition-colors"
                      >
                        <ExternalLink className="w-5 h-5 text-slate-300" />
                      </a>
                    ) : (
                      <span className="text-sm text-amber-400 bg-amber-500/10 px-3 py-2 rounded-lg border border-amber-500/20">
                        Connect
                      </span>
                    )}
                  </div>

                  {farcasterProfile && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-slate-900/30 rounded-xl">
                        <p className="text-2xl font-bold text-white">
                          {formatNumber(farcasterProfile.followerCount)}
                        </p>
                        <p className="text-slate-400 text-sm">Followers</p>
                      </div>
                      <div className="text-center p-3 bg-slate-900/30 rounded-xl">
                        <p className="text-2xl font-bold text-white">
                          {formatNumber(farcasterProfile.followingCount)}
                        </p>
                        <p className="text-slate-400 text-sm">Following</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Twitter */}
                <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-blue-500/20 rounded-xl border border-blue-500/30">
                        <X className="w-6 h-6 text-blue-400" />
                      </div>
                      <div>
                        <h3 className="text-white font-semibold text-lg">X (Twitter)</h3>
                        {farcasterProfile?.twitterUsername ? (
                          <p className="text-emerald-400 text-sm">@{farcasterProfile.twitterUsername}</p>
                        ) : (
                          <p className="text-slate-400 text-sm">Not connected</p>
                        )}
                      </div>
                    </div>
                    {farcasterProfile?.twitterUsername && (
                      <a
                        href={`https://twitter.com/${farcasterProfile.twitterUsername}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-3 bg-slate-600/50 rounded-xl hover:bg-slate-600 transition-colors"
                      >
                        <ExternalLink className="w-5 h-5 text-slate-300" />
                      </a>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'activity' && (
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
            {isOwner && (
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
                Share
              </motion.button>

              <Link href="/marketplace" className="flex-1">
                <motion.button
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl transition-all font-medium shadow-lg shadow-emerald-500/20"
                  whileTap={{ scale: 0.95 }}
                >
                  <Sparkles className="w-5 h-5" />
                  Explore
                </motion.button>
              </Link>
            </div>
          </div>
        </div>

        {/* Success State for Farcaster Connection */}
        {farcasterProfile && (
          <motion.div
            className="fixed top-4 left-4 right-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 backdrop-blur-xl z-50"
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-emerald-400" />
              <div>
                <p className="text-emerald-400 font-semibold">
                  ✅ Farcaster Connected
                </p>
                <p className="text-emerald-400/70 text-sm">
                  Profile verified and social presence confirmed
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}