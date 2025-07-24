"use client";

import { useState } from "react";
import { ExternalLink, Edit3, Users, Globe } from "lucide-react";
import { motion } from "framer-motion";
import { getSocialMediaLinks, parseSocialMediaFromProfile } from "@/utils/socialMedia";
import { SocialMediaModal } from "@/components/modals/SocialMediaModal";
import { SocialMediaLink } from "@/types/social";
import { useAccount } from "wagmi";

// Social media icons mapping
const SocialIcons: Record<string, any> = {
  Instagram: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
    </svg>
  ),
  Twitter: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  ),
  Music: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 0-2.31-1.09 3.09 3.09 0 1 0 3.09 3.09V8.55a6.72 6.72 0 0 0 2.74.75v-2.61z"/>
    </svg>
  ),
  Play: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z"/>
    </svg>
  ),
  Facebook: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  ),
  Linkedin: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  ),
  Twitch: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"/>
    </svg>
  ),
  Camera: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M9 2a1 1 0 0 0-.894.553L7.382 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-3.382l-.724-1.447A1 1 0 0 0 15 2H9zM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"/>
    </svg>
  ),
  MessageSquare: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  ),
};

interface SocialMediaCardProps {
  profileData?: string;
  userAddress: string;
  isOwner?: boolean;
  onProfileUpdate?: () => void;
}

export function SocialMediaCard({ profileData, userAddress, isOwner = false, onProfileUpdate }: SocialMediaCardProps) {
  const [showModal, setShowModal] = useState(false);
  const { address } = useAccount();

  console.log("🔍 SocialMediaCard - Processing profile data:");
  console.log("  - profileData:", profileData);
  console.log("  - profileData type:", typeof profileData);
  console.log("  - profileData length:", profileData ? profileData.length : 0);
  
  const socialMediaData = profileData ? parseSocialMediaFromProfile(profileData) : {};
  console.log("  - parsed socialMediaData:", socialMediaData);
  console.log("  - Object.keys(socialMediaData):", Object.keys(socialMediaData));
  
  const socialLinks = getSocialMediaLinks(socialMediaData);
  console.log("  - generated socialLinks:", socialLinks);
  console.log("  - socialLinks.length:", socialLinks.length);

  const SocialLinkButton = ({ link }: { link: SocialMediaLink }) => {
    const IconComponent = SocialIcons[link.icon];

    return (
      <motion.a
        href={link.url}
        target="_blank"
        rel="noopener noreferrer"
        className={`group flex items-center gap-3 p-3 bg-slate-900/30 hover:bg-slate-900/50 border border-slate-700/30 hover:border-slate-600/50 rounded-xl transition-all duration-200 ${link.color}`}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className={`w-8 h-8 ${link.color} flex items-center justify-center`}>
          {IconComponent ? (
            <IconComponent className="w-5 h-5" />
          ) : (
            <Globe className="w-5 h-5" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white group-hover:text-emerald-300 transition-colors">
            {link.platform.charAt(0).toUpperCase() + link.platform.slice(1)}
          </p>
          <p className="text-xs text-slate-400 truncate">
            @{link.username}
          </p>
        </div>
        <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-emerald-400 transition-colors opacity-0 group-hover:opacity-100" />
      </motion.a>
    );
  };

  return (
    <>
      <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/20">
              <Users className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Social Media</h3>
              <p className="text-sm text-slate-400">Follow this influencer</p>
            </div>
          </div>
          
          {isOwner && address?.toLowerCase() === userAddress.toLowerCase() && (
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-3 py-2 bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-500/20 hover:border-emerald-500/40 text-emerald-400 rounded-lg text-sm font-medium transition-all"
            >
              <Edit3 className="w-4 h-4" />
              Update
            </button>
          )}
        </div>

        {socialLinks.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {socialLinks.map((link) => (
              <SocialLinkButton key={link.platform} link={link} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 mb-2">No social media profiles added yet</p>
            {isOwner && address?.toLowerCase() === userAddress.toLowerCase() && (
              <button
                onClick={() => setShowModal(true)}
                className="text-emerald-400 hover:text-emerald-300 text-sm font-medium transition-colors"
              >
                Update your social media profiles
              </button>
            )}
          </div>
        )}
      </div>

      <SocialMediaModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        userAddress={userAddress}
        onProfileUpdate={onProfileUpdate}
      />
    </>
  );
}