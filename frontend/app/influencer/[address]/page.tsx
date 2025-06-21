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
  TrendingUp,
  AlertCircle,
  Loader2,
  Zap,
  Link as LinkIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Toaster, toast } from "react-hot-toast";
import { useFarcasterProfile } from "@/hooks/useFarcasterProfile";
import { useFarcasterAuth } from "@/hooks/UseFarcasterAuth";
import { useIsInfluencerVerified, useUserProfile } from "@/hooks/adsBazaar";
import {
  getUserStatusColor,
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
            <img src={url} alt="Farcaster QR Code" className="w-32 h-32" />
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
  const [refreshTrigger, setRefreshTrigger] = useState(0);

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
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-slate-400 text-sm">Loading profile...</p>
        </motion.div>
      </div>
    );
  }

  if (!userProfile?.isRegistered || !userProfile?.isInfluencer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <motion.div
          className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 max-w-sm w-full text-center"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <AlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-3">
            Profile Not Found
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed mb-6">
            This address is not registered as an influencer on AdsBazaar.
          </p>
          <Link href="/marketplace">
            <motion.button
              className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-medium py-2.5 px-4 rounded-lg hover:from-emerald-600 hover:to-emerald-700 transition-all text-sm"
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pt-4 pb-6 px-3">
      <Toaster position="top-center" />

      <div className="max-w-lg mx-auto space-y-4">
        {/* Connect Farcaster Section - Top Priority */}
        {!farcasterProfile && (
          <motion.div
            className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 backdrop-blur-xl border border-purple-500/20 rounded-xl p-4"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-white font-medium text-sm">Connect Farcaster</h3>
                  <p className="text-slate-400 text-xs">Verify your social presence</p>
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

        {/* Header Section */}
        <motion.div
          className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-xl p-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="flex items-center gap-4 mb-4">
            {/* Avatar */}
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center overflow-hidden border-2 border-slate-700/50">
                {pfpUrl ? (
                  <Image
                    src={pfpUrl}
                    alt={displayName}
                    width={64}
                    height={64}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Users className="w-8 h-8 text-white" />
                )}
              </div>

              {/* Verification Badge */}
              {isVerified && (
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full border-2 border-slate-900 flex items-center justify-center">
                  <Shield className="w-3 h-3 text-white" />
                </div>
              )}
            </div>

            {/* Basic Info */}
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-white truncate">
                {displayName}
              </h1>
              
              {/* Verification Status */}
              <span
                className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${
                  isVerified
                    ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                    : "bg-amber-500/20 text-amber-400 border-amber-500/40"
                }`}
              >
                <Shield className="w-3 h-3 mr-1" />
                {isVerified ? "Verified" : "Unverified"}
              </span>

              {/* Farcaster Username */}
              {farcasterProfile && (
                <div className="flex items-center gap-1 text-xs text-slate-400 mt-1">
                  <MessageSquare className="w-3 h-3" />
                  <span>@{farcasterProfile.username}</span>
                </div>
              )}
            </div>
          </div>

          {/* Address */}
          <div className="flex items-center gap-2 mb-3">
            <span className="font-mono bg-slate-700/50 px-2 py-1 rounded text-xs text-slate-300">
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
                <CheckCircle className="h-3 w-3 text-emerald-400" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </button>
          </div>

          {/* Bio */}
          <p className="text-slate-300 text-sm leading-relaxed">
            {bio}
          </p>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          className="grid grid-cols-3 gap-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-lg p-3 text-center">
            <p className="text-lg font-bold text-white">
              {farcasterProfile ? formatNumber(farcasterProfile.followerCount) : (userProfile?.completedCampaigns || 0)}
            </p>
            <p className="text-xs text-slate-400">
              {farcasterProfile ? "Followers" : "Campaigns"}
            </p>
          </div>

          <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-lg p-3 text-center">
            <p className="text-lg font-bold text-white">
              {farcasterProfile ? formatNumber(farcasterProfile.followingCount) : "4.9"}
            </p>
            <p className="text-xs text-slate-400">
              {farcasterProfile ? "Following" : "Rating"}
            </p>
          </div>

          <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-lg p-3 text-center">
            <p className="text-lg font-bold text-white">
              {getUserStatusLabel(userProfile?.status || 0)}
            </p>
            <p className="text-xs text-slate-400">Status</p>
          </div>
        </motion.div>

        {/* Social Media */}
        <motion.div
          className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-xl p-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
            <Globe className="w-5 h-5 text-emerald-400" />
            Social Presence
          </h2>

          <div className="space-y-3">
            {/* Farcaster */}
            <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <MessageSquare className="w-4 h-4 text-purple-400" />
                </div>
                <div>
                  <p className="text-white text-sm font-medium">Farcaster</p>
                  {farcasterProfile ? (
                    <p className="text-emerald-400 text-xs">@{farcasterProfile.username}</p>
                  ) : (
                    <p className="text-slate-400 text-xs">Not connected</p>
                  )}
                </div>
              </div>
              {farcasterProfile ? (
                <a
                  href={`https://warpcast.com/${farcasterProfile.username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 bg-slate-600/50 rounded-md hover:bg-slate-600 transition-colors"
                >
                  <ExternalLink className="w-3 h-3 text-slate-300" />
                </a>
              ) : (
                <span className="text-xs text-amber-400 bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20">
                  Connect
                </span>
              )}
            </div>

            {/* Twitter */}
            <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <X className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <p className="text-white text-sm font-medium">X (Twitter)</p>
                  {farcasterProfile?.twitterUsername ? (
                    <p className="text-emerald-400 text-xs">@{farcasterProfile.twitterUsername}</p>
                  ) : (
                    <p className="text-slate-400 text-xs">Not connected</p>
                  )}
                </div>
              </div>
              {farcasterProfile?.twitterUsername && (
                <a
                  href={`https://twitter.com/${farcasterProfile.twitterUsername}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 bg-slate-600/50 rounded-md hover:bg-slate-600 transition-colors"
                >
                  <ExternalLink className="w-3 h-3 text-slate-300" />
                </a>
              )}
            </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          className="flex flex-col gap-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          {isOwner && (
            <Link href="/influencersDashboard">
              <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-lg font-medium transition-all">
                <TrendingUp className="w-4 h-4" />
                Go to Dashboard
                <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
          )}

          <div className="flex gap-3">
            <button
              onClick={() =>
                handleCopy(
                  typeof window !== "undefined"
                    ? `${window.location.origin}/influencer/${profileAddress}`
                    : "",
                  "Profile Link"
                )
              }
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-600/50 transition-all text-sm"
            >
              {copiedText === "Profile Link" ? (
                <CheckCircle className="w-4 h-4 text-emerald-400" />
              ) : (
                <LinkIcon className="w-4 h-4" />
              )}
              Share
            </button>

            <Link href="/marketplace" className="flex-1">
              <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg transition-all text-sm">
                <Sparkles className="w-4 h-4" />
                Explore
              </button>
            </Link>
          </div>
        </motion.div>

        {/* Farcaster Connection Status */}
        {farcasterProfile && (
          <motion.div
            className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.5 }}
          >
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span className="text-emerald-400 text-sm font-medium">
                ✅ Farcaster Connected
              </span>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}