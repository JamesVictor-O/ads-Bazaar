"use client";

import { useParams } from "next/navigation";
import { useAccount, useReadContract } from "wagmi";
import { useEffect, useState } from "react";
import { Briefcase, Users, Link as LinkIcon, Share2 } from "lucide-react";
import Link from "next/link";

import adsBazaarABI from "../../../lib/AdsBazaar.json";
import { CONTRACT_ADDRESS } from "../../../lib/contracts";

export default function InfluencerProfile() {
  const { address: profileAddress } = useParams();
  const { address: connectedAddress, isConnected } = useAccount();
  const [isOwner, setIsOwner] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if connected wallet owns this profile
  useEffect(() => {
    if (isConnected && connectedAddress && profileAddress) {
      const ownerStatus =
        connectedAddress.toLowerCase() ===
        (profileAddress as string).toLowerCase();
      setIsOwner(ownerStatus);
    }
  }, [isConnected, connectedAddress, profileAddress]);

  // Fetch influencer data from contract
  const {
    data: influencerData,
    error: contractError,
    isLoading: contractLoading,
  } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: adsBazaarABI.abi,
    functionName: "getInfluencerProfile",
    args: [profileAddress as `0x${string}`],
    enabled: !!profileAddress,
  });

  // Process influencer data when loaded
  useEffect(() => {
    if (!profileAddress) {
      setError("No profile address provided");
      setLoading(false);
      return;
    }

    if (contractLoading) {
      setLoading(true);
      return;
    }

    if (contractError) {
      console.error("Contract error:", contractError);
      // Instead of showing error, create a basic profile
      const basicProfile = {
        farcasterUsername: null,
        farcasterPfp: null,
        niche: null,
        bio: null,
        followerCount: null,
      };
      setProfileData(basicProfile);
      setLoading(false);
      return;
    }

    if (influencerData) {
      try {
        let parsedData;
        if (typeof influencerData === "string") {
          parsedData = JSON.parse(influencerData);
        } else {
          parsedData = influencerData;
        }
        setProfileData(parsedData);
        setLoading(false);
      } catch (err) {
        console.error("Parsing error:", err);
        // Fallback to basic profile
        const basicProfile = {
          farcasterUsername: null,
          farcasterPfp: null,
          niche: null,
          bio: null,
          followerCount: null,
        };
        setProfileData(basicProfile);
        setLoading(false);
      }
    } else {
      // If contract call completed but returned no data, show basic profile
      if (!contractLoading) {
        const basicProfile = {
          farcasterUsername: null,
          farcasterPfp: null,
          niche: null,
          bio: null,
          followerCount: null,
        };
        setProfileData(basicProfile);
        setLoading(false);
      }
    }
  }, [influencerData, contractError, contractLoading, profileAddress]);

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

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center p-6 max-w-md">
          <p className="text-red-500 mb-4">{error}</p>
          <Link href="/" className="text-indigo-600 hover:underline">
            Go back home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-6">
            <div className="flex-shrink-0">
              <img
                src={profileData?.farcasterPfp || "/default-avatar.png"}
                alt="Profile"
                className="h-24 w-24 rounded-full object-cover bg-gray-200"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='96' height='96' viewBox='0 0 96 96'%3E%3Ccircle cx='48' cy='48' r='48' fill='%23e5e7eb'/%3E%3Cpath d='M48 24c6.627 0 12 5.373 12 12s-5.373 12-12 12-12-5.373-12-12 5.373-12 12-12zm0 24c13.255 0 24 10.745 24 24H24c0-13.255 10.745-24 24-24z' fill='%239ca3af'/%3E%3C/svg%3E";
                }}
              />
            </div>
            <div className="flex-grow">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {profileData?.farcasterUsername ||
                      `Influencer ${(profileAddress as string)?.slice(
                        0,
                        6
                      )}...${(profileAddress as string)?.slice(-4)}`}
                  </h1>
                  <p className="text-gray-600 text-sm mt-1">
                    {profileAddress as string}
                  </p>
                  <p className="text-gray-600 mt-2">
                    {profileData?.niche || "No niche specified"}
                  </p>
                </div>
                {isOwner && (
                  <Link
                    href="/influencersDashboard"
                    className="px-3 py-1 bg-indigo-600 text-white rounded-md text-sm hover:bg-indigo-700"
                  >
                    Edit Profile
                  </Link>
                )}
              </div>

              <div className="mt-4 flex flex-wrap gap-4">
                <div className="flex items-center text-gray-600">
                  <Users className="h-5 w-5 mr-2" />
                  <span>Followers: {profileData?.followerCount || "N/A"}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Briefcase className="h-5 w-5 mr-2" />
                  <span>Campaigns: {isOwner ? "0" : "Private"}</span>
                </div>
              </div>

              {profileData?.bio && (
                <p className="mt-4 text-gray-700">{profileData.bio}</p>
              )}
            </div>
          </div>
        </div>

        {/* Public Stats */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Public Statistics</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <p className="text-sm text-gray-500">Total Campaigns</p>
              <p className="text-xl font-bold">{isOwner ? "0" : "Private"}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <p className="text-sm text-gray-500">Engagement Rate</p>
              <p className="text-xl font-bold">N/A</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <p className="text-sm text-gray-500">Avg. Reach</p>
              <p className="text-xl font-bold">N/A</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <p className="text-sm text-gray-500">Success Rate</p>
              <p className="text-xl font-bold">N/A</p>
            </div>
          </div>
        </div>

        {/* Owner-only sections */}
        {isOwner && (
          <>
            {/* Applications - Simplified without dashboard hook */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-lg font-semibold mb-4">Your Applications</h2>
              <p className="text-gray-500">
                You haven't applied to any campaigns yet.
              </p>
              <Link
                href="/marketplace"
                className="inline-block mt-4 text-indigo-600 hover:underline"
              >
                Browse available campaigns →
              </Link>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link
                  href="/marketplace"
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center"
                >
                  <Briefcase className="h-5 w-5 mr-3 text-indigo-600" />
                  <span>Browse Campaigns</span>
                </Link>
                <Link
                  href="/influencersDashboard"
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center"
                >
                  <Share2 className="h-5 w-5 mr-3 text-indigo-600" />
                  <span>View Full Dashboard</span>
                </Link>
              </div>
            </div>
          </>
        )}

        {/* Public message for non-owners */}
        {!isOwner && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">
              About This Influencer
            </h2>
            <p className="text-gray-600 mb-4">
              This is a public profile page. Connect your wallet to view more
              details if this is your profile.
            </p>
            <Link
              href="/marketplace"
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              <Briefcase className="h-4 w-4 mr-2" />
              Browse Campaigns
            </Link>
          </div>
        )}

        {/* Share Profile */}
        <div className="mt-6 text-center">
          <p className="text-gray-500 mb-2">Share this profile</p>
          <div className="flex justify-center gap-3">
            <button
              onClick={() => {
                if (navigator.clipboard && window.location) {
                  navigator.clipboard
                    .writeText(window.location.href)
                    .then(() => {
                      // Could add a toast notification here
                      console.log("URL copied to clipboard");
                    })
                    .catch((err) => console.error("Failed to copy URL:", err));
                }
              }}
              className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"
              title="Copy profile URL"
            >
              <LinkIcon className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
