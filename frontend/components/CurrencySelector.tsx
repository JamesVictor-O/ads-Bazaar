'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, RefreshCw } from 'lucide-react';
import { MENTO_TOKENS, SupportedCurrency, mentoFX } from '@/lib/mento-simple';
import { useAccount, useBalance } from 'wagmi';

interface CurrencySelectorProps {
  selectedCurrency: SupportedCurrency;
  onCurrencyChange: (currency: SupportedCurrency) => void;
  amount?: string;
  showConverter?: boolean;
  className?: string;
}

export function CurrencySelector({
  selectedCurrency,
  onCurrencyChange,
  amount,
  showConverter = false,
  className = ''
}: CurrencySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [rates, setRates] = useState<any[]>([]);
  const [isLoadingRates, setIsLoadingRates] = useState(false);
  const [convertedAmounts, setConvertedAmounts] = useState<Record<string, string>>({});
  
  const { address } = useAccount();
  
  // Fetch balances for all supported currencies
  const cUSDBalance = useBalance({
    address: address,
    token: MENTO_TOKENS.cUSD.address as `0x${string}`,
    query: { enabled: !!address }
  });
  
  const cEURBalance = useBalance({
    address: address,
    token: MENTO_TOKENS.cEUR.address as `0x${string}`,
    query: { enabled: !!address }
  });
  
  const cREALBalance = useBalance({
    address: address,
    token: MENTO_TOKENS.cREAL.address as `0x${string}`,
    query: { enabled: !!address }
  });
  
  const cKESBalance = useBalance({
    address: address,
    token: MENTO_TOKENS.cKES.address as `0x${string}`,
    query: { enabled: !!address }
  });
  
  const eXOFBalance = useBalance({
    address: address,
    token: MENTO_TOKENS.eXOF.address as `0x${string}`,
    query: { enabled: !!address }
  });
  
  const cNGNBalance = useBalance({
    address: address,
    token: MENTO_TOKENS.cNGN.address as `0x${string}`,
    query: { enabled: !!address }
  });

  const balances = {
    cUSD: cUSDBalance.data,
    cEUR: cEURBalance.data,
    cREAL: cREALBalance.data,
    cKES: cKESBalance.data,
    eXOF: eXOFBalance.data,
    cNGN: cNGNBalance.data,
  };

  useEffect(() => {
    loadRates();
  }, [selectedCurrency]);

  useEffect(() => {
    if (amount && showConverter) {
      convertAmounts();
    }
  }, [amount, rates, showConverter]);

  const loadRates = async () => {
    setIsLoadingRates(true);
    try {
      const currenciesWithRates = await mentoFX.getAllCurrenciesWithRates(selectedCurrency);
      setRates(currenciesWithRates);
    } catch (error) {
      console.error('Error loading rates:', error);
    } finally {
      setIsLoadingRates(false);
    }
  };

  const convertAmounts = async () => {
    if (!amount) return;
    
    const converted: Record<string, string> = {};
    for (const currency of Object.keys(MENTO_TOKENS) as SupportedCurrency[]) {
      if (currency !== selectedCurrency) {
        try {
          converted[currency] = await mentoFX.convertCurrency(amount, selectedCurrency, currency);
        } catch (error) {
          converted[currency] = '0';
        }
      }
    }
    setConvertedAmounts(converted);
  };

  const selectedToken = MENTO_TOKENS[selectedCurrency];

  return (
    <div className={`relative ${className}`}>
      {/* Currency Selector Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-3 sm:px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-lg hover:bg-slate-800/70 transition-colors min-h-[60px]"
      >
        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
          <span className="text-xl sm:text-2xl flex-shrink-0">{selectedToken.flag}</span>
          <div className="text-left min-w-0">
            <div className="font-medium text-white text-sm sm:text-base">{selectedToken.symbol}</div>
            <div className="text-xs text-slate-400 truncate">{selectedToken.name}</div>
          </div>
        </div>
        
        <div className="flex items-center gap-2 flex-shrink-0">
          {isLoadingRates && <RefreshCw className="w-4 h-4 text-slate-400 animate-spin" />}
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop to close dropdown when clicking outside */}
          <div 
            className="fixed inset-0 z-[100]" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-[101] max-h-60 sm:max-h-80 overflow-y-auto max-w-full">
          {Object.entries(MENTO_TOKENS).map(([key, token]) => {
            const currency = key as SupportedCurrency;
            const rateInfo = rates.find(r => r.key === currency);
            
            return (
              <button
                type="button"
                key={key}
                onClick={() => {
                  onCurrencyChange(currency);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 sm:px-4 py-3 text-left hover:bg-slate-700/50 transition-colors ${
                  currency === selectedCurrency ? 'bg-slate-700/30' : ''
                }`}
              >
                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                  <span className="text-lg sm:text-xl flex-shrink-0">{token.flag}</span>
                  <div className="min-w-0">
                    <div className="font-medium text-white text-sm sm:text-base">{token.symbol}</div>
                    <div className="text-xs text-slate-400 truncate">{token.name}</div>
                  </div>
                </div>
                
                <div className="text-right flex-shrink-0 ml-2">
                  <div className="text-xs text-slate-400">
                    Balance: {balances[currency]?.formatted ? 
                      parseFloat(balances[currency].formatted).toFixed(2) : 
                      '0.00'}
                  </div>
                  {showConverter && amount && convertedAmounts[currency] && (
                    <div className="text-xs sm:text-sm text-emerald-400">
                      ≈ {parseFloat(convertedAmounts[currency]).toLocaleString()}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
          
          {/* Refresh Rates Button */}
          <div className="border-t border-slate-700 p-2">
            <button
              type="button"
              onClick={loadRates}
              disabled={isLoadingRates}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-slate-400 hover:text-white transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingRates ? 'animate-spin' : ''}`} />
              Refresh Rates
            </button>
          </div>
        </div>
        </>
      )}

      {/* Exchange Rate Display */}
      {!isOpen && rates.length > 0 && (
        <div className="mt-2 text-xs text-slate-500">
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      )}
    </div>
  );
}