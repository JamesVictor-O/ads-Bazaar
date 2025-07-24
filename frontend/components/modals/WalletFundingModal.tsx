"use client";

import React, { useState, useEffect } from "react";
import {
  X,
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
  Globe,
  RefreshCw
} from "lucide-react";
import { useAccount } from "wagmi";
import { SupportedCurrency } from "@/lib/mento-simple";
import { FiatFundingModal } from "./FiatFundingModal";
import { useMultiCurrencyBalances } from "@/hooks/useMultiCurrencyBalances";

interface WalletFundingModalProps {
  onClose: () => void;
}

interface FundingMethod {
  icon: React.ComponentType<any>;
  label: string;
  description: string;
}

export function WalletFundingModal({ onClose }: WalletFundingModalProps) {
  const { address, isConnected } = useAccount();
  const [showFiatModal, setShowFiatModal] = useState(false);
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
    setShowFiatModal(true);
  };

  const getFundingMethods = (currency: SupportedCurrency): FundingMethod[] => {
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
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-slate-900 rounded-2xl w-full max-w-2xl border border-slate-700">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-700">
            <div>
              <h2 className="text-xl font-bold text-white">Fund Wallet with Local Currency</h2>
              <p className="text-sm text-slate-400">Add funds using your local payment methods</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          {/* Connect Wallet Message */}
          <div className="p-8 text-center">
            <Wallet className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-3">Connect Your Wallet</h3>
            <p className="text-slate-400 mb-6">
              Connect your wallet to fund campaigns with local currencies and manage your multi-currency portfolio.
            </p>
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-400 mt-0.5" />
                <div className="text-left">
                  <h4 className="font-medium text-emerald-400 mb-1">What you'll get:</h4>
                  <ul className="text-sm text-slate-300 space-y-1">
                    <li>• Fund with Naira, M-Pesa, SEPA, and more</li>
                    <li>• Real-time balance tracking across 6 currencies</li>
                    <li>• Create campaigns in any supported currency</li>
                    <li>• 96% lower fees than traditional platforms</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-slate-900 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-slate-700">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-700">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Wallet className="w-6 h-6 text-emerald-400" />
                Fund Wallet with Local Currency
              </h2>
              <p className="text-sm text-slate-400">
                Add funds using local payment methods, receive stablecoins instantly
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Balance Overview */}
            <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white">Current Balance</h3>
                  <p className="text-sm text-slate-400">Your multi-currency wallet overview</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={refreshBalances}
                    className="flex items-center gap-2 px-3 py-2 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors"
                    disabled={isLoadingBalances}
                  >
                    <RefreshCw className={`w-4 h-4 text-slate-400 ${isLoadingBalances ? 'animate-spin' : ''}`} />
                    <span className="text-sm text-slate-300">Refresh</span>
                  </button>
                  <button
                    onClick={() => setExpandedBalance(!expandedBalance)}
                    className="flex items-center gap-2 px-3 py-2 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    <span className="text-lg font-bold text-emerald-400">
                      ${totalUsdValue.toFixed(2)}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${expandedBalance ? 'rotate-180' : ''}`} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {balances.slice(0, expandedBalance ? balances.length : 6).map((balance) => (
                  <div
                    key={balance.token}
                    className="bg-slate-700/30 border border-slate-600/50 rounded-lg p-4 hover:bg-slate-700/50 transition-colors relative"
                  >
                    {balance.isLoading && (
                      <div className="absolute inset-0 bg-slate-700/50 rounded-lg flex items-center justify-center">
                        <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                      </div>
                    )}
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-slate-300">{balance.token}</span>
                      <span className="text-xs text-slate-400">{balance.symbol}</span>
                    </div>
                    <div className="space-y-1">
                      <p className="text-lg font-semibold text-white">
                        {parseFloat(balance.balanceFormatted).toFixed(2)}
                      </p>
                      <p className="text-xs text-slate-400">
                        ≈ ${balance.usdValue.toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {lastUpdated && (
                <div className="mt-4 text-xs text-slate-500 text-center">
                  Last updated: {lastUpdated.toLocaleTimeString()}
                </div>
              )}
            </div>

            {/* Regional Funding Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Nigerian Naira -> cNGN */}
              <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="text-3xl">🇳🇬</div>
                  <div>
                    <h3 className="font-semibold text-white">Nigerian Naira</h3>
                    <p className="text-sm text-slate-400">Bank transfer → cNGN</p>
                  </div>
                </div>
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Fee:</span>
                    <span className="text-white">2.5%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Time:</span>
                    <span className="text-white">2-10 min</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Provider:</span>
                    <span className="text-white">Kotani Pay</span>
                  </div>
                </div>
                <button
                  onClick={() => handleFundWallet("cNGN")}
                  className="w-full bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 text-green-400 py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Fund with Naira
                </button>
              </div>

              {/* Kenyan Shilling -> cKES */}
              <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="text-3xl">🇰🇪</div>
                  <div>
                    <h3 className="font-semibold text-white">Kenyan Shilling</h3>
                    <p className="text-sm text-slate-400">M-Pesa → cKES</p>
                  </div>
                </div>
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Fee:</span>
                    <span className="text-white">2.5%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Time:</span>
                    <span className="text-white">1-5 min</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Provider:</span>
                    <span className="text-white">Kotani Pay</span>
                  </div>
                </div>
                <button
                  onClick={() => handleFundWallet("cKES")}
                  className="w-full bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-400 py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Smartphone className="w-4 h-4" />
                  Fund with M-Pesa
                </button>
              </div>

              {/* Euro -> cEUR */}
              <div className="bg-gradient-to-br from-purple-500/10 to-indigo-500/10 border border-purple-500/20 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="text-3xl">🇪🇺</div>
                  <div>
                    <h3 className="font-semibold text-white">Euro</h3>
                    <p className="text-sm text-slate-400">SEPA/Card → cEUR</p>
                  </div>
                </div>
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Fee:</span>
                    <span className="text-white">3.5%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Time:</span>
                    <span className="text-white">10-30 min</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Provider:</span>
                    <span className="text-white">Alchemy Pay</span>
                  </div>
                </div>
                <button
                  onClick={() => handleFundWallet("cEUR")}
                  className="w-full bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 text-purple-400 py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <CreditCard className="w-4 h-4" />
                  Fund with Euro
                </button>
              </div>

              {/* USD -> cUSD */}
              <div className="bg-gradient-to-br from-emerald-500/10 to-green-500/10 border border-emerald-500/20 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="text-3xl">🇺🇸</div>
                  <div>
                    <h3 className="font-semibold text-white">US Dollar</h3>
                    <p className="text-sm text-slate-400">Card/Wire → cUSD</p>
                  </div>
                </div>
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Fee:</span>
                    <span className="text-white">3.5%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Time:</span>
                    <span className="text-white">1-60 min</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Provider:</span>
                    <span className="text-white">Alchemy Pay</span>
                  </div>
                </div>
                <button
                  onClick={() => handleFundWallet("cUSD")}
                  className="w-full bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-400 py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <DollarSign className="w-4 h-4" />
                  Fund with USD
                </button>
              </div>

              {/* Brazilian Real -> cREAL */}
              <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="text-3xl">🇧🇷</div>
                  <div>
                    <h3 className="font-semibold text-white">Brazilian Real</h3>
                    <p className="text-sm text-slate-400">Card/PIX → cREAL</p>
                  </div>
                </div>
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Fee:</span>
                    <span className="text-white">3.5%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Time:</span>
                    <span className="text-white">5-30 min</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Provider:</span>
                    <span className="text-white">Alchemy Pay</span>
                  </div>
                </div>
                <button
                  onClick={() => handleFundWallet("cREAL")}
                  className="w-full bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/30 text-yellow-400 py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Building2 className="w-4 h-4" />
                  Fund with Real
                </button>
              </div>

              {/* West African CFA -> eXOF */}
              <div className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/20 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="text-3xl">🌍</div>
                  <div>
                    <h3 className="font-semibold text-white">West African CFA</h3>
                    <p className="text-sm text-slate-400">Mobile Money → eXOF</p>
                  </div>
                </div>
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Fee:</span>
                    <span className="text-white">2.5%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Time:</span>
                    <span className="text-white">2-10 min</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Provider:</span>
                    <span className="text-white">Kotani Pay</span>
                  </div>
                </div>
                <button
                  onClick={() => handleFundWallet("eXOF")}
                  className="w-full bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/30 text-orange-400 py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Smartphone className="w-4 h-4" />
                  Fund with CFA
                </button>
              </div>
            </div>

            {/* Feature Highlights */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-400 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-emerald-400 mb-1">Instant Conversion</h4>
                    <p className="text-sm text-slate-300">
                      Your local currency is automatically converted to the corresponding Mento stablecoin in your wallet.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Globe className="w-5 h-5 text-blue-400 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-400 mb-1">Global Campaigns</h4>
                    <p className="text-sm text-slate-300">
                      Create campaigns in any supported currency and reach influencers worldwide with live conversion rates.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fiat Funding Modal */}
      {showFiatModal && (
        <FiatFundingModal
          currency={selectedCurrency}
          onClose={() => setShowFiatModal(false)}
          fundingMethods={getFundingMethods(selectedCurrency)}
        />
      )}
    </>
  );
}