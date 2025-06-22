
import { NeynarAPIClient, Configuration } from "@neynar/nodejs-sdk";

export interface FarcasterProfile {
  fid: number;
  username: string;
  displayName: string;
  bio: string;
  pfpUrl: string;
  followerCount: number;
  followingCount: number;
  twitterUsername?: string;
  isVerified: boolean;
}

class NeynarService {
  private client: NeynarAPIClient;
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.NEYNAR_API_KEY || process.env.NEXT_PUBLIC_NEYNAR_API_KEY || "";
    
    if (!this.apiKey) {
      console.warn("Neynar API key not found. Set NEYNAR_API_KEY or NEXT_PUBLIC_NEYNAR_API_KEY environment variable.");
    }

    const config = new Configuration({
      apiKey: this.apiKey,
    });
    this.client = new NeynarAPIClient(config);
  }

  async getUserByFid(fid: number): Promise<FarcasterProfile | null> {
    if (!this.apiKey) {
      console.error("Neynar API key not configured");
      return null;
    }

    try {
      const response = await this.client.fetchBulkUsers({ fids: [fid] });
      return this.formatUserProfile(response.users[0]);
    } catch (error) {
      console.error("Error fetching user by FID:", error);
      return null;
    }
  }

  // Server-side method for API route
  async getUserByVerifiedAddressServer(
    address: string
  ): Promise<FarcasterProfile | null> {
    if (!this.apiKey) {
      console.error("Neynar API key not configured");
      return null;
    }

    try {
      const response = await this.client.fetchBulkUsersByEthOrSolAddress({ addresses: [address] });
      return this.formatUserProfile(response.users[0]);
    } catch (error) {
      console.error("Error fetching user by verified address:", error);
      return null;
    }
  }

  async storeFidMapping(address: string, fid: number): Promise<void> {
    // Check if we're in browser environment
    if (typeof window !== 'undefined') {
      localStorage.setItem(`fid_${address}`, fid.toString());
    }
  }

  async getFidByAddress(address: string): Promise<number | null> {
    // Check if we're in browser environment
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(`fid_${address}`);
      return stored ? parseInt(stored) : null;
    }
    return null;
  }

  // Client-side method
  async getUserByVerifiedAddress(
    address: string
  ): Promise<FarcasterProfile | null> {
    try {
      const response = await fetch(
        `/api/farcaster/profile/${address}?type=address`
      );
      if (!response.ok) {
        if (response.status === 404) {
          console.log("No Farcaster profile found for address:", address);
          return null;
        }
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      return data.profile;
    } catch (error) {
      console.error("Error fetching user by verified address:", error);
      return null;
    }
  }

  private formatUserProfile(user: {
    fid: number;
    username: string;
    displayName?: string;
    profile?: { bio?: { text?: string } };
    pfp?: { url?: string };
    followerCount?: number;
    followingCount?: number;
    connectedAccounts?: Array<{
      platform: string;
      username: string;
    }>;
    verifiedAddresses?: {
      ethAddresses?: string[];
    };
  }): FarcasterProfile {
    const twitterAccount = user.connectedAccounts?.find(
      (account) =>
        account.platform === "twitter" || account.platform === "x"
    );

    return {
      fid: user.fid,
      username: user.username,
      displayName: user.displayName || user.username,
      bio: user.profile?.bio?.text || "",
      pfpUrl: user.pfp?.url || "",
      followerCount: user.followerCount || 0,
      followingCount: user.followingCount || 0,
      twitterUsername: twitterAccount?.username,
      isVerified: (user.verifiedAddresses?.ethAddresses?.length || 0) > 0,
    };
  }
}

export const neynarService = new NeynarService();