// frontend/lib/neynar-client.ts
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

class NeynarClientService {
  // Client-side method - only makes HTTP requests to our API
  async getUserByVerifiedAddress(
    address: string
  ): Promise<FarcasterProfile | null> {
    try {
      console.log(`Client: Fetching profile for address: ${address}`);
      
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
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(`HTTP ${response.status}: ${errorData.error || response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.success || !data.profile) {
        console.log("Invalid response format or no profile data");
        return null;
      }

      console.log("Client: Successfully fetched profile:", {
        fid: data.profile.fid,
        username: data.profile.username,
        twitterUsername: data.profile.twitterUsername
      });

      return data.profile;
    } catch (error) {
      console.error("Client: Error fetching user by verified address:", error);
      return null;
    }
  }

  async getUserByFid(fid: number): Promise<FarcasterProfile | null> {
    try {
      console.log(`Client: Fetching profile for FID: ${fid}`);
      
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
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(`HTTP ${response.status}: ${errorData.error || response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.success || !data.profile) {
        console.log("Invalid response format or no profile data");
        return null;
      }

      console.log("Client: Successfully fetched profile:", {
        fid: data.profile.fid,
        username: data.profile.username,
        twitterUsername: data.profile.twitterUsername
      });

      return data.profile;
    } catch (error) {
      console.error("Client: Error fetching user by FID:", error);
      return null;
    }
  }

  async storeFidMapping(address: string, fid: number): Promise<void> {
    try {
      localStorage.setItem(`fid_${address}`, fid.toString());
      console.log(`Stored FID mapping: ${address} -> ${fid}`);
    } catch (error) {
      console.warn("Failed to store FID mapping:", error);
    }
  }

  async getFidByAddress(address: string): Promise<number | null> {
    try {
      const stored = localStorage.getItem(`fid_${address}`);
      const fid = stored ? parseInt(stored) : null;
      if (fid) {
        console.log(`Retrieved FID mapping: ${address} -> ${fid}`);
      }
      return fid;
    } catch (error) {
      console.warn("Failed to get FID mapping:", error);
      return null;
    }
  }

  // Method to test the API connection
  async testConnection(): Promise<boolean> {
    try {
      // Test with a known FID (Dan Romero - FID 3)
      const profile = await this.getUserByFid(3);
      return profile !== null;
    } catch (error) {
      console.error("API connection test failed:", error);
      return false;
    }
  }
}

export const neynarClientService = new NeynarClientService();