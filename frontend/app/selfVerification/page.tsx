"use client";

import { useState, useEffect, useCallback } from "react";
import { CheckCircle, AlertCircle, ArrowRight, Home } from "lucide-react";
import { useAccount } from "wagmi";
import { useUserProfile } from "@/hooks/adsBazaar";
import { useVerifySelfProof } from "@/hooks/adsBazaar";
import { SelfAppBuilder, SelfApp } from "@selfxyz/qrcode";
import SelfQRcodeWrapper from "@selfxyz/qrcode";
import toast from "react-hot-toast";
import Link from "next/link";
import { motion } from "framer-motion";
import { CONTRACT_ADDRESS } from "@/lib/contracts";

interface VerificationResult {
  isValid: boolean;
  credentialSubject?: { isOver18: boolean; nationality: string };
  error?: string;
}

const mockVerifyProof = async (): Promise<VerificationResult> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        isValid: true,
        credentialSubject: { isOver18: true, nationality: "US" },
      });
    }, 2000);
  });
};

export default function SelfVerification() {
  const [isVerified, setIsVerified] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selfApp, setSelfApp] = useState<SelfApp | null>(null);
  const { address, isConnected } = useAccount();
  const { userProfile, isLoadingProfile } = useUserProfile();
  const { verifySelfProof, isPending, isSuccess } = useVerifySelfProof();

  useEffect(() => {
    if (address) {
      const app = new SelfAppBuilder({
        appName: "AdsBazaar",
        scope: "adsbazaar-scope",
        endpoint: CONTRACT_ADDRESS,
        endpointType: "staging_celo",
        userId: address,
        userIdType: "hex",
        devMode: true,
      } as Partial<SelfApp>).build();
      setSelfApp(app);
    }
  }, [address]);

  const handleVerify = useCallback(
    async (proof: unknown, publicSignals: string[]) => {
      if (!isConnected || !address) {
        toast.error("Please connect your wallet to verify.");
        return;
      }
      setIsLoading(true);
      try {
        await verifySelfProof(proof, publicSignals);
        toast.success("Proof submitted for verification!");
      } catch (error) {
        console.error("Verification failed:", error);
        toast.error("Verification failed");
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [isConnected, address, verifySelfProof]
  );

  useEffect(() => {
    const checkVerification = async () => {
      if (!isConnected || !address) {
        setIsLoading(false);
        return;
      }

      const proofParam = new URLSearchParams(window.location.search).get("proof");
      const publicSignalsParam = new URLSearchParams(window.location.search).get("publicSignals");

      if (proofParam && publicSignalsParam && !isVerified) {
        try {
          const proof = JSON.parse(decodeURIComponent(proofParam));
          const publicSignals = JSON.parse(decodeURIComponent(publicSignalsParam));

          if (publicSignals.length !== 21) {
            throw new Error(`Expected 21 public signals, got ${publicSignals.length}`);
          }

          const result = await mockVerifyProof();

          if (result.isValid) {
            await handleVerify(proof, publicSignals);
            window.history.replaceState({}, "", window.location.pathname);
          } else {
            toast.error(`Verification failed: ${result.error}`);
          }
        } catch (error) {
          toast.error("Error verifying identity");
          console.error(error);
        }
      }
      setIsLoading(false);
    };
    checkVerification();
  }, [isVerified, isConnected, address, handleVerify]);

  useEffect(() => {
    if (isSuccess) {
      setIsVerified(true);
      toast.success("Identity verified successfully!");
    }
  }, [isSuccess]);

  const handleVerificationSuccess = () => {
    setIsVerified(true);
    toast.success("Identity verified successfully!");
  };

  if (isLoading || isLoadingProfile) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          <svg
            className="animate-spin h-6 w-6 text-emerald-500 mx-auto mb-2"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8h8a8 8 0 01-16 0z"
            ></path>
          </svg>
          <p className="text-xs text-slate-400">
            {isPending ? "Submitting to blockchain..." : "Loading..."}
          </p>
        </motion.div>
      </div>
    );
  }

  if (!isConnected || !address) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pt-16 sm:pt-20 pb-20">
        <div className="px-4 sm:px-6 md:px-8 max-w-xl mx-auto">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white">Identity Verification</h2>
              <p className="text-xs text-slate-400 mt-1">
                Connect your wallet to verify your identity
              </p>
            </div>
            <Link href="/">
              <motion.button
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-lg hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-md shadow-emerald-500/20"
                whileTap={{ scale: 0.95 }}
                aria-label="Back to Home"
              >
                <Home className="w-3.5 h-3.5" />
                Home
              </motion.button>
            </Link>
          </div>
          <motion.div
            className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-lg p-6 text-center"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-3" />
            <h3 className="text-base sm:text-lg font-semibold text-white mb-3">Wallet Not Connected</h3>
            <p className="text-xs text-slate-400 mb-4 max-w-sm mx-auto">
              Please connect your wallet to proceed with verification.
            </p>
            <Link
              href="/connect"
              className="inline-flex items-center px-4 py-2 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all"
            >
              Connect Wallet
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pt-16 sm:pt-20 md:pt-40 pb-20">
      <div className="px-4 sm:px-6 md:px-8 max-w-xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white">Identity Verification</h2>
            <p className="text-xs text-slate-400 mt-1">
              Verify your identity to unlock campaigns
            </p>
          </div>
          <Link href={userProfile?.isInfluencer ? "/influencersDashboard" : "/"}>
            <motion.button
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-lg hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-md shadow-emerald-500/20"
              whileTap={{ scale: 0.95 }}
              aria-label="Back to Home"
            >
              <Home className="w-3.5 h-3.5" />
              Dashboard
            </motion.button>
          </Link>
        </div>

        <motion.div
          className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-lg p-6 text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="mb-4">
            <span
              className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium border ${
                isVerified
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  : "bg-red-500/10 text-red-400 border-red-500/20"
              }`}
            >
              {isVerified ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Verified
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 mr-1" />
                  Not Verified
                </>
              )}
            </span>
          </div>

          <h3 className="text-base sm:text-lg font-semibold text-white mb-3">
            {isVerified ? "You're Verified!" : "Verify with Self Protocol"}
          </h3>
          <p className="text-xs text-slate-400 mb-4 max-w-sm mx-auto">
            {isVerified
              ? "Your identity is verified. You can now apply to campaigns."
              : "Scan the QR code with the Self app to verify your identity securely."}
          </p>

          {!isVerified && selfApp ? (
            <div className="mb-4 max-w-[80vw] mx-auto">
              <SelfQRcodeWrapper
                selfApp={selfApp}
                onSuccess={handleVerificationSuccess}
                size={Math.min(200, window.innerWidth * 0.6)}
              />
              <p className="text-[10px] text-slate-400 mt-1.5">
                Wallet: {`${address.substring(0, 6)}...${address.substring(address.length - 4)}`}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Session ID: {address.substring(0, 8)}...
              </p>
            </div>
          ) : !isVerified ? (
            <div className="mb-4 text-slate-400 text-xs">Initializing...</div>
          ) : null}

          <div className="mt-4 flex flex-col gap-2">
            {isVerified && (
              <Link
                href="/marketplace"
                className="inline-flex items-center px-4 py-2 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all"
              >
                Go to Marketplace
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Link>
            )}
            {isConnected && (!userProfile?.isRegistered || !userProfile.isInfluencer) && (
              <Link
                href="/register"
                className="inline-flex items-center px-4 py-2 rounded-lg text-xs font-medium bg-slate-500/10 text-slate-400 border border-slate-500/20 hover:bg-slate-500/20 transition-all"
              >
                Register as Influencer
              </Link>
            )}
          </div>
        </motion.div>

        {!isVerified && (
          <motion.div
            className="mt-6 border-t border-slate-700/50 pt-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <h4 className="text-sm font-semibold text-white mb-1.5">
              Why Verify with Self Protocol?
            </h4>
            <ul className="text-xs text-slate-400 space-y-1.5">
              <li className="flex items-start">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400 mr-1.5 mt-0.5" />
                <span>Prevents bots by ensuring only real humans apply.</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400 mr-1.5 mt-0.5" />
                <span>Privacy-preserving: shares only necessary attributes.</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400 mr-1.5 mt-0.5" />
                <span>Compliant with sanction lists for secure advertising.</span>
              </li>
            </ul>
          </motion.div>
        )}
      </div>
    </div>
  );
}