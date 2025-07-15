'use client';

import { useState, useEffect } from 'react';
import { useProfile } from '@farcaster/auth-kit';
import { updateUserPreferences, getUserPreferences } from '@/lib/database';

interface NotificationSettingsProps {
  onClose?: () => void;
}

interface NotificationPreference {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
}

export function NotificationSettings({ onClose }: NotificationSettingsProps) {
  const [preferences, setPreferences] = useState<NotificationPreference[]>([
    {
      id: 'campaign_opportunities',
      label: 'Campaign Opportunities',
      description: 'Get notified when new campaigns match your audience',
      enabled: true
    },
    {
      id: 'application_updates',
      label: 'Application Updates',
      description: 'Updates on your campaign applications and selections',
      enabled: true
    },
    {
      id: 'payment_notifications',
      label: 'Payment Notifications',
      description: 'Alerts when payments are ready or processed',
      enabled: true
    },
    {
      id: 'dispute_alerts',
      label: 'Dispute Alerts',
      description: 'Notifications about disputes and resolutions',
      enabled: true
    },
    {
      id: 'deadline_reminders',
      label: 'Deadline Reminders',
      description: 'Reminders for campaign deadlines and submissions',
      enabled: true
    },
    {
      id: 'proof_status_updates',
      label: 'Content Status Updates',
      description: 'When your submitted content is approved or needs revision',
      enabled: true
    },
    {
      id: 'proof_submitted',
      label: 'Content Submissions',
      description: 'When influencers submit content for your campaigns',
      enabled: true
    },
    {
      id: 'campaign_cancelled',
      label: 'Campaign Cancellations',
      description: 'When campaigns you applied to are cancelled',
      enabled: true
    }
  ]);

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { isAuthenticated, profile } = useProfile();

  useEffect(() => {
    loadUserPreferences();
  }, [isAuthenticated, profile]);

  const loadUserPreferences = async () => {
    if (!isAuthenticated || !profile?.fid) return;
    
    setIsLoading(true);
    try {
      const userPrefs = await getUserPreferences(profile.fid);
      if (userPrefs) {
        setPreferences(prev => prev.map(pref => ({
          ...pref,
          enabled: userPrefs[pref.id as keyof typeof userPrefs] as boolean ?? pref.enabled
        })));
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = async (preferenceId: string) => {
    if (!isAuthenticated || !profile?.fid) return;
    
    const newPreferences = preferences.map(pref => 
      pref.id === preferenceId ? { ...pref, enabled: !pref.enabled } : pref
    );
    
    setPreferences(newPreferences);
    
    // Save to database
    setIsSaving(true);
    try {
      const prefsToSave = newPreferences.reduce((acc, pref) => ({
        ...acc,
        [pref.id]: pref.enabled
      }), {});
      
      await updateUserPreferences(profile.fid, prefsToSave);
    } catch (error) {
      console.error('Error saving preferences:', error);
      // Revert on error
      loadUserPreferences();
    } finally {
      setIsSaving(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="p-6 text-center">
        <h3 className="text-lg font-semibold mb-4">Sign In Required</h3>
        <p className="text-gray-600">Please sign in with Farcaster to manage notification settings.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Notification Settings</h2>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading preferences...</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-blue-800">
                Notifications appear in your Farcaster client and will take you directly to the relevant page in AdsBazaar.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {preferences.map((preference) => (
              <div key={preference.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{preference.label}</h3>
                  <p className="text-sm text-gray-600 mt-1">{preference.description}</p>
                </div>
                <div className="ml-4">
                  <button
                    onClick={() => handleToggle(preference.id)}
                    disabled={isSaving}
                    className={`
                      relative inline-flex items-center h-6 w-11 rounded-full transition-colors duration-200
                      ${preference.enabled ? 'bg-blue-600' : 'bg-gray-300'}
                      ${isSaving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                    `}
                  >
                    <span
                      className={`
                        inline-block h-4 w-4 bg-white rounded-full transition-transform duration-200
                        ${preference.enabled ? 'translate-x-6' : 'translate-x-1'}
                      `}
                    />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2">Notification Frequency</h3>
            <p className="text-sm text-gray-600 mb-3">
              Most notifications are sent immediately when events occur. You can disable specific types above.
            </p>
            <div className="text-xs text-gray-500">
              <p>• Campaign opportunities: When matching campaigns are created</p>
              <p>• Application updates: When you're selected or applications change</p>
              <p>• Payment notifications: When payments are approved or ready</p>
              <p>• Content status updates: When your submitted content is reviewed</p>
              <p>• Content submissions: When influencers submit work (brands only)</p>
              <p>• Campaign cancellations: When campaigns are cancelled</p>
              <p>• Dispute alerts: When disputes are raised or resolved</p>
              <p>• Deadline reminders: 24 hours and 1 hour before deadlines</p>
            </div>
          </div>

          {isSaving && (
            <div className="text-center py-2">
              <p className="text-sm text-gray-600">Saving preferences...</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}