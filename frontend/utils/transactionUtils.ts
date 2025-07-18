/**
 * Global transaction success handling utilities
 * Ensures consistent refresh behavior across all successful transactions
 */

export interface TransactionSuccessOptions {
  /** Immediate refresh actions to run */
  immediateActions?: (() => void | Promise<void>)[];
  /** Actions to run after blockchain propagation delay */
  delayedActions?: (() => void | Promise<void>)[];
  /** Custom delay in milliseconds for blockchain propagation (default: 2000ms) */
  propagationDelay?: number;
  /** Whether to trigger global dashboard refresh event */
  triggerGlobalRefresh?: boolean;
  /** Custom success message to display */
  successMessage?: string;
}

/**
 * Handles successful transaction with consistent refresh patterns
 */
export function handleTransactionSuccess(options: TransactionSuccessOptions = {}) {
  const {
    immediateActions = [],
    delayedActions = [],
    propagationDelay = 2000,
    triggerGlobalRefresh = true,
    successMessage
  } = options;

  console.log("Transaction successful - executing refresh actions...");

  // Execute immediate actions
  immediateActions.forEach(async (action, index) => {
    try {
      await action();
      console.log(`Immediate action ${index + 1} completed`);
    } catch (error) {
      console.error(`Immediate action ${index + 1} failed:`, error);
    }
  });

  // Trigger global dashboard refresh if requested
  if (triggerGlobalRefresh) {
    setTimeout(() => {
      console.log("Triggering global dashboard refresh...");
      window.dispatchEvent(new CustomEvent("dashboardRefresh"));
    }, 1000);
  }

  // Execute delayed actions after blockchain propagation
  if (delayedActions.length > 0) {
    setTimeout(async () => {
      console.log("Executing delayed actions after blockchain propagation...");
      for (const [index, action] of delayedActions.entries()) {
        try {
          await action();
          console.log(`Delayed action ${index + 1} completed`);
        } catch (error) {
          console.error(`Delayed action ${index + 1} failed:`, error);
        }
      }
    }, propagationDelay);
  }
}

/**
 * Creates a standardized transaction success handler for marketplace applications
 */
export function createMarketplaceSuccessHandler(
  refreshApplicationStatus: (address?: string, force?: boolean) => Promise<void>
) {
  return () => handleTransactionSuccess({
    immediateActions: [
      () => refreshApplicationStatus(undefined, true)
    ],
    delayedActions: [
      () => refreshApplicationStatus(undefined, true)
    ],
    triggerGlobalRefresh: true,
    propagationDelay: 2500
  });
}

/**
 * Creates a standardized transaction success handler for brand dashboard
 */
export function createBrandDashboardSuccessHandler(
  refreshActions: (() => void | Promise<void>)[]
) {
  return () => handleTransactionSuccess({
    immediateActions: refreshActions,
    delayedActions: refreshActions,
    triggerGlobalRefresh: true,
    propagationDelay: 2000
  });
}

/**
 * Creates a standardized transaction success handler for influencer dashboard
 */
export function createInfluencerDashboardSuccessHandler(
  refreshActions: (() => void | Promise<void>)[]
) {
  return () => handleTransactionSuccess({
    immediateActions: refreshActions,
    delayedActions: refreshActions,
    triggerGlobalRefresh: true,
    propagationDelay: 2000
  });
}

/**
 * Global event dispatcher for manual refresh triggers
 */
export function triggerGlobalRefresh() {
  console.log("Manually triggering global refresh...");
  window.dispatchEvent(new CustomEvent("dashboardRefresh"));
}

/**
 * React hook for listening to global refresh events
 */
export function useGlobalRefreshListener(callback: () => void) {
  const handleRefresh = () => {
    console.log("Global refresh event received");
    callback();
  };

  // Set up listener
  if (typeof window !== 'undefined') {
    window.addEventListener('dashboardRefresh', handleRefresh);
    
    // Cleanup function
    return () => {
      window.removeEventListener('dashboardRefresh', handleRefresh);
    };
  }
  
  return () => {}; // No-op cleanup for SSR
}