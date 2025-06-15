import {
  Brief,
  CampaignStatus,
  CampaignStatusInfo,
  CampaignTimingInfo,
  CampaignProgressInfo,
  CampaignPhase,
  Application,
  ApplicationInfo,
  ProofStatus,
  PaymentStatus,
  PHASE_LABELS,
} from "@/types";

/**
 * Computes enhanced status information for a campaign
 */
export function computeCampaignStatusInfo(
  brief: Brief,
  currentTime: number = Date.now() / 1000
): CampaignStatusInfo {
  const timingInfo = computeCampaignTimingInfo(brief, currentTime);

  let canApply = false;
  let canSelect = false;
  let canSubmitProof = false;
  let canComplete = false;
  let canCancel = false;
  let nextAction: string | undefined;
  let warning: string | undefined;

  switch (brief.status) {
    case CampaignStatus.OPEN:
      canApply =
        !timingInfo.hasExpired && currentTime <= brief.selectionDeadline;
      canSelect = true;
      canCancel = brief.selectedInfluencersCount === 0;

      if (timingInfo.isUrgent) {
        warning = "Application deadline approaching!";
        nextAction = "Applications close soon";
      } else if (brief.selectedInfluencersCount === 0) {
        nextAction = "Waiting for applications";
      } else if (brief.selectedInfluencersCount < brief.maxInfluencers) {
        nextAction = "Select more influencers";
      } else {
        nextAction = "All spots filled";
      }
      break;

    case CampaignStatus.ASSIGNED:
      canSubmitProof =
        currentTime >= brief.promotionStartTime &&
        currentTime <= brief.proofSubmissionDeadline;
      canComplete = currentTime >= brief.proofSubmissionDeadline;

      if (timingInfo.phase === CampaignPhase.PREPARATION) {
        nextAction = "Campaign starts soon";
      } else if (timingInfo.phase === CampaignPhase.PROMOTION) {
        nextAction = "Campaign active - influencers promoting";
      } else if (timingInfo.phase === CampaignPhase.PROOF_SUBMISSION) {
        nextAction = "Awaiting proof submissions";
        if (timingInfo.isUrgent) {
          warning = "Proof submission deadline approaching!";
        }
      } else if (timingInfo.phase === CampaignPhase.VERIFICATION) {
        nextAction = "Review and release funds";
        warning = "Auto-approval will trigger soon";
      }
      break;

    case CampaignStatus.COMPLETED:
      nextAction = "Campaign completed";
      break;

    case CampaignStatus.CANCELLED:
      nextAction = "Campaign was cancelled";
      break;

    case CampaignStatus.EXPIRED:
      nextAction = "Campaign expired";
      break;
  }

  return {
    status: brief.status,
    statusLabel: getStatusLabel(brief.status),
    isActive:
      brief.status === CampaignStatus.OPEN ||
      brief.status === CampaignStatus.ASSIGNED,
    canApply,
    canSelect,
    canSubmitProof,
    canComplete,
    canCancel,
    nextAction,
    warning,
  };
}

/**
 * Computes enhanced timing information for a campaign
 */
export function computeCampaignTimingInfo(
  brief: Brief,
  currentTime: number = Date.now() / 1000
): CampaignTimingInfo {
  const timeSinceCreation = currentTime - brief.creationTime;
  const isNew = timeSinceCreation <= 24 * 60 * 60; // 24 hours

  let phase: CampaignPhase;
  let currentDeadline: number | undefined;
  let currentDeadlineLabel: string | undefined;
  let nextPhase: CampaignPhase | undefined;
  let nextPhaseTime: number | undefined;

  // Determine current phase
  if (brief.status === CampaignStatus.CANCELLED) {
    phase = CampaignPhase.CANCELLED;
  } else if (brief.status === CampaignStatus.EXPIRED) {
    phase = CampaignPhase.EXPIRED;
  } else if (brief.status === CampaignStatus.COMPLETED) {
    phase = CampaignPhase.COMPLETED;
  } else if (
    currentTime <= brief.selectionDeadline &&
    brief.status === CampaignStatus.OPEN
  ) {
    phase = CampaignPhase.SELECTION;
    currentDeadline = brief.selectionDeadline;
    currentDeadlineLabel = "Application deadline";
    nextPhase = CampaignPhase.PREPARATION;
    nextPhaseTime = brief.promotionStartTime;
  } else if (currentTime < brief.promotionStartTime) {
    phase = CampaignPhase.PREPARATION;
    currentDeadline = brief.promotionStartTime;
    currentDeadlineLabel = "Campaign starts";
    nextPhase = CampaignPhase.PROMOTION;
    nextPhaseTime = brief.promotionStartTime;
  } else if (currentTime <= brief.promotionEndTime) {
    phase = CampaignPhase.PROMOTION;
    currentDeadline = brief.promotionEndTime;
    currentDeadlineLabel = "Campaign ends";
    nextPhase = CampaignPhase.PROOF_SUBMISSION;
    nextPhaseTime = brief.promotionEndTime;
  } else if (currentTime <= brief.proofSubmissionDeadline) {
    phase = CampaignPhase.PROOF_SUBMISSION;
    currentDeadline = brief.proofSubmissionDeadline;
    currentDeadlineLabel = "Proof submission deadline";
    nextPhase = CampaignPhase.VERIFICATION;
    nextPhaseTime = brief.proofSubmissionDeadline;
  } else if (currentTime <= brief.verificationDeadline) {
    phase = CampaignPhase.VERIFICATION;
    currentDeadline = brief.verificationDeadline;
    currentDeadlineLabel = "Auto-approval deadline";
    nextPhase = CampaignPhase.COMPLETED;
    nextPhaseTime = brief.verificationDeadline;
  } else {
    phase = CampaignPhase.COMPLETED;
  }

  // Calculate time remaining for current deadline
  let timeRemaining:
    | { days: number; hours: number; minutes: number; totalSeconds: number }
    | undefined;
  let isUrgent = false;
  let hasExpired = false;

  if (currentDeadline) {
    const secondsLeft = currentDeadline - currentTime;

    if (secondsLeft <= 0) {
      hasExpired = true;
      timeRemaining = { days: 0, hours: 0, minutes: 0, totalSeconds: 0 };
    } else {
      isUrgent = secondsLeft <= 24 * 60 * 60; // 24 hours
      const days = Math.floor(secondsLeft / (24 * 60 * 60));
      const hours = Math.floor((secondsLeft % (24 * 60 * 60)) / (60 * 60));
      const minutes = Math.floor((secondsLeft % (60 * 60)) / 60);

      timeRemaining = { days, hours, minutes, totalSeconds: secondsLeft };
    }
  }

  return {
    isNew,
    isUrgent,
    hasExpired,
    phase,
    currentDeadline,
    currentDeadlineLabel,
    timeRemaining,
    nextPhase,
    nextPhaseTime,
  };
}

/**
 * Computes progress information for a campaign
 */
export function computeCampaignProgressInfo(
  brief: Brief
): CampaignProgressInfo {
  const spotsFilledPercentage =
    brief.maxInfluencers > 0
      ? Math.round(
          (brief.selectedInfluencersCount / brief.maxInfluencers) * 100
        )
      : 0;

  const budgetPerSpot =
    brief.maxInfluencers > 0 ? brief.budget / brief.maxInfluencers : 0;

  const remainingSpots = Math.max(
    0,
    brief.maxInfluencers - brief.selectedInfluencersCount
  );
  const isFullyBooked = brief.selectedInfluencersCount >= brief.maxInfluencers;

  return {
    spotsFilledPercentage,
    applicationsCount: brief.applicationCount,
    budgetPerSpot,
    remainingSpots,
    isFullyBooked,
  };
}

/**
 * Computes application information for an influencer
 */
export function computeApplicationInfo(
  application: Application,
  brief: Brief,
  currentTime: number = Date.now() / 1000
): ApplicationInfo {
  const briefStatus = computeCampaignStatusInfo(brief, currentTime);
  const briefTiming = computeCampaignTimingInfo(brief, currentTime);

  let proofStatus: ProofStatus;
  let paymentStatus: PaymentStatus;
  let canSubmitProof = false;
  let canClaim = false;
  let nextAction: string | undefined;
  let warning: string | undefined;

  // Determine proof status
  if (!application.isSelected) {
    proofStatus = ProofStatus.NOT_REQUIRED;
  } else if (!application.proofLink) {
    proofStatus = ProofStatus.PENDING;
    if (briefTiming.phase === CampaignPhase.PROMOTION) {
      canSubmitProof = true;
      nextAction = "Submit proof when campaign is active";
    } else if (briefTiming.phase === CampaignPhase.PROOF_SUBMISSION) {
      canSubmitProof = true;
      nextAction = "Submit proof of work";
      if (briefTiming.isUrgent) {
        warning = "Proof submission deadline approaching!";
      }
    }
  } else if (application.disputeStatus === 3) {
    // RESOLVED_INVALID
    proofStatus = ProofStatus.REJECTED;
  } else if (application.isApproved) {
    proofStatus = ProofStatus.APPROVED;
  } else {
    proofStatus = ProofStatus.SUBMITTED;
    nextAction = "Awaiting proof review";
  }

  // Determine payment status
  if (!application.isSelected || proofStatus === ProofStatus.REJECTED) {
    paymentStatus = PaymentStatus.NOT_EARNED;
  } else if (!application.isApproved) {
    paymentStatus = PaymentStatus.PENDING_APPROVAL;
  } else if (!application.hasClaimed) {
    paymentStatus = PaymentStatus.READY_TO_CLAIM;
    canClaim = true;
    if (!nextAction) {
      nextAction = "Claim your payment";
    }
  } else {
    paymentStatus = PaymentStatus.CLAIMED;
    if (!nextAction) {
      nextAction = "Payment claimed";
    }
  }

  return {
    canSubmitProof,
    canClaim,
    proofStatus,
    paymentStatus,
    nextAction,
    warning,
  };
}

/**
 * Gets a human-readable status label
 */
export function getStatusLabel(status: CampaignStatus): string {
  switch (status) {
    case CampaignStatus.OPEN:
      return "Open for Applications";
    case CampaignStatus.ASSIGNED:
      return "In Progress";
    case CampaignStatus.COMPLETED:
      return "Completed";
    case CampaignStatus.CANCELLED:
      return "Cancelled";
    case CampaignStatus.EXPIRED:
      return "Expired";
    default:
      return "Unknown";
  }
}

/**
 * Gets phase label
 */
export function getPhaseLabel(phase: CampaignPhase): string {
  return PHASE_LABELS[phase] || "Unknown";
}

/**
 * Formats time remaining in a human-readable way
 */
export function formatTimeRemaining(timeRemaining: {
  days: number;
  hours: number;
  minutes: number;
}): string {
  if (timeRemaining.days > 0) {
    return `${timeRemaining.days}d ${timeRemaining.hours}h`;
  } else if (timeRemaining.hours > 0) {
    return `${timeRemaining.hours}h ${timeRemaining.minutes}m`;
  } else {
    return `${timeRemaining.minutes}m`;
  }
}

/**
 * Gets appropriate color class for campaign status
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
 * Gets appropriate color class for campaign phase
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
 * Gets appropriate color for proof status
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
 * Gets appropriate color for payment status
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
 * Determines if action is urgent (needs immediate attention)
 */
export function isActionUrgent(brief: Brief): boolean {
  const timingInfo = computeCampaignTimingInfo(brief);
  const statusInfo = computeCampaignStatusInfo(brief);

  return (
    timingInfo.isUrgent ||
    statusInfo.warning !== undefined ||
    (timingInfo.phase === CampaignPhase.VERIFICATION &&
      timingInfo.timeRemaining !== undefined &&
      timingInfo.timeRemaining.days <= 1)
  );
}
/**
 * Gets priority level for campaign actions
 */
export function getActionPriority(brief: Brief): "high" | "medium" | "low" {
  if (isActionUrgent(brief)) {
    return "high";
  }

  const timingInfo = computeCampaignTimingInfo(brief);
  if (timingInfo.timeRemaining && timingInfo.timeRemaining.days <= 3) {
    return "medium";
  }

  return "low";
}
