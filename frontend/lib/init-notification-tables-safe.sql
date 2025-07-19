-- Database tables required for AdsBazaar notifications (Safe version)

-- Table to store notification tokens from Farcaster webhook
CREATE TABLE IF NOT EXISTS notification_tokens (
  id SERIAL PRIMARY KEY,
  fid INTEGER NOT NULL UNIQUE,
  notification_token TEXT NOT NULL,
  notification_url TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table to store user notification preferences
CREATE TABLE IF NOT EXISTS notification_preferences (
  id SERIAL PRIMARY KEY,
  fid INTEGER NOT NULL UNIQUE,
  user_address TEXT,
  campaign_opportunities BOOLEAN DEFAULT true,
  application_updates BOOLEAN DEFAULT true,
  payment_notifications BOOLEAN DEFAULT true,
  dispute_alerts BOOLEAN DEFAULT true,
  deadline_reminders BOOLEAN DEFAULT true,
  proof_status_updates BOOLEAN DEFAULT true,
  proof_submitted BOOLEAN DEFAULT true,
  campaign_cancelled BOOLEAN DEFAULT true,
  auto_approval_alert BOOLEAN DEFAULT true,
  campaign_expiry_warning BOOLEAN DEFAULT true,
  insufficient_applications BOOLEAN DEFAULT true,
  budget_refund BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table to store notification history
CREATE TABLE IF NOT EXISTS notification_history (
  id SERIAL PRIMARY KEY,
  fid INTEGER NOT NULL,
  notification_type VARCHAR(50) NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  target_url TEXT,
  notification_data JSONB,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  clicked_at TIMESTAMP WITH TIME ZONE
);

-- NEW: Table to map Farcaster FIDs to wallet addresses
CREATE TABLE IF NOT EXISTS user_fid_mappings (
  id SERIAL PRIMARY KEY,
  fid INTEGER NOT NULL,
  wallet_address TEXT NOT NULL,
  username TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(fid),
  UNIQUE(wallet_address)
);

-- Optional: Table for dispute resolvers (can be added later)
CREATE TABLE IF NOT EXISTS dispute_resolvers (
  id SERIAL PRIMARY KEY,
  fid INTEGER NOT NULL UNIQUE,
  wallet_address TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notification_tokens_fid ON notification_tokens(fid);
CREATE INDEX IF NOT EXISTS idx_notification_tokens_enabled ON notification_tokens(enabled);
CREATE INDEX IF NOT EXISTS idx_notification_preferences_fid ON notification_preferences(fid);
CREATE INDEX IF NOT EXISTS idx_notification_history_fid ON notification_history(fid);
CREATE INDEX IF NOT EXISTS idx_notification_history_type ON notification_history(notification_type);
CREATE INDEX IF NOT EXISTS idx_user_fid_mappings_fid ON user_fid_mappings(fid);
CREATE INDEX IF NOT EXISTS idx_user_fid_mappings_address ON user_fid_mappings(wallet_address);
CREATE INDEX IF NOT EXISTS idx_dispute_resolvers_fid ON dispute_resolvers(fid);
CREATE INDEX IF NOT EXISTS idx_dispute_resolvers_active ON dispute_resolvers(active);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing triggers if they exist, then recreate them
DROP TRIGGER IF EXISTS update_notification_tokens_updated_at ON notification_tokens;
DROP TRIGGER IF EXISTS update_notification_preferences_updated_at ON notification_preferences;
DROP TRIGGER IF EXISTS update_user_fid_mappings_updated_at ON user_fid_mappings;
DROP TRIGGER IF EXISTS update_dispute_resolvers_updated_at ON dispute_resolvers;

-- Create triggers
CREATE TRIGGER update_notification_tokens_updated_at 
  BEFORE UPDATE ON notification_tokens 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_preferences_updated_at 
  BEFORE UPDATE ON notification_preferences 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_fid_mappings_updated_at 
  BEFORE UPDATE ON user_fid_mappings 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dispute_resolvers_updated_at 
  BEFORE UPDATE ON dispute_resolvers 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();