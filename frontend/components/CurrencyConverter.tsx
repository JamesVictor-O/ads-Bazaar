'use client';

import { useState, useEffect } from 'react';
import { ArrowRightLeft, TrendingUp, TrendingDown } from 'lucide-react';
import { MENTO_TOKENS, SupportedCurrency, mentoFX } from '@/lib/mento-simple';

interface CurrencyConverterProps {
  amount: string;
  fromCurrency: SupportedCurrency;
  toCurrency: SupportedCurrency;
  onSwap?: () => void;
  showSwapButton?: boolean;
  className?: string;
}

export function CurrencyConverter({
  amount,
  fromCurrency,
  toCurrency,
  onSwap,
  showSwapButton = false,
  className = ''
}: CurrencyConverterProps) {
  const [convertedAmount, setConvertedAmount] = useState<string>('0');
  const [exchangeRate, setExchangeRate] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [priceDirection, setPriceDirection] = useState<'up' | 'down' | 'neutral'>('neutral');

  useEffect(() => {
    convertCurrency();
  }, [amount, fromCurrency, toCurrency]);

  const convertCurrency = async () => {
    if (!amount || fromCurrency === toCurrency) {
      setConvertedAmount(amount || '0');
      setExchangeRate(1);
      return;
    }

    setIsLoading(true);
    try {
      // Get current rate
      const currentRate = await mentoFX.getExchangeRate(fromCurrency, toCurrency);
      const previousRate = exchangeRate;
      
      // Determine price direction
      if (currentRate > previousRate) {
        setPriceDirection('up');
      } else if (currentRate < previousRate) {
        setPriceDirection('down');
      } else {
        setPriceDirection('neutral');
      }
      
      setExchangeRate(currentRate);
      
      // Convert amount
      const converted = await mentoFX.convertCurrency(amount, fromCurrency, toCurrency);
      setConvertedAmount(converted);
    } catch (error) {
      console.error('Error converting currency:', error);
      setConvertedAmount('0');
    } finally {
      setIsLoading(false);
    }
  };

  const fromToken = MENTO_TOKENS[fromCurrency];
  const toToken = MENTO_TOKENS[toCurrency];

  return (
    <div className={`bg-slate-800/30 border border-slate-700/50 rounded-lg p-4 ${className}`}>
      {/* Conversion Display */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-lg">{fromToken.flag}</span>
          <div>
            <div className="text-lg font-semibold text-white">
              {parseFloat(amount || '0').toLocaleString()} {fromToken.symbol}
            </div>
            <div className="text-xs text-slate-400">{fromToken.name}</div>
          </div>
        </div>

        {showSwapButton && onSwap && (
          <button
            onClick={onSwap}
            className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
            title="Swap currencies"
          >
            <ArrowRightLeft className="w-4 h-4 text-slate-400" />
          </button>
        )}

        <div className="flex items-center gap-2">
          <span className="text-lg">{toToken.flag}</span>
          <div className="text-right">
            <div className="text-lg font-semibold text-emerald-400">
              {isLoading ? (
                <div className="animate-pulse bg-slate-700 h-6 w-20 rounded"></div>
              ) : (
                `${parseFloat(convertedAmount).toLocaleString()} ${toToken.symbol}`
              )}
            </div>
            <div className="text-xs text-slate-400">{toToken.name}</div>
          </div>
        </div>
      </div>

      {/* Exchange Rate Info */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2 text-slate-400">
          <span>Exchange Rate:</span>
          {priceDirection === 'up' && <TrendingUp className="w-3 h-3 text-green-400" />}
          {priceDirection === 'down' && <TrendingDown className="w-3 h-3 text-red-400" />}
        </div>
        
        <div className="text-white">
          1 {fromToken.symbol} = {exchangeRate.toFixed(6)} {toToken.symbol}
        </div>
      </div>

      {/* Additional Info */}
      {fromCurrency !== toCurrency && (
        <div className="mt-3 pt-3 border-t border-slate-700/50">
          <div className="flex justify-between text-xs text-slate-500">
            <span>Network:</span>
            <span>Celo (Mento Protocol)</span>
          </div>
          <div className="flex justify-between text-xs text-slate-500 mt-1">
            <span>Estimated Fee:</span>
            <span>~0.001 CELO</span>
          </div>
        </div>
      )}
    </div>
  );
}