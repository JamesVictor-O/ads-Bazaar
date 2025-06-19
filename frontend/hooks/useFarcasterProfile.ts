import { useState, useEffect } from "react";
import { neynarService, FarcasterProfile } from "@/lib/neynar";

export function useFarcasterProfile(address?: string) {
  const [profile, setProfile] = useState<FarcasterProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!address) return;

    const fetchProfile = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await neynarService.getUserByVerifiedAddress(address);
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
  }, [address]);

  return { profile, isLoading, error };
}
