'use client';

import { useState, useEffect } from 'react';
import { X, TrendingUp, Globe, ArrowRightLeft, DollarSign, AlertTriangle, Info, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { CurrencySelector } from '../CurrencySelector';
import { CurrencyConverter } from '../CurrencyConverter';
import { SupportedCurrency, mentoFX, MENTO_TOKENS } from '@/lib/mento-simple';
import { useAccount, useBalance } from 'wagmi';
import { toast } from 'react-hot-toast';
import { useCurrencySwap } from '@/hooks/useMultiCurrencyAdsBazaar';

interface CurrencyConverterModalProps {
  isOpen: boolean;
  onClose: () => void;
  userType?: 'brand' | 'influencer';
}

export function CurrencyConverterModal({ 
  isOpen, 
  onClose, 
  userType = 'brand' 
}: CurrencyConverterModalProps) {
  const [fromCurrency, setFromCurrency] = useState<SupportedCurrency>('cUSD');
  const [toCurrency, setToCurrency] = useState<SupportedCurrency>('cEUR');
  const [amount, setAmount] = useState('100');
  const [rates, setRates] = useState<any[]>([]);
  const [isLoadingRates, setIsLoadingRates] = useState(false);
  const [activeTab, setActiveTab] = useState<'convert' | 'swap'>('convert');
  
  const { address } = useAccount();
  const { prepareSwap, isSwapping } = useCurrencySwap();

  // Get balance for from currency
  const { data: fromBalance } = useBalance({
    address: address,
    token: MENTO_TOKENS[fromCurrency].address as `0x${string}`,
    query: { enabled: !!address }
  });

  useEffect(() => {
    if (isOpen) {
      loadRates();
    }
  }, [isOpen, fromCurrency]);

  const loadRates = async () => {
    setIsLoadingRates(true);
    try {
      const currenciesWithRates = await mentoFX.getAllCurrenciesWithRates(fromCurrency);
      setRates(currenciesWithRates);
    } catch (error) {
      console.error('Error loading rates:', error);
      toast.error('Failed to load exchange rates');
    } finally {
      setIsLoadingRates(false);
    }
  };

  const swapCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  const handleSwap = async () => {
    if (!address) {
      toast.error('Please connect your wallet');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (!fromBalance || parseFloat(fromBalance.formatted) < parseFloat(amount)) {
      toast.error(`Insufficient ${MENTO_TOKENS[fromCurrency].symbol} balance`);
      return;
    }

    try {
      const result = await prepareSwap(fromCurrency, toCurrency, amount);
      toast.success(result.message || 'Swap executed successfully!');
      // Refresh balances and close modal
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Swap error:', error);
      if (error instanceof Error) {
        toast.error(error.message || 'Swap failed. Please try again.');
      } else {
        toast.error('Swap failed. Please try again.');
      }
    }
  };

  const setMaxAmount = () => {
    if (fromBalance) {
      setAmount(fromBalance.formatted);
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className="bg-slate-800/90 backdrop-blur-md border border-slate-700/50 rounded-2xl w-full max-w-2xl mx-auto max-h-[90vh] overflow-hidden flex flex-col shadow-2xl shadow-emerald-500/10"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1">
          <div className="p-4 sm:p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white">Currency Converter</h2>
                <p className="text-sm text-slate-400 mt-1">
                  {userType === 'brand' ? 'Plan campaigns in any currency' : 'Convert your earnings'}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* Tabs */}
            <div className="mb-6">
              <div className="flex bg-slate-900/50 rounded-lg p-1">
                <button
                  onClick={() => setActiveTab('convert')}
                  className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                    activeTab === 'convert'
                      ? 'bg-emerald-500 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Globe className="w-4 h-4 inline mr-2" />
                  View Rates
                </button>
                <button
                  onClick={() => setActiveTab('swap')}
                  className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                    activeTab === 'swap'
                      ? 'bg-emerald-500 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <ArrowRightLeft className="w-4 h-4 inline mr-2" />
                  Swap Currency
                </button>
              </div>
            </div>

            {activeTab === 'convert' ? (
              // Conversion View
              <div className="space-y-6">
                {/* Currency Converter */}
                <div className="bg-slate-900/30 border border-slate-700/30 rounded-xl p-4">
                  <h4 className="text-sm font-medium text-slate-300 mb-4 flex items-center">
                    <DollarSign className="w-4 h-4 mr-2" />
                    Currency Conversion
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">From</label>
                      <CurrencySelector
                        selectedCurrency={fromCurrency}
                        onCurrencyChange={setFromCurrency}
                        amount={amount}
                        className="bg-slate-800 border-slate-600 text-white focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">To</label>
                      <CurrencySelector
                        selectedCurrency={toCurrency}
                        onCurrencyChange={setToCurrency}
                        amount={amount}
                        className="bg-slate-800 border-slate-600 text-white focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-300 mb-2">Amount</label>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-emerald-500 focus:outline-none"
                      placeholder="Enter amount"
                    />
                  </div>

                  {/* Swap Button */}
                  <div className="flex justify-center mb-4">
                    <button
                      onClick={swapCurrencies}
                      className="p-2 bg-slate-700 hover:bg-slate-600 rounded-full transition-colors"
                      title="Swap currencies"
                    >
                      <ArrowRightLeft className="w-4 h-4 text-slate-300" />
                    </button>
                  </div>

                  {/* Conversion Result */}
                  {amount && fromCurrency !== toCurrency && (
                    <CurrencyConverter
                      amount={amount}
                      fromCurrency={fromCurrency}
                      toCurrency={toCurrency}
                      className="bg-slate-700/50 p-3 rounded-lg"
                    />
                  )}
                </div>

                {/* Supported Currencies Grid */}
                <div className="bg-slate-900/30 border border-slate-700/30 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="w-5 h-5 text-emerald-400" />
                    <h4 className="font-semibold text-white">Live Exchange Rates</h4>
                    {isLoadingRates && (
                      <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {Object.entries(MENTO_TOKENS).map(([key, token]) => {
                      const rate = rates.find(r => r.key === key);
                      return (
                        <div
                          key={key}
                          className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50 hover:border-slate-600 transition-colors"
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-lg">{token.flag}</span>
                            <span className="font-medium text-white">{token.symbol}</span>
                          </div>
                          <div className="text-xs text-slate-400">{token.name}</div>
                          {rate && (
                            <div className="text-xs text-emerald-400 mt-1">
                              1 {MENTO_TOKENS[fromCurrency].symbol} = {rate.rate.toFixed(4)}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              // Swap View
              <div className="space-y-6">
                {/* Swap Interface */}
                <div className="bg-slate-900/30 border border-slate-700/30 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Zap className="w-5 h-5 text-emerald-400" />
                    <span className="text-sm text-emerald-400">
                      Live swaps powered by Mento Protocol
                    </span>
                  </div>

                  <div className="space-y-4">
                    {/* From Currency */}
                    <div className="bg-slate-800/50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-slate-300">From</label>
                        {fromBalance && (
                          <button
                            onClick={setMaxAmount}
                            className="text-xs text-emerald-400 hover:text-emerald-300"
                          >
                            Balance: {parseFloat(fromBalance.formatted).toFixed(2)} {MENTO_TOKENS[fromCurrency].symbol}
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <CurrencySelector
                          selectedCurrency={fromCurrency}
                          onCurrencyChange={setFromCurrency}
                          className="bg-slate-800 border-slate-600 text-white focus:border-emerald-500"
                        />
                        <input
                          type="number"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          className="px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-emerald-500 focus:outline-none"
                          placeholder="0.00"
                        />
                      </div>
                    </div>

                    {/* Swap Arrow */}
                    <div className="flex justify-center">
                      <button
                        onClick={swapCurrencies}
                        className="p-3 bg-slate-700 hover:bg-slate-600 rounded-full transition-colors"
                      >
                        <ArrowRightLeft className="w-5 h-5 text-slate-300" />
                      </button>
                    </div>

                    {/* To Currency */}
                    <div className="bg-slate-800/50 rounded-lg p-4">
                      <label className="block text-sm font-medium text-slate-300 mb-2">To (estimated)</label>
                      <div className="grid grid-cols-2 gap-3">
                        <CurrencySelector
                          selectedCurrency={toCurrency}
                          onCurrencyChange={setToCurrency}
                          className="bg-slate-800 border-slate-600 text-white focus:border-emerald-500"
                        />
                        <div className="px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-400 flex items-center">
                          {amount && fromCurrency !== toCurrency ? (
                            <CurrencyConverter
                              amount={amount}
                              fromCurrency={fromCurrency}
                              toCurrency={toCurrency}
                              className="text-white"
                            />
                          ) : '0.00'}
                        </div>
                      </div>
                    </div>

                    {/* Swap Button */}
                    <button
                      onClick={handleSwap}
                      disabled={!address || !amount || parseFloat(amount) <= 0 || isSwapping}
                      className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-700 disabled:text-slate-400 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      {isSwapping ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Swapping...
                        </>
                      ) : (
                        <>
                          <ArrowRightLeft className="w-4 h-4" />
                          Execute Swap
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Info Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-slate-900/30 border border-slate-700/30 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="w-4 h-4 text-emerald-400" />
                      <span className="font-medium text-white">Low Slippage</span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Near 1:1 swaps with minimal fees via Mento Protocol
                    </p>
                  </div>
                  <div className="bg-slate-900/30 border border-slate-700/30 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Info className="w-4 h-4 text-blue-400" />
                      <span className="font-medium text-white">Transparent</span>
                    </div>
                    <p className="text-xs text-slate-400">
                      All rates and reserves verified onchain
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}