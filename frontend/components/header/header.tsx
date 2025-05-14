"use client";

import React, { useState, useEffect } from "react";
import { Bell, Menu, X, User, Search, ChevronDown } from "lucide-react";
import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";

interface HeaderProps {
  setActiveTab?: (tab: string) => void;
}

const Header: React.FC<HeaderProps> = ({ setActiveTab }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const { address, isConnected } = useAccount();

  useEffect(() => {
    setIsMounted(true);
    
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    // Only add event listener if window is available
    if (typeof window !== "undefined") {
      window.addEventListener("scroll", handleScroll);
      return () => window.removeEventListener("scroll", handleScroll);
    }
  }, []);

  const handleNavClick = (tab: string) => {
    if (setActiveTab) {
      setActiveTab(tab);
    }
    setMobileMenuOpen(false);
  };

  // Truncate wallet address for display
  const truncateAddress = (addr?: string) => {
    if (!addr) return "";
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // Don't render anything until component is mounted (client-side)
  if (!isMounted) {
    return null;
  }

  return (
    <header className="fixed h-28 w-full z-50 transition-all duration-300 bg-slate-900/95 backdrop-blur-sm shadow-lg py-2">
      <div className="h-full w-full px-4 lg:px-8 flex justify-between items-center">
        {/* Logo */}
        <div className="flex items-center space-x-3">
          <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg">
            <span className="font-bold text-white text-lg">AB</span>
          </div>
          <h1 className="text-xl font-bold text-white">Ads-Bazer</h1>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          <Link
            className="font-medium text-slate-200 hover:text-white hover:underline decoration-emerald-400 decoration-2 underline-offset-8 transition"
            href={"/influencersDashboard"}
          >
            Dashboard
          </Link>
          <Link
            href={"/marketplace"}
            className="font-medium text-slate-200 hover:text-white hover:underline decoration-emerald-400 decoration-2 underline-offset-8 transition"
          >
            Marketplace
          </Link>
          <div className="relative group">
            <button className="font-medium text-slate-200 hover:text-white flex items-center space-x-1 group-hover:underline decoration-emerald-400 decoration-2 underline-offset-8 transition">
              <span>Campaigns</span>
              <ChevronDown
                size={16}
                className="opacity-70 group-hover:opacity-100"
              />
            </button>
            <div className="absolute left-0 mt-2 w-48 rounded-md shadow-lg bg-slate-800 ring-1 ring-slate-700 hidden group-hover:block">
              <div className="py-1">
                <a
                  href="#"
                  className="block px-4 py-2 text-sm text-slate-200 hover:bg-slate-700 hover:text-white"
                >
                  Active Campaigns
                </a>
                <a
                  href="#"
                  className="block px-4 py-2 text-sm text-slate-200 hover:bg-slate-700 hover:text-white"
                >
                  Create Campaign
                </a>
                <a
                  href="#"
                  className="block px-4 py-2 text-sm text-slate-200 hover:bg-slate-700 hover:text-white"
                >
                  Campaign History
                </a>
              </div>
            </div>
          </div>
          <a
            href="#"
            className="font-medium text-slate-200 hover:text-white hover:underline decoration-emerald-400 decoration-2 underline-offset-8 transition"
            onClick={() => handleNavClick("analytics")}
          >
            Analytics
          </a>
        </nav>

        {/* Right Side Actions */}
        <div className="flex items-center space-x-1 sm:space-x-4">
          {isConnected ? (
            <>
              {/* Search - Hidden on smallest screens */}
              <div className="hidden sm:flex items-center relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={16} className="text-slate-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search"
                  className="bg-slate-800/60 border-slate-700 text-slate-200 text-sm rounded-lg pl-10 pr-4 py-1.5 w-40 lg:w-56 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              {/* Notifications */}
              <button className="relative p-2 rounded-full hover:bg-slate-800/60">
                <Bell size={20} className="text-slate-200" />
                <span className="absolute top-1 right-1 h-2.5 w-2.5 bg-emerald-500 rounded-full border border-slate-800"></span>
              </button>

              {/* User Profile */}
              <div className="relative">
                <button
                  className="flex items-center space-x-1 sm:space-x-2 bg-slate-800/60 hover:bg-slate-800 rounded-full sm:rounded-lg px-1 sm:px-3 py-1 transition"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                >
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center border border-slate-600">
                    <User size={16} className="text-slate-200" />
                  </div>
                  <span className="hidden sm:inline font-medium text-slate-200">
                    Account
                  </span>
                  <ChevronDown
                    size={16}
                    className="hidden sm:block text-slate-400"
                  />
                </button>

                {/* User Dropdown Menu */}
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-lg shadow-lg bg-slate-800 border border-slate-700 z-10">
                    <div className="p-3 border-b border-slate-700">
                      <p className="text-sm font-medium text-white">John Doe</p>
                      <p className="text-xs text-slate-400">
                        john.doe@example.com
                      </p>
                    </div>
                    <div className="py-1">
                      <a
                        href="#"
                        className="block px-4 py-2 text-sm text-slate-200 hover:bg-slate-700 hover:text-white"
                      >
                        Profile
                      </a>
                      <a
                        href="#"
                        className="block px-4 py-2 text-sm text-slate-200 hover:bg-slate-700 hover:text-white"
                      >
                        Settings
                      </a>
                      <div className="bg-emerald-500 text-white px-4 py-1 rounded-lg hover:bg-emerald-600 transition-all shadow-lg">
                        <ConnectButton.Custom>
                          {({
                            account,
                            openAccountModal,
                            openConnectModal,
                            mounted,
                          }) => {
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
                    </div>
                  </div>
                )}
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
            {/* Search for mobile */}
            <div className="relative mb-4 mt-2">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={18} className="text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Search"
                className="bg-slate-700/60 border border-slate-600 text-slate-200 rounded-lg pl-10 pr-4 py-2 w-full focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            <a
              href="#"
              className="py-3 px-2 font-medium text-slate-200 hover:text-white border-b border-slate-700/50"
              onClick={() => handleNavClick("dashboard")}
            >
              Dashboard
            </a>
            <a
              href="#"
              className="py-3 px-2 font-medium text-slate-200 hover:text-white border-b border-slate-700/50"
              onClick={() => handleNavClick("marketplace")}
            >
              Marketplace
            </a>

            {/* Expandable campaigns section */}
            <div className="border-b border-slate-700/50">
              <button className="py-3 px-2 font-medium text-slate-200 hover:text-white w-full text-left flex justify-between items-center">
                <span>Campaigns</span>
                <ChevronDown size={18} className="text-slate-400" />
              </button>
              <div className="pl-4 pb-2">
                <a
                  href="#"
                  className="block py-2 text-sm text-slate-300 hover:text-white"
                >
                  Active Campaigns
                </a>
                <a
                  href="#"
                  className="block py-2 text-sm text-slate-300 hover:text-white"
                >
                  Create Campaign
                </a>
                <a
                  href="#"
                  className="block py-2 text-sm text-slate-300 hover:text-white"
                >
                  Campaign History
                </a>
              </div>
            </div>

            <a
              href="#"
              className="py-3 px-2 font-medium text-slate-200 hover:text-white"
              onClick={() => handleNavClick("analytics")}
            >
              Analytics
            </a>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;