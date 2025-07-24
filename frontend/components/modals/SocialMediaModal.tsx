"use client";

import { useState, useEffect } from "react";
import { X, Save, Loader2, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import { useUpdateInfluencerProfile, useGetInfluencerProfile } from "@/hooks/adsBazaar";
import { 
  SOCIAL_PLATFORMS, 
  parseSocialMediaFromProfile, 
  updateProfileWithSocialMedia,
  validateUsername,
  generateSocialUrl 
} from "@/utils/socialMedia";
import { SocialMediaProfile, SocialPlatform } from "@/types/social";

interface SocialMediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  userAddress: string;
  onProfileUpdate?: () => void;
}

export function SocialMediaModal({ isOpen, onClose, userAddress, onProfileUpdate }: SocialMediaModalProps) {
  const [socialMedia, setSocialMedia] = useState<SocialMediaProfile>({});
  const [loading, setLoading] = useState(false);

  const { updateProfile, isPending, isSuccess, isError, error } = useUpdateInfluencerProfile();
  const { data: currentProfileData, refetch: refetchProfile } = useGetInfluencerProfile(userAddress as `0x${string}`);

  // Load current social media data when modal opens
  useEffect(() => {
    if (isOpen && currentProfileData) {
      const currentSocialMedia = parseSocialMediaFromProfile(currentProfileData as string);
      setSocialMedia(currentSocialMedia);
    }
  }, [isOpen, currentProfileData]);

  // Handle success/error states - Wait for blockchain confirmation
  useEffect(() => {
    if (isSuccess) {
      // Wait for transaction to be confirmed on blockchain before refetching
      const waitForConfirmationAndRefetch = async () => {
        try {
          // Wait longer to ensure blockchain state is updated
          await new Promise(resolve => setTimeout(resolve, 4000));
          
          // Refetch profile data multiple times to ensure we get fresh data
          for (let attempt = 1; attempt <= 3; attempt++) {
            const result = await refetchProfile();
            
            // Check if we have updated data
            if (result.data) {
              try {
                const parsed = JSON.parse(result.data as string);
                if (parsed.socialMedia && Object.keys(parsed.socialMedia).length > 0) {
                  break; // Found fresh data
                }
              } catch {
                // Continue to next attempt
              }
            }
            
            // Wait between attempts (except for the last one)
            if (attempt < 3) {
              await new Promise(resolve => setTimeout(resolve, 1500));
            }
          }
          
          // Also refresh the parent page's profile data
          if (onProfileUpdate) {
            onProfileUpdate();
          }
          
          toast.success("Social media profiles updated successfully!");
          onClose();
        } catch (error) {
          console.error("Error refetching profile after update:", error);
          toast.error("Profile updated but failed to refresh. Please reload the page.");
          onClose();
        }
      };
      
      waitForConfirmationAndRefetch();
    }
  }, [isSuccess, refetchProfile, onClose, onProfileUpdate]);

  useEffect(() => {
    if (isError && error) {
      toast.error(`Update failed: ${error.message}`);
    }
  }, [isError, error]);

  const handleInputChange = (platform: SocialPlatform, value: string) => {
    setSocialMedia(prev => ({
      ...prev,
      [platform]: value
    }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);

      // Validate all usernames
      for (const [platform, username] of Object.entries(socialMedia)) {
        if (username && username.trim() !== "") {
          const validation = validateUsername(platform as SocialPlatform, username);
          if (!validation.isValid) {
            toast.error(`${SOCIAL_PLATFORMS[platform as SocialPlatform].name}: ${validation.error}`);
            return;
          }
        }
      }

      // Clean up empty values
      const cleanedSocialMedia = Object.fromEntries(
        Object.entries(socialMedia).filter(([_, username]) => username && username.trim() !== "")
      ) as SocialMediaProfile;

      // Update profile data
      const updatedProfileData = updateProfileWithSocialMedia(
        currentProfileData as string || "",
        cleanedSocialMedia
      );

      await updateProfile(updatedProfileData);
    } catch (err) {
      console.error("Error updating social media:", err);
      toast.error("Failed to update social media profiles");
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = () => {
    return Object.values(socialMedia).some(username => username && username.trim() !== "");
  };

  if (!isOpen) return null;

  return (
    <motion.div
      className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-slate-800/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
          <div>
            <h2 className="text-xl font-bold text-white">Update Social Media Profiles</h2>
            <p className="text-sm text-slate-400 mt-1">
              Add your social media usernames to help businesses find and assess your profiles
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all"
            disabled={isPending || loading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-4">
          {Object.entries(SOCIAL_PLATFORMS).map(([platform, config]) => (
            <div key={platform} className="space-y-2">
              <label className="block text-sm font-medium text-slate-300">
                {config.name}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={socialMedia[platform as SocialPlatform] || ""}
                  onChange={(e) => handleInputChange(platform as SocialPlatform, e.target.value)}
                  className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all pr-12"
                  placeholder={`Your ${config.name} ${config.placeholder}`}
                  disabled={isPending || loading}
                />
                {socialMedia[platform as SocialPlatform] && (
                  <a
                    href={generateSocialUrl(platform as SocialPlatform, socialMedia[platform as SocialPlatform]!)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-emerald-400 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
              {socialMedia[platform as SocialPlatform] && (
                <p className="text-xs text-slate-500">
                  Will link to: {generateSocialUrl(platform as SocialPlatform, socialMedia[platform as SocialPlatform]!)}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-slate-700/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-300 hover:text-white transition-colors"
            disabled={isPending || loading}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!isFormValid() || isPending || loading}
            className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-all flex items-center gap-2"
          >
            {(isPending || loading) ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Update Profiles
              </>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}