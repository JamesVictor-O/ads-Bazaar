
import { Hex } from "viem";

export interface Brief {
  title: string;
  id: Hex;
  name: string;
  description: string;
  budget: string;
  applicationDeadline: string;
  promotionDuration: string;
  maxInfluencers: string;
  targetAudience: string;
  verificationPeriod: string;
  status: string;
  promotionStartTime?: string;
  promotionEndTime?: string;
  verificationDeadline?: string;
}

export interface Application {
  influencer: Hex;
  message: string;
  timestamp: number;
  isSelected: boolean;
  isApproved?: boolean;
  proofLink?: string;
  influencerProfile?: {
    avatar?: string;
    name?: string;
    // Add other fields as needed
  };
   hasClaimed?: boolean;
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


export interface BriefData {
  business: string;
  name: string;
  description: string;
  budget: string;
  status: number;
  applicationDeadline: string;
  promotionDuration: string;
  promotionStartTime: string;
  promotionEndTime: string;
  maxInfluencers: string;
  selectedInfluencersCount: string;
  targetAudience: number;
  verificationDeadline: string;
}

export  interface ApplicationData {
  influencer: string;
  message: string;
  timestamp: string;
  isSelected: boolean;
  hasClaimed: boolean;
  proofLink: string;
  isApproved: boolean;
}

export interface InfluencerDashboardData {
  appliedBriefs: {
    briefId: string;
    brief: BriefData;
    application: ApplicationData | null;
  }[];
  assignedBriefs: {
    briefId: string;
    brief: BriefData;
    application: ApplicationData;
  }[];
  isLoading: boolean;
  error: string | null;
}

export interface ApplicationsModalProps {
  selectedBrief: Brief | null;
  applications: Application[];
  isLoadingApplications: boolean;
  onClose: () => void;
}
export type Transaction = {
    id: string;
    type: string;
    amount: number;
    from: string;
    date: string;
    txHash: string;
    status: string;
  };

