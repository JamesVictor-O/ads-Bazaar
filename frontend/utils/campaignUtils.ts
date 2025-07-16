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
  DisputeStatus,
} from "@/types";

/**
 * Enhanced status computation with expiration logic
 */
export function computeCampaignStatusInfo(
  brief: Brief,
  currentTime: number = Date.now() / 1000
): CampaignStatusInfo {
  const timingInfo = computeCampaignTimingInfo(brief, currentTime);
  const expirationInfo = canExpireCampaign(brief, currentTime);
  const decisionInfo = isCampaignAwaitingDecision(brief, currentTime);

  let canApply = false;
  let canSelect = false;
  let canSubmitProof = false;
  let canComplete = false;
  let canCancel = false;
  let canExpire = false;
  let nextAction: string | undefined;
  let warning: string | undefined;

  switch (brief.status) {
    case CampaignStatus.OPEN:
      // Normal application logic
      canApply = !timingInfo.hasExpired && currentTime <= brief.selectionDeadline;
      canSelect = currentTime <= brief.selectionDeadline + (1 * 60 * 60); // Grace period
      canCancel = brief.selectedInfluencersCount === 0;
      canExpire = expirationInfo.canExpire;

      // Handle campaigns past deadline with selected influencers
      if (decisionInfo.isAwaitingDecision) {
        warning = `Action required: ${decisionInfo.reason}`;
        
        if (expirationInfo.canExpire) {
          nextAction = "Decision required - start campaign or cancel with compensation";
        } else if (expirationInfo.timeUntilExpirable) {
          const timeRemaining = getTimeRemaining(Math.floor(Date.now() / 1000) + expirationInfo.timeUntilExpirable);
          const formattedTime = formatTimeRemaining(timeRemaining);
          nextAction = `Decision deadline in ${formattedTime} - start campaign or cancel with compensation`;
        }
      } else if (currentTime > brief.selectionDeadline) {
        // Past deadline but no influencers selected
        if (expirationInfo.canExpire) {
          nextAction = "Campaign can be closed - no influencers were selected";
          warning = "Application deadline passed";
        } else {
          nextAction = "Limited time to close campaign - no influencers selected";
          warning = "Application deadline passed";
        }
      } else if (timingInfo.isUrgent) {
        warning = "Application deadline approaching soon";
        if (brief.selectedInfluencersCount === 0) {
          nextAction = "No applications received yet";
        } else if (brief.selectedInfluencersCount < brief.maxInfluencers) {
          nextAction = `${brief.selectedInfluencersCount}/${brief.maxInfluencers} influencers selected - ${brief.maxInfluencers - brief.selectedInfluencersCount} spots remaining`;
        }
      } else {
        // Normal open campaign logic
        if (brief.selectedInfluencersCount === 0) {
          nextAction = "Accepting applications from influencers";
        } else if (brief.selectedInfluencersCount < brief.maxInfluencers) {
          nextAction = `${brief.selectedInfluencersCount}/${brief.maxInfluencers} influencers selected - ${brief.maxInfluencers - brief.selectedInfluencersCount} spots remaining`;
        } else {
          nextAction = "All positions filled - campaign ready to start";
        }
      }
      break;

    case CampaignStatus.ASSIGNED:
      canSubmitProof = currentTime >= brief.promotionStartTime && 
                       currentTime <= brief.proofSubmissionDeadline;
      canComplete = currentTime >= brief.proofSubmissionDeadline;

      if (timingInfo.phase === CampaignPhase.PREPARATION) {
        nextAction = "Campaign starting soon - influencers preparing content";
      } else if (timingInfo.phase === CampaignPhase.PROMOTION) {
        nextAction = "Campaign live - influencers creating and posting content";
      } else if (timingInfo.phase === CampaignPhase.PROOF_SUBMISSION) {
        nextAction = "Waiting for influencers to submit their posts";
        if (timingInfo.isUrgent) {
          warning = "Submission deadline approaching soon";
        }
      } else if (timingInfo.phase === CampaignPhase.VERIFICATION) {
        nextAction = "Review influencer submissions and finalize campaign";
        if (timingInfo.isUrgent) {
          warning = "Ready for final review and completion";
        } else {
          warning = "Review period active - check all submissions";
        }
      }
      break;

    case CampaignStatus.COMPLETED:
      nextAction = "Campaign successfully completed";
      break;

    case CampaignStatus.CANCELLED:
      nextAction = "Campaign was cancelled by the business";
      break;

    case CampaignStatus.EXPIRED:
      nextAction = "Campaign closed due to deadline - funds refunded";
      break;
  }

  return {
    status: brief.status,
    statusLabel: getStatusLabel(brief.status),
    isActive: brief.status === CampaignStatus.OPEN || brief.status === CampaignStatus.ASSIGNED,
    canApply,
    canSelect,
    canSubmitProof,
    canComplete,
    canCancel,
    canExpire,
    nextAction,
    warning,
  };
}
/**
 * Enhanced timing info with grace period awareness
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

  const SELECTION_GRACE_PERIOD = 24 * 60 * 60; // 1 day
  const gracePeriodEnd = brief.selectionDeadline + SELECTION_GRACE_PERIOD;

  // Determine current phase with grace period awareness
  if (brief.status === CampaignStatus.CANCELLED) {
    phase = CampaignPhase.CANCELLED;
  } else if (brief.status === CampaignStatus.EXPIRED) {
    phase = CampaignPhase.EXPIRED;
  } else if (brief.status === CampaignStatus.COMPLETED) {
    phase = CampaignPhase.COMPLETED;
  } else if (currentTime <= brief.selectionDeadline && brief.status === CampaignStatus.OPEN) {
    phase = CampaignPhase.SELECTION;
    currentDeadline = brief.selectionDeadline;
    currentDeadlineLabel = "Application deadline";
    nextPhase = CampaignPhase.PREPARATION;
    nextPhaseTime = brief.promotionStartTime;
  } else if (currentTime <= gracePeriodEnd && brief.status === CampaignStatus.OPEN) {
    // Grace period phase
    phase = CampaignPhase.SELECTION;
    currentDeadline = gracePeriodEnd;
    currentDeadlineLabel = "Selection grace period ends";
    nextPhase = CampaignPhase.EXPIRED;
    nextPhaseTime = gracePeriodEnd;
  } else if (brief.status === CampaignStatus.OPEN) {
    // Past grace period - should be expired
    phase = CampaignPhase.EXPIRED;
    currentDeadlineLabel = "Campaign should be expired";
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
  let timeRemaining: { days: number; hours: number; minutes: number; totalSeconds: number } | undefined;
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

  // FIXED: Check if influencer was not selected when campaign is assigned 
  if (!application.isSelected) {
    if (brief.status === CampaignStatus.ASSIGNED || 
        brief.status === CampaignStatus.COMPLETED) {
      // Campaign has moved to assigned status, meaning all spots are filled
      return {
        canSubmitProof: false,
        canClaim: false,
        proofStatus: ProofStatus.NOT_REQUIRED,
        paymentStatus: PaymentStatus.NOT_EARNED,
        nextAction: "Not selected - all spots filled",
        warning: "You were not selected for this campaign",
      };
    } else if (brief.status === CampaignStatus.CANCELLED || 
               brief.status === CampaignStatus.EXPIRED) {
      return {
        canSubmitProof: false,
        canClaim: false,
        proofStatus: ProofStatus.NOT_REQUIRED,
        paymentStatus: PaymentStatus.NOT_EARNED,
        nextAction: brief.status === CampaignStatus.CANCELLED ? "Campaign cancelled" : "Campaign expired",
      };
    } else {
      // Still in open status, waiting for selection
      return {
        canSubmitProof: false,
        canClaim: false,
        proofStatus: ProofStatus.NOT_REQUIRED,
        paymentStatus: PaymentStatus.NOT_EARNED,
        nextAction: "Awaiting selection decision",
      };
    }
  }

  // Determine proof status and submission capability
  if (!application.proofLink) {
    proofStatus = ProofStatus.PENDING;
    
    // FIXED: More specific timing messages (Issue 3)
    if (briefTiming.phase === CampaignPhase.PREPARATION) {
      canSubmitProof = false;
      const timeRemaining = getTimeRemaining(brief.promotionStartTime);
      nextAction = `Campaign starts ${formatDetailedTimeRemaining(timeRemaining)} (${formatDate(brief.promotionStartTime)})`;
      
    } else if (briefTiming.phase === CampaignPhase.PROMOTION) {
      canSubmitProof = true;
      const timeRemaining = getTimeRemaining(brief.promotionEndTime);
      nextAction = `Submit proof - campaign ends ${formatDetailedTimeRemaining(timeRemaining)} (${formatDate(brief.promotionEndTime)})`;
      if (briefTiming.isUrgent) {
        warning = "Campaign ends soon!";
      }
      
    } else if (briefTiming.phase === CampaignPhase.PROOF_SUBMISSION) {
      canSubmitProof = true;
      const timeRemaining = getTimeRemaining(brief.proofSubmissionDeadline);
      nextAction = `Submit proof - deadline ${formatDetailedTimeRemaining(timeRemaining)} (${formatDate(brief.proofSubmissionDeadline)})`;
      if (briefTiming.isUrgent) {
        warning = "Proof submission deadline approaching!";
      }
      
    } else if (
      briefTiming.phase === CampaignPhase.VERIFICATION ||
      briefTiming.phase === CampaignPhase.COMPLETED
    ) {
      canSubmitProof = false;
      nextAction = `Proof submission period ended (${formatDate(brief.proofSubmissionDeadline)})`;
      warning = "You missed the submission deadline";
      
    } else {
      canSubmitProof = false;
      nextAction = "Awaiting campaign start";
    }
    
  } else if (application.disputeStatus === DisputeStatus.RESOLVED_INVALID || 
            application.disputeStatus === DisputeStatus.EXPIRED) {
    proofStatus = ProofStatus.REJECTED;
    canSubmitProof = false;
    nextAction = "Submission was rejected";
    
  } else if (application.isApproved) {
    proofStatus = ProofStatus.APPROVED;
    canSubmitProof = false;
    nextAction = "Proof approved";
    
  } else {
    proofStatus = ProofStatus.SUBMITTED;
    canSubmitProof = false;
    if (briefTiming.phase === CampaignPhase.VERIFICATION) {
      const timeRemaining = getTimeRemaining(brief.verificationDeadline);
      nextAction = `Under review - decision ${formatDetailedTimeRemaining(timeRemaining)} (${formatDate(brief.verificationDeadline)})`;
    } else {
      nextAction = "Submission under review by business";
    }
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
      nextAction = "Payment ready - claim your earnings";
    }
  } else {
    paymentStatus = PaymentStatus.CLAIMED;
    if (!nextAction) {
      nextAction = "Payment successfully claimed";
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
 * Helper function for more detailed time formatting 
 */
function formatDetailedTimeRemaining(timeRemaining: {
  days: number;
  hours: number;
  minutes: number;
  totalSeconds: number;
  isExpired: boolean;
}): string {
  if (timeRemaining.isExpired) {
    return "now";
  }

  if (timeRemaining.days > 0) {
    return `in ${timeRemaining.days}d ${timeRemaining.hours}h`;
  } else if (timeRemaining.hours > 0) {
    return `in ${timeRemaining.hours}h ${timeRemaining.minutes}m`;
  } else if (timeRemaining.minutes > 0) {
    return `in ${timeRemaining.minutes}m`;
  } else {
    return "very soon";
  }
}

/**
 * Helper function to format dates 
 */
function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
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
export function getPhaseColor(phase: CampaignPhase, isStuck: boolean = false): string {
  if (isStuck) {
    return "bg-red-500/10 text-red-400 border-red-500/20 animate-pulse";
  }

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
  const decisionInfo = isCampaignAwaitingDecision(brief);
  const expirationInfo = canExpireCampaign(brief);

  return (
    timingInfo.isUrgent ||
    statusInfo.warning !== undefined ||
    decisionInfo.isAwaitingDecision ||
    expirationInfo.canExpire ||
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

export function hasPendingDisputes(
  applications: Application[],
  currentTime: number = Date.now() / 1000
): {
  hasPending: boolean;
  pendingCount: number;
  canAutoApprove: boolean;
} {
  const DISPUTE_RESOLUTION_DEADLINE = 2 * 24 * 60 * 60; // 2 days

  const pendingDisputes = applications.filter(
    (app) =>
      app.isSelected &&
      app.disputeStatus === DisputeStatus.FLAGGED &&
      currentTime <= app.timestamp + DISPUTE_RESOLUTION_DEADLINE
  );

  return {
    hasPending: pendingDisputes.length > 0,
    pendingCount: pendingDisputes.length,
    canAutoApprove:
      currentTime >
      Math.max(...applications.map((a) => a.timestamp)) +
        DISPUTE_RESOLUTION_DEADLINE,
  };
}

/**
 * Determines if a dispute has expired
 */
export function isDisputeExpired(
  application: Application,
  currentTime: number = Date.now() / 1000
): boolean {
  const DISPUTE_RESOLUTION_DEADLINE = 2 * 24 * 60 * 60; // 2 days

  return (
    application.disputeStatus === DisputeStatus.FLAGGED &&
    currentTime > application.timestamp + DISPUTE_RESOLUTION_DEADLINE
  );
}

export function getTimeRemaining(deadline: number) {
  const now = Math.floor(Date.now() / 1000);
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
 * Enhanced function to check if campaign can be expired
 */
export function canExpireCampaign(
  brief: Brief,
  currentTime: number = Date.now() / 1000
): {
  canExpire: boolean;
  reason?: string;
  timeUntilExpirable?: number;
} {
  // Can only expire campaigns in OPEN status
  if (brief.status !== CampaignStatus.OPEN) {
    return {
      canExpire: false,
      reason: `Campaign is ${getStatusLabel(brief.status).toLowerCase()}`,
    };
  }

  // Can only expire if NO influencers have been selected
  // This prevents businesses from abandoning selected influencers without compensation
  if (brief.selectedInfluencersCount > 0) {
    return {
      canExpire: false,
      reason: "Cannot expire campaign with selected influencers - must start partial or cancel with compensation",
    };
  }

  // For campaigns with no selections, can expire after selection deadline
  if (currentTime > brief.selectionDeadline) {
    return {
      canExpire: true,
      reason: "No influencers selected and deadline passed",
    };
  }

  return {
    canExpire: false,
    reason: "Selection deadline not yet reached",
    timeUntilExpirable: brief.selectionDeadline - currentTime,
  };
}

/**
 * Enhanced function to check if campaign requires business decision (past deadline with selections)
 */
export function isCampaignAwaitingDecision(
  brief: Brief,
  currentTime: number = Date.now() / 1000
): {
  isAwaitingDecision: boolean;
  reason?: string;
  timePastDeadline?: number;
} {
  if (brief.status !== CampaignStatus.OPEN) {
    return { isAwaitingDecision: false };
  }

  // Campaign awaits decision if:
  // 1. Past selection deadline
  // 2. Has some influencers selected but not all
  // 3. Still in OPEN status
  const isPastDeadline = currentTime > brief.selectionDeadline;
  const hasPartialSelection = brief.selectedInfluencersCount > 0 && 
                              brief.selectedInfluencersCount < brief.maxInfluencers;

  if (isPastDeadline && hasPartialSelection) {
    return {
      isAwaitingDecision: true,
      reason: `${brief.selectedInfluencersCount}/${brief.maxInfluencers} influencers selected`,
      timePastDeadline: currentTime - brief.selectionDeadline,
    };
  }

  if (isPastDeadline && brief.selectedInfluencersCount === 0) {
    return {
      isAwaitingDecision: true,
      reason: "No influencers selected",
      timePastDeadline: currentTime - brief.selectionDeadline,
    };
  }

  return { isAwaitingDecision: false };
}

