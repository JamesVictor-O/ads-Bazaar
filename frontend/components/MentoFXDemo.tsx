'use client';

import { useState, useEffect } from 'react';
import { Zap, TrendingUp, Globe, ArrowRightLeft } from 'lucide-react';
import { CurrencySelector } from './CurrencySelector';
import { CurrencyConverter } from './CurrencyConverter';
import { SupportedCurrency, mentoFX, MENTO_TOKENS } from '@/lib/mento-integration';

export function MentoFXDemo() {
  const [fromCurrency, setFromCurrency] = useState<SupportedCurrency>('cUSD');
  const [toCurrency, setToCurrency] = useState<SupportedCurrency>('cEUR');
  const [amount, setAmount] = useState('100');
  const [rates, setRates] = useState<any[]>([]);

  useEffect(() => {
    loadInitialRates();
  }, []);

  const loadInitialRates = async () => {
    try {
      const currenciesWithRates = await mentoFX.getAllCurrenciesWithRates('cUSD');
      setRates(currenciesWithRates);
    } catch (error) {
      console.error('Error loading rates:', error);
    }
  };

  const swapCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  return (
    <div className="bg-gradient-to-br from-emerald-50 to-teal-100 rounded-2xl p-6 border border-emerald-200">
      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Zap className="w-6 h-6 text-emerald-600" />
          <h3 className="text-xl font-bold text-emerald-800">
            Multi-Currency Campaigns with Mento
          </h3>
        </div>
        <p className="text-emerald-700 text-sm">
          Create campaigns in any global currency using Mento Protocol's onchain FX
        </p>
      </div>

      {/* Currency Converter Demo */}
      <div className="bg-white/50 rounded-xl p-4 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Globe className="w-5 h-5 text-emerald-600" />
          <h4 className="font-semibold text-emerald-800">Live Currency Converter</h4>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-end">
          {/* Amount Input */}
          <div>
            <label className="block text-sm font-medium text-emerald-700 mb-2">
              Amount
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 border border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Enter amount"
            />
          </div>

          {/* From Currency */}
          <div>
            <label className="block text-sm font-medium text-emerald-700 mb-2">
              From
            </label>
            <CurrencySelector
              selectedCurrency={fromCurrency}
              onCurrencyChange={setFromCurrency}
              amount={amount}
              className="bg-white border-emerald-300"
            />
          </div>

          {/* To Currency */}
          <div>
            <label className="block text-sm font-medium text-emerald-700 mb-2">
              To
            </label>
            <CurrencySelector
              selectedCurrency={toCurrency}
              onCurrencyChange={setToCurrency}
              amount={amount}
              className="bg-white border-emerald-300"
            />
          </div>
        </div>

        {/* Swap Button */}
        <div className="flex justify-center my-4">
          <button
            onClick={swapCurrencies}
            className="p-2 bg-emerald-100 hover:bg-emerald-200 rounded-full transition-colors"
            title="Swap currencies"
          >
            <ArrowRightLeft className="w-4 h-4 text-emerald-600" />
          </button>
        </div>

        {/* Conversion Result */}
        {amount && fromCurrency !== toCurrency && (
          <CurrencyConverter
            amount={amount}
            fromCurrency={fromCurrency}
            toCurrency={toCurrency}
            className="bg-white/70"
          />
        )}
      </div>

      {/* Supported Currencies Grid */}
      <div className="bg-white/50 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-emerald-600" />
          <h4 className="font-semibold text-emerald-800">Supported Currencies</h4>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {Object.entries(MENTO_TOKENS).map(([key, token]) => {
            const rate = rates.find(r => r.key === key);
            return (
              <div
                key={key}
                className="bg-white rounded-lg p-3 border border-emerald-200 hover:border-emerald-300 transition-colors"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{token.flag}</span>
                  <span className="font-medium text-emerald-800">{token.symbol}</span>
                </div>
                <div className="text-xs text-emerald-600">{token.name}</div>
                {rate && (
                  <div className="text-xs text-emerald-500 mt-1">
                    1 USD = {rate.rate.toFixed(4)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Benefits */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
        <div className="bg-white/30 rounded-lg p-3">
          <div className="font-medium text-emerald-800 mb-1">🌍 Global Reach</div>
          <div className="text-emerald-700">Create campaigns in local currencies for global audiences</div>
        </div>
        <div className="bg-white/30 rounded-lg p-3">
          <div className="font-medium text-emerald-800 mb-1">⚡ Low Slippage</div>
          <div className="text-emerald-700">Near 1:1 swaps with minimal fees via Mento Protocol</div>
        </div>
        <div className="bg-white/30 rounded-lg p-3">
          <div className="font-medium text-emerald-800 mb-1">🔒 Transparent</div>
          <div className="text-emerald-700">All rates and reserves verified onchain</div>
        </div>
        <div className="bg-white/30 rounded-lg p-3">
          <div className="font-medium text-emerald-800 mb-1">🚀 Instant</div>
          <div className="text-emerald-700">Real-time currency conversion and settlement</div>
        </div>
      </div>
    </div>
  );
}