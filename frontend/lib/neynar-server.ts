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

class NeynarServerService {
  private client: NeynarAPIClient;
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.NEYNAR_API_KEY || "";
    
    if (!this.apiKey) {
      console.warn("Neynar API key not found. Set NEYNAR_API_KEY environment variable.");
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

  async getUserByVerifiedAddress(
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

export const neynarServerService = new NeynarServerService();