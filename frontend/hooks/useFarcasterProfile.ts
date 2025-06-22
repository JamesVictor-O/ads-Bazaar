
import { useState, useEffect } from "react";
import { neynarClientService, FarcasterProfile } from "@/lib/neynar-client";

export function useFarcasterProfile(fid: number | null, address?: string) {
  const [profile, setProfile] = useState<FarcasterProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFromCache, setIsFromCache] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      // If no FID provided, try to get it from localStorage using address
      let actualFid = fid;
      
      if (!actualFid && address) {
        try {
          const storedFid = localStorage.getItem(`fid_${address}`);
          if (storedFid) {
            actualFid = parseInt(storedFid);
            console.log(`Retrieved FID ${actualFid} from localStorage for address ${address}`);
          }
        } catch (error) {
          console.warn("Failed to get FID from localStorage:", error);
        }
      }

      if (!actualFid) {
        console.log("No FID provided and no stored FID found");
        setProfile(null);
        setError(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      setIsFromCache(false);

      try {
        // Check cache first
        const cacheKey = `profile_fid_${actualFid}`;
        try {
          const cachedProfile = localStorage.getItem(cacheKey);
          if (cachedProfile) {
            const parsed = JSON.parse(cachedProfile);
            console.log(`Using cached profile for FID ${actualFid}`);
            setProfile(parsed);
            setIsFromCache(true);
            setIsLoading(false);
            
            // Background refresh
            setTimeout(async () => {
              try {
                console.log(`Background refresh for FID ${actualFid}`);
                const apiResult = await neynarClientService.getUserByFid(actualFid);
                if (apiResult) {
                  setProfile(apiResult);
                  setIsFromCache(false);
                  localStorage.setItem(cacheKey, JSON.stringify(apiResult));
                  
                  // Also store FID mapping if we have an address
                  if (address) {
                    localStorage.setItem(`fid_${address}`, actualFid.toString());
                  }
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

        // Fetch from API
        console.log(`Fetching profile for FID: ${actualFid}`);
        const result = await neynarClientService.getUserByFid(actualFid);

        if (result) {
          setProfile(result);
          // Cache the profile
          localStorage.setItem(cacheKey, JSON.stringify(result));
          
          // Store FID mapping if we have an address
          if (address) {
            localStorage.setItem(`fid_${address}`, actualFid.toString());
          }
        } else {
          setError("Profile not found");
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to fetch profile";
        console.error("Profile fetch error:", errorMessage);
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [fid, address]);

  // Method to refresh profile data
  const refreshProfile = async () => {
    let actualFid = fid;
    
    if (!actualFid && address) {
      const storedFid = localStorage.getItem(`fid_${address}`);
      if (storedFid) {
        actualFid = parseInt(storedFid);
      }
    }

    if (!actualFid) return;
    
    setIsLoading(true);
    setError(null);

    try {
      const result = await neynarClientService.getUserByFid(actualFid);
      if (result) {
        setProfile(result);
        localStorage.setItem(`profile_fid_${actualFid}`, JSON.stringify(result));
        if (address) {
          localStorage.setItem(`fid_${address}`, actualFid.toString());
        }
      } else {
        setError("Profile not found");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to refresh profile";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return { 
    profile, 
    isLoading, 
    error, 
    isFromCache,
    refreshProfile,
    fid: fid || (address ? parseInt(localStorage.getItem(`fid_${address}`) || "0") : null)
  };
}

// Helper hook to get FID from address
export function useFidFromAddress(address: string) {
  const [fid, setFid] = useState<number | null>(null);
  
  useEffect(() => {
    if (address) {
      try {
        const storedFid = localStorage.getItem(`fid_${address}`);
        if (storedFid) {
          setFid(parseInt(storedFid));
        }
      } catch (error) {
        console.warn("Failed to get FID from address:", error);
      }
    }
  }, [address]);

  return fid;
}