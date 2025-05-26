"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle,
  DollarSign,
  Shield,
  Star,
  Users,
  Zap,
} from "lucide-react";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useRouter } from "next/navigation";
import { useUserProfile } from "../../hooks/adsBazaar";

interface HeroSectionProps {
  setIsModalOpen: (isOpen: boolean) => void;
}

export default function HeroSection({ setIsModalOpen }: HeroSectionProps) {
  const [animationPhase, setAnimationPhase] = useState(0);
  const [isButtonPressed, setIsButtonPressed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { isConnected: wagmiConnected} = useAccount();
  const { userProfile, isLoadingProfile } = useUserProfile();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleGetStartedClick = async () => {
    try {
      setIsButtonPressed(true);
      await new Promise((resolve) => setTimeout(resolve, 100));
      setIsModalOpen(true);
    } catch (error) {
      console.error('Error opening modal:', error);
    } finally {
      setIsButtonPressed(false);
    }
  };



  const getDashboardUrl = useCallback(() => {
  if (!userProfile || isLoadingProfile) return "#";
  if (!userProfile.isRegistered) return "/";
  if (userProfile.isBusiness) return "/brandsDashBoard";
  if (userProfile.isInfluencer) return "/influencersDashboard";
  return "/";
}, [userProfile, isLoadingProfile]);


  const handleDashboardClick = useCallback(async () => {
  if (isLoadingProfile) return;
  try {
    const url = getDashboardUrl();
    if (url !== "#" && url !== "/") {
      router.push(url);
    }
  } catch (error) {
    console.error('Error navigating to dashboard:', error);
  }
}, [getDashboardUrl, isLoadingProfile]);


  // Animation cycle for floating elements
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationPhase((prev) => (prev + 1) % 3);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut", staggerChildren: 0.2 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  // Unified button rendering logic
  const renderActionButtons = () => {
    if (!mounted) {
      return (
        <div className="w-full max-w-sm mx-auto lg:mx-0">
          <div className="w-full bg-slate-600 text-slate-400 py-3 md:py-4 rounded-xl flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin mr-2"></div>
            Loading...
          </div>
        </div>
      );
    }

    if (!wagmiConnected) {
      return (
        <div className="w-full max-w-sm mx-auto lg:mx-0">
          <ConnectButton.Custom>
            {({ account, openAccountModal, openConnectModal, mounted: walletMounted }) => {
              const connected = walletMounted && account;
              return (
                <motion.button
                  onClick={connected ? openAccountModal : openConnectModal}
                  className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-medium py-3 md:py-4 rounded-xl transition-all duration-300 hover:shadow-xl flex items-center justify-center gap-2"
                  whileTap={{ scale: 0.95 }}
                  aria-label={connected ? "View Account" : "Connect Wallet"}
                >
                  {connected ? (
                    <span className="text-white font-medium truncate">
                      {account.displayName || account.address}
                    </span>
                  ) : (
                    <>
                      <span className="text-white font-medium">
                        Connect Wallet to Start
                      </span>
                    </>
                  )}
                </motion.button>
              );
            }}
          </ConnectButton.Custom>
        </div>
      );
    }

    if (userProfile?.isRegistered) {
      return (
        <div className="flex flex-col md:flex-row gap-4 w-full max-w-sm md:max-w-none mx-auto lg:mx-0">
          <motion.button
            className="flex-1 md:flex-none bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-medium py-3 md:py-4 px-6 md:px-8 rounded-xl transition-all duration-300 hover:shadow-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleDashboardClick}
            whileTap={{ scale: 0.95 }}
            disabled={isLoadingProfile}
            aria-label="Go to Dashboard"
          >
            {isLoadingProfile ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <Users className="w-5 h-5" />
                Go to Dashboard
              </>
            )}
          </motion.button>
          <button className="hidden md:block px-6 md:px-8 py-3 bg-transparent border border-slate-600 text-slate-200 font-medium rounded-xl hover:bg-slate-700/50 transition">
            Learn More
          </button>
        </div>
      );
    }

    return (
      <div className="flex flex-col md:flex-row gap-4 w-full max-w-sm md:max-w-none mx-auto lg:mx-0">
        <motion.button
          className="flex-1 md:flex-none bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-medium py-3 md:py-4 px-6 md:px-8 rounded-xl transition-all duration-300 hover:shadow-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleGetStartedClick}
          whileTap={{ scale: 0.95 }}
          disabled={isButtonPressed}
          aria-label="Get Started"
        >
          {isButtonPressed ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <>
              Get Started
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </motion.button>
        <button className="hidden md:block px-6 md:px-8 py-3 bg-transparent border border-slate-600 text-slate-200 font-medium rounded-xl hover:bg-slate-700/50 transition">
          Learn More
        </button>
      </div>
    );
  };

  return (
    <section className="relative min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 md:bg-gradient-to-br md:from-slate-900 md:via-slate-800 md:to-emerald-900 px-4 sm:px-6 lg:px-16 py-20 sm:py-12 lg:py-16 overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 md:hidden">
        <div className={`absolute top-10 left-4 w-20 h-20 bg-emerald-400/20 rounded-full blur-xl transition-all duration-3000 ${
          animationPhase === 0 ? "animate-bounce" : animationPhase === 1 ? "animate-pulse" : "animate-ping"
        }`}></div>
        <div className={`absolute top-32 right-8 w-16 h-16 bg-indigo-400/20 rounded-full blur-xl transition-all duration-3000 ${
          animationPhase === 1 ? "animate-bounce" : animationPhase === 2 ? "animate-pulse" : "animate-ping"
        }`}></div>
        <div className={`absolute bottom-32 left-8 w-24 h-24 bg-purple-400/20 rounded-full blur-xl transition-all duration-3000 ${
          animationPhase === 2 ? "animate-bounce" : animationPhase === 0 ? "animate-pulse" : "animate-ping"
        }`}></div>
        <div className="absolute top-20 left-1/4 w-2 h-2 bg-emerald-400 rounded-full animate-pulse opacity-60"></div>
        <div className="absolute top-40 right-1/3 w-1 h-1 bg-white rounded-full animate-ping opacity-40"></div>
        <div className="absolute bottom-40 left-1/3 w-3 h-3 bg-indigo-400 rounded-full animate-bounce opacity-50"></div>
      </div>

      {/* Main Content */}
      <motion.div
        className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8 mt-8 md:mt-20 lg:mt-40"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Left Content */}
        <div className="w-full lg:w-[60%] space-y-6 text-center lg:text-left">
          {/* Header Section */}
          <div>
            <motion.div
              className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-4 py-2 mb-4 md:hidden"
              variants={itemVariants}
            >
              <Zap className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span className="text-emerald-400 text-sm font-medium">
                Web3 Influencer  Economy
              </span>
            </motion.div>
            
            <motion.h1
              className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-white leading-tight"
              variants={itemVariants}
            >
              <span className="md:hidden ">
                Connect{" "}
                <span className="text-emerald-400 animate-pulse">Brands</span> with{" "}
                <span className="text-emerald-400 animate-pulse">Creators / Influencers</span>
                <br />
                <span className="text-xl block mt-2 bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                  Guaranteed Growth & Earnings
                </span>
              </span>
              <span className="hidden md:block">
                Connecting{" "}
                <span className="text-emerald-400">Brands, Businesses</span> with{" "}
                <span className="text-emerald-400">
                  Influencers, Content Creators
                </span>
                <br className="hidden sm:block" />{" "}
                <span className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl block mt-2">
                  For Measurable Growth & Guaranteed Earnings
                </span>
              </span>
            </motion.h1>
            
            <motion.p
              className="mt-4 sm:mt-6 text-base md:text-lg lg:text-xl xl:text-2xl text-slate-300 leading-relaxed max-w-sm md:max-w-none mx-auto lg:mx-0"
              variants={itemVariants}
            >
              <span className="md:hidden">
                Verified creators / Influencers, secure crypto payments, transparent campaigns with real results.
              </span>
              <span className="hidden md:block">
                The trusted marketplace where verified creators help brands increase visibility and sales, with transparent campaigns, secure payments, and performance tracking.
              </span>
            </motion.p>
          </div>

          {/* CTA Buttons */}
          <motion.div className="pt-2" variants={itemVariants}>
            {renderActionButtons()}
          </motion.div>

          {/* Integration Features */}
          <motion.div
            className="grid grid-cols-3 gap-4 pt-6 md:pt-8 max-w-lg mx-auto lg:mx-0"
            variants={containerVariants}
          >
            <motion.div
              className="bg-slate-800/60 md:bg-transparent backdrop-blur-sm border border-slate-700/50 md:border-slate-600 rounded-lg p-3 text-center"
              variants={itemVariants}
            >
              <Shield className="w-5 h-5 md:w-6 md:h-6 mx-auto mb-2 text-emerald-400 md:border md:rounded-full md:p-1" />
              <div className="text-xs md:text-sm text-slate-300">
                Self Protocol Verified
              </div>
            </motion.div>
            
            <motion.div
              className="bg-slate-800/60 md:bg-transparent backdrop-blur-sm border border-slate-700/50 md:border-slate-600 rounded-lg p-3 text-center"
              variants={itemVariants}
            >
              <DollarSign className="w-5 h-5 md:w-6 md:h-6 mx-auto mb-2 text-indigo-400 md:border md:rounded-full md:p-1" />
              <div className="text-xs md:text-sm text-slate-300">
                Celo Blockchain
              </div>
            </motion.div>
            
            <motion.div
              className="bg-slate-800/60 md:bg-transparent backdrop-blur-sm border border-slate-700/50 md:border-slate-600 rounded-lg p-3 text-center"
              variants={itemVariants}
            >
              <Users className="w-5 h-5 md:w-6 md:h-6 mx-auto mb-2 text-purple-400 md:border md:rounded-full md:p-1" />
              <div className="text-xs md:text-sm text-slate-300">
                Farcaster MiniApp
              </div>
            </motion.div>
          </motion.div>

          {/* Trust Indicators (Mobile Only) */}
          <motion.div
            className="flex md:hidden justify-center items-center gap-4 pt-6 opacity-60"
            variants={itemVariants}
          >
            <div className="flex items-center gap-1">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span className="text-xs text-slate-400">Secured</span>
            </div>
            <div className="w-1 h-1 bg-slate-600 rounded-full"></div>
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-400" />
              <span className="text-xs text-slate-400">Reliable</span>
            </div>
            <div className="w-1 h-1 bg-slate-600 rounded-full"></div>
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4 text-indigo-400" />
              <span className="text-xs text-slate-400">Trusted</span>
            </div>
          </motion.div>
        </div>

        {/* Right Content - Campaign Card (Desktop Only) */}
        <div className="hidden md:block w-full lg:w-1/3 mt-10 lg:mt-0">
          <div className="relative w-full max-w-sm sm:max-w-md mx-auto">
            <div className="absolute -top-6 -left-6 w-48 h-48 md:w-64 md:h-64 bg-emerald-500/10 rounded-full filter blur-3xl"></div>
            <div className="absolute -bottom-10 -right-10 w-48 h-48 md:w-64 md:h-64 bg-indigo-500/10 rounded-full filter blur-3xl"></div>
            <div className="bg-white dark:bg-slate-800 border border-slate-700/50 rounded-2xl shadow-xl overflow-hidden z-10 relative">
              <div className="bg-gradient-to-r from-slate-700 to-slate-800 p-4 sm:p-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg sm:text-xl font-bold text-white">
                    Featured Campaigns
                  </h3>
                  <span className="text-emerald-400 text-xs sm:text-sm font-medium">
                    For Influencers
                  </span>
                </div>
              </div>
              <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                <div className="bg-slate-100 dark:bg-slate-700/40 rounded-xl p-4 sm:p-6 hover:shadow-md transition">
                  <div className="flex justify-between items-start mb-3 sm:mb-4">
                    <div>
                      <span className="bg-emerald-500 text-white text-xs font-bold px-2 py-1 rounded">
                        PREMIUM
                      </span>
                      <h3 className="text-base sm:text-lg font-semibold mt-2 text-slate-800 dark:text-slate-100">
                        Tech Product Launch
                      </h3>
                    </div>
                    <span className="text-emerald-500 font-bold text-sm sm:text-base">
                      1,500 cUSD
                    </span>
                  </div>
                  <div className="space-y-2 sm:space-y-3 mb-3 sm:mb-4">
                    <div className="flex items-center text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                      <CheckCircle
                        size={14}
                        className="text-emerald-500 mr-2 flex-shrink-0"
                      />
                      <span>10+ influencers needed</span>
                    </div>
                    <div className="flex items-center text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                      <CheckCircle
                        size={14}
                        className="text-emerald-500 mr-2 flex-shrink-0"
                      />
                      <span>Tech audience focus</span>
                    </div>
                  </div>
                  <button className="w-full bg-emerald-500 text-white py-2 px-4 rounded-lg hover:bg-emerald-600 transition flex items-center justify-center text-sm sm:text-base">
                    Apply Now
                  </button>
                </div>
                <div className="bg-slate-100 dark:bg-slate-700/40 rounded-xl p-4 sm:p-6 opacity-70">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="bg-slate-500 text-white text-xs font-bold px-2 py-1 rounded">
                        NEW
                      </span>
                      <h3 className="text-base sm:text-lg font-semibold mt-2 text-slate-800 dark:text-slate-100">
                        Fashion Brand Promo
                      </h3>
                    </div>
                    <span className="text-emerald-500 font-bold text-sm sm:text-base">
                      800 cUSD
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}