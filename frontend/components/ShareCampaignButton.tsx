"use client";

import { useState, useRef, useEffect } from "react";
import { Share, Twitter, Facebook, Copy, Check } from "lucide-react";
import { Brief } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";

interface ShareCampaignButtonProps {
  campaign: Brief;
  className?: string;
}

// Add a simple Farcaster icon (FC initials) for now
const FarcasterIcon = () => (
  <span className="font-bold text-purple-400 text-xs">FC</span>
);

const ShareCampaignButton = ({
  campaign,
  className = "",
}: ShareCampaignButtonProps) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [copied, setCopied] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<"up" | "down">(
    "down"
  );
  const buttonRef = useRef<HTMLDivElement>(null);

  const shareUrl = `${window.location.origin}/campaign/${campaign.id}`;
  const shareText = `Check out this amazing campaign: ${campaign.name}`;

  // Check available space and set dropdown position
  useEffect(() => {
    if (showDropdown && buttonRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const dropdownHeight = 280; // Approximate dropdown height

      // Check if there's enough space below
      const spaceBelow = viewportHeight - buttonRect.bottom;
      const spaceAbove = buttonRect.top;

      if (spaceBelow < dropdownHeight && spaceAbove > dropdownHeight) {
        setDropdownPosition("up");
      } else {
        setDropdownPosition("down");
      }
    }
  }, [showDropdown]);

  // Farcaster share handler
  const handleFarcasterShare = () => {
    const farcasterUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(
      `Check out this campaign: ${campaign.name}\n${window.location.origin}/campaign/${campaign.id}`
    )}`;
    window.open(farcasterUrl, "_blank");
    setShowDropdown(false);
  };

  const shareOptions = [
    {
      name: "Farcaster",
      icon: FarcasterIcon,
      color: "text-purple-400",
      bgColor: "hover:bg-purple-500/10",
      action: handleFarcasterShare,
    },
    {
      name: "Twitter",
      icon: Twitter,
      color: "text-blue-400",
      bgColor: "hover:bg-blue-500/10",
      action: () => {
        const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
          shareText
        )}&url=${encodeURIComponent(shareUrl)}`;
        window.open(url, "_blank");
        setShowDropdown(false);
      },
    },
    {
      name: "Facebook",
      icon: Facebook,
      color: "text-blue-500",
      bgColor: "hover:bg-blue-600/10",
      action: () => {
        const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
          shareUrl
        )}`;
        window.open(url, "_blank");
        setShowDropdown(false);
      },
    },
    {
      name: "Copy Link",
      icon: copied ? Check : Copy,
      color: copied ? "text-emerald-400" : "text-slate-400",
      bgColor: copied ? "hover:bg-emerald-500/10" : "hover:bg-slate-500/10",
      action: async () => {
        try {
          await navigator.clipboard.writeText(shareUrl);
          setCopied(true);
          toast.success("Link copied to clipboard!");
          setTimeout(() => setCopied(false), 2000);
          setShowDropdown(false);
        } catch {
          toast.error("Failed to copy link");
        }
      },
    },
  ];

  return (
    <div className={`relative ${className}`} ref={buttonRef}>
      <motion.button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-2 px-3 py-2.5 bg-slate-700/50 hover:bg-slate-700 text-white rounded-xl font-medium transition-all duration-200 border border-slate-600/50 hover:border-slate-500/50 hover:shadow-lg hover:shadow-slate-500/10"
        whileTap={{ scale: 0.95 }}
      >
        <Share className="h-4 w-4" />
        <span className="hidden sm:inline">Share</span>
      </motion.button>

      <AnimatePresence>
        {showDropdown && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 z-10"
              onClick={() => setShowDropdown(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />

            {/* Dropdown - Smart Positioning */}
            <motion.div
              className={`absolute w-64 bg-slate-800/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl shadow-slate-900/50 z-20 overflow-hidden ${
                dropdownPosition === "up"
                  ? "bottom-full right- mb-2"
                  : "top-full right-0 mt-2"
              }`}
              initial={{
                opacity: 0,
                y: dropdownPosition === "up" ? 10 : -10,
                scale: 0.95,
              }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{
                opacity: 0,
                y: dropdownPosition === "up" ? 10 : -10,
                scale: 0.95,
              }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              {/* Caret/Arrow - Dynamic positioning */}
              <div
                className={`absolute w-4 h-4 bg-slate-800/95 border-r border-b border-slate-700/50 rotate-45 z-30 ${
                  dropdownPosition === "up"
                    ? "-bottom-2 right-6"
                    : "-top-2 right-6"
                }`}
              ></div>

              {/* Header */}
              <div className="p-4 border-b border-slate-700/50">
                <h3 className="text-white font-semibold text-sm">
                  Share Campaign
                </h3>
                <p className="text-slate-400 text-xs mt-1 line-clamp-2">
                  {campaign.name}
                </p>
              </div>

              {/* Share Options */}
              <div className="p-2">
                {shareOptions.map((option, index) => (
                  <motion.button
                    key={option.name}
                    onClick={option.action}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 text-left group ${option.bgColor}`}
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <div
                      className={`p-2 rounded-lg bg-slate-700/50 group-hover:bg-slate-700/70 transition-colors`}
                    >
                      <option.icon className={`w-4 h-4 ${option.color}`} />
                    </div>
                    <div className="flex-1">
                      <span className="text-white font-medium text-sm">
                        {option.name}
                      </span>
                      {option.name === "Copy Link" && copied && (
                        <span className="text-emerald-400 text-xs ml-2">
                          Copied!
                        </span>
                      )}
                    </div>
                  </motion.button>
                ))}
              </div>

              {/* Quick Stats */}
              <div className="p-3 bg-slate-900/30 border-t border-slate-700/50">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Budget: {campaign.budget} cUSD</span>
                  <span>
                    {campaign.selectedInfluencersCount}/
                    {campaign.maxInfluencers} spots
                  </span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ShareCampaignButton;
