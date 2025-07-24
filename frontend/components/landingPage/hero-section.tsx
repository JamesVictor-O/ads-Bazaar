"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, easeInOut } from "framer-motion";
import {
  ArrowRight,
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
import { usePlatformStats } from "../../hooks/usePlatformStats";
import { formatNumber } from "@/utils/format";
import Link from "next/link";
import Image from "next/image";
import { CurrencySelector } from "../CurrencySelector";
import { SupportedCurrency } from "@/lib/mento-simple";

interface HeroSectionProps {
  setIsModalOpen: (isOpen: boolean) => void;
}

export default function HeroSection({ setIsModalOpen }: HeroSectionProps) {
  const [animationPhase, setAnimationPhase] = useState(0);
  const [isButtonPressed, setIsButtonPressed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [displayCurrency, setDisplayCurrency] = useState<SupportedCurrency>("cUSD");
  const { isConnected: wagmiConnected } = useAccount();
  const { userProfile, isLoadingProfile } = useUserProfile();

  // Debug logging
  useEffect(() => {
    console.log("HeroSection userProfile state:", {
      userProfile,
      isLoadingProfile,
      isRegistered: userProfile?.isRegistered,
      isBusiness: userProfile?.isBusiness,
      isInfluencer: userProfile?.isInfluencer,
    });
  }, [userProfile, isLoadingProfile]);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const { stats, isLoading: isLoadingStats } = usePlatformStats(displayCurrency);

  const handleGetStartedClick = async () => {
    try {
      setIsButtonPressed(true);
      await new Promise((resolve) => setTimeout(resolve, 100));
      setIsModalOpen(true);
    } catch (error) {
      console.error("Error opening modal:", error);
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
      console.error("Error navigating to dashboard:", error);
    }
  }, [getDashboardUrl, isLoadingProfile, router]);

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
      transition: { duration: 0.6, ease: easeInOut, staggerChildren: 0.2 },
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
            {({
              account,
              openAccountModal,
              openConnectModal,
              mounted: walletMounted,
            }) => {
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
          <Link href={"/learn"} passHref>
            <button className="flex-1 md:flex-none px-6 md:px-8 py-3 bg-transparent border border-slate-600 text-slate-200 font-medium rounded-xl hover:bg-slate-700/50 transition">
              Learn More
            </button>
          </Link>
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
              Start Promotion/Start Earning Now
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </motion.button>
        <Link href={"/learn"} passHref>
          <button className="flex-1 md:flex-none px-6 md:px-8 py-3 bg-transparent border border-slate-600 text-slate-200 font-medium rounded-xl hover:bg-slate-700/50 transition">
            Learn More
          </button>
        </Link>
      </div>
    );
  };

  return (
    <section className="relative min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 md:bg-gradient-to-br md:from-slate-900 md:via-slate-800 md:to-emerald-900 px-4 sm:px-6 lg:px-16 pt-24 sm:pt-40 lg:pt-2 pb-20 sm:pb-12 lg:pb-16 overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 md:hidden">
        <div
          className={`absolute top-10 left-4 w-20 h-20 bg-emerald-400/20 rounded-full blur-xl transition-all duration-3000 ${
            animationPhase === 0
              ? "animate-bounce"
              : animationPhase === 1
              ? "animate-pulse"
              : "animate-ping"
          }`}
        ></div>
        <div
          className={`absolute top-32 right-8 w-16 h-16 bg-indigo-400/20 rounded-full blur-xl transition-all duration-3000 ${
            animationPhase === 1
              ? "animate-bounce"
              : animationPhase === 2
              ? "animate-pulse"
              : "animate-ping"
          }`}
        ></div>
        <div
          className={`absolute bottom-32 left-8 w-24 h-24 bg-purple-400/20 rounded-full blur-xl transition-all duration-3000 ${
            animationPhase === 2
              ? "animate-bounce"
              : animationPhase === 0
              ? "animate-pulse"
              : "animate-ping"
          }`}
        ></div>
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
              className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-4 py-2 mb-4"
              variants={itemVariants}
            >
              <Zap className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span className="text-emerald-400 text-sm font-medium">
                Web3 Creator Economy
              </span>
            </motion.div>

            <motion.h1
              className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-white leading-tight"
              variants={itemVariants}
            >
              <span className="md:hidden">
                <span className="text-emerald-400 animate-pulse">Amplify</span>{" "}
                Your Brand,{" "}
                <span className="text-emerald-400 animate-pulse">Monetize</span>{" "}
                Your Influence
                <br />
                <span className="text-lg block mt-2 bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                  <span className="text-emerald-400 animate-pulse">
                    Where Every Post Pays
                  </span>{" "}
                </span>
              </span>
              <span className="hidden md:block">
                <span className="text-emerald-400">Amplify</span> Your Brand,{" "}
                <span className="text-emerald-400">Monetize</span> Your
                Influence
                <br className="hidden sm:block" />
                <span className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl block mt-2">
                  Where Every Post Pays &{" "}
                  <span className="bg-gradient-to-r from-emerald-400 to-indigo-400 bg-clip-text text-transparent">
                    Every Campaign Converts
                  </span>
                </span>
              </span>
            </motion.h1>
            <motion.p
              className="mt-4 sm:mt-6 text-base md:text-lg lg:text-xl text-slate-300 leading-relaxed max-w-sm md:max-w-none mx-auto lg:mx-0"
              variants={itemVariants}
            >
              <span className="md:hidden">
                Your audience is your asset. Time to cash in with brands that
                value your influence.
              </span>
              <span className="hidden md:block">
                The trusted marketplace where verified creators help brands
                increase visibility and sales, with transparent campaigns,
                secure payments, and performance tracking.
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
              className="bg-slate-800/60 md:bg-transparent backdrop-blur-sm border border-slate-700/50 md:border-slate-600 rounded-lg p-3 text-center hover:bg-slate-700/50 transition-all duration-300"
              variants={itemVariants}
              whileHover={{ scale: 1.05 }}
            >
              <Shield className="w-5 h-5 md:w-6 md:h-6 mx-auto mb-2 text-emerald-400" />
              <div className="text-xs md:text-sm text-slate-300">
                Mento StableCoins Supported
              </div>
            </motion.div>

            <motion.div
              className="bg-slate-800/60 md:bg-transparent backdrop-blur-sm border border-slate-700/50 md:border-slate-600 rounded-lg p-3 text-center hover:bg-slate-700/50 transition-all duration-300"
              variants={itemVariants}
              whileHover={{ scale: 1.05 }}
            >
              <DollarSign className="w-5 h-5 md:w-6 md:h-6 mx-auto mb-2 text-indigo-400" />
              <div className="text-xs md:text-sm text-slate-300">
                Celo Blockchain
              </div>
            </motion.div>

            <motion.div
              className="bg-slate-800/60 md:bg-transparent backdrop-blur-sm border border-slate-700/50 md:border-slate-600 rounded-lg p-3 text-center hover:bg-slate-700/50 transition-all duration-300"
              variants={itemVariants}
              whileHover={{ scale: 1.05 }}
            >
              <Users className="w-5 h-5 md:w-6 md:h-6 mx-auto mb-2 text-purple-400" />
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
        <div className="hidden md:block w-full lg:w-1/3 mt-10 lg:mt-0 ">
          <div className="relative w-full rounded-full  shadow-lg">
            <Image
              src="/side2.png"
              alt="Campaign Card"
              width={600}
              height={300}
              className="w-full"
            />
            <Image src={"/twitter.png"} width={500} height={400} alt="X" className="w-24 h-24 absolute top-60 left-6"/>
            <Image src={"/tiktok.png"} width={500} height={400} alt="X" className="w-24 h-24 absolute top-60 right-4"/>
            <Image src={"/facebook.png"} width={500} height={400} alt="X" className="w-24 h-24 absolute bottom-8 right-60"/>
          </div>
        </div>
      </motion.div>

      {/* Platform Statistics */}
      <motion.div
        className="mt-16 md:mt-24"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
            Join Our Growing Community
          </h2>
          <p className="text-slate-400">
            Trusted by businesses and creators worldwide
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
          {[
            {
              value: isLoadingStats ? "..." : formatNumber(stats.totalUsers),
              label: "Total Users",
              icon: "👥",
              color: "from-blue-400 to-blue-600",
            },
            {
              value: isLoadingStats
                ? "..."
                : formatNumber(stats.totalBusinesses),
              label: "Businesses",
              icon: "🏢",
              color: "from-emerald-400 to-emerald-600",
            },
            {
              value: isLoadingStats
                ? "..."
                : formatNumber(stats.totalInfluencers),
              label: "Creators",
              icon: "⭐",
              color: "from-purple-400 to-purple-600",
            },
            {
              value: isLoadingStats
                ? "..."
                : `${formatNumber(stats.totalEscrowAmount)} ${stats.displayCurrency}`,
              label: "Active Escrow",
              icon: "💰",
              color: "from-amber-400 to-amber-600",
            },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              className="text-center p-4 md:p-6 bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-xl hover:bg-slate-800/60 transition-all duration-300"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 * index }}
              whileHover={{ scale: 1.05 }}
            >
              <div className="text-2xl md:text-3xl mb-2">{stat.icon}</div>
              <div
                className={`text-2xl md:text-3xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent mb-1`}
              >
                {stat.value}
              </div>
              <div className="text-sm md:text-base text-slate-400">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Live indicator and Currency Selector */}
        <div className="flex flex-col md:flex-row justify-center items-center gap-4 mt-6">
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 rounded-full">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
            <span className="text-xs text-slate-400">
              Live on Celo Blockchain
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Display currency:</span>
            <CurrencySelector
              selectedCurrency={displayCurrency}
              onCurrencyChange={setDisplayCurrency}
              className="scale-75"
            />
          </div>
        </div>

        {/* Escrow Breakdown */}
        {!isLoadingStats && stats.escrowBreakdown.length > 0 && (
          <motion.div
            className="mt-16 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.6 }}
          >
            <details className="bg-slate-800/30 backdrop-blur-sm border border-slate-700/30 rounded-xl p-4">
              <summary className="cursor-pointer text-slate-300 hover:text-white transition-colors select-none">
                <span className="text-sm font-medium">View escrow breakdown by currency</span>
              </summary>
              
              <div className="mt-4 space-y-3">
                {stats.escrowBreakdown.map((item) => (
                  <div key={item.currency} className="flex items-center justify-between p-3 bg-slate-900/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">
                        {item.currency === 'cUSD' ? '🇺🇸' : 
                         item.currency === 'cEUR' ? '🇪🇺' :
                         item.currency === 'cREAL' ? '🇧🇷' :
                         item.currency === 'cKES' ? '🇰🇪' :
                         item.currency === 'eXOF' ? '🌍' :
                         item.currency === 'cNGN' ? '🇳🇬' : '💰'}
                      </span>
                      <span className="font-medium text-white">{item.currency}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-white">
                        {formatNumber(item.amount)} {item.currency}
                      </div>
                      {item.currency !== displayCurrency && (
                        <div className="text-xs text-slate-400">
                          ≈ {formatNumber(item.convertedAmount)} {displayCurrency}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </details>
          </motion.div>
        )}
      </motion.div>
      {/* END OF PLATFORM STATISTICS */}
    </section>
  );
}
