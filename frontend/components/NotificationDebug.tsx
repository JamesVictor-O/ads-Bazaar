'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';

interface NotificationDebugProps {
  className?: string;
}

export function NotificationDebug({ className = '' }: NotificationDebugProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { address } = useAccount();

  const testNotification = async (type: string) => {
    if (!address) {
      alert('Please connect your wallet first');
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/notifications/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          address,
          data: {
            campaignTitle: 'Test Campaign for Debug',
            amount: '75'
          }
        }),
      });

      const data = await response.json();
      setResult(data);

      if (response.ok) {
        alert(`Test notification sent successfully! Type: ${type}`);
      } else {
        alert(`Failed to send notification: ${data.error}`);
      }
    } catch (error) {
      console.error('Error sending test notification:', error);
      alert('Failed to send test notification');
      setResult({ error: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  if (process.env.NODE_ENV === 'production') {
    return null; // Don't show in production
  }

  return (
    <div className={`bg-yellow-50 border border-yellow-200 rounded-lg p-4 ${className}`}>
      <h3 className="text-lg font-semibold text-yellow-800 mb-4">
        🔧 Notification Debug (Dev Only)
      </h3>
      
      <div className="space-y-2 mb-4">
        <button
          onClick={() => testNotification('campaign_opportunity')}
          disabled={isLoading}
          className="w-full sm:w-auto mr-2 mb-2 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
        >
          Test Campaign Opportunity
        </button>
        
        <button
          onClick={() => testNotification('influencer_selected')}
          disabled={isLoading}
          className="w-full sm:w-auto mr-2 mb-2 px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50"
        >
          Test Influencer Selected
        </button>
        
        <button
          onClick={() => testNotification('payment_available')}
          disabled={isLoading}
          className="w-full sm:w-auto mr-2 mb-2 px-3 py-1 bg-emerald-600 text-white rounded text-sm hover:bg-emerald-700 disabled:opacity-50"
        >
          Test Payment Available
        </button>
        
        <button
          onClick={() => testNotification('application_received')}
          disabled={isLoading}
          className="w-full sm:w-auto mr-2 mb-2 px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 disabled:opacity-50"
        >
          Test Application Received
        </button>
      </div>

      {isLoading && (
        <div className="text-sm text-yellow-700">
          Sending test notification...
        </div>
      )}

      {result && (
        <div className="mt-4 p-3 bg-gray-100 rounded text-sm">
          <strong>Result:</strong>
          <pre className="mt-2 text-xs overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}

      <div className="text-xs text-yellow-600 mt-4">
        <strong>Note:</strong> Make sure you've enabled notifications first and that your Supabase database has the required tables.
        <br />
        Connected address: {address || 'Not connected'}
      </div>
    </div>
  );
}