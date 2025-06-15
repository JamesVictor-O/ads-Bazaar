"use client";

import { useAccount } from "wagmi";
import { useEnsureNetwork } from "@/hooks/useEnsureNetwork";
import { AlertTriangle, CheckCircle, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

interface NetworkStatusProps {
  showWhenCorrect?: boolean;
  className?: string;
}

export const NetworkStatus = ({
  showWhenCorrect = false,
  className = "",
}: NetworkStatusProps) => {
  const { isConnected, chain } = useAccount();
  const { isCorrectChain, ensureNetwork, isSwitching, currentNetwork } =
    useEnsureNetwork();

  if (!isConnected) {
    return null;
  }

  if (isCorrectChain && !showWhenCorrect) {
    return null;
  }

  return (
    <motion.div
      className={`rounded-lg border p-3 ${className}`}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center gap-3">
        {isCorrectChain ? (
          <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0" />
        ) : (
          <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0" />
        )}

        <div className="flex-1">
          {isCorrectChain ? (
            <div>
              <p className="text-sm font-medium text-emerald-600">
                Connected to {currentNetwork.name}
              </p>
              <p className="text-xs text-slate-500">
                You're on the correct network
              </p>
            </div>
          ) : (
            <div>
              <p className="text-sm font-medium text-amber-600">
                Wrong Network
              </p>
              <p className="text-xs text-slate-500">
                Please switch to {currentNetwork.name}
                {chain?.name && ` (currently on ${chain.name})`}
              </p>
            </div>
          )}
        </div>

        {!isCorrectChain && (
          <button
            onClick={ensureNetwork}
            disabled={isSwitching}
            className="px-3 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-lg hover:from-emerald-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-1.5"
          >
            {isSwitching ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                Switching...
              </>
            ) : (
              <>Switch Network</>
            )}
          </button>
        )}
      </div>
    </motion.div>
  );
};

// Wrapper component for forms/modals that need correct network
export const NetworkGuardWrapper = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  const { isConnected } = useAccount();
  const { isCorrectChain } = useEnsureNetwork();

  if (!isConnected) {
    return (
      <div className={`text-center p-6 ${className}`}>
        <p className="text-slate-400">Please connect your wallet to continue</p>
      </div>
    );
  }

  return (
    <div className={className}>
      <NetworkStatus className="mb-4" />
      {children}
    </div>
  );
};
