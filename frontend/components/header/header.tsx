"use client";

import React, { useState, useEffect } from "react";
import { Bell, Menu, X, User, Search, ChevronDown, Copy } from "lucide-react";
import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useBalance } from "wagmi";
import { cUSDContractConfig } from "../../lib/contracts";
import { useUserProfile } from "../../hooks/adsBazaar";

interface HeaderProps {
  setActiveTab?: (tab: string) => void;
}

const Header: React.FC<HeaderProps> = ({ setActiveTab }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const { address, isConnected } = useAccount();
  const { data: celoBalance } = useBalance({
    address: address,
    enabled: isConnected,
    watch: true,
  });

  const { data: cUSDBalanceData } = useBalance({
    address: address,
    token: cUSDContractConfig.address,
    enabled: isConnected,
    watch: true,
  });

  const { userProfile, isLoadingProfile } = useUserProfile();

  const shouldShowDashboard =
    userProfile?.isRegistered &&
    (userProfile.isBusiness || userProfile.isInfluencer);

  useEffect(() => {
    setIsMounted(true);
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("scroll", handleScroll);
      return () => window.removeEventListener("scroll", handleScroll);
    }
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

  if (!isMounted) {
    return null;
  }

  return (
    <header className="fixed h-28 w-full z-50 transition-all duration-300 bg-slate-900/95 backdrop-blur-sm shadow-lg py-2">
      <div className="h-full w-full px-4 lg:px-8 flex justify-between items-center">
        {/* Logo */}
        <Link href={"/"}>
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg">
              <span className="font-bold text-white text-lg">AB</span>
            </div>
            <h1 className="text-xl font-bold text-white">Ads-Bazer</h1>
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
        </nav>

        {/* Right Side Actions */}
        <div className="flex items-center space-x-1 sm:space-x-4">
          {isConnected ? (
            <>
              {/* User Profile */}
              <div className="relative">
                <div className="mt-2 w-56 rounded-lg shadow-lg bg-slate-800 border border-slate-700 z-10">
                  <div className="bg-gray-800 rounded-lg px-4 py- flex items-center">
                    <div>
                      <div className="flex items-center">
                        <span className="text-green-400 mr-2">●</span>
                        <span className="text-gray-300 font-medium">
                          {truncateAddress(address)}
                        </span>
                        <button className="ml-2 text-gray-400 hover:text-gray-300">
                          <Copy size={14} />
                        </button>
                      </div>
                      <div className="flex items-center mt-1 text-sm">
                        <span className="text-gray-400 mr-2">
                          {celoBalance?.formatted
                            ? `${parseFloat(celoBalance.formatted).toFixed(
                                2
                              )} CELO`
                            : "0.00 CELO"}
                        </span>
                        <span className="text-gray-400">
                          {cUSDBalanceData?.formatted
                            ? `${parseFloat(cUSDBalanceData.formatted).toFixed(
                                2
                              )} cUSD`
                            : "0.00 cUSD"}
                        </span>
                      </div>
                      {/* Add registration status */}
                      {userProfile && (
                        <div className="mt-1 text-xs">
                          <span
                            className={`px-2 py-1 rounded ${
                              !userProfile.isRegistered
                                ? "bg-yellow-500/20 text-yellow-400"
                                : userProfile.isBusiness
                                ? "bg-blue-500/20 text-blue-400"
                                : "bg-purple-500/20 text-purple-400"
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
                </div>
              </div>

              {/* Mobile menu button */}
              <button
                className="md:hidden p-2 rounded-lg hover:bg-slate-800/60 text-white"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </>
          ) : (
            <div className="bg-emerald-500 text-white px-8 py-3 rounded-lg hover:bg-emerald-600 transition-all shadow-lg">
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
                            {truncateAddress(account.address)}
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
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
