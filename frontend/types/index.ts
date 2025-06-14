import { Hex } from "viem";

export interface Application {
  influencer: `0x${string}`;
  message: string;
  timestamp: number;
  isSelected: boolean;
  hasClaimed: boolean;
  proofLink: string;
  isApproved: boolean;
  disputeStatus?: number;
  disputeReason?: string;
  resolvedBy?: `0x${string}`;
  influencerProfile?: {
    name?: string;
    avatar?: string;
  };
  isFlagged: boolean;
}

export enum CampaignStatus {
  OPEN = 0,
  ASSIGNED = 1,
  COMPLETED = 2,
  CANCELLED = 3,
  EXPIRED = 4,
}

export enum TargetAudience {
  GENERAL = 0,
  FASHION = 1,
  TECH = 2,
  GAMING = 3,
  FITNESS = 4,
  BEAUTY = 5,
  FOOD = 6,
  TRAVEL = 7,
  BUSINESS = 8,
  EDUCATION = 9,
  ENTERTAINMENT = 10,
  SPORTS = 11,
  LIFESTYLE = 12,
  OTHER = 13,
}

export enum DisputeStatus {
  NONE = 0,
  FLAGGED = 1,
  RESOLVED_VALID = 2,
  RESOLVED_INVALID = 3,
}

export enum UserStatus {
  NEW_COMER = 0,
  RISING = 1,
  POPULAR = 2,
  ELITE = 3,
  SUPERSTAR = 4,
}

// Raw contract data structure (as returned from blockchain)
export interface RawBriefData {
  briefId: `0x${string}`;
  business: `0x${string}`;
  name: string;
  description: string;
  requirements: string;
  budget: bigint;
  status: CampaignStatus;
  promotionDuration: bigint;
  promotionStartTime: bigint;
  promotionEndTime: bigint;
  proofSubmissionDeadline: bigint;
  verificationDeadline: bigint;
  maxInfluencers: bigint;
  selectedInfluencersCount: bigint;
  targetAudience: TargetAudience;
  creationTime: bigint;
  selectionDeadline: bigint;
}

// Formatted brief data for frontend use
export interface Brief {
  id: `0x${string}`;
  business: `0x${string}`;
  name: string;
  description: string;
  requirements: string;
  budget: number; // Converted from bigint to number
  status: CampaignStatus;
  promotionDuration: number; // In seconds
  promotionStartTime: number; // Unix timestamp
  promotionEndTime: number; // Unix timestamp
  proofSubmissionDeadline: number; // Unix timestamp
  verificationDeadline: number; // Unix timestamp
  maxInfluencers: number;
  selectedInfluencersCount: number;
  targetAudience: TargetAudience;
  creationTime: number; // Unix timestamp
  selectionDeadline: number; // Unix timestamp
  applicationCount: number;

  // Computed properties for better UX
  statusInfo: CampaignStatusInfo;
  timingInfo: CampaignTimingInfo;
  progressInfo: CampaignProgressInfo;
}

// Enhanced status information
export interface CampaignStatusInfo {
  status: CampaignStatus;
  statusLabel: string;
  isActive: boolean;
  canApply: boolean;
  canSelect: boolean;
  canSubmitProof: boolean;
  canComplete: boolean;
  canCancel: boolean;
  nextAction?: string;
  warning?: string;
}

// Enhanced timing information
export interface CampaignTimingInfo {
  isNew: boolean; // Created within last 24 hours
  isUrgent: boolean; // Deadline within 24 hours
  hasExpired: boolean;
  phase: CampaignPhase;
  currentDeadline?: number;
  currentDeadlineLabel?: string;
  timeRemaining?: {
    days: number;
    hours: number;
    minutes: number;
    totalSeconds: number;
  };
  nextPhase?: CampaignPhase;
  nextPhaseTime?: number;
}

export enum CampaignPhase {
  SELECTION = "selection", // Before selectionDeadline
  PREPARATION = "preparation", // After selection, before promotionStartTime
  PROMOTION = "promotion", // Between promotionStartTime and promotionEndTime
  PROOF_SUBMISSION = "proof_submission", // Between promotionEndTime and proofSubmissionDeadline
  VERIFICATION = "verification", // Between proofSubmissionDeadline and verificationDeadline
  COMPLETED = "completed", // After verificationDeadline or manually completed
  EXPIRED = "expired", // Expired at any stage
  CANCELLED = "cancelled", // Manually cancelled
}

// Progress tracking
export interface CampaignProgressInfo {
  spotsFilledPercentage: number;
  applicationsCount: number;
  budgetPerSpot: number;
  remainingSpots: number;
  isFullyBooked: boolean;
}

// Application data structure


export interface ApplicationInfo {
  canSubmitProof: boolean;
  canClaim: boolean;
  proofStatus: ProofStatus;
  paymentStatus: PaymentStatus;
  nextAction?: string;
  warning?: string;
}

export enum ProofStatus {
  NOT_REQUIRED = "not_required", // Not selected yet
  PENDING = "pending", // Selected but no proof submitted
  SUBMITTED = "submitted", // Proof submitted, awaiting approval
  APPROVED = "approved", // Proof approved
  REJECTED = "rejected", // Proof rejected/disputed
}

export enum PaymentStatus {
  NOT_EARNED = "not_earned", // Not eligible for payment
  PENDING_APPROVAL = "pending_approval", // Waiting for proof approval
  READY_TO_CLAIM = "ready_to_claim", // Can claim payment
  CLAIMED = "claimed", // Payment claimed
}

// User profile
export interface UserProfile {
  isRegistered: boolean;
  isBusiness: boolean;
  isInfluencer: boolean;
  status: UserStatus;
  profileData: string;
  completedCampaigns: number;
  totalEscrowed: number;
}

// Dashboard data structures
export interface InfluencerDashboardData {
  appliedBriefs: Array<{
    briefId: string;
    brief: Brief;
    application: Application;
  }>;
  assignedBriefs: Array<{
    briefId: string;
    brief: Brief;
    application: Application;
  }>;
  isLoading: boolean;
  error: string | null;
}

export interface BrandDashboardData {
  activeCampaigns: Brief[];
  completedCampaigns: Brief[];
  totalBudget: number;
  totalInfluencers: number;
  pendingActions: Array<{
    campaignId: string;
    action: string;
    priority: "high" | "medium" | "low";
    dueDate?: number;
  }>;
}

// Transaction types
export interface Transaction {
  id: string;
  type: "payment" | "application" | "submission" | "creation" | "cancellation";
  amount: number;
  from: string;
  to?: string;
  date: string;
  txHash: string;
  status: "pending" | "confirmed" | "failed";
  description?: string;
  briefId?: string;
  briefName?: string;
}

// Form data
export interface CreateCampaignFormData {
  name: string;
  description: string;
  requirements: string;
  budget: string;
  promotionDuration: string; // In seconds
  maxInfluencers: string;
  targetAudience: string;
}

// Modal props
export interface ApplicationsModalProps {
  selectedBrief: Brief | null;
  applications: Application[];
  isLoadingApplications: boolean;
  onClose: () => void;
  onSelectInfluencer?: (briefId: string, applicationIndex: number) => void;
}

export interface SubmissionsModalProps {
  selectedBrief: Brief | null;
  applications: Application[];
  isLoadingApplications: boolean;
  isCompletingCampaign: boolean;
  onReleaseFunds: (briefId: `0x${string}`) => void;
  onClose: () => void;
}

// Utility types
export type EthereumAddress = `0x${string}`;
export type TransactionHash = `0x${string}`;
export type Bytes32 = `0x${string}`;

// Constants
export const STATUS_LABELS = {
  [CampaignStatus.OPEN]: "Open for Applications",
  [CampaignStatus.ASSIGNED]: "In Progress",
  [CampaignStatus.COMPLETED]: "Completed",
  [CampaignStatus.CANCELLED]: "Cancelled",
  [CampaignStatus.EXPIRED]: "Expired",
} as const;

export const AUDIENCE_LABELS = {
  [TargetAudience.GENERAL]: "General",
  [TargetAudience.FASHION]: "Fashion",
  [TargetAudience.TECH]: "Tech",
  [TargetAudience.GAMING]: "Gaming",
  [TargetAudience.FITNESS]: "Fitness",
  [TargetAudience.BEAUTY]: "Beauty",
  [TargetAudience.FOOD]: "Food",
  [TargetAudience.TRAVEL]: "Travel",
  [TargetAudience.BUSINESS]: "Business",
  [TargetAudience.EDUCATION]: "Education",
  [TargetAudience.ENTERTAINMENT]: "Entertainment",
  [TargetAudience.SPORTS]: "Sports",
  [TargetAudience.LIFESTYLE]: "Lifestyle",
  [TargetAudience.OTHER]: "Other",
} as const;

export const PHASE_LABELS = {
  [CampaignPhase.SELECTION]: "Selecting Influencers",
  [CampaignPhase.PREPARATION]: "Preparing Campaign",
  [CampaignPhase.PROMOTION]: "Active Promotion",
  [CampaignPhase.PROOF_SUBMISSION]: "Awaiting Submissions",
  [CampaignPhase.VERIFICATION]: "Reviewing Submissions",
  [CampaignPhase.COMPLETED]: "Completed",
  [CampaignPhase.EXPIRED]: "Expired",
  [CampaignPhase.CANCELLED]: "Cancelled",
} as const;

export const USER_STATUS_LABELS = {
  [UserStatus.NEW_COMER]: "Newcomer",
  [UserStatus.RISING]: "Rising Star",
  [UserStatus.POPULAR]: "Popular",
  [UserStatus.ELITE]: "Elite",
  [UserStatus.SUPERSTAR]: "Superstar",
} as const;
