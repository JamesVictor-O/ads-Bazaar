import { useEffect, useCallback } from 'react';
import { usePublicClient, useAccount } from 'wagmi';
import { CONTRACT_ADDRESS } from '@/lib/contracts';
import AdsBazaarABI from '@/lib/AdsBazaar.json';
import { toast } from 'react-hot-toast';

interface ContractEventListenerProps {
  onCampaignCreated?: () => void;
  onCampaignCancelled?: () => void;
  onCampaignExpired?: () => void;
  onCampaignCompleted?: () => void;
  enabled?: boolean;
}

export function useContractEventListener({
  onCampaignCreated,
  onCampaignCancelled,
  onCampaignExpired,
  onCampaignCompleted,
  enabled = true
}: ContractEventListenerProps) {
  const publicClient = usePublicClient();
  const { address } = useAccount();

  const handleCampaignEvent = useCallback((eventName: string, callback?: () => void) => {
    console.log(`Contract event detected: ${eventName}`);
    if (callback) {
      callback();
    }
  }, []);

  useEffect(() => {
    if (!publicClient || !enabled || !address) return;

    let unsubscribeFunctions: (() => void)[] = [];

    const setupEventListeners = async () => {
      try {
        // Listen for AdBriefCreated events
        if (onCampaignCreated) {
          const unsubscribeCreated = publicClient.watchContractEvent({
            address: CONTRACT_ADDRESS as `0x${string}`,
            abi: AdsBazaarABI.abi,
            eventName: 'AdBriefCreated',
            args: {
              business: address, // Only listen for events from the current user
            },
            onLogs: (logs) => {
              console.log('AdBriefCreated event detected:', logs);
              handleCampaignEvent('AdBriefCreated', onCampaignCreated);
            },
          });
          unsubscribeFunctions.push(unsubscribeCreated);
        }

        // Listen for AdBriefCancelled events
        if (onCampaignCancelled) {
          const unsubscribeCancelled = publicClient.watchContractEvent({
            address: CONTRACT_ADDRESS as `0x${string}`,
            abi: AdsBazaarABI.abi,
            eventName: 'AdBriefCancelled',
            args: {
              business: address,
            },
            onLogs: (logs) => {
              console.log('AdBriefCancelled event detected:', logs);
              handleCampaignEvent('AdBriefCancelled', onCampaignCancelled);
            },
          });
          unsubscribeFunctions.push(unsubscribeCancelled);
        }

        // Listen for CampaignExpired events
        if (onCampaignExpired) {
          const unsubscribeExpired = publicClient.watchContractEvent({
            address: CONTRACT_ADDRESS as `0x${string}`,
            abi: AdsBazaarABI.abi,
            eventName: 'CampaignExpired',
            args: {
              business: address,
            },
            onLogs: (logs) => {
              console.log('CampaignExpired event detected:', logs);
              handleCampaignEvent('CampaignExpired', onCampaignExpired);
            },
          });
          unsubscribeFunctions.push(unsubscribeExpired);
        }

        // Listen for CampaignCompleted events
        if (onCampaignCompleted) {
          const unsubscribeCompleted = publicClient.watchContractEvent({
            address: CONTRACT_ADDRESS as `0x${string}`,
            abi: AdsBazaarABI.abi,
            eventName: 'CampaignCompleted',
            args: {
              business: address,
            },
            onLogs: (logs) => {
              console.log('CampaignCompleted event detected:', logs);
              handleCampaignEvent('CampaignCompleted', onCampaignCompleted);
            },
          });
          unsubscribeFunctions.push(unsubscribeCompleted);
        }

        console.log(`Set up ${unsubscribeFunctions.length} contract event listeners`);
      } catch (error) {
        console.error('Error setting up contract event listeners:', error);
      }
    };

    setupEventListeners();

    // Cleanup function
    return () => {
      unsubscribeFunctions.forEach(unsubscribe => {
        try {
          unsubscribe();
        } catch (error) {
          console.error('Error cleaning up event listener:', error);
        }
      });
      console.log('Cleaned up contract event listeners');
    };
  }, [publicClient, enabled, address, handleCampaignEvent, onCampaignCreated, onCampaignCancelled, onCampaignExpired, onCampaignCompleted]);

  return {
    // Could add additional methods here if needed
    isListening: enabled && !!publicClient && !!address
  };
}