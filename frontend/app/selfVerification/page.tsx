"use client";

import { useState, useEffect, useCallback } from "react";
import {
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Home,
  Shield,
  Star,
  Zap,
  Lock,
  Globe,
  Users,
  TrendingUp,
  Sparkles,
  Eye,
  UserCheck,
  Crown,
  Gem,
} from "lucide-react";
import { useAccount } from "wagmi";
import { useUserProfile } from "@/hooks/adsBazaar";
import { useVerifySelfProof } from "@/hooks/adsBazaar";
import { SelfAppBuilder, SelfApp } from "@selfxyz/qrcode";
import SelfQRcodeWrapper from "@selfxyz/qrcode";
import toast from "react-hot-toast";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { CONTRACT_ADDRESS } from "@/lib/contracts";
import { withNetworkGuard } from "@/components/WithNetworkGuard";
import { NetworkStatus } from "@/components/NetworkStatus";
import { useEnsureNetwork } from "@/hooks/useEnsureNetwork";
import { useDivviIntegration } from "@/hooks/useDivviIntegration";

interface VerificationResult {
  isValid: boolean;
  credentialSubject?: { isOver18: boolean; nationality: string };
  error?: string;
}

interface SelfVerificationProps {
  guardedAction?: (action: () => Promise<void>) => Promise<void>;
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

const verificationBenefits = [
  {
    icon: Crown,
    title: "Premium Campaign Access",
    description:
      "Unlock exclusive high-paying campaigns reserved for verified creators",
    color: "from-yellow-400 to-orange-500",
  },
  {
    icon: TrendingUp,
    title: "Higher Earnings",
    description: "Earn up to 30% more with verified creator premium rates",
    color: "from-emerald-400 to-emerald-600",
  },
  {
    icon: Shield,
    title: "Trust & Credibility",
    description: "Build trust with brands and get priority consideration",
    color: "from-blue-400 to-blue-600",
  },
  {
    icon: Star,
    title: "Priority Support",
    description: "Get dedicated support and faster campaign approvals",
    color: "from-purple-400 to-purple-600",
  },
  {
    icon: Zap,
    title: "Instant Approval",
    description: "Skip manual reviews with automated verification status",
    color: "from-amber-400 to-orange-500",
  },
  {
    icon: Globe,
    title: "Global Opportunities",
    description: "Access international campaigns with compliance verification",
    color: "from-cyan-400 to-cyan-600",
  },
];

const securityFeatures = [
  {
    icon: Lock,
    title: "Privacy First",
    description: "Zero-knowledge proofs protect your personal data",
  },
  {
    icon: Eye,
    title: "Selective Disclosure",
    description: "Share only what's needed, nothing more",
  },
  {
    icon: UserCheck,
    title: "Anti-Bot Protection",
    description: "Ensures only real humans can participate",
  },
  {
    icon: Shield,
    title: "Compliance Ready",
    description: "Meet international advertising standards",
  },
];

function SelfVerification({ guardedAction }: SelfVerificationProps) {
  const [isVerified, setIsVerified] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selfApp, setSelfApp] = useState<SelfApp | null>(null);
  const [showBenefits, setShowBenefits] = useState<boolean>(false);
  const { address, isConnected } = useAccount();
  const { isCorrectChain, currentNetwork } = useEnsureNetwork();
  const { userProfile, isLoadingProfile } = useUserProfile();
  const { verifySelfProof, isPending, isSuccess } = useVerifySelfProof();
  const { trackTransaction } = useDivviIntegration();

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

      if (!guardedAction) {
        toast.error(
          "Network configuration error. Please refresh and try again."
        );
        return;
      }

      setIsLoading(true);
      try {
        await guardedAction(async () => {
          const txHash = await verifySelfProof(proof, publicSignals);

          // Track high-value identity verification with Divvi
          await trackTransaction(txHash);
        });
        toast.success("Proof submitted for verification!");
      } catch (error) {
        console.error("Verification failed:", error);
        toast.error("Verification failed");
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [isConnected, address, verifySelfProof, guardedAction, trackTransaction]
  );

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
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className="relative w-16 h-16 mx-auto mb-6"
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <div className="absolute inset-0 rounded-full border-4 border-emerald-500/20"></div>
            <div className="absolute inset-0 rounded-full border-t-4 border-emerald-500"></div>
          </motion.div>
          <p className="text-slate-400 text-lg font-medium">
            {isPending ? "Submitting to blockchain..." : "Loading..."}
          </p>
          <div className="flex justify-center mt-4">
            <div className="flex space-x-1">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 bg-emerald-500 rounded-full"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                />
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!isConnected || !address) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4 py-8">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <motion.div
            className="text-center mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center">
              <AlertCircle className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Wallet Required
            </h1>
            <p className="text-slate-400">
              Connect your wallet to start the verification process
            </p>
          </motion.div>

          {/* Connect Wallet Card */}
          <motion.div
            className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="text-center">
              <h3 className="text-xl font-semibold text-white mb-3">
                Get Started
              </h3>
              <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                Connect your wallet to access identity verification and unlock
                premium creator benefits.
              </p>
              <Link href="/">
                <motion.button
                  className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-lg shadow-emerald-500/20"
                  whileTap={{ scale: 0.95 }}
                >
                  <Home className="w-5 h-5" />
                  Connect Wallet
                  <ArrowRight className="w-5 h-5" />
                </motion.button>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4 pt-36 md:pt-40 md:pb-6">
      <div className=" flex justify-between md:px-10 md:flex-row flex-col">
        <div>
          <motion.div
            className="text-center mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center justify-between mb-6">
              <Link
                href={userProfile?.isInfluencer ? "/influencersDashboard" : "/"}
              >
                <motion.button
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-400 bg-slate-800/50 hover:bg-slate-800 rounded-lg border border-slate-700/50 transition-all"
                  whileTap={{ scale: 0.95 }}
                >
                  <Home className="w-4 h-4" />
                  Back
                </motion.button>
              </Link>
              <span
                className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium border ${
                  isVerified
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                }`}
              >
                {isVerified ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Verified
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 mr-2" />
                    Unverified
                  </>
                )}
              </span>
            </div>

            <motion.div
              className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-3xl flex items-center justify-center relative"
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
            >
              <Shield className="w-12 h-12 text-white" />
              <motion.div
                className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-amber-400 to-amber-500 rounded-full flex items-center justify-center"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Sparkles className="w-4 h-4 text-white" />
              </motion.div>
            </motion.div>

            <h1 className="text-3xl font-bold text-white mb-4">
              {isVerified ? "✨ You're Verified!" : "Identity Verification"}
            </h1>
            <p className="text-slate-400 text-lg leading-relaxed">
              {isVerified
                ? "You have access to all premium features and campaigns"
                : "Unlock premium campaigns and earn up to 30% more"}
            </p>
          </motion.div>

          {/* Network Status */}
          {isConnected && (
            <motion.div
              className="mb-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <NetworkStatus className="bg-slate-800/60 border-slate-600/50" />
            </motion.div>
          )}
           {/* Verification Status Card */}
        <motion.div
          className={`mb-8 bg-gradient-to-br ${
            isVerified
              ? "from-emerald-500/10 to-emerald-600/5 border-emerald-500/20"
              : "from-slate-800/50 to-slate-900/50 border-slate-700/50"
          } backdrop-blur-xl border rounded-2xl overflow-hidden`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {isVerified ? (
            // Verified State
            <div className="p-8 text-center">
              <motion.div
                className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", duration: 0.6 }}
              >
                <CheckCircle className="w-10 h-10 text-white" />
              </motion.div>
              <h3 className="text-2xl font-bold text-white mb-3">
                Verification Complete! 🎉
              </h3>
              <p className="text-emerald-400 mb-6">
                You now have access to premium campaigns and higher earning
                rates
              </p>
              <div className="flex flex-col gap-3">
                <Link href="/marketplace">
                  <motion.button
                    className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-lg shadow-emerald-500/20"
                    whileTap={{ scale: 0.95 }}
                  >
                    <Star className="w-5 h-5" />
                    Explore Premium Campaigns
                    <ArrowRight className="w-5 h-5" />
                  </motion.button>
                </Link>
                {userProfile?.isInfluencer && (
                  <Link href="/influencersDashboard">
                    <motion.button
                      className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-slate-800/50 hover:bg-slate-800 text-slate-300 font-medium rounded-xl border border-slate-700/50 transition-all"
                      whileTap={{ scale: 0.95 }}
                    >
                      Go to Dashboard
                    </motion.button>
                  </Link>
                )}
              </div>
            </div>
          ) : (
            // Unverified State
            <div className="p-8">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-white mb-4">
                  Verify with Self Protocol
                </h3>
                <p className="text-slate-400 leading-relaxed">
                  Scan the QR code below with the Self app to complete secure
                  identity verification
                </p>
              </div>

              {selfApp && isConnected && isCorrectChain ? (
                <div className="text-center">
                  <motion.div
                    className="inline-block p-6 bg-white rounded-3xl mb-6 shadow-2xl"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <SelfQRcodeWrapper
                      selfApp={selfApp}
                      onSuccess={handleVerificationSuccess}
                      size={Math.min(220, window.innerWidth * 0.6)}
                    />
                  </motion.div>

                  <div className="space-y-2 text-xs text-slate-400 mb-6">
                    <p>
                      Wallet:{" "}
                      {`${address.substring(0, 8)}...${address.substring(
                        address.length - 6
                      )}`}
                    </p>
                    <p>Network: {currentNetwork.name}</p>
                  </div>

                  <motion.button
                    onClick={() => setShowBenefits(!showBenefits)}
                    className="flex items-center justify-center gap-2 mx-auto text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
                    whileTap={{ scale: 0.95 }}
                  >
                    <Gem className="w-4 h-4" />
                    {showBenefits ? "Hide" : "See"} Verification Benefits
                    <motion.div
                      animate={{ rotate: showBenefits ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ArrowRight className="w-4 h-4 rotate-90" />
                    </motion.div>
                  </motion.button>
                </div>
              ) : !isCorrectChain ? (
                <div className="text-center p-6 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                  <AlertCircle className="w-8 h-8 text-amber-400 mx-auto mb-3" />
                  <h4 className="text-lg font-semibold text-white mb-2">
                    Network Switch Required
                  </h4>
                  <p className="text-amber-400">
                    Please switch to {currentNetwork.name} to verify your
                    identity
                  </p>
                </div>
              ) : (
                <div className="text-center p-6">
                  <motion.div
                    className="w-12 h-12 mx-auto mb-4 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  />
                  <p className="text-slate-400">Initializing verification...</p>
                </div>
              )}
            </div>
          )}
        </motion.div>
        </div>
        {/* Header */}

       

        {/* Benefits Section */}
        <AnimatePresence>
          {(showBenefits || !isVerified) && !isVerified && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mb-8"
            >
              <motion.div
                className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-2xl p-6"
                initial={{ y: 20 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <h4 className="text-xl font-bold text-white mb-6 text-center flex items-center justify-center gap-2">
                  <Crown className="w-6 h-6 text-amber-400" />
                  Premium Creator Benefits
                </h4>
                <div className="grid grid-cols-1 gap-4">
                  {verificationBenefits.map((benefit, index) => (
                    <motion.div
                      key={benefit.title}
                      className="flex items-start gap-4 p-4 bg-slate-900/30 rounded-xl border border-slate-700/30"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      <div
                        className={`p-2 rounded-lg bg-gradient-to-br ${benefit.color}/20 border border-slate-600/30`}
                      >
                        <benefit.icon
                          className={`w-5 h-5 bg-gradient-to-br ${benefit.color} bg-clip-text text-transparent`}
                        />
                      </div>
                      <div>
                        <h5 className="font-semibold text-white mb-1">
                          {benefit.title}
                        </h5>
                        <p className="text-sm text-slate-400 leading-relaxed">
                          {benefit.description}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Security Features */}
        {!isVerified && (
          <motion.div
            className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-2xl p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h4 className="text-lg font-bold text-white mb-6 text-center flex items-center justify-center gap-2">
              <Shield className="w-5 h-5 text-blue-400" />
              Why Self Protocol?
            </h4>
            <div className="grid grid-cols-1 gap-4">
              {securityFeatures.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  className="flex items-start gap-3 p-3 bg-slate-900/20 rounded-lg"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <feature.icon className="w-5 h-5 text-blue-400 mt-0.5" />
                  <div>
                    <h5 className="font-medium text-white text-sm mb-1">
                      {feature.title}
                    </h5>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Registration CTA */}
        {isConnected &&
          (!userProfile?.isRegistered || !userProfile.isInfluencer) && (
            <motion.div
              className="mt-8 p-6 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-2xl text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Users className="w-8 h-8 text-purple-400 mx-auto mb-3" />
              <h4 className="text-lg font-semibold text-white mb-2">
                Not Registered Yet?
              </h4>
              <p className="text-slate-400 text-sm mb-4">
                Register as an influencer to start applying for campaigns
              </p>
              <Link href="/">
                <motion.button
                  className="flex items-center justify-center gap-2 mx-auto px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all"
                  whileTap={{ scale: 0.95 }}
                >
                  Register Now
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
              </Link>
            </motion.div>
          )}
      </div>
    </div>
  );
}

export default withNetworkGuard(SelfVerification);
