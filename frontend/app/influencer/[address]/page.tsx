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
  Heart,
  MessageSquare,
  Star,
  Award,
  Globe,
  Sparkles,
  CheckCircle,
  X,
  Instagram,
  Youtube,
  Facebook,
  Linkedin,
  ArrowRight,
  UserPlus,
  Calendar,
  TrendingUp,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Toaster, toast } from "react-hot-toast";
import { useFarcasterProfile } from "@/hooks/useFarcasterProfile";
import { useIsInfluencerVerified, useUserProfile } from "@/hooks/adsBazaar";
import {
  getUserStatusColor,
  getUserStatusLabel,
  formatNumber,
} from "@/utils/format";
import Image from "next/image";
import Link from "next/link";

interface SocialPlatform {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  comingSoon?: boolean;
}

const socialPlatforms: SocialPlatform[] = [
  {
    id: "farcaster",
    name: "Farcaster",
    icon: MessageSquare,
    color: "text-purple-400",
  },
  {
    id: "twitter",
    name: "X (Twitter)",
    icon: X,
    color: "text-blue-400",
  },
  {
    id: "instagram",
    name: "Instagram",
    icon: Instagram,
    color: "text-pink-400",
    comingSoon: true,
  },
  {
    id: "youtube",
    name: "YouTube",
    icon: Youtube,
    color: "text-red-400",
    comingSoon: true,
  },
  {
    id: "facebook",
    name: "Facebook",
    icon: Facebook,
    color: "text-blue-500",
    comingSoon: true,
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    icon: Linkedin,
    color: "text-blue-600",
    comingSoon: true,
  },
];

export default function EnhancedInfluencerProfile() {
  const { address: profileAddress } = useParams();
  const { address: connectedAddress, isConnected } = useAccount();
  const [isOwner, setIsOwner] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);

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
    error: farcasterError,
  } = useFarcasterProfile(profileAddress as string);

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
    }
  };

  const isLoading =
    isLoadingProfile || isLoadingVerification || isFarcasterLoading;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading profile...</p>
        </motion.div>
      </div>
    );
  }

  if (!userProfile?.isRegistered || !userProfile?.isInfluencer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <motion.div
          className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 max-w-md w-full text-center"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <AlertCircle className="w-16 h-16 text-amber-400 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-white mb-4">
            Profile Not Found
          </h2>
          <p className="text-slate-400 leading-relaxed mb-8">
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pt-28 pb-12 px-4 sm:px-6 lg:px-8">
      <Toaster position="top-right" />

      <div className="max-w-6xl mx-auto">
        {/* Hero Section */}
        <motion.div
          className="relative bg-gradient-to-r from-slate-800/60 to-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 mb-8 overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-blue-500/5"></div>
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl"></div>

          <div className="relative">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8">
              {/* Profile Info */}
              <div className="flex-1">
                <div className="flex items-start gap-6 mb-6">
                  {/* Avatar */}
                  <div className="relative">
                    <div className="w-24 h-24 lg:w-32 lg:h-32 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center overflow-hidden border-4 border-slate-700/50">
                      {pfpUrl ? (
                        <Image
                          src={pfpUrl}
                          alt={displayName}
                          width={128}
                          height={128}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Users className="w-12 h-12 lg:w-16 lg:h-16 text-white" />
                      )}
                    </div>

                    {/* Verification Badge */}
                    {isVerified && (
                      <div className="absolute -bottom-2 -right-2 w-8 h-8 lg:w-10 lg:h-10 bg-emerald-500 rounded-full border-4 border-slate-900 flex items-center justify-center">
                        <Shield className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
                      </div>
                    )}
                  </div>

                  {/* Name and Status */}
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
                      <h1 className="text-3xl lg:text-4xl font-bold text-white">
                        {displayName}
                      </h1>

                      {/* Verification Status */}
                      <motion.span
                        className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold border ${
                          isVerified
                            ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                            : "bg-amber-500/20 text-amber-400 border-amber-500/40"
                        }`}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.3, delay: 0.2 }}
                      >
                        <Shield className="w-4 h-4 mr-2" />
                        {isVerified ? "Verified Creator" : "Unverified"}
                      </motion.span>
                    </div>

                    {/* User Status */}
                    {userProfile?.status !== undefined && (
                      <div className="flex items-center gap-3 mb-4">
                        <span
                          className={`inline-flex items-center px-4 py-2 rounded-full font-medium border ${getUserStatusColor(
                            userProfile.status
                          )}`}
                        >
                          <Award className="w-4 h-4 mr-2" />
                          {getUserStatusLabel(userProfile.status)}
                        </span>
                        <span className="text-slate-400 text-sm">
                          {userProfile.completedCampaigns} campaigns completed
                        </span>
                      </div>
                    )}

                    {/* Farcaster Info */}
                    {farcasterProfile && (
                      <div className="flex items-center gap-2 text-sm text-slate-400 mb-4">
                        <MessageSquare className="w-4 h-4" />
                        <span>@{farcasterProfile.username}</span>
                        <span>•</span>
                        <span>FID: {farcasterProfile.fid}</span>
                      </div>
                    )}

                    {/* Address */}
                    <div className="flex items-center gap-2 text-sm text-slate-400 mb-6">
                      <span className="font-mono bg-slate-800/50 px-3 py-1.5 rounded-lg">
                        {`${(profileAddress as string).slice(0, 6)}...${(
                          profileAddress as string
                        ).slice(-4)}`}
                      </span>
                      <button
                        onClick={() =>
                          handleCopy(profileAddress as string, "Address")
                        }
                        className="text-slate-500 hover:text-emerald-400 transition-colors"
                      >
                        {copiedText === "Address" ? (
                          <CheckCircle className="h-4 w-4 text-emerald-400" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                    </div>

                    {/* Bio */}
                    <p className="text-slate-300 text-lg leading-relaxed">
                      {bio}
                    </p>
                  </div>
                </div>
              </div>

              {/* Enhanced Stats Card with Farcaster Data */}
              {(farcasterProfile || userProfile) && (
                <motion.div
                  className="bg-slate-800/60 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6 min-w-72"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <div className="flex items-center gap-2 mb-6">
                    <h3 className="text-xl font-semibold text-white">
                      {farcasterProfile ? "Live Metrics" : "Profile Stats"}
                    </h3>
                    {farcasterProfile && (
                      <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded-full text-xs">
                        Farcaster
                      </span>
                    )}
                  </div>

                  <div className="space-y-6">
                    {farcasterProfile ? (
                      // Farcaster Data
                      <>
                        <div>
                          <p className="text-sm text-slate-400 mb-1">
                            Followers
                          </p>
                          <p className="text-3xl font-bold text-white">
                            {formatNumber(farcasterProfile.followerCount)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-400 mb-1">
                            Following
                          </p>
                          <p className="text-2xl font-bold text-white">
                            {formatNumber(farcasterProfile.followingCount)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-400 mb-1">
                            Campaigns
                          </p>
                          <p className="text-2xl font-bold text-white">
                            {userProfile?.completedCampaigns || 0}
                          </p>
                        </div>
                      </>
                    ) : (
                      // Fallback Data
                      <>
                        <div>
                          <p className="text-sm text-slate-400 mb-1">
                            Campaigns
                          </p>
                          <p className="text-3xl font-bold text-white">
                            {userProfile?.completedCampaigns || 0}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-400 mb-1">Status</p>
                          <p className="text-2xl font-bold text-white">
                            {getUserStatusLabel(userProfile?.status || 0)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-400 mb-1">Rating</p>
                          <p className="text-2xl font-bold text-white">4.9</p>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Farcaster Connection Status */}
                  {farcasterProfile ? (
                    <div className="mt-6 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                        <span className="text-emerald-400 text-sm font-medium">
                          Farcaster Connected
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-6 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-400" />
                        <span className="text-amber-400 text-sm font-medium">
                          No Farcaster Profile
                        </span>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4 mt-8">
              {farcasterProfile && (
                <motion.a
                  href={`https://warpcast.com/${farcasterProfile.username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-6 py-3 bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 rounded-xl border border-purple-500/30 transition-all font-medium"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.3 }}
                >
                  <MessageSquare className="h-5 w-5" />
                  View on Farcaster
                  <ExternalLink className="h-4 w-4" />
                </motion.a>
              )}

              <motion.button
                onClick={() =>
                  handleCopy(
                    typeof window !== "undefined"
                      ? `${window.location.origin}/influencer/${profileAddress}`
                      : "",
                    "Profile Link"
                  )
                }
                className="flex items-center gap-2 px-6 py-3 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-600/50 transition-all font-medium"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.4 }}
              >
                {copiedText === "Profile Link" ? (
                  <CheckCircle className="h-5 w-5 text-emerald-400" />
                ) : (
                  <Copy className="h-5 w-5" />
                )}
                Share Profile
              </motion.button>

              {isOwner && (
                <Link href="/influencersDashboard">
                  <motion.button
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl transition-all font-medium shadow-lg shadow-emerald-500/20"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.5 }}
                  >
                    <TrendingUp className="h-5 w-5" />
                    Dashboard
                    <ArrowRight className="h-4 w-4" />
                  </motion.button>
                </Link>
              )}
            </div>
          </div>
        </motion.div>

        {/* Enhanced Social Media Section */}
        <motion.div
          className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
            <Globe className="w-8 h-8 text-emerald-400" />
            Social Media Presence
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Farcaster */}
            <motion.div
              className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-slate-700/50 rounded-xl border border-slate-600/50">
                    <MessageSquare className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">Farcaster</h3>
                    {farcasterProfile ? (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                        <span className="text-emerald-400 text-sm">
                          @{farcasterProfile.username}
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-400 text-sm">
                        Not connected
                      </span>
                    )}
                  </div>
                </div>

                {farcasterProfile && (
                  <a
                    href={`https://warpcast.com/${farcasterProfile.username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-full bg-slate-600/50 hover:bg-slate-600 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4 text-slate-300" />
                  </a>
                )}
              </div>
            </motion.div>

            {/* Twitter */}
            <motion.div
              className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-slate-700/50 rounded-xl border border-slate-600/50">
                    <X className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">
                      X (Twitter)
                    </h3>
                    {farcasterProfile?.twitterUsername ? (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                        <span className="text-emerald-400 text-sm">
                          @{farcasterProfile.twitterUsername}
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-400 text-sm">
                        Not connected
                      </span>
                    )}
                  </div>
                </div>

                {farcasterProfile?.twitterUsername && (
                  <a
                    href={`https://twitter.com/${farcasterProfile.twitterUsername}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-full bg-slate-600/50 hover:bg-slate-600 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4 text-slate-300" />
                  </a>
                )}
              </div>
            </motion.div>

            {/* Other Social Platforms */}
            {socialPlatforms.slice(2).map((platform, index) => {
              const PlatformIcon = platform.icon;

              return (
                <motion.div
                  key={platform.id}
                  className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-6 transition-all duration-300 hover:bg-slate-800/40 hover:border-slate-600/50"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 * (index + 2) }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-slate-700/50 rounded-xl border border-slate-600/50">
                        <PlatformIcon className={`w-6 h-6 ${platform.color}`} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white mb-1">
                          {platform.name}
                        </h3>
                        <span className="text-sm text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                          Coming Soon
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Connection Status Notice */}
          {!farcasterProfile ? (
            <motion.div
              className="mt-8 p-6 bg-blue-500/10 border border-blue-500/20 rounded-xl"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.5 }}
            >
              <div className="flex items-start gap-4">
                <MessageSquare className="w-6 h-6 text-blue-400 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold text-blue-400 mb-2">
                    Connect Farcaster Profile
                  </h3>
                  <p className="text-blue-300 mb-4">
                    Connect your Farcaster account to display your social
                    metrics and verified social connections. This helps
                    businesses understand your audience and engagement.
                  </p>
                  {isOwner && (
                    <button className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg border border-blue-500/30 transition-all">
                      <UserPlus className="w-4 h-4" />
                      Connect Farcaster
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              className="mt-8 p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-xl"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.5 }}
            >
              <div className="flex items-start gap-4">
                <CheckCircle className="w-6 h-6 text-emerald-400 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold text-emerald-400 mb-2">
                    ✅ Farcaster Connected
                  </h3>
                  <p className="text-emerald-300">
                    Your Farcaster profile is connected and verified. Your
                    social metrics and verified connections are displayed
                    automatically!
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Portfolio & Achievements */}
        <motion.div
          className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
            <Star className="w-8 h-8 text-emerald-400" />
            Portfolio & Achievements
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
            <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-6 text-center">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-6 h-6 text-emerald-400" />
              </div>
              <p className="text-2xl font-bold text-white mb-1">
                {userProfile.completedCampaigns}
              </p>
              <p className="text-slate-400 text-sm">Completed Campaigns</p>
            </div>

            <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-6 text-center">
              <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Star className="w-6 h-6 text-purple-400" />
              </div>
              <p className="text-2xl font-bold text-white mb-1">4.9</p>
              <p className="text-slate-400 text-sm">Average Rating</p>
            </div>

            <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-6 text-center">
              <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-6 h-6 text-amber-400" />
              </div>
              <p className="text-2xl font-bold text-white mb-1">95%</p>
              <p className="text-slate-400 text-sm">Success Rate</p>
            </div>
          </div>

          {/* Call to Action */}
          <div className="text-center">
            <p className="text-slate-400 mb-6">
              Ready to collaborate with {displayName}?
            </p>
            <Link href="/marketplace">
              <motion.button
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl font-semibold transition-all shadow-lg shadow-emerald-500/20"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Sparkles className="w-5 h-5" />
                Explore Campaigns
                <ArrowRight className="w-5 h-5" />
              </motion.button>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
