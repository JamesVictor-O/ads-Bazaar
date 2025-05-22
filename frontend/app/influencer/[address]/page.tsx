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
} from "lucide-react";
import Link from "next/link";

export default function InfluencerProfile() {
  const { address: profileAddress } = useParams();
  const { address: connectedAddress, isConnected } = useAccount();
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);

  // Sample social accounts data structure
  const [socialAccounts, setSocialAccounts] = useState([
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

  const [profileData, setProfileData] = useState({
    name: "John Doe",
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
    // In a real app, this would save to the contract/database
    setEditMode(false);
    // Recalculate total followers
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

  const updateSocialAccount = (index: number, field: string, value: any) => {
    const updated = [...socialAccounts];
    updated[index] = { ...updated[index], [field]: value };
    setSocialAccounts(updated);
  };

  const removeSocialAccount = (index: number) => {
    setSocialAccounts(socialAccounts.filter((_, i) => i !== index));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  const PlatformIcon = ({ platform }: { platform: string }) => {
    switch (platform.toLowerCase()) {
      case "youtube":
        return <Youtube className="h-5 w-5" />;
      case "instagram":
        return <Instagram className="h-5 w-5" />;
      case "twitter":
        return <Twitter className="h-5 w-5" />;
      case "facebook":
        return <Facebook className="h-5 w-5" />;
      case "linkedin":
        return <Linkedin className="h-5 w-5" />;
      case "tiktok":
        return <Video className="h-5 w-5" />; // Using Video as substitute for TikTok
      case "farcaster":
        return <MessageSquare className="h-5 w-5" />; // Using MessageSquare as substitute
      default:
        return <Globe className="h-5 w-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        {/* Profile Header */}
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900">
                  {editMode ? (
                    <input
                      type="text"
                      value={profileData.name}
                      onChange={(e) =>
                        setProfileData({ ...profileData, name: e.target.value })
                      }
                      className="border rounded px-3 py-1"
                    />
                  ) : (
                    profileData.name
                  )}
                </h1>
                {isOwner && !editMode && (
                  <button
                    onClick={() => setEditMode(true)}
                    className="text-indigo-600 hover:text-indigo-800 flex items-center text-sm"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit Profile
                  </button>
                )}
              </div>
              <p className="text-gray-600 text-sm mt-1">
                {profileAddress as string}
              </p>
            </div>

            {isOwner && (
              <div className="flex gap-3">
                {editMode ? (
                  <>
                    <button
                      onClick={() => setEditMode(false)}
                      className="px-3 py-1 bg-gray-200 text-gray-800 rounded-md text-sm hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveProfile}
                      className="px-3 py-1 bg-indigo-600 text-white rounded-md text-sm hover:bg-indigo-700"
                    >
                      Save Changes
                    </button>
                  </>
                ) : (
                  <Link
                    href="/marketplace"
                    className="px-3 py-1 bg-indigo-600 text-white rounded-md text-sm hover:bg-indigo-700 flex items-center"
                  >
                    <Briefcase className="h-4 w-4 mr-1" />
                    Browse Campaigns
                  </Link>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Bio Section */}
            <div className="md:col-span-2">
              <h2 className="text-lg font-semibold mb-2">About</h2>
              {editMode ? (
                <textarea
                  value={profileData.bio}
                  onChange={(e) =>
                    setProfileData({ ...profileData, bio: e.target.value })
                  }
                  className="w-full border rounded px-3 py-2 h-32"
                />
              ) : (
                <p className="text-gray-700">{profileData.bio}</p>
              )}

              <div className="mt-4">
                <h2 className="text-lg font-semibold mb-2">Niche</h2>
                {editMode ? (
                  <input
                    type="text"
                    value={profileData.niche}
                    onChange={(e) =>
                      setProfileData({ ...profileData, niche: e.target.value })
                    }
                    className="border rounded px-3 py-1 w-full"
                  />
                ) : (
                  <div className="inline-block bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm">
                    {profileData.niche}
                  </div>
                )}
              </div>

              {profileData.website && (
                <div className="mt-4">
                  <h2 className="text-lg font-semibold mb-2">Website</h2>
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
                      className="border rounded px-3 py-1 w-full"
                    />
                  ) : (
                    <a
                      href={profileData.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:underline flex items-center"
                    >
                      <Globe className="h-4 w-4 mr-1" />
                      {profileData.website.replace(/^https?:\/\//, "")}
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Stats Overview */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-4">Audience Metrics</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Total Followers</p>
                  <p className="text-2xl font-bold">
                    {profileData.totalFollowers.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Avg. Engagement Rate</p>
                  <p className="text-2xl font-bold">
                    {profileData.avgEngagement}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Campaign Success Rate</p>
                  <p className="text-2xl font-bold">
                    {profileData.successRate}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Social Accounts Section */}
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Social Accounts</h2>
            {isOwner && editMode && (
              <button
                onClick={addSocialAccount}
                className="text-indigo-600 hover:text-indigo-800 flex items-center text-sm"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Account
              </button>
            )}
          </div>

          <div className="space-y-4">
            {socialAccounts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No social accounts added yet
              </div>
            ) : (
              socialAccounts.map((account, index) => (
                <div
                  key={index}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-gray-100 p-2 rounded-full">
                        <PlatformIcon platform={account.platform} />
                      </div>
                      <div>
                        {editMode ? (
                          <div className="space-y-2">
                            <select
                              value={account.platform}
                              onChange={(e) =>
                                updateSocialAccount(
                                  index,
                                  "platform",
                                  e.target.value
                                )
                              }
                              className="border rounded px-2 py-1 text-sm"
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
                              className="border rounded px-2 py-1 text-sm w-full"
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
                              className="border rounded px-2 py-1 text-sm w-full"
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
                              className="border rounded px-2 py-1 text-sm w-full"
                            />
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium capitalize">
                                {account.platform}
                              </h3>
                              {account.verified && (
                                <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                                  Verified
                                </span>
                              )}
                            </div>
                            <p className="text-gray-600 text-sm">
                              @{account.username}
                            </p>
                            <p className="text-gray-800 mt-1">
                              {account.followers.toLocaleString()} followers
                            </p>
                            {account.url && (
                              <a
                                href={account.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-indigo-600 hover:underline text-sm flex items-center mt-1"
                              >
                                <LinkIcon className="h-3 w-3 mr-1" />
                                View Profile
                              </a>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    {editMode && (
                      <button
                        onClick={() => removeSocialAccount(index)}
                        className="text-red-500 hover:text-red-700"
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
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Public Profile</h2>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">
                  Your public profile URL
                </p>
                <a
                  href={`/influencer/${profileAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 hover:underline flex items-center"
                >
                  {typeof window !== "undefined" &&
                    `${window.location.origin}/influencer/${profileAddress}`}
                  <LinkIcon className="h-4 w-4 ml-1" />
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
                className="px-3 py-1 bg-gray-200 text-gray-800 rounded-md text-sm hover:bg-gray-300 flex items-center"
              >
                <Share2 className="h-4 w-4 mr-1" />
                Copy Link
              </button>
            </div>
          </div>
        </div>

        {/* Campaign Statistics (for owner) */}
        {isOwner && (
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Campaign Performance</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500">Completed Campaigns</p>
                <p className="text-2xl font-bold">12</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500">Active Campaigns</p>
                <p className="text-2xl font-bold">3</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500">Total Earnings</p>
                <p className="text-2xl font-bold">$8,450</p>
              </div>
            </div>

            <div className="mt-6">
              <Link
                href="/influencersDashboard"
                className="text-indigo-600 hover:text-indigo-800 flex items-center"
              >
                View full dashboard for detailed analytics
                <LinkIcon className="h-4 w-4 ml-1" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
