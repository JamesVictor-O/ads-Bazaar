import { Hex } from "viem";
export interface Brief {
  id: `0x${string}`;
  business: `0x${string}`;
  name: string;
  description: string;
  requirements: string;
  budget: number;
  status: number; // CampaignStatus: 0=Open, 1=Assigned, 2=Completed, 3=Cancelled, 4=Expired
  promotionDuration: number;
  promotionStartTime: number;
  promotionEndTime: number;
  proofSubmissionDeadline: number;
  verificationDeadline: number;
  maxInfluencers: number;
  selectedInfluencersCount: number;
  targetAudience: number; // TargetAudience: 0=General, ..., 13=Other
  creationTime: number;
  selectionDeadline: number;
  applicationCount: number;
}

export interface FormattedBriefData {
  id: `0x${string}`;
  business: `0x${string}`;
  name: string;
  description: string;
  requirements: string;
  budget: number;
  status: number; // CampaignStatus enum
  promotionDuration: number;
  promotionStartTime: number;
  promotionEndTime: number;
  proofSubmissionDeadline: number;
  verificationDeadline: number;
  maxInfluencers: number;
  selectedInfluencersCount: number;
  targetAudience: number; // TargetAudience enum
  creationTime: number;
  selectionDeadline: number; // Correct deadline field from contract
  applicationCount: number;
}

export interface BriefData {
  business: `0x${string}`;
  name: string;
  description: string;
  budget: bigint;
  status: number;
  promotionDuration: bigint;
  promotionStartTime: bigint;
  promotionEndTime: bigint;
  proofSubmissionDeadline: bigint;
  verificationDeadline: bigint;
  maxInfluencers: bigint;
  selectedInfluencersCount: bigint;
  targetAudience: number;
  selectionDeadline: bigint;
}

export interface Brief extends FormattedBriefData {}

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

export enum CampaignStatus {
  OPEN = 0,
  ASSIGNED = 1,
  COMPLETED = 2,
  CANCELLED = 3,
  EXPIRED = 4,
}

export interface FormData {
  name: string;
  description: string;
  budget: string;
  applicationDeadline: string;
  promotionDuration: string;
  maxInfluencers: string;
  targetAudience: string;
  verificationPeriod: string;
}

export interface Campaign {
  id: number;
  title: string;
  brand: string;
  budget: number;
  deadline: string;
  tasks: Task[];
  paymentStatus: string;
  contractAddress: string;
}

export interface Task {
  name: string;
  status: string;
  postLink?: string;
}

export interface ApplicationData {
  influencer: string;
  message: string;
  timestamp: string;
  isSelected: boolean;
  hasClaimed: boolean;
  proofLink: string;
  isApproved: boolean;
}

export interface UserProfile {
  isRegistered: boolean;
  isBusiness: boolean;
  isInfluencer: boolean;
  status: number;
  profileData: string;
  completedCampaigns: number;
  totalEscrowed: number;
}

export interface InfluencerDashboardData {
  appliedBriefs: Array<{
    briefId: string;
    brief: any;
    application: Application;
  }>;
  assignedBriefs: Array<{
    briefId: string;
    brief: any;
    application: Application;
  }>;
  isLoading: boolean;
  error: string | null;
}

export interface ApplicationsModalProps {
  selectedBrief: Brief | null;
  applications: Application[];
  isLoadingApplications: boolean;
  onClose: () => void;
}

export interface SubmissionsModalProps {
  selectedBrief: Brief | null;
  applications: Application[];
  isLoadingApplications: boolean;
  isCompletingCampaign: boolean;
  onReleaseFunds: (briefId: `0x${string}`) => void;
  onClose: () => void;
}

export interface Transaction {
  id: string;
  type: "payment" | "application" | "submission";
  amount: number;
  from: string;
  to?: string;
  date: string;
  txHash: string;
  status: "pending" | "confirmed" | "failed";
  description?: string;
}

export type EthereumAddress = `0x${string}`;
export type TransactionHash = `0x${string}`;

// Constants
export const STATUS_LABELS = {
  [CampaignStatus.OPEN]: "Open",
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
