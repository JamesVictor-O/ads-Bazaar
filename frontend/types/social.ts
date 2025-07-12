export interface SocialMediaProfile {
  instagram?: string;
  twitter?: string;
  tiktok?: string;
  youtube?: string;
  facebook?: string;
  linkedin?: string;
  twitch?: string;
  snapchat?: string;
  farcaster?: string;
}

export interface InfluencerProfileData {
  userType: "influencer";
  niche?: string;
  bio?: string;
  socialMedia?: SocialMediaProfile;
}

export type SocialPlatform = keyof SocialMediaProfile;

export interface SocialMediaLink {
  platform: SocialPlatform;
  username: string;
  url: string;
  icon: string;
  color: string;
}