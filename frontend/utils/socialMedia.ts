import { SocialPlatform, SocialMediaProfile, SocialMediaLink } from "@/types/social";

// Social media platform configurations
export const SOCIAL_PLATFORMS: Record<SocialPlatform, {
  name: string;
  baseUrl: string;
  icon: string;
  color: string;
  placeholder: string;
}> = {
  instagram: {
    name: "Instagram",
    baseUrl: "https://instagram.com/",
    icon: "Instagram",
    color: "text-pink-500",
    placeholder: "username"
  },
  twitter: {
    name: "Twitter/X",
    baseUrl: "https://twitter.com/",
    icon: "Twitter",
    color: "text-blue-400",
    placeholder: "username"
  },
  tiktok: {
    name: "TikTok",
    baseUrl: "https://tiktok.com/@",
    icon: "Music",
    color: "text-red-500",
    placeholder: "username"
  },
  youtube: {
    name: "YouTube",
    baseUrl: "https://youtube.com/@",
    icon: "Play",
    color: "text-red-600",
    placeholder: "channelname"
  },
  facebook: {
    name: "Facebook",
    baseUrl: "https://facebook.com/",
    icon: "Facebook",
    color: "text-blue-600",
    placeholder: "username"
  },
  linkedin: {
    name: "LinkedIn",
    baseUrl: "https://linkedin.com/in/",
    icon: "Linkedin",
    color: "text-blue-700",
    placeholder: "username"
  },
  twitch: {
    name: "Twitch",
    baseUrl: "https://twitch.tv/",
    icon: "Twitch",
    color: "text-purple-500",
    placeholder: "username"
  },
  snapchat: {
    name: "Snapchat",
    baseUrl: "https://snapchat.com/add/",
    icon: "Camera",
    color: "text-yellow-400",
    placeholder: "username"
  },
  farcaster: {
    name: "Farcaster",
    baseUrl: "https://warpcast.com/",
    icon: "MessageSquare",
    color: "text-purple-400",
    placeholder: "username"
  }
};

// Generate full URL for a social media platform
export function generateSocialUrl(platform: SocialPlatform, username: string): string {
  if (!username.trim()) return "";
  
  const config = SOCIAL_PLATFORMS[platform];
  const cleanUsername = username.replace(/^@/, ""); // Remove @ if present
  
  return `${config.baseUrl}${cleanUsername}`;
}

// Parse profile data and extract social media info
export function parseSocialMediaFromProfile(profileData: string): SocialMediaProfile {
  try {
    const parsed = JSON.parse(profileData);
    return parsed.socialMedia || {};
  } catch {
    return {};
  }
}

// Update profile data with social media info
export function updateProfileWithSocialMedia(
  currentProfileData: string,
  socialMedia: SocialMediaProfile
): string {
  try {
    const parsed = JSON.parse(currentProfileData || "{}");
    return JSON.stringify({
      ...parsed,
      socialMedia: {
        ...parsed.socialMedia,
        ...socialMedia
      }
    });
  } catch {
    return JSON.stringify({
      userType: "influencer",
      socialMedia
    });
  }
}

// Convert social media profile to links array
export function getSocialMediaLinks(socialMedia: SocialMediaProfile): SocialMediaLink[] {
  return Object.entries(socialMedia)
    .filter(([_, username]) => username && username.trim() !== "")
    .map(([platform, username]) => {
      const config = SOCIAL_PLATFORMS[platform as SocialPlatform];
      return {
        platform: platform as SocialPlatform,
        username: username!,
        url: generateSocialUrl(platform as SocialPlatform, username!),
        icon: config.icon,
        color: config.color
      };
    });
}

// Validate username for a platform
export function validateUsername(platform: SocialPlatform, username: string): {
  isValid: boolean;
  error?: string;
} {
  if (!username.trim()) {
    return { isValid: false, error: "Username cannot be empty" };
  }

  const cleanUsername = username.replace(/^@/, "");
  
  // Basic validation rules
  if (cleanUsername.length < 1) {
    return { isValid: false, error: "Username too short" };
  }
  
  if (cleanUsername.length > 50) {
    return { isValid: false, error: "Username too long" };
  }

  // Platform-specific validation
  const invalidChars = /[^a-zA-Z0-9._-]/;
  if (invalidChars.test(cleanUsername)) {
    return { isValid: false, error: "Username contains invalid characters" };
  }

  return { isValid: true };
}