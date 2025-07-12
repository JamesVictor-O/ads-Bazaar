"use client";

import { useGetUsername } from "@/hooks/adsBazaar";

interface UserDisplayProps {
  address: string;
  className?: string;
  showFullAddress?: boolean;
  maxUsernameLength?: number;
}

export function UserDisplay({ 
  address, 
  className = "", 
  showFullAddress = false,
  maxUsernameLength = 20 
}: UserDisplayProps) {
  const { username, isLoadingUsername } = useGetUsername(address as `0x${string}`);

  const formatAddress = (addr: string) => {
    if (showFullAddress) return addr;
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const truncateUsername = (username: string) => {
    if (username.length <= maxUsernameLength) return username;
    return `${username.slice(0, maxUsernameLength - 3)}...`;
  };

  if (isLoadingUsername) {
    return (
      <span className={`animate-pulse bg-slate-700 rounded px-2 py-1 ${className}`}>
        Loading...
      </span>
    );
  }

  if (username && username.trim() !== "") {
    return (
      <span className={className} title={`@${username} (${address})`}>
        @{truncateUsername(username)}
      </span>
    );
  }

  // Fallback to address if no username
  return (
    <span className={`font-mono ${className}`} title={address}>
      {formatAddress(address)}
    </span>
  );
}