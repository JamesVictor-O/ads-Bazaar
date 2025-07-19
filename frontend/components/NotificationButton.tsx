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

    if (!address) {
      alert('Please connect your wallet first');
      return;
    }

    setIsLoading(true);
    
    try {
      let fid: number | null = null;
      
      if (isInMiniApp) {
        // Use Frame SDK for Mini App context
        await sdk.actions.addFrame();
        
        // Get FID from Frame SDK context
        const context = await sdk.context;
        fid = context?.user?.fid || null;
      } else if (typeof window !== 'undefined' && window.farcaster) {
        // Use regular Farcaster SDK for web app
        await window.farcaster.addMiniApp();
        
        // Get FID from auth-kit profile
        fid = profile?.fid || null;
      } else {
        // Fallback for when not in Farcaster client
        alert('Please open this app in a Farcaster client to enable notifications');
        return;
      }

      if (!fid) {
        console.error('No FID available');
        alert('Failed to get Farcaster ID. Please try again.');
        return;
      }

      // Register the FID-to-address mapping
      try {
        const response = await fetch('/api/notifications/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fid,
            address,
            username: profile?.username || null,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to register notification mapping');
        }

        console.log('Successfully registered FID-to-address mapping:', { fid, address });
      } catch (registrationError) {
        console.error('Error registering notification mapping:', registrationError);
        alert('Failed to register for notifications. Please try again.');
        return;
      }
        
      setIsEnabled(true);
      
      // Save to localStorage
      const storageKey = `notifications_enabled_${address}`;
      localStorage.setItem(storageKey, 'true');
      
      onNotificationEnabled?.();
      
      // Show success message
      alert('Notifications enabled! You\'ll now receive updates about campaigns, applications, and payments in your Farcaster client.');
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