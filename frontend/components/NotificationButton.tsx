'use client';

import { useState } from 'react';
import { useProfile } from '@farcaster/auth-kit';

interface NotificationButtonProps {
  onNotificationEnabled?: () => void;
  className?: string;
}

export function NotificationButton({ onNotificationEnabled, className = '' }: NotificationButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const { isAuthenticated, profile } = useProfile();

  const handleEnableNotifications = async () => {
    if (!isAuthenticated || !profile) {
      alert('Please sign in with Farcaster first');
      return;
    }

    setIsLoading(true);
    
    try {
      // Use the Farcaster SDK to add the Mini App
      if (typeof window !== 'undefined' && window.farcaster) {
        await window.farcaster.addMiniApp();
        setIsEnabled(true);
        onNotificationEnabled?.();
        
        // Show success message
        alert('Notifications enabled! You\'ll now receive updates about campaigns, applications, and payments.');
      } else {
        // Fallback for when not in Farcaster client
        alert('Please open this app in a Farcaster client to enable notifications');
      }
    } catch (error) {
      console.error('Error enabling notifications:', error);
      alert('Failed to enable notifications. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <button
      onClick={handleEnableNotifications}
      disabled={isLoading || isEnabled}
      className={`
        px-4 py-2 rounded-lg font-medium transition-all duration-200
        ${isEnabled 
          ? 'bg-green-100 text-green-800 cursor-not-allowed' 
          : 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800'
        }
        ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
    >
      {isLoading ? (
        <>
          <span className="inline-block animate-spin mr-2">⏳</span>
          Enabling...
        </>
      ) : isEnabled ? (
        <>
          <span className="mr-2">✅</span>
          Notifications Enabled
        </>
      ) : (
        <>
          <span className="mr-2">🔔</span>
          Enable Notifications
        </>
      )}
    </button>
  );
}

// Type declaration for Farcaster SDK (add this to your types file)
declare global {
  interface Window {
    farcaster?: {
      addMiniApp: () => Promise<void>;
      removeMiniApp: () => Promise<void>;
    };
  }
}