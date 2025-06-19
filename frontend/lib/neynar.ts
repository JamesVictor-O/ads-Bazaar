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

  constructor() {
    const config = new Configuration({
      apiKey: process.env.NEYNAR_API_KEY || "",
    });
    this.client = new NeynarAPIClient(config);
  }

  // Server-side method for API route
  async getUserByVerifiedAddressServer(
    address: string
  ): Promise<FarcasterProfile | null> {
    try {
      const response = await this.client.fetchUserByVerification(address);
      return this.formatUserProfile(response.result.user);
    } catch (error) {
      console.error("Error fetching user by verified address:", error);
      return null;
    }
  }

  // Client-side method
  async getUserByVerifiedAddress(
    address: string
  ): Promise<FarcasterProfile | null> {
    try {
      const response = await fetch(
        `/api/farcaster/profile/${address}?type=address`
      );
      if (!response.ok) return null;
      const data = await response.json();
      return data.profile;
    } catch (error) {
      console.error("Error fetching user by verified address:", error);
      return null;
    }
  }

  private formatUserProfile(user: any): FarcasterProfile {
    const twitterAccount = user.connectedAccounts?.find(
      (account: any) =>
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
