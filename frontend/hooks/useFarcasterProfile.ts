import { useState, useEffect } from "react";
import { neynarService, FarcasterProfile } from "@/lib/neynar";

export function useFarcasterProfile(address: string, fid?: number) {
  const [profile, setProfile] = useState<FarcasterProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      setError(null);

      try {
        let result: FarcasterProfile | null = null;

        // Try FID first if available
        if (fid) {
          result = await neynarService.getUserByFid(fid);
        }

        // Fallback to address lookup
        if (!result && address) {
          result = await neynarService.getUserByVerifiedAddress(address);
          // Store the FID mapping for future use
          if (result?.fid) {
            await neynarService.storeFidMapping(address, result.fid);
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
