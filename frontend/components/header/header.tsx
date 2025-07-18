"use client";
import React, { useState, useEffect } from "react";
import { Menu, X, Copy, ChevronDown, User, Wallet, Zap } from "lucide-react";
import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useBalance } from "wagmi";
import { cUSDContractConfig } from "../../lib/contracts";
import { useUserProfile } from "../../hooks/adsBazaar";
import { motion } from "framer-motion";

interface HeaderProps {
  setActiveTab?: (tab: string) => void;
}

const Header: React.FC<HeaderProps> = ({ setActiveTab }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const { address, isConnected } = useAccount();
  const { data: celoBalance } = useBalance({
    address: address,
  });

  const { data: cUSDBalanceData } = useBalance({
    address: address,
    token: cUSDContractConfig.address,
  });

  const { userProfile, isLoadingProfile } = useUserProfile();

  const shouldShowDashboard =
    userProfile?.isRegistered &&
    (userProfile.isBusiness || userProfile.isInfluencer);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const getDashboardUrl = () => {
    if (!userProfile || isLoadingProfile) return "#";
    if (!userProfile.isRegistered) return "/";
    if (userProfile.isBusiness) return "/brandsDashBoard";
    if (userProfile.isInfluencer) return "/influencersDashboard";
    return "/";
  };

  const handleNavClick = (tab: string) => {
    if (setActiveTab) {
      setActiveTab(tab);
    }
    setMobileMenuOpen(false);
  };

  const truncateAddress = (addr?: string) => {
    if (!addr) return "";
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const copyAddress = async () => {
    if (address) {
      await navigator.clipboard.writeText(address);
      // You might want to add a toast notification here
    }
  };

  if (!isMounted) {
    return null;
  }

  return (
    <header className="fixed h-20 sm:h-28 w-full z-50 transition-all duration-300 bg-slate-900/95 backdrop-blur-sm shadow-lg py-2">
      <div className="h-full w-full px-4 lg:px-8 flex justify-between items-center">
        {/* Logo */}
        <Link href={"/"}>
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg">
              <span className="font-bold text-white text-sm sm:text-lg">
                AB
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-white">
              Ads-Bazaar
            </h1>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          {shouldShowDashboard && (
            <Link
              className={`font-medium text-slate-200 hover:text-white hover:underline decoration-emerald-400 decoration-2 underline-offset-8 transition ${
                isLoadingProfile ? "opacity-50 cursor-not-allowed" : ""
              }`}
              href={getDashboardUrl()}
              onClick={(e) => {
                if (isLoadingProfile) {
                  e.preventDefault();
                }
              }}
            >
              Dashboard
            </Link>
          )}
          <Link
            href={"/marketplace"}
            className="font-medium text-slate-200 hover:text-white hover:underline decoration-emerald-400 decoration-2 underline-offset-8 transition"
          >
            Marketplace
          </Link>
          {isConnected && (
            <Link href="/auto-approval">
              <motion.button
                className="flex items-center gap-2 px-4 py-2 text-slate-300 hover:text-white transition-colors"
                whileTap={{ scale: 0.95 }}
              >
                <Zap className="w-4 h-4" />
                Auto-Approval
              </motion.button>
            </Link>
          )}
          {isConnected && (
            <Link href="/disputeresolution">
              <motion.button
                className="flex items-center gap-2 px-4 py-2 text-slate-300 hover:text-white transition-colors"
                whileTap={{ scale: 0.95 }}
              >
                <Zap className="w-4 h-4" />
                Disputes
              </motion.button>
            </Link>
          )}
        </nav>

        {/* Right Side Actions */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          {isConnected ? (
            <>
              {/* Desktop User Profile */}
              <div className="hidden sm:block relative">
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center space-x-2 bg-slate-800/60 hover:bg-slate-800 px-3 py-2 rounded-lg transition-all"
                >
                  <div className="h-8 w-8 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center">
                    <User size={16} className="text-white" />
                  </div>
                  <span className="text-slate-200 font-medium hidden md:block">
                    {userProfile?.username ? `@${userProfile.username}` : truncateAddress(address)}
                  </span>
                  <ChevronDown size={16} className="text-slate-400" />
                </button>

                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-80 rounded-xl shadow-2xl bg-slate-800 border border-slate-700 z-50">
                    <div className="p-4">
                      {/* Address Section */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-2">
                          <span className="text-green-400 text-xs">●</span>
                          <span className="text-slate-200 font-medium text-sm">
                            {userProfile?.username ? `@${userProfile.username}` : truncateAddress(address)}
                          </span>
                        </div>
                        <button
                          onClick={copyAddress}
                          className="p-1.5 hover:bg-slate-700 rounded transition-colors"
                        >
                          <Copy
                            size={14}
                            className="text-slate-400 hover:text-slate-200"
                          />
                        </button>
                      </div>

                      {/* Balance Section */}
                      <div className="bg-slate-900/50 rounded-lg p-3 mb-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <Wallet size={16} className="text-emerald-400" />
                          <span className="text-slate-300 font-medium text-sm">
                            Wallet Balance
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="text-center p-2 bg-slate-800 rounded">
                            <div className="text-slate-400 text-xs">CELO</div>
                            <div className="text-slate-200 font-medium">
                              {celoBalance?.formatted
                                ? `${parseFloat(celoBalance.formatted).toFixed(
                                    2
                                  )}`
                                : "0.00"}
                            </div>
                          </div>
                          <div className="text-center p-2 bg-slate-800 rounded">
                            <div className="text-slate-400 text-xs">cUSD</div>
                            <div className="text-slate-200 font-medium">
                              {cUSDBalanceData?.formatted
                                ? `${parseFloat(
                                    cUSDBalanceData.formatted
                                  ).toFixed(2)}`
                                : "0.00"}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Registration Status */}
                      {userProfile && (
                        <div className="text-center">
                          <span
                            className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium ${
                              !userProfile.isRegistered
                                ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                                : userProfile.isBusiness
                                ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                                : "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                            }`}
                          >
                            {!userProfile.isRegistered
                              ? "Not Registered"
                              : userProfile.isBusiness
                              ? "Business Account"
                              : "Influencer Account"}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile User Profile - Compact Version */}
              <div className="sm:hidden">
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center space-x-2 bg-slate-800/60 hover:bg-slate-800 px-2 py-2 rounded-lg transition-all"
                >
                  <div className="h-7 w-7 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center">
                    <User size={14} className="text-white" />
                  </div>
                  <ChevronDown size={14} className="text-slate-400" />
                </button>

                {profileDropdownOpen && (
                  <div className="absolute right-4 mt-2 w-72 rounded-xl shadow-2xl bg-slate-800 border border-slate-700 z-50">
                    <div className="p-4">
                      {/* Mobile Address Section */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <span className="text-green-400 text-xs">●</span>
                          <span className="text-slate-200 font-medium text-sm">
                            {userProfile?.username ? `@${userProfile.username}` : truncateAddress(address)}
                          </span>
                        </div>
                        <button
                          onClick={copyAddress}
                          className="p-1.5 hover:bg-slate-700 rounded transition-colors"
                        >
                          <Copy
                            size={14}
                            className="text-slate-400 hover:text-slate-200"
                          />
                        </button>
                      </div>

                      {/* Mobile Balance Section - Stacked Layout */}
                      <div className="bg-slate-900/50 rounded-lg p-3 mb-3">
                        <div className="flex items-center space-x-2 mb-2">
                          <Wallet size={14} className="text-emerald-400" />
                          <span className="text-slate-300 font-medium text-sm">
                            Balance
                          </span>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400 text-xs">CELO</span>
                            <span className="text-slate-200 font-medium text-sm">
                              {celoBalance?.formatted
                                ? `${parseFloat(celoBalance.formatted).toFixed(
                                    2
                                  )}`
                                : "0.00"}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400 text-xs">cUSD</span>
                            <span className="text-slate-200 font-medium text-sm">
                              {cUSDBalanceData?.formatted
                                ? `${parseFloat(
                                    cUSDBalanceData.formatted
                                  ).toFixed(2)}`
                                : "0.00"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Mobile Registration Status */}
                      {userProfile && (
                        <div className="text-center">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                              !userProfile.isRegistered
                                ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                                : userProfile.isBusiness
                                ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                                : "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                            }`}
                          >
                            {!userProfile.isRegistered
                              ? "Not Registered"
                              : userProfile.isBusiness
                              ? "Business"
                              : "Influencer"}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile menu button */}
              <button
                className="md:hidden p-2 rounded-lg hover:bg-slate-800/60 text-white"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </>
          ) : (
            <div className="bg-emerald-500 text-white px-4 sm:px-8 py-2 sm:py-3 rounded-lg hover:bg-emerald-600 transition-all shadow-lg">
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
                          <span className="text-white font-medium text-sm sm:text-base">
                            {userProfile?.username ? `@${userProfile.username}` : truncateAddress(account.address)}
                          </span>
                        </button>
                      ) : (
                        <button
                          onClick={openConnectModal}
                          className="flex items-center"
                        >
                          <span className="text-white font-medium text-sm sm:text-base">
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
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-800/95 backdrop-blur-sm border-t border-slate-700 absolute w-full">
          <nav className="container mx-auto px-4 py-3 flex flex-col">
            {shouldShowDashboard && (
              <Link
                href={getDashboardUrl()}
                className="py-3 px-2 font-medium text-slate-200 hover:text-white border-b border-slate-700/50"
                onClick={() => {
                  handleNavClick("dashboard");
                  if (isLoadingProfile) {
                    return false;
                  }
                }}
              >
                Dashboard
              </Link>
            )}
            <Link
              href={"/marketplace"}
              className="py-3 px-2 font-medium text-slate-200 hover:text-white border-b border-slate-700/50"
              onClick={() => handleNavClick("marketplace")}
            >
              Marketplace
            </Link>
            {isConnected && (
              <Link href="/auto-approval">
                <motion.button
                  className="flex items-center gap-2 px-4 py-2 text-slate-300 hover:text-white transition-colors"
                  whileTap={{ scale: 0.95 }}
                >
                  <Zap className="w-4 h-4" />
                  Auto-Approval
                </motion.button>
              </Link>
            )}
            {isConnected && (
              <Link href="/disputeresolution">
                <motion.button
                  className="flex items-center gap-2 px-4 py-2 text-slate-300 hover:text-white transition-colors"
                  whileTap={{ scale: 0.95 }}
                >
                  <Zap className="w-4 h-4" />
                  Disputes
                </motion.button>
              </Link>
            )}
          </nav>
        </div>
      )}

      {/* Backdrop for dropdowns */}
      {profileDropdownOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setProfileDropdownOpen(false)}
        />
      )}
    </header>
  );
};

export default Header;
