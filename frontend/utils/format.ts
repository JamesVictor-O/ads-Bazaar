export function truncateAddress(
  address?: string,
  startLength: number = 6,
  endLength: number = 4
): string {
  if (!address) return "";
  if (address.length <= startLength + endLength) return address;

  return `${address.slice(0, startLength)}...${address.slice(-endLength)}`;
}

export function formatCurrency(
  amount: number,
  currency: string = "cUSD",
  decimals: number = 2
): string {
  return `${amount.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })} ${currency}`;
}

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

export function getTimeRemaining(deadline: number) {
  const now = Date.now() / 1000; // Current time in seconds
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

export function calculateSpotsFilled(selected: number, max: number): number {
  if (max === 0) return 0;
  return Math.round((selected / max) * 100);
}

/**
 * Determines if a campaign is urgent (deadline within 24 hours)
 * @param deadline - Deadline timestamp in seconds
 * @returns Boolean indicating if campaign is urgent
 */
export function isCampaignUrgent(deadline: number): boolean {
  const now = Date.now() / 1000;
  const timeLeft = deadline - now;
  const twentyFourHours = 24 * 60 * 60; // 24 hours in seconds

  return timeLeft > 0 && timeLeft <= twentyFourHours;
}

/**
 * Determines if a campaign is new (created within last 24 hours)
 * @param creationTime - Creation timestamp in seconds
 * @returns Boolean indicating if campaign is new
 */
export function isCampaignNew(creationTime: number): boolean {
  const now = Date.now() / 1000;
  const timeSinceCreation = now - creationTime;
  const twentyFourHours = 24 * 60 * 60; // 24 hours in seconds

  return timeSinceCreation <= twentyFourHours;
}

/**
 * Formats a large number with appropriate suffixes (K, M, B)
 * @param num - The number to format
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted number string
 */
export function formatNumber(num: number, decimals: number = 1): string {
  if (num < 1000) return num.toString();

  const suffixes = ["", "K", "M", "B", "T"];
  const suffixNum = Math.floor(Math.log10(Math.abs(num)) / 3);
  const shortNum = num / Math.pow(1000, suffixNum);

  return shortNum.toFixed(decimals) + suffixes[suffixNum];
}

/**
 * Gets the appropriate color class for a campaign status
 * @param status - Campaign status number
 * @returns Tailwind CSS color classes
 */
export function getStatusColor(status: number): string {
  switch (status) {
    case 0: // OPEN
      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    case 1: // ASSIGNED/IN_PROGRESS
      return "bg-blue-500/10 text-blue-400 border-blue-500/20";
    case 2: // COMPLETED
      return "bg-green-500/10 text-green-400 border-green-500/20";
    case 3: // CANCELLED
      return "bg-red-500/10 text-red-400 border-red-500/20";
    case 4: // EXPIRED
      return "bg-orange-500/10 text-orange-400 border-orange-500/20";
    default:
      return "bg-slate-500/10 text-slate-400 border-slate-500/20";
  }
}

/**
 * Gets the appropriate color class for a target audience category
 * @param category - Category name
 * @returns Tailwind CSS color classes
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
 * Validates an Ethereum address
 * @param address - Address to validate
 * @returns Boolean indicating if address is valid
 */
export function isValidEthereumAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Safely parses a JSON string
 * @param jsonString - JSON string to parse
 * @param fallback - Fallback value if parsing fails
 * @returns Parsed object or fallback
 */
export function safeJsonParse<T>(jsonString: string, fallback: T): T {
  try {
    return JSON.parse(jsonString);
  } catch {
    return fallback;
  }
}
