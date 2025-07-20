// Test Component for Multi-Currency AdsBazaar functionality
// This tests the frontend integration with the new diamond contract

import React, { useState } from 'react';
import { useAccount, useConnect } from 'wagmi';
import { MENTO_TOKENS, SupportedCurrency } from '@/lib/mento-simple';
import { 
  useMultiCurrencyCampaignCreation,
  useMultiCurrencyPayments,
  useMultiCurrencyPendingPayments,
  useMultiCurrencyStats,
  usePreferredCurrency,
  formatCurrencyAmount
} from '@/hooks/useMultiCurrencyAdsBazaar';
import { useCreateBrief, useClaimPayments } from '@/hooks/useEnhancedAdsBazaar';

export default function TestMultiCurrencyFrontend() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const [selectedCurrency, setSelectedCurrency] = useState<SupportedCurrency>('cUSD');
  const [testResults, setTestResults] = useState<string[]>([]);

  // Hooks for testing
  const { createCampaignWithToken, isCreating } = useMultiCurrencyCampaignCreation();
  const { claimPaymentsInToken, claimAllPendingPayments, isClaiming } = useMultiCurrencyPayments();
  const { pendingPayments, isLoading: isPendingLoading } = useMultiCurrencyPendingPayments();
  const { stats, isLoading: isStatsLoading } = useMultiCurrencyStats();
  const { preferredCurrency, setPreferredCurrency } = usePreferredCurrency();
  const { createBrief } = useCreateBrief();
  const { claimPayments } = useClaimPayments();

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const testCampaignCreation = async () => {
    if (!isConnected) {
      addTestResult('❌ Wallet not connected');
      return;
    }

    try {
      addTestResult(`🧪 Testing campaign creation with ${selectedCurrency}...`);
      
      const campaignData = {
        name: `Test Campaign ${selectedCurrency}`,
        description: `Testing multicurrency campaign with ${selectedCurrency}`,
        requirements: 'Test requirements',
        budget: '100', // 100 tokens
        promotionDuration: 7 * 24 * 60 * 60, // 7 days
        maxInfluencers: 5,
        targetAudience: 1,
        applicationPeriod: 2 * 24 * 60 * 60, // 2 days
        proofSubmissionGracePeriod: 1 * 24 * 60 * 60, // 1 day
        verificationPeriod: 1 * 24 * 60 * 60, // 1 day
        selectionGracePeriod: 6 * 60 * 60, // 6 hours
      };

      const result = await createCampaignWithToken(campaignData, selectedCurrency);
      addTestResult(`✅ Campaign created successfully with ${selectedCurrency}: ${result}`);
    } catch (error) {
      addTestResult(`❌ Campaign creation failed: ${error.message}`);
    }
  };

  const testBackwardCompatibility = async () => {
    if (!isConnected) {
      addTestResult('❌ Wallet not connected');
      return;
    }

    try {
      addTestResult('🧪 Testing backward compatibility with cUSD...');
      
      const result = await createBrief(
        'Legacy Test Campaign',
        'Testing legacy cUSD campaign',
        'Legacy requirements',
        '50',
        7 * 24 * 60 * 60,
        3,
        1,
        2 * 24 * 60 * 60,
        1 * 24 * 60 * 60,
        1 * 24 * 60 * 60,
        6 * 60 * 60,
        'cUSD' // Optional currency parameter
      );
      addTestResult('✅ Legacy cUSD campaign created successfully');
    } catch (error) {
      addTestResult(`❌ Legacy campaign creation failed: ${error.message}`);
    }
  };

  const testPaymentClaiming = async () => {
    if (!isConnected) {
      addTestResult('❌ Wallet not connected');
      return;
    }

    try {
      addTestResult(`🧪 Testing payment claiming for ${selectedCurrency}...`);
      const result = await claimPaymentsInToken(selectedCurrency);
      addTestResult(`✅ Payments claimed successfully for ${selectedCurrency}`);
    } catch (error) {
      addTestResult(`❌ Payment claiming failed: ${error.message}`);
    }
  };

  const testClaimAllPayments = async () => {
    if (!isConnected) {
      addTestResult('❌ Wallet not connected');
      return;
    }

    try {
      addTestResult('🧪 Testing claim all pending payments...');
      const result = await claimAllPendingPayments();
      addTestResult('✅ All pending payments claimed successfully');
    } catch (error) {
      addTestResult(`❌ Claim all payments failed: ${error.message}`);
    }
  };

  const testLegacyPaymentClaiming = async () => {
    if (!isConnected) {
      addTestResult('❌ Wallet not connected');
      return;
    }

    try {
      addTestResult('🧪 Testing legacy payment claiming...');
      const result = await claimPayments(); // No currency parameter for backward compatibility
      addTestResult('✅ Legacy payments claimed successfully');
    } catch (error) {
      addTestResult(`❌ Legacy payment claiming failed: ${error.message}`);
    }
  };

  if (!isConnected) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold mb-4">Multi-Currency AdsBazaar Test</h1>
        <p className="mb-4">Please connect your wallet to test multi-currency functionality.</p>
        {connectors.map((connector) => (
          <button
            key={connector.id}
            onClick={() => connect({ connector })}
            className="bg-blue-500 text-white px-4 py-2 rounded mr-2"
          >
            Connect {connector.name}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Multi-Currency AdsBazaar Test Dashboard</h1>
      <p className="mb-4">Connected: {address}</p>

      {/* Currency Selection */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Select Test Currency</h2>
        <select
          value={selectedCurrency}
          onChange={(e) => setSelectedCurrency(e.target.value as SupportedCurrency)}
          className="border rounded px-3 py-2"
        >
          {Object.entries(MENTO_TOKENS).map(([key, token]) => (
            <option key={key} value={key}>
              {token.flag} {token.symbol} - {token.name}
            </option>
          ))}
        </select>
      </div>

      {/* Test Buttons */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <button
          onClick={testCampaignCreation}
          disabled={isCreating}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
        >
          {isCreating ? 'Creating...' : `Test Campaign Creation (${selectedCurrency})`}
        </button>

        <button
          onClick={testBackwardCompatibility}
          disabled={isCreating}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          Test Backward Compatibility (cUSD)
        </button>

        <button
          onClick={testPaymentClaiming}
          disabled={isClaiming}
          className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 disabled:opacity-50"
        >
          {isClaiming ? 'Claiming...' : `Test Payment Claiming (${selectedCurrency})`}
        </button>

        <button
          onClick={testClaimAllPayments}
          disabled={isClaiming}
          className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 disabled:opacity-50"
        >
          Test Claim All Payments
        </button>

        <button
          onClick={testLegacyPaymentClaiming}
          disabled={isClaiming}
          className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 disabled:opacity-50"
        >
          Test Legacy Payment Claiming
        </button>

        <button
          onClick={() => setPreferredCurrency(selectedCurrency)}
          className="bg-indigo-500 text-white px-4 py-2 rounded hover:bg-indigo-600"
        >
          Set Preferred Currency ({selectedCurrency})
        </button>
      </div>

      {/* Data Display */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Pending Payments */}
        <div className="border rounded p-4">
          <h3 className="font-semibold mb-2">Pending Payments</h3>
          {isPendingLoading ? (
            <p>Loading...</p>
          ) : pendingPayments ? (
            <div>
              <p>Tokens with pending payments: {pendingPayments.tokens.length}</p>
              {pendingPayments.tokens.map((token, index) => (
                <div key={token} className="text-sm">
                  {pendingPayments.symbols[index]}: {formatCurrencyAmount(
                    pendingPayments.amounts[index],
                    pendingPayments.symbols[index] as SupportedCurrency
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p>No pending payments data</p>
          )}
        </div>

        {/* Multi-Currency Stats */}
        <div className="border rounded p-4">
          <h3 className="font-semibold mb-2">Multi-Currency Stats</h3>
          {isStatsLoading ? (
            <p>Loading...</p>
          ) : stats ? (
            <div>
              <p>Supported currencies: {stats.tokens.length}</p>
              {stats.symbols.map((symbol, index) => (
                <div key={symbol} className="text-sm">
                  {symbol}: {stats.campaignCounts[index].toString()} campaigns
                </div>
              ))}
            </div>
          ) : (
            <p>No stats data available</p>
          )}
        </div>
      </div>

      {/* Current Preferences */}
      <div className="mb-6">
        <h3 className="font-semibold mb-2">Current Preferred Currency</h3>
        <p>{preferredCurrency || 'Not set'}</p>
      </div>

      {/* Test Results */}
      <div className="border rounded p-4">
        <h3 className="font-semibold mb-2">Test Results</h3>
        <div className="max-h-60 overflow-y-auto space-y-1">
          {testResults.length === 0 ? (
            <p className="text-gray-500">No tests run yet</p>
          ) : (
            testResults.map((result, index) => (
              <div key={index} className="text-sm font-mono">{result}</div>
            ))
          )}
        </div>
        <button
          onClick={() => setTestResults([])}
          className="mt-2 bg-red-500 text-white px-3 py-1 rounded text-sm"
        >
          Clear Results
        </button>
      </div>

      {/* Instructions */}
      <div className="mt-6 border rounded p-4 bg-gray-50">
        <h3 className="font-semibold mb-2">Testing Instructions</h3>
        <ol className="text-sm space-y-1 list-decimal list-inside">
          <li>Select a currency from the dropdown</li>
          <li>Test campaign creation with different currencies</li>
          <li>Test backward compatibility with existing cUSD functionality</li>
          <li>Test payment claiming for specific currencies</li>
          <li>Test claiming all pending payments across currencies</li>
          <li>Set preferred payment currency</li>
          <li>Review pending payments and stats data</li>
        </ol>
      </div>
    </div>
  );
}