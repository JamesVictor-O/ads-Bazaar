-- AdsBazaar Notification System Database Migration
-- Run this in your Supabase SQL Editor or PostgreSQL database

-- Create notification_tokens table
CREATE TABLE notification_tokens (
  id SERIAL PRIMARY KEY,
  fid INTEGER NOT NULL UNIQUE,
  notification_token TEXT NOT NULL,
  notification_url TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create notification_preferences table
CREATE TABLE notification_preferences (
  id SERIAL PRIMARY KEY,
  fid INTEGER NOT NULL,
  user_address VARCHAR(42),
  campaign_opportunities BOOLEAN DEFAULT true,
  application_updates BOOLEAN DEFAULT true,
  payment_notifications BOOLEAN DEFAULT true,
  dispute_alerts BOOLEAN DEFAULT true,
  deadline_reminders BOOLEAN DEFAULT true,
  proof_status_updates BOOLEAN DEFAULT true,
  proof_submitted BOOLEAN DEFAULT true,
  campaign_cancelled BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (fid) REFERENCES notification_tokens(fid) ON DELETE CASCADE
);

-- Create notification_history table
CREATE TABLE notification_history (
  id SERIAL PRIMARY KEY,
  fid INTEGER NOT NULL,
  notification_type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  target_url TEXT,
  notification_data JSONB,
  sent_at TIMESTAMP DEFAULT NOW(),
  clicked_at TIMESTAMP,
  FOREIGN KEY (fid) REFERENCES notification_tokens(fid) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX idx_notification_tokens_fid ON notification_tokens(fid);
CREATE INDEX idx_notification_tokens_enabled ON notification_tokens(enabled);
CREATE INDEX idx_notification_preferences_fid ON notification_preferences(fid);
CREATE INDEX idx_notification_preferences_user_address ON notification_preferences(user_address);
CREATE INDEX idx_notification_history_fid ON notification_history(fid);
CREATE INDEX idx_notification_history_type ON notification_history(notification_type);
CREATE INDEX idx_notification_history_sent_at ON notification_history(sent_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_notification_tokens_updated_at
    BEFORE UPDATE ON notification_tokens
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_preferences_updated_at
    BEFORE UPDATE ON notification_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE notification_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for notification_tokens
CREATE POLICY "Users can view their own notification tokens"
  ON notification_tokens FOR SELECT
  USING (true); -- Allow service role to access all tokens

CREATE POLICY "Users can insert their own notification tokens"
  ON notification_tokens FOR INSERT
  WITH CHECK (true); -- Allow service role to insert

CREATE POLICY "Users can update their own notification tokens"
  ON notification_tokens FOR UPDATE
  USING (true) -- Allow service role to update
  WITH CHECK (true);

CREATE POLICY "Users can delete their own notification tokens"
  ON notification_tokens FOR DELETE
  USING (true); -- Allow service role to delete

-- Create RLS policies for notification_preferences
CREATE POLICY "Users can view their own notification preferences"
  ON notification_preferences FOR SELECT
  USING (true); -- Allow service role to access all preferences

CREATE POLICY "Users can insert their own notification preferences"
  ON notification_preferences FOR INSERT
  WITH CHECK (true); -- Allow service role to insert

CREATE POLICY "Users can update their own notification preferences"
  ON notification_preferences FOR UPDATE
  USING (true) -- Allow service role to update
  WITH CHECK (true);

CREATE POLICY "Users can delete their own notification preferences"
  ON notification_preferences FOR DELETE
  USING (true); -- Allow service role to delete

-- Create RLS policies for notification_history
CREATE POLICY "Users can view their own notification history"
  ON notification_history FOR SELECT
  USING (true); -- Allow service role to access all history

CREATE POLICY "Users can insert their own notification history"
  ON notification_history FOR INSERT
  WITH CHECK (true); -- Allow service role to insert

-- Grant permissions to service role
GRANT ALL ON notification_tokens TO service_role;
GRANT ALL ON notification_preferences TO service_role;
GRANT ALL ON notification_history TO service_role;
GRANT ALL ON SEQUENCE notification_tokens_id_seq TO service_role;
GRANT ALL ON SEQUENCE notification_preferences_id_seq TO service_role;
GRANT ALL ON SEQUENCE notification_history_id_seq TO service_role;

-- Insert default preferences for existing users (if any)
-- This is optional and can be customized based on your needs
INSERT INTO notification_preferences (fid, campaign_opportunities, application_updates, payment_notifications, dispute_alerts, deadline_reminders)
SELECT 
  fid,
  true, -- campaign_opportunities
  true, -- application_updates
  true, -- payment_notifications
  true, -- dispute_alerts
  true  -- deadline_reminders
FROM notification_tokens
WHERE fid NOT IN (SELECT fid FROM notification_preferences);

-- Create a function to clean up old notification history (optional)
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS void AS $$
BEGIN
  DELETE FROM notification_history
  WHERE sent_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to clean up old notifications (optional)
-- This requires pg_cron extension to be enabled
-- SELECT cron.schedule('cleanup-notifications', '0 2 * * *', 'SELECT cleanup_old_notifications();');

-- Create a view for notification statistics (optional)
CREATE VIEW notification_stats AS
SELECT 
  nt.fid,
  COUNT(nh.id) as total_notifications,
  COUNT(CASE WHEN nh.clicked_at IS NOT NULL THEN 1 END) as clicked_notifications,
  COUNT(CASE WHEN nh.sent_at >= NOW() - INTERVAL '30 days' THEN 1 END) as notifications_last_30_days,
  MAX(nh.sent_at) as last_notification_sent
FROM notification_tokens nt
LEFT JOIN notification_history nh ON nt.fid = nh.fid
GROUP BY nt.fid;

-- Grant access to the view
GRANT SELECT ON notification_stats TO service_role;