
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

class NeynarClientService {
  // Client-side method - only makes HTTP requests to our API
  async getUserByVerifiedAddress(
    address: string
  ): Promise<FarcasterProfile | null> {
    try {
      const response = await fetch(
        `/api/farcaster/profile/${address}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          console.log("No Farcaster profile found for address:", address);
          return null;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.profile;
    } catch (error) {
      console.error("Error fetching user by verified address:", error);
      return null;
    }
  }

  async getUserByFid(fid: number): Promise<FarcasterProfile | null> {
    try {
      const response = await fetch(
        `/api/farcaster/profile/fid/${fid}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          console.log("No Farcaster profile found for FID:", fid);
          return null;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.profile;
    } catch (error) {
      console.error("Error fetching user by FID:", error);
      return null;
    }
  }

  async storeFidMapping(address: string, fid: number): Promise<void> {
    try {
      localStorage.setItem(`fid_${address}`, fid.toString());
    } catch (error) {
      console.warn("Failed to store FID mapping:", error);
    }
  }

  async getFidByAddress(address: string): Promise<number | null> {
    try {
      const stored = localStorage.getItem(`fid_${address}`);
      return stored ? parseInt(stored) : null;
    } catch (error) {
      console.warn("Failed to get FID mapping:", error);
      return null;
    }
  }
}

export const neynarClientService = new NeynarClientService();