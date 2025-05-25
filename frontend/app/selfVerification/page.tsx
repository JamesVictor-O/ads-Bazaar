"use client";
import { useState, useEffect } from "react";
import { CheckCircle, AlertCircle, ArrowRight } from "lucide-react";
import { useAccount } from "wagmi";
import { SelfAppBuilder } from "@selfxyz/qrcode";
import SelfQRcodeWrapper from "@selfxyz/qrcode";
import toast from "react-hot-toast";
import Link from "next/link";

export default function SelfVerification() {
  const [isVerified, setIsVerified] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selfApp, setSelfApp] = useState<any>(null);
  const { address, isConnected } = useAccount();

  // Initialize SelfApp configuration
  useEffect(() => {
    if (address) {
      const app = new SelfAppBuilder({
        appName: "AdsBazaar",
        scope: process.env.NEXT_PUBLIC_HASHED_SCOPE,
        endpoint: "/api/verify",
        userId: address,
        userIdType: "hex",
        devMode: process.env.NODE_ENV === "development",
      }).build();
      setSelfApp(app);
    }
  }, [address]);

  const handleVerificationSuccess = async (result: any) => {
    setIsLoading(true);
    try {
      const { proof, publicSignals } = result;

      // Submit to your API endpoint
      const response = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proof, publicSignals }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const data = await response.json();
      if (data.success) {
        setIsVerified(true);
        toast.success("Identity verified successfully!");
      } else {
        throw new Error(data.error || "Verification failed");
      }
    } catch (error) {
      console.error("Verification error:", error);
      toast.error(
        error instanceof Error ? error.message : "Verification failed"
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!isConnected || !address) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-900 pt-10 md:pt-20">
        <div className="p-6 lg:p-8 max-w-3xl mx-auto">
          <div className="bg-slate-800/80 border border-slate-700/50 rounded-2xl p-6">
            <div className="flex flex-col items-center text-center">
              <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
              <h3 className="text-xl font-semibold text-white mb-4">
                Wallet Not Connected
              </h3>
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
    <div className="flex flex-col min-h-screen bg-slate-900 pt-10 md:pt-24">
      <div className="p-6 lg:p-8 max-w-3xl mx-auto">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white">
            Identity Verification
          </h2>
          <p className="text-sm text-slate-400 mt-2">
            Verify your identity to unlock campaign applications
          </p>
        </div>

        <div className="bg-slate-800/80 border border-slate-700/50 rounded-2xl p-6">
          <div className="flex flex-col items-center text-center">
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

            {!isVerified ? (
              <>
                <h3 className="text-xl font-semibold text-white mb-4">
                  Verify Your Identity
                </h3>
                {selfApp ? (
                  <div className="mb-6">
                    <SelfQRcodeWrapper
                      selfApp={selfApp}
                      onSuccess={handleVerificationSuccess}
                      onError={(error) => {
                        toast.error(`Verification failed: ${error.message}`);
                      }}
                      size={250}
                      darkMode={true}
                    />
                    <p className="text-xs text-slate-400 mt-2">
                      Wallet:{" "}
                      {`${address.substring(0, 6)}...${address.substring(
                        address.length - 4
                      )}`}
                    </p>
                  </div>
                ) : (
                  <div className="mb-6 text-slate-400">
                    Initializing verification...
                  </div>
                )}
              </>
            ) : (
              <>
                <h3 className="text-xl font-semibold text-white mb-4">
                  You're Verified!
                </h3>
                <p className="text-sm text-slate-300 mb-6 max-w-md">
                  Your identity has been successfully verified.
                </p>
                <Link
                  href="/marketplace"
                  className="inline-flex items-center px-6 py-3 rounded-xl text-sm font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all duration-200"
                >
                  Go to Marketplace
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
