// frontend/hooks/useFarcasterProfile.ts
import { useState, useEffect } from "react";
import { neynarClientService, FarcasterProfile } from "@/lib/neynar-client";

export function useFarcasterProfile(address: string, fid?: number) {
  const [profile, setProfile] = useState<FarcasterProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!address && !fid) {
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        let result: FarcasterProfile | null = null;

        // Check localStorage first for recently connected profiles
        if (address) {
          try {
            const cachedProfile = localStorage.getItem(`profile_${address}`);
            if (cachedProfile) {
              const parsed = JSON.parse(cachedProfile);
              // Use cached profile temporarily
              setProfile(parsed);
              setIsLoading(false);
              
              // Still fetch from API in background to get updated stats
              setTimeout(async () => {
                try {
                  const apiResult = await neynarClientService.getUserByVerifiedAddress(address);
                  if (apiResult) {
                    setProfile(apiResult);
                    // Update cache with fresh data
                    localStorage.setItem(`profile_${address}`, JSON.stringify(apiResult));
                  }
                } catch (error) {
                  console.log("Background refresh failed, keeping cached profile");
                }
              }, 100);
              return;
            }
          } catch (error) {
            console.warn("Failed to read cached profile:", error);
          }
        }

        // Try FID first if available
        if (fid) {
          result = await neynarClientService.getUserByFid(fid);
        }

        // Fallback to address lookup
        if (!result && address) {
          result = await neynarClientService.getUserByVerifiedAddress(address);
          // Store the FID mapping for future use
          if (result?.fid) {
            await neynarClientService.storeFidMapping(address, result.fid);
          }
        }

        setProfile(result);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch profile"
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [address, fid]);

  return { profile, isLoading, error };
}