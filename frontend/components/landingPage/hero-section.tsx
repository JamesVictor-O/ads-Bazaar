"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle,
  TrendingUp,
  DollarSign,
  Shield,
  Star,
  Users,
  Zap,
} from "lucide-react";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";

interface HeroSectionProps {
  setIsModalOpen: (isOpen: boolean) => void;
}

export default function HeroSection({ setIsModalOpen }: HeroSectionProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [animationPhase, setAnimationPhase] = useState(0);
  const [isButtonPressed, setIsButtonPressed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { isConnected: wagmiConnected, address } = useAccount();

  useEffect(() => {
    setMounted(true);
  }, []);

  // const handleGetStartedClick = () => {
  //   console.log("okay");
  //   setAnimationPhase(0);
  //   setIsModalOpen(true);
  // };
  const handleGetStartedClick = async () => {
    console.log("Button clicked");
    setIsButtonPressed(true);
    setAnimationPhase(0);

    // Small delay to ensure animations complete
    await new Promise((resolve) => setTimeout(resolve, 50));

    setIsModalOpen(true);
    setIsButtonPressed(false);
  };

  // Animation cycle for mobile floating elements
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationPhase((prev) => (prev + 1) % 3);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Animation variants for mobile
  const mobileContainerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut", staggerChildren: 0.2 },
    },
  };

  const mobileItemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  return (
    <section className="relative min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 px-4 sm:px-6 lg:px-16 py-10 sm:py-12 lg:py-16 overflow-hidden md:bg-gradient-to-br md:from-slate-900 md:via-slate-800 md:to-emerald-900">
      {/* Mobile Layout (max-width: 767px) */}
      <motion.div
        className="md:hidden relative z-10 px-4 py-8 space-y-8"
        variants={mobileContainerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
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
          {/* Floating particles */}
          <div className="absolute top-20 left-1/4 w-2 h-2 bg-emerald-400 rounded-full animate-pulse opacity-60"></div>
          <div className="absolute top-40 right-1/3 w-1 h-1 bg-white rounded-full animate-ping opacity-40"></div>
          <div className="absolute bottom-40 left-1/3 w-3 h-3 bg-indigo-400 rounded-full animate-bounce opacity-50"></div>
        </div>

        {/* Header */}
        <div className="text-center space-y-6 pt-8">
          <motion.div
            className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-4 py-2 mb-4"
            variants={mobileItemVariants}
          >
            <Zap className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span className="text-emerald-400 text-sm font-medium">
              Web3 Creator Economy
            </span>
          </motion.div>

          <motion.h1
            className="text-2xl font-bold text-white leading-tight px-2"
            variants={mobileItemVariants}
          >
            Connect{" "}
            <span className="text-emerald-400 animate-pulse">Brands</span> with{" "}
            <span className="text-emerald-400 animate-pulse">Creators</span>
            <br />
            <span className="text-xl block mt-2 bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
              Guaranteed Growth & Earnings
            </span>
          </motion.h1>

          <motion.p
            className="text-slate-300 text-base leading-relaxed px-4 max-w-sm mx-auto"
            variants={mobileItemVariants}
          >
            Verified creators, secure crypto payments, transparent campaigns
            with real results.
          </motion.p>
        </div>

        {/* Stats Cards */}
        <motion.div
          className="grid grid-cols-3 gap-3 px-4 max-w-sm mx-auto"
          variants={mobileContainerVariants}
        >
          {[
            {
              icon: TrendingUp,
              label: "Verified",
              value: "1K+",
              color: "emerald-400",
            },
            {
              icon: DollarSign,
              label: "Paid Out",
              value: "$2M+",
              color: "indigo-400",
            },
            {
              icon: Shield,
              label: "Secure",
              value: "100%",
              color: "purple-400",
            },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              className={`bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 rounded-xl p-3 text-center transform transition-all duration-500 hover:scale-105 ${
                index === animationPhase
                  ? "animate-pulse border-emerald-500/50"
                  : ""
              }`}
              variants={mobileItemVariants}
            >
              <stat.icon
                className={`w-5 h-5 mx-auto mb-2 text-${stat.color}`}
              />
              <div className={`text-lg font-bold text-${stat.color}`}>
                {stat.value}
              </div>
              <div className="text-xs text-slate-400">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>

       

        {/* CTA Section */}
        <motion.div
          className="px-4 space-y-4 pb-8"
          variants={mobileContainerVariants}
        >
          {mounted && wagmiConnected ? (
            <div className="space-y-3 max-w-sm mx-auto relative">
              {/* Debugging overlay - remove in production */}
              <div className="absolute inset-0 border-2 border-red-500 z-[9998] pointer-events-none opacity-20"></div>

              <motion.button
                className={`w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-medium py-4 rounded-xl transition-all duration-300 hover:shadow-xl flex items-center justify-center relative z-50 ${
                  isButtonPressed ? "scale-95" : "hover:scale-102"
                }`}
                onClick={handleGetStartedClick}
                onTouchStart={() => setIsHovered(true)}
                onTouchEnd={() => setIsHovered(false)}
                whileTap={{ scale: 0.95 }}
                disabled={isButtonPressed}
              >
                {!isButtonPressed ? (
                  <>
                    Get Started
                    <ArrowRight size={18} className="ml-2" />
                  </>
                ) : (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white rounded-full animate-spin"></div>
                  </div>
                )}
              </motion.button>

            </div>
          ) : (
            <motion.div
              className="max-w-sm mx-auto"
              variants={mobileItemVariants}
            >
              <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 text-white w-full py-4 rounded-xl transition-all duration-300 hover:shadow-xl hover:scale-102 pt-10">
                <ConnectButton.Custom>
                  {({
                    account,
                    openAccountModal,
                    openConnectModal,
                    mounted,
                  }) => {
                    const connected = mounted && account;
                    return (
                      <motion.button
                        onClick={
                          connected ? openAccountModal : openConnectModal
                        }
                        className="w-full flex items-center justify-center gap-2"
                        whileTap={{ scale: 0.95 }}
                      >
                        {connected ? (
                          <span className="text-white font-medium">
                            {address}
                          </span>
                        ) : (
                          <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
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
            </motion.div>
          )}

          <motion.div
            className="flex justify-center items-center gap-4 pt-10 opacity-60"
            variants={mobileItemVariants}
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
        </motion.div>
      </motion.div>

      {/* Desktop Layout (min-width: 768px) */}
      <div className="hidden md:flex flex-col lg:flex-row items-center justify-between gap-8 md:mt-40 lg:gap-12">
        {/* Left Content */}
        <div className="w-full lg:w-[60%] space-y-6 text-center lg:text-left mt-8 sm:mt-12 lg:mt-0">
          <div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight">
              Connecting{" "}
              <span className="text-emerald-400">Brands, Businesses</span> with{" "}
              <span className="text-emerald-400">
                Influencers, Content Creators
              </span>
              <br className="hidden sm:block" />{" "}
              <span className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl block mt-2">
                For Measurable Growth & Guaranteed Earnings
              </span>
            </h1>
            <p className="mt-4 sm:mt-6 text-lg sm:text-xl md:text-2xl text-slate-300">
              The trusted marketplace where verified creators help brands
              increase visibility and sales, with transparent campaigns, secure
              payments, and performance tracking.
            </p>
          </div>
          {mounted && wagmiConnected ? (
            <div className="flex flex-wrap justify-center lg:justify-start gap-4 pt-2">
              <button
                className="px-6 sm:px-8 py-3 bg-emerald-500 text-white font-medium rounded-lg hover:bg-emerald-600 transition shadow-lg flex items-center group"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onClick={handleGetStartedClick}
              >
                Get Started
                <ArrowRight
                  size={18}
                  className={`ml-2 transition-transform duration-300 ${
                    isHovered ? "transform translate-x-1" : ""
                  }`}
                />
              </button>
              <button className="px-6 sm:px-8 py-3 bg-transparent border border-slate-600 text-slate-200 font-medium rounded-lg hover:bg-slate-700/50 transition">
                Learn More
              </button>
            </div>
          ) : (
            <div className="bg-emerald-500 text-white w-[13rem] px-8 py-3 rounded-lg hover:bg-emerald-600 transition-all shadow-lg">
              <ConnectButton.Custom>
                {({ account, openAccountModal, openConnectModal, mounted }) => {
                  const connected = mounted && account;
                  return (
                    <div>
                      {connected ? (
                        <button
                          onClick={openAccountModal}
                          className="flex items-center"
                        >
                          <span className="text-white font-medium">
                            {account.address}
                          </span>
                        </button>
                      ) : (
                        <button
                          onClick={openConnectModal}
                          className="flex items-center"
                        >
                          <span className="text-white font-medium">
                            Connect Wallet
                          </span>
                        </button>
                      )}
                    </div>
                  );
                }}
              </ConnectButton.Custom>
            </div>
          )}

          <div className="grid grid-cols-3 gap-2 sm:gap-4 md:gap-6 pt-6 md:pt-8 max-w-lg mx-auto lg:mx-0">
            <div className="text-center border rounded-lg py-2 sm:py-3 px-1 sm:px-2">
              <div className="flex justify-center mb-1 sm:mb-2">
                <TrendingUp className="h-4 w-4 sm:h-6 sm:w-6 text-emerald-400 border rounded-full p-1" />
              </div>
              <p className="text-xs sm:text-sm text-slate-300">
                Verified Influencers
              </p>
            </div>
            <div className="text-center border rounded-lg py-2 sm:py-3 px-1 sm:px-2">
              <div className="flex justify-center mb-1 sm:mb-2">
                <DollarSign className="h-4 w-4 sm:h-6 sm:w-6 text-emerald-400 border rounded-full p-1" />
              </div>
              <p className="text-xs sm:text-sm text-slate-300">
                Crypto Payments
              </p>
            </div>
            <div className="text-center border rounded-lg py-2 sm:py-3 px-1 sm:px-2">
              <div className="flex justify-center mb-1 sm:mb-2">
                <Shield className="h-4 w-4 sm:h-6 sm:w-6 text-emerald-400 border rounded-full p-1" />
              </div>
              <p className="text-xs sm:text-sm text-slate-300">
                Blockchain Secured
              </p>
            </div>
          </div>
        </div>

        {/* Right Content - Campaign Card */}
        <div className="w-full lg:w-1/3 flex justify-center mt-10 lg:mt-0">
          <div className="relative w-full max-w-sm sm:max-w-md">
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
      </div>
    </section>
  );
}
