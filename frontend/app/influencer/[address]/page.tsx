"use client";

import { useParams } from "next/navigation";
import { useAccount } from "wagmi";
import { useState, useEffect } from "react";
import {
  Briefcase,
  Link as LinkIcon,
  Share2,
  Plus,
  Edit,
  Globe,
  Youtube,
  Instagram,
  Twitter,
  MessageSquare,
  Video,
  Facebook,
  Linkedin,
  Shield,
  ChevronRight,
  Copy,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { Toaster } from "react-hot-toast";

interface SocialAccount {
  platform: string;
  username: string;
  followers: number;
  verified: boolean;
  url: string;
}

interface ProfileData {
  name: string;
  bio: string;
  website: string;
  niche: string;
  totalFollowers: number;
  avgEngagement: number;
  successRate: number;
}

export default function InfluencerProfile() {
  const { address: profileAddress } = useParams();
  const { address: connectedAddress, isConnected } = useAccount();
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);

  const [socialAccounts, setSocialAccounts] = useState<SocialAccount[]>([
    {
      platform: "twitter",
      username: "johndoe",
      followers: 12500,
      verified: true,
      url: "https://twitter.com/johndoe",
    },
    {
      platform: "youtube",
      username: "@johndoe",
      followers: 85000,
      verified: false,
      url: "https://youtube.com/johndoe",
    },
    {
      platform: "instagram",
      username: "john.doe",
      followers: 42000,
      verified: true,
      url: "https://instagram.com/john.doe",
    },
  ]);

  const [profileData, setProfileData] = useState<ProfileData>({
    name: "Influencer",
    bio: "Digital creator specializing in tech reviews and tutorials. Collaborating with brands to create authentic content.",
    website: "https://johndoe.com",
    niche: "Tech & Gadgets",
    totalFollowers: socialAccounts.reduce((sum, acc) => sum + acc.followers, 0),
    avgEngagement: 4.7,
    successRate: 92,
  });

  // Check if connected wallet owns this profile
  useEffect(() => {
    if (isConnected && connectedAddress && profileAddress) {
      const ownerStatus =
        connectedAddress.toLowerCase() ===
        (profileAddress as string).toLowerCase();
      setIsOwner(ownerStatus);
    }
    setLoading(false);
  }, [isConnected, connectedAddress, profileAddress]);

  const handleSaveProfile = () => {
    setEditMode(false);
    setProfileData((prev) => ({
      ...prev,
      totalFollowers: socialAccounts.reduce(
        (sum, acc) => sum + acc.followers,
        0
      ),
    }));
  };

  const addSocialAccount = () => {
    setSocialAccounts([
      ...socialAccounts,
      { platform: "", username: "", followers: 0, verified: false, url: "" },
    ]);
  };

  const updateSocialAccount = (
    index: number,
    field: keyof SocialAccount,
    value: string | number | boolean
  ) => {
    const updated = [...socialAccounts];
    updated[index] = { ...updated[index], [field]: value };
    setSocialAccounts(updated);
  };

  const removeSocialAccount = (index: number) => {
    setSocialAccounts(socialAccounts.filter((_, i) => i !== index));
  };

  const PlatformIcon = ({ platform }: { platform: string }) => {
    switch (platform.toLowerCase()) {
      case "youtube":
        return <Youtube className="h-5 w-5 text-red-400" />;
      case "instagram":
        return <Instagram className="h-5 w-5 text-pink-500" />;
      case "twitter":
        return <Twitter className="h-5 w-5 text-blue-400" />;
      case "facebook":
        return <Facebook className="h-5 w-5 text-blue-600" />;
      case "linkedin":
        return <Linkedin className="h-5 w-5 text-blue-500" />;
      case "tiktok":
        return <Video className="h-5 w-5 text-black dark:text-white" />;
      case "farcaster":
        return <MessageSquare className="h-5 w-5 text-purple-500" />;
      default:
        return <Globe className="h-5 w-5 text-emerald-400" />;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pt-28 pb-12 px-4 sm:px-6 lg:px-8">
      <Toaster position="top-right" />

      <div className="max-w-6xl mx-auto">
        {/* Profile Header */}
        <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 mb-8">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-8">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                <h1 className="text-3xl lg:text-4xl font-bold text-white">
                  {editMode ? (
                    <input
                      type="text"
                      value={profileData.name}
                      onChange={(e) =>
                        setProfileData({ ...profileData, name: e.target.value })
                      }
                      className="bg-slate-700/50 border border-slate-600/50 rounded-xl px-4 py-2 text-white w-full max-w-md"
                    />
                  ) : (
                    <span className="bg-gradient-to-r from-emerald-400 bg-clip-text ">
                      {profileData.name}
                    </span>
                  )}
                </h1>
                {isOwner && !editMode && (
                  <button
                    onClick={() => setEditMode(true)}
                    className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 text-sm"
                  >
                    <Edit className="h-4 w-4" />
                    Edit Profile
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 text-sm text-slate-400 mb-6">
                <span className="font-mono bg-slate-800/50 px-3 py-1 rounded-lg">
                  {profileAddress as string}
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(profileAddress as string);
                    // Add toast in real app
                  }}
                  className="text-slate-500 hover:text-slate-300"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>

              <div className="mb-6">
                <h2 className="text-lg font-semibold text-white mb-2">About</h2>
                {editMode ? (
                  <textarea
                    value={profileData.bio}
                    onChange={(e) =>
                      setProfileData({ ...profileData, bio: e.target.value })
                    }
                    className="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl px-4 py-3 h-32 text-white"
                  />
                ) : (
                  <p className="text-slate-300">{profileData.bio}</p>
                )}
              </div>

              <div className="mb-6">
                <h2 className="text-lg font-semibold text-white mb-2">Niche</h2>
                {editMode ? (
                  <input
                    type="text"
                    value={profileData.niche}
                    onChange={(e) =>
                      setProfileData({ ...profileData, niche: e.target.value })
                    }
                    className="bg-slate-700/50 border border-slate-600/50 rounded-xl px-4 py-2 text-white w-full max-w-md"
                  />
                ) : (
                  <span className="inline-block bg-emerald-900/30 text-emerald-400 px-4 py-1.5 rounded-full text-sm border border-emerald-800/50">
                    {profileData.niche}
                  </span>
                )}
              </div>

              {profileData.website && (
                <div>
                  <h2 className="text-lg font-semibold text-white mb-2">
                    Website
                  </h2>
                  {editMode ? (
                    <input
                      type="url"
                      value={profileData.website}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          website: e.target.value,
                        })
                      }
                      className="bg-slate-700/50 border border-slate-600/50 rounded-xl px-4 py-2 text-white w-full max-w-md"
                    />
                  ) : (
                    <a
                      href={profileData.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-400 hover:text-emerald-300 flex items-center gap-2"
                    >
                      <Globe className="h-5 w-5" />
                      {profileData.website.replace(/^https?:\/\//, "")}
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Stats Overview */}
            <div className="bg-slate-800/60 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6 min-w-72">
              <h2 className="text-xl font-semibold text-white mb-6">
                Audience Metrics
              </h2>
              <div className="space-y-6">
                <div>
                  <p className="text-sm text-slate-400 mb-1">Total Followers</p>
                  <p className="text-3xl font-bold text-white">
                    {profileData.totalFollowers.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-400 mb-1">
                    Avg. Engagement Rate
                  </p>
                  <p className="text-3xl font-bold text-white">
                    {profileData.avgEngagement}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-400 mb-1">
                    Campaign Success Rate
                  </p>
                  <p className="text-3xl font-bold text-white">
                    {profileData.successRate}%
                  </p>
                </div>
              </div>
            </div>
          </div>

          {isOwner && (
            <div className="flex gap-4">
              {editMode ? (
                <>
                  <button
                    onClick={() => setEditMode(false)}
                    className="px-5 py-2.5 bg-slate-700/50 hover:bg-slate-700/70 text-slate-300 rounded-xl border border-slate-600/50 text-sm font-medium transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveProfile}
                    className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl text-sm font-medium transition-all shadow-lg shadow-emerald-500/20"
                  >
                    Save Changes
                  </button>
                </>
              ) : (
                <Link
                  href="/marketplace"
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl text-sm font-medium transition-all shadow-lg shadow-emerald-500/20"
                >
                  <Briefcase className="h-5 w-5" />
                  Browse Campaigns
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Social Accounts Section */}
        <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 mb-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-white">Social Accounts</h2>
            {isOwner && editMode && (
              <button
                onClick={addSocialAccount}
                className="flex items-center gap-2 text-emerald-400 hover:text-emerald-300 text-sm"
              >
                <Plus className="h-5 w-5" />
                Add Account
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {socialAccounts.length === 0 ? (
              <div className="col-span-2 text-center py-8 text-slate-500">
                No social accounts added yet
              </div>
            ) : (
              socialAccounts.map((account, index) => (
                <div
                  key={index}
                  className="bg-slate-800/30 hover:bg-slate-800/40 border border-slate-700/50 rounded-xl p-5 transition-all group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-slate-700/50 rounded-xl border border-slate-600/50 group-hover:border-emerald-500/30 transition-colors">
                        <PlatformIcon platform={account.platform} />
                      </div>
                      <div className="flex-1">
                        {editMode ? (
                          <div className="space-y-3">
                            <select
                              value={account.platform}
                              onChange={(e) =>
                                updateSocialAccount(
                                  index,
                                  "platform",
                                  e.target.value
                                )
                              }
                              className="w-full bg-slate-700/50 border border-slate-600/50 rounded-lg px-3 py-2 text-white text-sm"
                            >
                              <option value="">Select Platform</option>
                              <option value="youtube">YouTube</option>
                              <option value="instagram">Instagram</option>
                              <option value="twitter">Twitter</option>
                              <option value="facebook">Facebook</option>
                              <option value="linkedin">LinkedIn</option>
                              <option value="tiktok">TikTok</option>
                              <option value="farcaster">Farcaster</option>
                            </select>
                            <input
                              type="text"
                              placeholder="Username"
                              value={account.username}
                              onChange={(e) =>
                                updateSocialAccount(
                                  index,
                                  "username",
                                  e.target.value
                                )
                              }
                              className="w-full bg-slate-700/50 border border-slate-600/50 rounded-lg px-3 py-2 text-white text-sm"
                            />
                            <input
                              type="number"
                              placeholder="Follower Count"
                              value={account.followers}
                              onChange={(e) =>
                                updateSocialAccount(
                                  index,
                                  "followers",
                                  parseInt(e.target.value) || 0
                                )
                              }
                              className="w-full bg-slate-700/50 border border-slate-600/50 rounded-lg px-3 py-2 text-white text-sm"
                            />
                            <input
                              type="url"
                              placeholder="Profile URL"
                              value={account.url}
                              onChange={(e) =>
                                updateSocialAccount(
                                  index,
                                  "url",
                                  e.target.value
                                )
                              }
                              className="w-full bg-slate-700/50 border border-slate-600/50 rounded-lg px-3 py-2 text-white text-sm"
                            />
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-medium capitalize text-white">
                                {account.platform}
                              </h3>
                              {account.verified && (
                                <span className="text-xs bg-emerald-900/30 text-emerald-400 px-2 py-1 rounded-full border border-emerald-800/50 flex items-center gap-1">
                                  <Shield className="h-3 w-3" />
                                  Verified
                                </span>
                              )}
                            </div>
                            <p className="text-slate-300 text-sm mb-1">
                              @{account.username}
                            </p>
                            <p className="text-white font-medium mb-3">
                              {account.followers.toLocaleString()} followers
                            </p>
                            {account.url && (
                              <a
                                href={account.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-emerald-400 hover:text-emerald-300 text-sm flex items-center gap-1"
                              >
                                <LinkIcon className="h-4 w-4" />
                                View Profile
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    {editMode && (
                      <button
                        onClick={() => removeSocialAccount(index)}
                        className="text-red-400 hover:text-red-300 p-1"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Public Profile Link */}
        <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">Public Profile</h2>
          <div className="bg-slate-800/60 backdrop-blur-md border border-slate-700/50 rounded-xl p-5">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <p className="text-sm text-slate-400 mb-2">
                  Your public profile URL
                </p>
                <a
                  href={`/influencer/${profileAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-400 hover:text-emerald-300 flex items-center gap-2 font-mono"
                >
                  {typeof window !== "undefined" &&
                    `${window.location.origin}/influencer/${profileAddress}`}
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
              <button
                onClick={() => {
                  if (navigator.clipboard) {
                    navigator.clipboard.writeText(
                      typeof window !== "undefined"
                        ? `${window.location.origin}/influencer/${profileAddress}`
                        : ""
                    );
                    // Add toast notification in a real app
                  }
                }}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-700/50 hover:bg-slate-700/70 text-slate-300 rounded-xl border border-slate-600/50 text-sm font-medium transition-all"
              >
                <Share2 className="h-4 w-4" />
                Copy Link
              </button>
            </div>
          </div>
        </div>

        {/* Campaign Statistics (for owner) */}
        {isOwner && (
          <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-white mb-6">
              Campaign Performance
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
              <div className="bg-slate-800/60 backdrop-blur-md border border-slate-700/50 rounded-xl p-5">
                <p className="text-sm text-slate-400 mb-2">
                  Completed Campaigns
                </p>
                <p className="text-3xl font-bold text-white">12</p>
              </div>
              <div className="bg-slate-800/60 backdrop-blur-md border border-slate-700/50 rounded-xl p-5">
                <p className="text-sm text-slate-400 mb-2">Active Campaigns</p>
                <p className="text-3xl font-bold text-white">3</p>
              </div>
              <div className="bg-slate-800/60 backdrop-blur-md border border-slate-700/50 rounded-xl p-5">
                <p className="text-sm text-slate-400 mb-2">Total Earnings</p>
                <p className="text-3xl font-bold text-white">$8,450</p>
              </div>
            </div>

            <Link
              href="/influencersDashboard"
              className="flex items-center gap-2 text-emerald-400 hover:text-emerald-300 group"
            >
              View full dashboard for detailed analytics
              <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
