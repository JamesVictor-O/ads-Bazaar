'use client';

import { useState, useEffect } from 'react';
import { X, Coins, ArrowRight, CheckCircle, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { 
  useMultiCurrencyPayments, 
  useMultiCurrencyPendingPayments,
  formatCurrencyAmount
} from '@/hooks/useMultiCurrencyAdsBazaar';
import { MENTO_TOKENS, SupportedCurrency } from '@/lib/mento-simple';

interface MultiCurrencyPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MultiCurrencyPaymentModal({ isOpen, onClose }: MultiCurrencyPaymentModalProps) {
  const [selectedCurrency, setSelectedCurrency] = useState<SupportedCurrency | 'all'>('all');
  const [claimMode, setClaimMode] = useState<'individual' | 'bulk'>('bulk');
  
  const { 
    claimPaymentsInToken, 
    claimAllPendingPayments, 
    isClaiming 
  } = useMultiCurrencyPayments();
  
  const { 
    pendingPayments, 
    isLoading: isLoadingPayments, 
    refetch 
  } = useMultiCurrencyPendingPayments();

  // Refresh payments when modal opens
  useEffect(() => {
    if (isOpen) {
      refetch();
    }
  }, [isOpen, refetch]);

  const handleClaimPayments = async () => {
    try {
      if (claimMode === 'bulk') {
        await claimAllPendingPayments();
        toast.success('All pending payments claimed successfully!');
      } else if (selectedCurrency !== 'all') {
        await claimPaymentsInToken(selectedCurrency as SupportedCurrency);
        const currencyInfo = MENTO_TOKENS[selectedCurrency as SupportedCurrency];
        toast.success(`Payments claimed in ${currencyInfo.symbol}!`);
      }
      
      // Refresh the payments data
      setTimeout(() => refetch(), 2000);
    } catch (error) {
      console.error('Error claiming payments:', error);
      // Error toast is handled in the hook
    }
  };

  const formatPendingPayments = () => {
    if (!pendingPayments) return [];
    
    return pendingPayments.tokens.map((token, index) => {
      const currency = Object.entries(MENTO_TOKENS).find(
        ([_, tokenInfo]) => tokenInfo.address.toLowerCase() === token.toLowerCase()
      )?.[0] as SupportedCurrency;
      
      if (!currency) return null;
      
      return {
        currency,
        token: MENTO_TOKENS[currency],
        amount: pendingPayments.amounts[index],
        symbol: pendingPayments.symbols[index],
        formattedAmount: formatCurrencyAmount(pendingPayments.amounts[index], currency)
      };
    }).filter(Boolean);
  };

  const pendingData = formatPendingPayments();
  const totalPendingCurrencies = pendingData.length;
  const hasPendingPayments = totalPendingCurrencies > 0;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-slate-900 rounded-2xl p-6 w-full max-w-md border border-slate-700"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/20 rounded-lg">
                <Coins className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Claim Payments</h2>
                <p className="text-sm text-slate-400">
                  {totalPendingCurrencies} {totalPendingCurrencies === 1 ? 'currency' : 'currencies'} available
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          {/* Loading State */}
          {isLoadingPayments && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-500 border-t-transparent"></div>
              <span className="ml-3 text-slate-400">Loading payments...</span>
            </div>
          )}

          {/* No Pending Payments */}
          {!isLoadingPayments && !hasPendingPayments && (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-slate-500 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-white mb-2">All caught up!</h3>
              <p className="text-slate-400 text-sm">
                You have no pending payments to claim.
              </p>
            </div>
          )}

          {/* Pending Payments List */}
          {!isLoadingPayments && hasPendingPayments && (
            <div className="space-y-4">
              {/* Claim Mode Toggle */}
              <div className="flex bg-slate-800/50 rounded-lg p-1">
                <button
                  onClick={() => setClaimMode('bulk')}
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                    claimMode === 'bulk'
                      ? 'bg-emerald-500 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Claim All
                </button>
                <button
                  onClick={() => setClaimMode('individual')}
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                    claimMode === 'individual'
                      ? 'bg-emerald-500 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Individual
                </button>
              </div>

              {/* Currency Selection (Individual Mode) */}
              {claimMode === 'individual' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Select Currency</label>
                  <select
                    value={selectedCurrency}
                    onChange={(e) => setSelectedCurrency(e.target.value as SupportedCurrency)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="all">Select a currency...</option>
                    {pendingData.map(item => (
                      <option key={item!.currency} value={item!.currency}>
                        {item!.token.flag} {item!.token.name} - {item!.formattedAmount}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Payments Summary */}
              <div className="bg-slate-800/30 rounded-lg p-4 space-y-3">
                <h3 className="font-medium text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-400" />
                  Pending Payments
                </h3>
                
                {pendingData.map(item => (
                  <div key={item!.currency} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{item!.token.flag}</span>
                      <div>
                        <div className="font-medium text-white">{item!.token.symbol}</div>
                        <div className="text-xs text-slate-400">{item!.token.name}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-emerald-400">
                        {item!.formattedAmount}
                      </div>
                    </div>
                  </div>
                ))}

                {claimMode === 'bulk' && totalPendingCurrencies > 1 && (
                  <div className="border-t border-slate-700 pt-3 mt-3">
                    <div className="text-sm text-slate-400">
                      You will claim payments in {totalPendingCurrencies} different currencies
                    </div>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <button
                onClick={handleClaimPayments}
                disabled={
                  isClaiming || 
                  (claimMode === 'individual' && selectedCurrency === 'all')
                }
                className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-700 disabled:text-slate-400 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {isClaiming ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    {claimMode === 'bulk' ? (
                      `Claim All Payments (${totalPendingCurrencies})`
                    ) : selectedCurrency === 'all' ? (
                      'Select Currency to Claim'
                    ) : (
                      `Claim ${MENTO_TOKENS[selectedCurrency as SupportedCurrency]?.symbol} Payments`
                    )}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Info Text */}
              <div className="text-xs text-slate-500 text-center">
                {claimMode === 'bulk' 
                  ? 'All pending payments will be transferred to your wallet in their respective tokens'
                  : 'Only the selected currency will be claimed'
                }
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}