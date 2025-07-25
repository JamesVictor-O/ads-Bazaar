"use client";

import { useEffect } from "react";
import { useAccount } from "wagmi";
import { motion } from "framer-motion";
import { Zap, Clock, AlertTriangle, Loader2 } from "lucide-react";
import { useGetAllBriefs, useTriggerAutoApproval } from "@/hooks/adsBazaar";
import { CampaignStatus } from "@/types";
import { formatTimeRemaining, getTimeRemaining } from "@/utils/format";
import { toast, Toaster } from "react-hot-toast";
import Link from "next/link";
import { useDivviIntegration } from "@/hooks/useDivviIntegration";

export default function AutoApprovalPage() {
  const { isConnected } = useAccount();
  const { briefs, isLoading } = useGetAllBriefs();
  const {
    triggerAutoApproval,
    isPending,
    isSuccess,
    hash: triggerApprovalHash,
  } = useTriggerAutoApproval();
  const { generateDivviReferralTag, trackTransaction } = useDivviIntegration();
  // Filter campaigns eligible for auto-approval
  const eligibleCampaigns =
    briefs?.filter((brief) => {
      const currentTime = Math.floor(Date.now() / 1000);
      return (
        brief.status === CampaignStatus.ASSIGNED &&
        currentTime > brief.verificationDeadline
      );
    }) || [];

  // Track transaction when hash becomes available
  useEffect(() => {
    if (triggerApprovalHash) {
      console.log(
        "DIVVI: Hash available from auto-approval:",
        triggerApprovalHash
      );
      trackTransaction(triggerApprovalHash);
    }
  }, [triggerApprovalHash, trackTransaction]);

  const handleAutoApproval = async (briefId: string) => {
    try {
      // Generate Divvi referral tag to append to transaction calldata
      const referralTag = generateDivviReferralTag();
      console.log(
        "DIVVI: About to trigger auto-approval with referral tag:",
        referralTag
      );

      await triggerAutoApproval(briefId as `0x${string}`, referralTag);
    } catch (error) {
      console.error("Auto-approval failed:", error);
    }
  };

  useEffect(() => {
    if (isSuccess) {
      toast.success("Auto-approval triggered successfully!");
    }
  }, [isSuccess]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pt-20 sm:pt-24 md:pt-40 pb-20">
      <Toaster position="top-right" />

      <div className="px-4 md:px-6 lg:px-8 pb-8 max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div>
              <h1 className="text-3xl font-bold text-white">Auto-Approval</h1>
              <p className="text-slate-400">
                Trigger automatic campaign completion
              </p>
            </div>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
            <h3 className="text-blue-400 font-medium mb-2">
              How Auto-Approval Works
            </h3>
            <p className="text-blue-300 text-sm">
              When campaigns pass their verification deadline, anyone can
              trigger auto-approval. This automatically processes payments for
              valid submissions and handles expired disputes.
            </p>
          </div>
        </motion.div>

        {/* Connection Check */}
        {!isConnected && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-6 mb-8">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-amber-400" />
              <div>
                <h3 className="text-amber-400 font-medium">
                  Wallet Not Connected
                </h3>
                <p className="text-amber-300 text-sm">
                  Please connect your wallet to trigger auto-approval.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Eligible Campaigns */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
          </div>
        ) : eligibleCampaigns.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              No Campaigns Ready for Auto-Approval
            </h3>
            <p className="text-slate-400">
              Check back later when campaigns pass their verification deadlines.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white mb-4">
              Campaigns Ready for Auto-Approval ({eligibleCampaigns.length})
            </h2>

            {eligibleCampaigns.map((brief, index) => (
              <motion.div
                key={brief.id}
                className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 hover:bg-slate-800/70 transition-all"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-2">
                      {brief.name}
                    </h3>
                    <p className="text-slate-400 text-sm mb-3">
                      {brief.description}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                      <span>Budget: {brief.budget.toFixed(0)} cUSD</span>
                      <span>
                        Selected: {brief.selectedInfluencersCount}/
                        {brief.maxInfluencers}
                      </span>
                      <span>
                        Deadline passed:{" "}
                        {formatTimeRemaining(
                          getTimeRemaining(brief.verificationDeadline)
                        )}{" "}
                        ago
                      </span>
                    </div>
                  </div>

                  <motion.button
                    onClick={() => handleAutoApproval(brief.id)}
                    disabled={!isConnected || isPending}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
                      !isConnected || isPending
                        ? "bg-slate-600/50 text-slate-400 cursor-not-allowed"
                        : "bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600"
                    }`}
                    whileTap={!isConnected || isPending ? {} : { scale: 0.95 }}
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4" />
                        Trigger Auto-Approval
                      </>
                    )}
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center">
          <Link href="/marketplace">
            <button className="text-slate-400 hover:text-slate-300 text-sm">
              ← Back to Marketplace
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
