// Database configuration for AdsBazaar Farcaster notifications
// Uses Supabase (PostgreSQL) as the database backend

import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

// Create Supabase client with service role key for server-side operations
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Database types
export interface NotificationToken {
  id: number;
  fid: number;
  notification_token: string;
  notification_url: string;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotificationPreferences {
  id: number;
  fid: number;
  user_address?: string;
  campaign_opportunities: boolean;
  application_updates: boolean;
  payment_notifications: boolean;
  dispute_alerts: boolean;
  deadline_reminders: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotificationHistory {
  id: number;
  fid: number;
  notification_type: string;
  title: string;
  body: string;
  target_url?: string;
  notification_data?: any;
  sent_at: string;
  clicked_at?: string;
}

export interface UserFidMapping {
  id: number;
  fid: number;
  wallet_address: string;
  username?: string;
  created_at: string;
  updated_at: string;
}

// Database helper functions
export async function getNotificationToken(fid: number): Promise<NotificationToken | null> {
  const { data, error } = await supabase
    .from('notification_tokens')
    .select('*')
    .eq('fid', fid)
    .eq('enabled', true)
    .single();
  
  if (error) {
    console.error('Error fetching notification token:', error);
    return null;
  }
  
  return data;
}

export async function getUserPreferences(fid: number): Promise<NotificationPreferences | null> {
  const { data, error } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('fid', fid)
    .single();
  
  if (error) {
    console.error('Error fetching user preferences:', error);
    return null;
  }
  
  return data;
}

export async function updateUserPreferences(fid: number, preferences: Partial<NotificationPreferences>): Promise<boolean> {
  const { error } = await supabase
    .from('notification_preferences')
    .upsert({
      fid,
      ...preferences,
      updated_at: new Date().toISOString()
    });
  
  if (error) {
    console.error('Error updating user preferences:', error);
    return false;
  }
  
  return true;
}

export async function saveNotificationHistory(notification: Omit<NotificationHistory, 'id' | 'sent_at'>): Promise<boolean> {
  const { error } = await supabase
    .from('notification_history')
    .insert({
      ...notification,
      sent_at: new Date().toISOString()
    });
  
  if (error) {
    console.error('Error saving notification history:', error);
    return false;
  }
  
  return true;
}

export async function getFidFromAddress(address: string): Promise<number | null> {
  const { data, error } = await supabase
    .from('user_fid_mappings')
    .select('fid')
    .eq('wallet_address', address.toLowerCase())
    .single();
  
  if (error) {
    console.error('Error fetching FID from address:', error);
    return null;
  }
  
  return data?.fid || null;
}

export async function getAddressFromFid(fid: number): Promise<string | null> {
  const { data, error } = await supabase
    .from('user_fid_mappings')
    .select('wallet_address')
    .eq('fid', fid)
    .single();
  
  if (error) {
    console.error('Error fetching address from FID:', error);
    return null;
  }
  
  return data?.wallet_address || null;
}

export async function getUserMapping(fid: number): Promise<UserFidMapping | null> {
  const { data, error } = await supabase
    .from('user_fid_mappings')
    .select('*')
    .eq('fid', fid)
    .single();
  
  if (error) {
    console.error('Error fetching user mapping:', error);
    return null;
  }
  
  return data;
}

export async function registerUserFidMapping(fid: number, address: string, username?: string): Promise<boolean> {
  const { error } = await supabase
    .from('user_fid_mappings')
    .upsert({
      fid,
      wallet_address: address.toLowerCase(),
      username: username || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  
  if (error) {
    console.error('Error registering user FID mapping:', error);
    return false;
  }
  
  return true;
}