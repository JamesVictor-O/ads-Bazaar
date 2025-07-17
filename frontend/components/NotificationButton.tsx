'use client';

import { useState, useEffect } from 'react';
import { useProfile } from '@farcaster/auth-kit';
import sdk from '@farcaster/frame-sdk';
// import { NotificationSuccessModal } from './modals/NotificationSuccessModal';
import { useAccount } from 'wagmi';
// import { useUserProfile } from '../hooks/adsBazaar';

interface NotificationButtonProps {
  onNotificationEnabled?: () => void;
  className?: string;
}

export function NotificationButton({ onNotificationEnabled, className = '' }: NotificationButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [isInMiniApp, setIsInMiniApp] = useState(false);
  // const [showSuccessModal, setShowSuccessModal] = useState(false);
  const { isAuthenticated, profile } = useProfile();
  const { address } = useAccount();
  // const { data: userProfile } = useUserProfile(address as `0x${string}`);

  // Check if we're in a Farcaster Mini App context
  useEffect(() => {
    const checkMiniAppContext = async () => {
      try {
        const context = await sdk.context;
        setIsInMiniApp(!!context?.client?.clientFid);
      } catch (error) {
        console.error('Error checking Mini App context:', error);
        setIsInMiniApp(false);
      }
    };
    
    checkMiniAppContext();
  }, []);

  // Check if notifications were previously enabled
  useEffect(() => {
    const checkNotificationStatus = () => {
      if (address) {
        const storageKey = `notifications_enabled_${address}`;
        const isNotificationEnabled = localStorage.getItem(storageKey) === 'true';
        setIsEnabled(isNotificationEnabled);
      }
    };
    
    checkNotificationStatus();
  }, [address]);

  // Determine user type based on profile data
  const getUserType = (): 'influencer' | 'brand' | 'unknown' => {
    // if (!userProfile?.isRegistered) return 'unknown';
    // if (userProfile?.isBusiness) return 'brand';
    // if (userProfile?.isInfluencer) return 'influencer';
    return 'unknown';
  };

  const handleEnableNotifications = async () => {
    // In Mini App context, we don't need traditional auth-kit authentication
    if (!isInMiniApp && (!isAuthenticated || !profile)) {
      alert('Please sign in with Farcaster first');
      return;
    }

    setIsLoading(true);
    
    try {
      if (isInMiniApp) {
        // Use Frame SDK for Mini App context
        await sdk.actions.addFrame();
        setIsEnabled(true);
        
        // Save to localStorage
        if (address) {
          const storageKey = `notifications_enabled_${address}`;
          localStorage.setItem(storageKey, 'true');
        }
        
        onNotificationEnabled?.();
        
        // Show success message
        alert('Notifications enabled! You\'ll now receive updates about campaigns, applications, and payments.');
      } else if (typeof window !== 'undefined' && window.farcaster) {
        // Use regular Farcaster SDK for web app
        await window.farcaster.addMiniApp();
        setIsEnabled(true);
        
        // Save to localStorage
        if (address) {
          const storageKey = `notifications_enabled_${address}`;
          localStorage.setItem(storageKey, 'true');
        }
        
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

  // Show button if authenticated OR in Mini App context
  if (!isAuthenticated && !isInMiniApp) {
    return null;
  }

  return (
    <>
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

      {/* <NotificationSuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        userType={getUserType()}
      /> */}
    </>
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