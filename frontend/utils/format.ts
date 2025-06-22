import {
  CampaignStatus,
  CampaignPhase,
  TargetAudience,
  ProofStatus,
  PaymentStatus,
  AUDIENCE_LABELS,
  STATUS_LABELS,
  PHASE_LABELS,
  USER_STATUS_LABELS,
  UserStatus,
} from "@/types";

/**
 * Truncates an Ethereum address for display
 */
export function truncateAddress(
  address?: string,
  startLength: number = 6,
  endLength: number = 4
): string {
  if (!address) return "";
  if (address.length <= startLength + endLength) return address;

  return `${address.slice(0, startLength)}...${address.slice(-endLength)}`;
}

/**
 * Converts wei amount to decimal format (18 decimals for cUSD)
 */
export function fromWei(weiAmount: number | string, decimals: number = 18): number {
  const divisor = Math.pow(10, decimals);
  const amount = typeof weiAmount === 'string' ? parseFloat(weiAmount) : weiAmount;
  return amount / divisor;
}

/**
 * Smart currency formatting that adapts based on the amount
 */
export function formatCurrency(
  amount: number,
  currency: string = "cUSD",
  decimals?: number
): string {
  // If decimals is explicitly provided, use it
  if (decimals !== undefined) {
    return `${amount.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })} ${currency}`;
  }

  // Handle zero and negative amounts
  if (amount === 0) {
    return `0 ${currency}`;
  }
  
  if (amount < 0) {
    return `-${formatCurrency(Math.abs(amount), currency)}`;
  }

  // Smart formatting based on amount size
  if (amount >= 1000000) {
    // For millions and above, use compact notation
    return `${(amount / 1000000).toLocaleString(undefined, {
      minimumFractionDigits: 1,
      maximumFractionDigits: 2,
    })}M ${currency}`;
  } else if (amount >= 100000) {
    // For 100K+, show as whole numbers with K notation
    return `${(amount / 1000).toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}K ${currency}`;
  } else if (amount >= 10000) {
    // For 10K+, show with 1 decimal place and K notation
    return `${(amount / 1000).toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
    })}K ${currency}`;
  } else if (amount >= 1000) {
    // For 1K+, show with up to 2 decimal places and K notation
    return `${(amount / 1000).toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}K ${currency}`;
  } else if (amount >= 100) {
    // For 100+, show as whole numbers
    return `${amount.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })} ${currency}`;
  } else if (amount >= 1) {
    // For amounts >= 1, show up to 2 decimal places
    return `${amount.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })} ${currency}`;
  } else if (amount >= 0.01) {
    // For small amounts, show up to 4 decimal places
    return `${amount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    })} ${currency}`;
  } else {
    // For very small amounts, show more precision
    return `${amount.toLocaleString(undefined, {
      minimumFractionDigits: 6,
      maximumFractionDigits: 8,
    })} ${currency}`;
  }
}

/**
 * Formats currency values with proper localization (legacy version for compatibility)
 */
export function formatCurrencyLegacy(
  amount: number,
  currency: string = "cUSD",
  decimals: number = 2
): string {
  return `${amount.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })} ${currency}`;
}

/**
 * Formats duration in seconds to human-readable string
 */
export function formatDuration(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days > 0) {
    return `${days} day${days !== 1 ? "s" : ""}`;
  } else if (hours > 0) {
    return `${hours} hour${hours !== 1 ? "s" : ""}`;
  } else {
    return `${minutes} minute${minutes !== 1 ? "s" : ""}`;
  }
}

/**
 * Calculates time remaining from a deadline
 */
export function getTimeRemaining(deadline: number) {
  const now = Math.floor(Date.now() / 1000); // Current time in seconds
  const timeLeft = deadline - now;

  if (timeLeft <= 0) {
    return {
      isExpired: true,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      totalSeconds: 0,
    };
  }

  const days = Math.floor(timeLeft / 86400);
  const hours = Math.floor((timeLeft % 86400) / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  const seconds = Math.floor(timeLeft % 60);

  return {
    isExpired: false,
    days,
    hours,
    minutes,
    seconds,
    totalSeconds: timeLeft,
  };
}

/**
 * Formats time remaining in a concise, human-readable way
 */
export function formatTimeRemaining(timeRemaining: {
  days: number;
  hours: number;
  minutes: number;
  totalSeconds: number;
}): string {
  if (timeRemaining.totalSeconds <= 0) {
    return "Expired";
  }

  if (timeRemaining.days > 7) {
    return `${timeRemaining.days} days`;
  } else if (timeRemaining.days > 0) {
    return `${timeRemaining.days}d ${timeRemaining.hours}h`;
  } else if (timeRemaining.hours > 0) {
    return `${timeRemaining.hours}h ${timeRemaining.minutes}m`;
  } else if (timeRemaining.minutes > 0) {
    return `${timeRemaining.minutes}m`;
  } else {
    return "< 1m";
  }
}

/**
 * Formats Unix timestamp to human-readable date
 */
export function formatTimestamp(
  timestamp: number,
  includeTime: boolean = false
): string {
  const date = new Date(timestamp * 1000);

  if (includeTime) {
    return date.toLocaleString();
  }

  return date.toLocaleDateString();
}

/**
 * Calculates percentage of spots filled
 */
export function calculateSpotsFilled(selected: number, max: number): number {
  if (max === 0) return 0;
  return Math.round((selected / max) * 100);
}

/**
 * Determines if a campaign deadline is urgent (within 24 hours)
 */
export function isCampaignUrgent(deadline: number): boolean {
  const now = Date.now() / 1000;
  const timeLeft = deadline - now;
  const twentyFourHours = 24 * 60 * 60; // 24 hours in seconds

  return timeLeft > 0 && timeLeft <= twentyFourHours;
}

/**
 * Determines if a campaign is new (created within last 24 hours)
 */
export function isCampaignNew(creationTime: number): boolean {
  const now = Date.now() / 1000;
  const timeSinceCreation = now - creationTime;
  const twentyFourHours = 24 * 60 * 60; // 24 hours in seconds

  return timeSinceCreation <= twentyFourHours;
}

/**
 * Formats large numbers with appropriate suffixes (K, M, B)
 */
export function formatNumber(num: number, decimals: number = 1): string {
  if (num < 1000) return num.toString();

  const suffixes = ["", "K", "M", "B", "T"];
  const suffixNum = Math.floor(Math.log10(Math.abs(num)) / 3);
  const shortNum = num / Math.pow(1000, suffixNum);

  return shortNum.toFixed(decimals) + suffixes[suffixNum];
}

/**
 * Gets appropriate color classes for campaign status
 */
export function getStatusColor(status: CampaignStatus): string {
  switch (status) {
    case CampaignStatus.OPEN:
      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    case CampaignStatus.ASSIGNED:
      return "bg-blue-500/10 text-blue-400 border-blue-500/20";
    case CampaignStatus.COMPLETED:
      return "bg-green-500/10 text-green-400 border-green-500/20";
    case CampaignStatus.CANCELLED:
      return "bg-red-500/10 text-red-400 border-red-500/20";
    case CampaignStatus.EXPIRED:
      return "bg-orange-500/10 text-orange-400 border-orange-500/20";
    default:
      return "bg-slate-500/10 text-slate-400 border-slate-500/20";
  }
}

/**
 * Gets appropriate color classes for campaign phase
 */
export function getPhaseColor(phase: CampaignPhase): string {
  switch (phase) {
    case CampaignPhase.SELECTION:
      return "bg-purple-500/10 text-purple-400 border-purple-500/20";
    case CampaignPhase.PREPARATION:
      return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
    case CampaignPhase.PROMOTION:
      return "bg-blue-500/10 text-blue-400 border-blue-500/20";
    case CampaignPhase.PROOF_SUBMISSION:
      return "bg-orange-500/10 text-orange-400 border-orange-500/20";
    case CampaignPhase.VERIFICATION:
      return "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";
    case CampaignPhase.COMPLETED:
      return "bg-green-500/10 text-green-400 border-green-500/20";
    case CampaignPhase.EXPIRED:
      return "bg-red-500/10 text-red-400 border-red-500/20";
    case CampaignPhase.CANCELLED:
      return "bg-red-500/10 text-red-400 border-red-500/20";
    default:
      return "bg-slate-500/10 text-slate-400 border-slate-500/20";
  }
}

/**
 * Gets appropriate color classes for target audience category
 */
export function getCategoryColor(category: string): string {
  switch (category.toLowerCase()) {
    case "tech":
      return "bg-blue-500/10 text-blue-400 border-blue-500/20";
    case "fashion":
      return "bg-purple-500/10 text-purple-400 border-purple-500/20";
    case "food":
      return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    case "fitness":
      return "bg-red-500/10 text-red-400 border-red-500/20";
    case "travel":
      return "bg-green-500/10 text-green-400 border-green-500/20";
    case "gaming":
      return "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";
    case "beauty":
      return "bg-pink-500/10 text-pink-400 border-pink-500/20";
    case "business":
      return "bg-slate-500/10 text-slate-400 border-slate-500/20";
    case "education":
      return "bg-cyan-500/10 text-cyan-400 border-cyan-500/20";
    case "entertainment":
      return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
    case "sports":
      return "bg-orange-500/10 text-orange-400 border-orange-500/20";
    case "lifestyle":
      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    default:
      return "bg-slate-500/10 text-slate-400 border-slate-500/20";
  }
}

/**
 * Gets appropriate color classes for proof status
 */
export function getProofStatusColor(status: ProofStatus): string {
  switch (status) {
    case ProofStatus.NOT_REQUIRED:
      return "bg-slate-500/10 text-slate-400 border-slate-500/20";
    case ProofStatus.PENDING:
      return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
    case ProofStatus.SUBMITTED:
      return "bg-blue-500/10 text-blue-400 border-blue-500/20";
    case ProofStatus.APPROVED:
      return "bg-green-500/10 text-green-400 border-green-500/20";
    case ProofStatus.REJECTED:
      return "bg-red-500/10 text-red-400 border-red-500/20";
    default:
      return "bg-slate-500/10 text-slate-400 border-slate-500/20";
  }
}

/**
 * Gets appropriate color classes for payment status
 */
export function getPaymentStatusColor(status: PaymentStatus): string {
  switch (status) {
    case PaymentStatus.NOT_EARNED:
      return "bg-slate-500/10 text-slate-400 border-slate-500/20";
    case PaymentStatus.PENDING_APPROVAL:
      return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
    case PaymentStatus.READY_TO_CLAIM:
      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    case PaymentStatus.CLAIMED:
      return "bg-green-500/10 text-green-400 border-green-500/20";
    default:
      return "bg-slate-500/10 text-slate-400 border-slate-500/20";
  }
}

/**
 * Gets appropriate color classes for user status
 */
export function getUserStatusColor(status: UserStatus): string {
  switch (status) {
    case UserStatus.NEW_COMER:
      return "bg-slate-500/10 text-slate-400 border-slate-500/20";
    case UserStatus.RISING:
      return "bg-blue-500/10 text-blue-400 border-blue-500/20";
    case UserStatus.POPULAR:
      return "bg-purple-500/10 text-purple-400 border-purple-500/20";
    case UserStatus.ELITE:
      return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    case UserStatus.SUPERSTAR:
      return "bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-yellow-500/20";
    default:
      return "bg-slate-500/10 text-slate-400 border-slate-500/20";
  }
}

/**
 * Gets priority level styling
 */
export function getPriorityColor(priority: "high" | "medium" | "low"): string {
  switch (priority) {
    case "high":
      return "bg-red-500/10 text-red-400 border-red-500/20";
    case "medium":
      return "bg-orange-500/10 text-orange-400 border-orange-500/20";
    case "low":
      return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
    default:
      return "bg-slate-500/10 text-slate-400 border-slate-500/20";
  }
}

/**
 * Validates an Ethereum address
 */
export function isValidEthereumAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Safely parses a JSON string with fallback
 */
export function safeJsonParse<T>(jsonString: string, fallback: T): T {
  try {
    return JSON.parse(jsonString);
  } catch {
    return fallback;
  }
}

/**
 * Converts campaign status number to human-readable label
 */
export function getStatusLabel(status: CampaignStatus): string {
  return STATUS_LABELS[status] || "Unknown";
}

/**
 * Converts target audience number to human-readable label
 */
export function getAudienceLabel(audience: TargetAudience): string {
  return AUDIENCE_LABELS[audience] || "Other";
}

/**
 * Converts campaign phase to human-readable label
 */
export function getPhaseLabel(phase: CampaignPhase): string {
  return PHASE_LABELS[phase] || "Unknown";
}

/**
 * Converts user status to human-readable label
 */
export function getUserStatusLabel(status: UserStatus): string {
  return USER_STATUS_LABELS[status] || "Unknown";
}

/**
 * Converts proof status to human-readable label
 */
export function getProofStatusLabel(status: ProofStatus): string {
  return status
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (l) => l.toUpperCase());
}

/**
 * Converts payment status to human-readable label
 */
export function getPaymentStatusLabel(status: PaymentStatus): string {
  return status
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (l) => l.toUpperCase());
}

/**
 * Formats a relative time (e.g., "2 days ago", "in 3 hours")
 */
export function formatRelativeTime(timestamp: number): string {
  const now = Date.now() / 1000;
  const diff = timestamp - now;
  const absDiff = Math.abs(diff);

  const intervals = [
    { label: "year", seconds: 31536000 },
    { label: "month", seconds: 2592000 },
    { label: "week", seconds: 604800 },
    { label: "day", seconds: 86400 },
    { label: "hour", seconds: 3600 },
    { label: "minute", seconds: 60 },
  ];

  for (const interval of intervals) {
    const count = Math.floor(absDiff / interval.seconds);
    if (count > 0) {
      const suffix = count === 1 ? "" : "s";
      if (diff > 0) {
        return `in ${count} ${interval.label}${suffix}`;
      } else {
        return `${count} ${interval.label}${suffix} ago`;
      }
    }
  }

  return diff > 0 ? "in a moment" : "just now";
}

/**
 * Calculates completion percentage for campaigns
 */
export function calculateCompletionPercentage(
  selectedInfluencers: number,
  maxInfluencers: number
): number {
  if (maxInfluencers === 0) return 0;
  return Math.min(
    Math.round((selectedInfluencers / maxInfluencers) * 100),
    100
  );
}

/**
 * Formats bytes to human-readable size
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

/**
 * Generates a deterministic color from a string (useful for avatars, categories)
 */
export function stringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  const hue = hash % 360;
  return `hsl(${hue}, 70%, 50%)`;
}

/**
 * Debounce function for search inputs
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Clamps a number between min and max values
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Formats percentage with proper display
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

export function getDisputeStatusColor(status: string): string {
  switch (status) {
    case "FLAGGED":
      return "bg-amber-500/20 text-amber-400 border-amber-500/30";
    case "RESOLVED_VALID":
      return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
    case "RESOLVED_INVALID":
      return "bg-red-500/20 text-red-400 border-red-500/30";
    case "EXPIRED":
      return "bg-slate-500/20 text-slate-400 border-slate-500/30";
    default:
      return "bg-slate-500/20 text-slate-400 border-slate-500/30";
  }
}