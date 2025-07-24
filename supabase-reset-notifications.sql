-- =====================================================
-- AdsBazaar Notification System - Fresh Start Script
-- =====================================================
-- This script will drop all existing notification tables and recreate them
-- Use this to start fresh with a clean notification system

-- =====================================================
-- 1. DROP ALL EXISTING NOTIFICATION TABLES
-- =====================================================

-- Drop tables in reverse dependency order to avoid foreign key conflicts
DROP TABLE IF EXISTS notification_history CASCADE;
DROP TABLE IF EXISTS notification_preferences CASCADE;
DROP TABLE IF EXISTS notification_tokens CASCADE;
DROP TABLE IF EXISTS user_fid_mappings CASCADE;

-- Drop any related indexes, triggers, or functions
DROP INDEX IF EXISTS idx_notification_history_fid;
DROP INDEX IF EXISTS idx_notification_history_type;
DROP INDEX IF EXISTS idx_notification_history_sent_at;
DROP INDEX IF EXISTS idx_notification_preferences_fid;
DROP INDEX IF EXISTS idx_notification_tokens_fid;
DROP INDEX IF EXISTS idx_user_fid_mappings_fid;
DROP INDEX IF EXISTS idx_user_fid_mappings_address;

-- =====================================================
-- 2. CREATE FRESH NOTIFICATION TABLES
-- =====================================================

-- Table 1: User FID to Wallet Address Mappings
-- Maps Farcaster FIDs to wallet addresses for notification targeting
CREATE TABLE user_fid_mappings (
    id BIGSERIAL PRIMARY KEY,
    fid BIGINT NOT NULL UNIQUE,
    wallet_address TEXT NOT NULL,
    username TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 2: Notification Tokens (for Farcaster users)
-- Stores notification tokens and URLs for sending notifications
CREATE TABLE notification_tokens (
    id BIGSERIAL PRIMARY KEY,
    fid BIGINT NOT NULL REFERENCES user_fid_mappings(fid) ON DELETE CASCADE,
    notification_token TEXT NOT NULL,
    notification_url TEXT NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(fid, notification_token)
);

-- Table 3: User Notification Preferences
-- Controls which types of notifications each user wants to receive
CREATE TABLE notification_preferences (
    id BIGSERIAL PRIMARY KEY,
    fid BIGINT NOT NULL REFERENCES user_fid_mappings(fid) ON DELETE CASCADE,
    user_address TEXT,
    campaign_opportunities BOOLEAN NOT NULL DEFAULT true,
    application_updates BOOLEAN NOT NULL DEFAULT true,
    payment_notifications BOOLEAN NOT NULL DEFAULT true,
    dispute_alerts BOOLEAN NOT NULL DEFAULT true,
    deadline_reminders BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(fid)
);

-- Table 4: Notification History
-- Logs all sent notifications for tracking and analytics
CREATE TABLE notification_history (
    id BIGSERIAL PRIMARY KEY,
    fid BIGINT NOT NULL REFERENCES user_fid_mappings(fid) ON DELETE CASCADE,
    notification_type TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    target_url TEXT,
    notification_data JSONB,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    clicked_at TIMESTAMPTZ,
    -- Add constraint to ensure notification_type is valid
    CONSTRAINT valid_notification_type CHECK (
        notification_type IN (
            'campaign_opportunity',
            'application_update', 
            'payment_notification',
            'dispute_alert',
            'deadline_reminder',
            'campaign_created',
            'campaign_cancelled',
            'campaign_expired',
            'campaign_completed'
        )
    )
);

-- =====================================================
-- 3. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Indexes for user_fid_mappings
CREATE INDEX idx_user_fid_mappings_fid ON user_fid_mappings(fid);
CREATE INDEX idx_user_fid_mappings_address ON user_fid_mappings(wallet_address);
CREATE INDEX idx_user_fid_mappings_username ON user_fid_mappings(username) WHERE username IS NOT NULL;

-- Indexes for notification_tokens
CREATE INDEX idx_notification_tokens_fid ON notification_tokens(fid);
CREATE INDEX idx_notification_tokens_enabled ON notification_tokens(enabled) WHERE enabled = true;

-- Indexes for notification_preferences  
CREATE INDEX idx_notification_preferences_fid ON notification_preferences(fid);

-- Indexes for notification_history (most important for performance)
CREATE INDEX idx_notification_history_fid ON notification_history(fid);
CREATE INDEX idx_notification_history_type ON notification_history(notification_type);
CREATE INDEX idx_notification_history_sent_at ON notification_history(sent_at DESC);
CREATE INDEX idx_notification_history_clicked_at ON notification_history(clicked_at) WHERE clicked_at IS NOT NULL;
CREATE INDEX idx_notification_history_unread ON notification_history(fid, sent_at DESC) WHERE clicked_at IS NULL;

-- Composite index for common queries
CREATE INDEX idx_notification_history_fid_type_sent ON notification_history(fid, notification_type, sent_at DESC);

-- =====================================================
-- 4. CREATE TRIGGERS FOR AUTO-UPDATING TIMESTAMPS
-- =====================================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for auto-updating updated_at
CREATE TRIGGER update_user_fid_mappings_updated_at 
    BEFORE UPDATE ON user_fid_mappings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_tokens_updated_at 
    BEFORE UPDATE ON notification_tokens 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_preferences_updated_at 
    BEFORE UPDATE ON notification_preferences 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 5. CREATE ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE user_fid_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_history ENABLE ROW LEVEL SECURITY;

-- Allow service role to access all data (for API operations)
CREATE POLICY "Allow service role full access" ON user_fid_mappings
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Allow service role full access" ON notification_tokens
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Allow service role full access" ON notification_preferences
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Allow service role full access" ON notification_history
    FOR ALL USING (auth.role() = 'service_role');

-- =====================================================
-- 6. INSERT SAMPLE DATA (OPTIONAL - REMOVE IF NOT NEEDED)
-- =====================================================

-- Uncomment the following if you want some test data
/*
-- Sample user FID mapping
INSERT INTO user_fid_mappings (fid, wallet_address, username) VALUES
(12345, '0x1234567890123456789012345678901234567890', 'testuser'),
(67890, '0x0987654321098765432109876543210987654321', 'anotheruser');

-- Sample notification preferences (default preferences)
INSERT INTO notification_preferences (fid, user_address, campaign_opportunities, application_updates, payment_notifications, dispute_alerts, deadline_reminders) VALUES
(12345, '0x1234567890123456789012345678901234567890', true, true, true, true, true),
(67890, '0x0987654321098765432109876543210987654321', true, false, true, true, false);

-- Sample notification history
INSERT INTO notification_history (fid, notification_type, title, body, target_url, notification_data) VALUES
(12345, 'campaign_opportunity', 'New Campaign Available', 'A new marketing campaign matches your profile!', 'https://adsbazaar.com/campaigns/123', '{"campaign_id": "123", "budget": "1000"}'),
(12345, 'application_update', 'Application Accepted', 'Your application has been accepted!', 'https://adsbazaar.com/applications/456', '{"application_id": "456", "status": "accepted"}');
*/

-- =====================================================
-- 7. VERIFICATION QUERIES
-- =====================================================

-- Run these queries after executing the script to verify everything is working:

-- Check that all tables exist
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('user_fid_mappings', 'notification_tokens', 'notification_preferences', 'notification_history')
ORDER BY table_name;

-- Check indexes
SELECT indexname, tablename 
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND tablename IN ('user_fid_mappings', 'notification_tokens', 'notification_preferences', 'notification_history')
ORDER BY tablename, indexname;

-- Check RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('user_fid_mappings', 'notification_tokens', 'notification_preferences', 'notification_history');

-- Check row counts (should be 0 for fresh start, or sample data count if you included it)
SELECT 'user_fid_mappings' as table_name, COUNT(*) as row_count FROM user_fid_mappings
UNION ALL
SELECT 'notification_tokens', COUNT(*) FROM notification_tokens  
UNION ALL
SELECT 'notification_preferences', COUNT(*) FROM notification_preferences
UNION ALL
SELECT 'notification_history', COUNT(*) FROM notification_history;

-- =====================================================
-- 8. CLEANUP COMPLETED
-- =====================================================

-- Your notification system is now clean and ready to use!
-- Make sure your environment variables are set:
-- - NEXT_PUBLIC_SUPABASE_URL
-- - SUPABASE_SERVICE_ROLE_KEY

SELECT 'Notification system cleanup and setup completed successfully!' as status;