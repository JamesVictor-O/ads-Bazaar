"use client";

import React, { useState, useEffect } from "react";
import {
  CreditCard,
  Smartphone,
  Building2,
  Plus,
  ArrowRightLeft,
  Wallet,
  DollarSign,
  Loader2,
  CheckCircle,
  AlertTriangle,
  ExternalLink,
  ChevronDown,
  Globe
} from "lucide-react";
import { useAccount } from "wagmi";
import { SupportedCurrency } from "@/lib/mento-simple";
import { FiatFundingModal } from "./modals/FiatFundingModal";
import { useMultiCurrencyBalances } from "@/hooks/useMultiCurrencyBalances";

export function WalletFundingSection() {
  const { address, isConnected } = useAccount();
  const [showFundingModal, setShowFundingModal] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState<SupportedCurrency>("cUSD");
  const [expandedBalance, setExpandedBalance] = useState(false);

  const {
    balances,
    totalUsdValue,
    isLoading: isLoadingBalances,
    refreshBalances,
    hasAnyBalance,
    lastUpdated
  } = useMultiCurrencyBalances();

  const handleFundWallet = (currency: SupportedCurrency) => {
    setSelectedCurrency(currency);
    setShowFundingModal(true);
  };

  const getFundingMethods = (currency: SupportedCurrency) => {
    switch (currency) {
      case "cNGN":
        return [
          { icon: Building2, label: "Bank Transfer", description: "Nigerian banks via Kotani Pay" },
          { icon: Smartphone, label: "Mobile Money", description: "Coming soon" }
        ];
      case "cKES":
        return [
          { icon: Smartphone, label: "M-Pesa", description: "Direct M-Pesa via Kotani Pay" },
          { icon: Building2, label: "Bank Transfer", description: "Kenyan banks" }
        ];
      case "cEUR":
        return [
          { icon: Building2, label: "SEPA Transfer", description: "European banks via Alchemy Pay" },
          { icon: CreditCard, label: "Credit/Debit Card", description: "Visa, Mastercard" }
        ];
      default:
        return [
          { icon: CreditCard, label: "Credit/Debit Card", description: "Global card payments" },
          { icon: Building2, label: "Bank Transfer", description: "Available in select regions" }
        ];
    }
  };

  if (!isConnected) {
    return (
      <div className="bg-slate-900/30 border border-slate-700/30 rounded-xl p-6">
        <div className="text-center">
          <Wallet className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-white mb-2">Connect Wallet</h3>
          <p className="text-slate-400 text-sm">
            Connect your wallet to fund campaigns with local currencies
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-slate-900/30 border border-slate-700/30 rounded-xl p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Wallet className="w-5 h-5 text-emerald-400" />
              Multi-Currency Wallet
            </h3>
            <p className="text-sm text-slate-400">
              Fund your wallet with local currency, create campaigns globally
            </p>
          </div>
          <button
            onClick={() => setExpandedBalance(!expandedBalance)}
            className="flex items-center gap-2 px-3 py-2 bg-slate-800/50 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <span className="text-sm text-slate-300">
              ${totalUsdValue.toFixed(2)} USD
            </span>
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${expandedBalance ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Balance Overview */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {balances.slice(0, expandedBalance ? balances.length : 3).map((balance) => (
            <div
              key={balance.token}
              className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-3 hover:bg-slate-800/50 transition-colors relative"
            >
              {balance.isLoading && (
                <div className="absolute inset-0 bg-slate-800/50 rounded-lg flex items-center justify-center">
                  <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                </div>
              )}
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-300">{balance.token}</span>
                <span className="text-xs text-slate-400">{balance.symbol}</span>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-white">
                  {parseFloat(balance.balanceFormatted).toFixed(2)}
                </p>
                <p className="text-xs text-slate-400">
                  ${balance.usdValue.toFixed(2)}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Refresh button and last updated */}
        <div className="flex items-center justify-between text-xs text-slate-400">
          <button
            onClick={refreshBalances}
            className="flex items-center gap-1 hover:text-slate-300 transition-colors"
            disabled={isLoadingBalances}
          >
            <ArrowRightLeft className={`w-3 h-3 ${isLoadingBalances ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          {lastUpdated && (
            <span>
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}
        </div>

        {/* Quick Fund Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Nigerian Naira -> cNGN */}
          <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold text-green-400">₦</span>
              </div>
              <div>
                <h4 className="font-medium text-white">Nigerian Naira</h4>
                <p className="text-xs text-slate-400">Bank transfer → cNGN</p>
              </div>
            </div>
            <button
              onClick={() => handleFundWallet("cNGN")}
              className="w-full bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 text-green-400 py-2 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Fund with Naira
            </button>
          </div>

          {/* Kenyan Shilling -> cKES */}
          <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                <Smartphone className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <h4 className="font-medium text-white">Kenyan Shilling</h4>
                <p className="text-xs text-slate-400">M-Pesa → cKES</p>
              </div>
            </div>
            <button
              onClick={() => handleFundWallet("cKES")}
              className="w-full bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-400 py-2 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Fund with M-Pesa
            </button>
          </div>

          {/* Euro -> cEUR */}
          <div className="bg-gradient-to-br from-purple-500/10 to-indigo-500/10 border border-purple-500/20 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold text-purple-400">€</span>
              </div>
              <div>
                <h4 className="font-medium text-white">Euro</h4>
                <p className="text-xs text-slate-400">SEPA/Card → cEUR</p>
              </div>
            </div>
            <button
              onClick={() => handleFundWallet("cEUR")}
              className="w-full bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 text-purple-400 py-2 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Fund with Euro
            </button>
          </div>
        </div>

        {/* More Currencies */}
        <div className="border-t border-slate-700/50 pt-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-slate-300">More Currencies</h4>
            <Globe className="w-4 h-4 text-slate-400" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <button
              onClick={() => handleFundWallet("cUSD")}
              className="flex items-center justify-between p-3 bg-slate-800/30 hover:bg-slate-800/50 border border-slate-700/50 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-white">USD → cUSD</span>
              </div>
              <Plus className="w-4 h-4 text-slate-400" />
            </button>
            <button
              onClick={() => handleFundWallet("cREAL")}
              className="flex items-center justify-between p-3 bg-slate-800/30 hover:bg-slate-800/50 border border-slate-700/50 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-white">BRL → cREAL</span>
              </div>
              <Plus className="w-4 h-4 text-slate-400" />
            </button>
            <button
              onClick={() => handleFundWallet("eXOF")}
              className="flex items-center justify-between p-3 bg-slate-800/30 hover:bg-slate-800/50 border border-slate-700/50 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-white">XOF → eXOF</span>
              </div>
              <Plus className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Feature Highlight */}
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-400 mt-0.5" />
            <div>
              <h4 className="font-medium text-emerald-400 mb-1">Global Multi-Currency Platform</h4>
              <p className="text-sm text-slate-300">
                Pay with your local currency, receive the corresponding Mento stablecoin, and create campaigns that work globally. No crypto knowledge required.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Fiat Funding Modal */}
      {showFundingModal && (
        <FiatFundingModal
          currency={selectedCurrency}
          onClose={() => setShowFundingModal(false)}
          fundingMethods={getFundingMethods(selectedCurrency)}
        />
      )}
    </>
  );
}