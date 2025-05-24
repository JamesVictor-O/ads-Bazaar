"use client";
import { useState, useEffect } from "react";
import { CheckCircle, AlertCircle, User, ArrowRight } from "lucide-react";
import { useAccount } from "wagmi";
import { useUserProfile } from "@/hooks/adsBazaar";
import { useVerifySelfProof } from "@/hooks/adsBazaar";
import { SelfAppBuilder, SelfApp } from "@selfxyz/qrcode";
import SelfQRcodeWrapper from "@selfxyz/qrcode";
import toast from "react-hot-toast";
import Link from "next/link";
import { CONTRACT_ADDRESS } from "@/lib/contracts";

// Mock verification check (replace with actual backend API call)
const mockVerifyProof = async (
  proof: string,
  publicSignals: string[]
): Promise<{ isValid: boolean; credentialSubject?: any; error?: string }> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Simulate successful verification
      resolve({
        isValid: true,
        credentialSubject: { isOver18: true, nationality: "US" },
      });
      // Simulate failure: resolve({ isValid: false, error: "Invalid proof" });
    }, 2000);
  });
};

export default function SelfVerification() {
  // State
  const [isVerified, setIsVerified] = useState<boolean>(false);
  const [_isVerifying, setIsVerifying] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);


  const { address, isConnected } = useAccount();

  const { userProfile, isLoadingProfile } = useUserProfile();

  const { verifySelfProof, isPending, isSuccess } = useVerifySelfProof();

  const handleVerify = async (proof: any, publicSignals: string[]) => {
    if (!isConnected || !address) {
      toast.error("Please connect your wallet to verify your identity.");
      return;
    }
    setIsLoading(true);
    try {
      await verifySelfProof(proof, publicSignals);
      toast.success("Proof submitted for on-chain verification!");
    } catch (error) {
      console.error("On-chain verification failed:", error);
      toast.error("On-chain verification failed");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };



  useEffect(() => {
    const checkVerification = async () => {
      if (!isConnected || !address) {
        setIsLoading(false);
        return;
      }

      const proofParam = new URLSearchParams(window.location.search).get(
        "proof"
      );
      const publicSignalsParam = new URLSearchParams(
        window.location.search
      ).get("publicSignals");

      if (proofParam && publicSignalsParam && !isVerified) {
        setIsVerifying(true);
        try {
          const proof = JSON.parse(decodeURIComponent(proofParam));
          const publicSignals = JSON.parse(
            decodeURIComponent(publicSignalsParam)
          );

          if (publicSignals.length !== 21) {
            throw new Error(
              `Expected 21 public signals, got ${publicSignals.length}`
            );
          }

          const result = await mockVerifyProof(proofParam, publicSignals);

          if (result.isValid) {
            await handleVerify(proof, publicSignals);

            console.log("Verified attributes:", result.credentialSubject);

            window.history.replaceState({}, "", window.location.pathname);
          } else {
            toast.error(`Verification failed: ${result.error}`);
          }
        } catch (error) {
          toast.error("Error verifying identity");
          console.error(error);
        }
        setIsVerifying(false);
      }
      setIsLoading(false);
    };
    checkVerification();
  }, [isVerified, isConnected, address, verifySelfProof]);

  // Handle transaction confirmation
  useEffect(() => {
    if (isSuccess) {
      setIsVerified(true);
      toast.success("Identity verified on-chain successfully!");
    }
  }, [isSuccess]);

  

  const selfApp = new SelfAppBuilder({
    appName: "AdsBazaar",
    scope: "adsbazaar-scope",
    endpoint: CONTRACT_ADDRESS,
    endpointType: "staging_celo",
    userId: address,
    userIdType: "hex",
    devMode: true,
  } as Partial<SelfApp>).build();

  const handleVerificationSuccess = () => {
    setIsVerified(true);
    toast.success("Identity verified successfully!");
  };

  // Loading state
  if (isLoading || isLoadingProfile || !isConnected) {
    return (
      <div
        className="flex justify-center items-center min-h-screen bg-slate-900"
        aria-live="polite"
      >
        <div className="text-center">
          <svg
            className="animate-spin h-12 w-12 text-emerald-500 mx-auto"
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
          <p className="mt-4 text-slate-400">
            {isPending
              ? "Submitting verification to blockchain..."
              : "Confirming transaction..."}
          </p>
        </div>
      </div>
    );
  }

  // Wallet not connected state
  if (!isConnected || !address) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-900">
        <div className="p-6 lg:p-8 max-w-3xl mx-auto">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-white">
              Identity Verification
            </h2>
            <p className="text-sm text-slate-400 mt-2">
              Connect your wallet to verify your identity on AdsBazaar
            </p>
          </div>
          <div className="bg-slate-800/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-lg shadow-emerald-500/10">
            <div className="flex flex-col items-center text-center">
              <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
              <h3 className="text-xl font-semibold text-white mb-4">
                Wallet Not Connected
              </h3>
              <p className="text-sm text-slate-300 mb-6 max-w-md">
                Please connect your wallet to proceed with identity
                verification.
              </p>
              <Link
                href="/connect"
                className="inline-flex items-center px-6 py-3 rounded-xl text-sm font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all duration-200"
              >
                Connect Wallet
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-900">
      <div className="p-6 lg:p-8 max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white">
            Identity Verification
          </h2>
          <p className="text-sm text-slate-400 mt-2">
            Verify your identity to unlock campaign applications on AdsBazaar
          </p>
        </div>

        {/* Verification Card */}
        <div className="bg-slate-800/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-lg shadow-emerald-500/10">
          <div className="flex flex-col items-center text-center">
            {/* Verification Status */}
            <div className="mb-6">
              <span
                className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium border ${
                  isVerified
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    : "bg-red-500/10 text-red-400 border-red-500/20"
                }`}
              >
                {isVerified ? (
                  <>
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Verified
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-5 h-5 mr-2" />
                    Not Verified
                  </>
                )}
              </span>
            </div>

            {/* Instructions */}
            <h3 className="text-xl font-semibold text-white mb-4">
              {isVerified
                ? "You're Verified!"
                : "Verify Your Identity with Self Protocol"}
            </h3>
            <p className="text-sm text-slate-300 mb-6 max-w-md">
              {isVerified
                ? "Your identity has been successfully verified. You can now apply to campaigns in the marketplace."
                : "Scan the QR code below with the Self app to verify your identity. This process is secure and privacy-preserving."}
            </p>

            {/* QR Code or Success State */}
            {!isVerified && selfApp && (
              <div className="mb-6">
                <SelfQRcodeWrapper
                  selfApp={selfApp}
                  onSuccess={handleVerificationSuccess}
                  size={250}
                />
                <p className="text-xs text-slate-400 mt-2">
                  Wallet:{" "}
                  {`${address.substring(0, 6)}...${address.substring(
                    address.length - 4
                  )}`}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Session ID: {address.substring(0, 8)}...
                </p>
              </div>
            )}

            {/* Navigation Links */}
            <div className="mt-6 flex flex-col sm:flex-row gap-4">
              {isVerified && (
                <Link
                  href="/marketplace"
                  className="inline-flex items-center px-6 py-3 rounded-xl text-sm font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all duration-200"
                >
                  Go to Marketplace
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              )}
              {isConnected &&
                (!userProfile?.isRegistered || !userProfile.isInfluencer) && (
                  <Link
                    href="/register"
                    className="inline-flex items-center px-6 py-3 rounded-xl text-sm font-medium bg-slate-500/10 text-slate-400 border border-slate-500/20 hover:bg-slate-500/20 transition-all duration-200"
                  >
                    Register as Influencer
                  </Link>
                )}
            </div>
          </div>

          {/* Additional Info */}
          {!isVerified && (
            <div className="mt-8 border-t border-slate-700/50 pt-6">
              <h4 className="text-sm font-semibold text-white mb-2">
                Why Verify with Self Protocol?
              </h4>
              <ul className="text-xs text-slate-300 space-y-2">
                <li className="flex items-start">
                  <CheckCircle className="w-4 h-4 text-emerald-400 mr-2 mt-1" />
                  <span>
                    Ensures only real humans can apply to campaigns, preventing
                    bots.
                  </span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-4 h-4 text-emerald-400 mr-2 mt-1" />
                  <span>
                    Privacy-preserving: only necessary attributes are shared
                    (e.g., age over 18).
                  </span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-4 h-4 text-emerald-400 mr-2 mt-1" />
                  <span>
                    Compliant with sanction lists (e.g., OFAC) for secure
                    advertising.
                  </span>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
