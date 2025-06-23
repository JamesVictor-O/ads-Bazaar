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
  custodyAddress?: string;
  verifiedAddresses?: string[];
}

type NeynarAccount = {
  platform?: string;
  username: string;
};

type NeynarUser = {
  fid: number;
  username: string;
  display_name?: string;
  displayName?: string;
  bio?: string;
  profile?: { bio?: { text?: string } };
  pfp_url?: string;
  pfp?: { url?: string };
  pfpUrl?: string;
  follower_count?: number;
  followerCount?: number;
  following_count?: number;
  followingCount?: number;
  custody_address?: string;
  custodyAddress?: string;
  verified_accounts?: NeynarAccount[];
  verified_addresses?: { eth_addresses?: string[] };
  verifications?: string[];
  verifiedAddresses?: string[];
  user?: NeynarUser;
};

class NeynarServerService {
  private client: NeynarAPIClient;
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.NEYNAR_API_KEY || "";

    if (!this.apiKey) {
      console.warn(
        "Neynar API key not found. Set NEYNAR_API_KEY environment variable."
      );
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
      console.log(`Fetching user by FID: ${fid}`);
      const response = await this.client.fetchBulkUsers({ fids: [fid] });

      if (!response.users || response.users.length === 0) {
        console.log(`No user found for FID: ${fid}`);
        return null;
      }

      const user = response.users[0];
      console.log("FID API response structure:", JSON.stringify(user, null, 2));
      if (
        user &&
        typeof user === "object" &&
        !Array.isArray(user) &&
        "fid" in user
      ) {
        return this.formatUserProfile(user as NeynarUser);
      }
      return null;
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
      console.log(`Fetching user by verified address: ${address}`);
      const response = await this.client.fetchBulkUsersByEthOrSolAddress({
        addresses: [address],
      });

      console.log(
        "Address API full response:",
        JSON.stringify(response, null, 2)
      );

      // The response structure for address lookup is different
      // It can be either response.users[0] or response[address] or another structure
      let user = null;

      // Try different possible response structures
      if (response.users && response.users.length > 0) {
        user = response.users[0];
        console.log("Found user in response.users[0]");
      } else if (response[address]) {
        user = response[address];
        console.log("Found user in response[address]");
      } else if (
        response.result &&
        !Array.isArray(response.result) &&
        (response.result as { user: NeynarUser }).user
      ) {
        user = (response.result as { user: NeynarUser }).user;
        console.log("Found user in response.result.user");
      } else if (response.user) {
        user = response.user;
        console.log("Found user in response.user");
      } else {
        // Look for any user object in the response
        const keys = Object.keys(response);
        for (const key of keys) {
          if (response[key] && typeof response[key] === "object") {
            if (
              Array.isArray(response[key]) &&
              response[key].length > 0 &&
              (response[key][0] as NeynarUser).fid
            ) {
              user = response[key][0];
              console.log(`Found user in response.${key}[0]`);
              break;
            } else if (
              !Array.isArray(response[key]) &&
              (response[key] as NeynarUser).fid
            ) {
              user = response[key];
              console.log(`Found user in response.${key}`);
              break;
            }
          }
        }
      }

      if (!user) {
        console.log(`No user found for address: ${address}`);
        console.log("Available response keys:", Object.keys(response));
        return null;
      }

      console.log("Address API user data:", JSON.stringify(user, null, 2));
      if (
        user &&
        typeof user === "object" &&
        !Array.isArray(user) &&
        "fid" in user
      ) {
        return this.formatUserProfile(user as NeynarUser);
      }
      return null;
    } catch (error) {
      console.error("Error fetching user by verified address:", error);
      return null;
    }
  }

  private formatUserProfile(user: NeynarUser): FarcasterProfile {
    console.log("Formatting user profile from:", JSON.stringify(user, null, 2));

    // Handle different field naming conventions
    const fid = user.fid;
    const username = user.username;
    const displayName = user.display_name || user.displayName || user.username;
    const bio = user.profile?.bio?.text || user.bio || "";
    const pfpUrl = user.pfp_url || user.pfp?.url || user.pfpUrl || "";
    const followerCount = user.follower_count || user.followerCount || 0;
    const followingCount = user.following_count || user.followingCount || 0;
    const custodyAddress = user.custody_address || user.custodyAddress;

    // Extract X/Twitter username from verified_accounts
    const twitterAccount = user.verified_accounts?.find(
      (account: NeynarAccount) =>
        account.platform === "x" || account.platform === "twitter"
    );

    // Extract verified Ethereum addresses - handle different structures
    let verifiedAddresses: string[] = [];
    if (user.verified_addresses?.eth_addresses) {
      verifiedAddresses = user.verified_addresses.eth_addresses;
    } else if (user.verifications) {
      verifiedAddresses = user.verifications;
    } else if (user.verifiedAddresses) {
      verifiedAddresses = user.verifiedAddresses;
    }

    const profile = {
      fid,
      username,
      displayName,
      bio,
      pfpUrl,
      followerCount,
      followingCount,
      twitterUsername: twitterAccount?.username,
      isVerified: verifiedAddresses.length > 0,
      custodyAddress,
      verifiedAddresses,
    };

    console.log("Formatted profile:", JSON.stringify(profile, null, 2));
    return profile;
  }
}

export const neynarServerService = new NeynarServerService();
