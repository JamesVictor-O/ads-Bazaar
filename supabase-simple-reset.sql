-- =====================================================
-- AdsBazaar Notifications - Simple Clean Reset
-- =====================================================
-- Quick script to drop and recreate just the essential tables

-- 1. Drop existing tables
DROP TABLE IF EXISTS notification_history CASCADE;
DROP TABLE IF EXISTS notification_preferences CASCADE;
DROP TABLE IF EXISTS notification_tokens CASCADE;
DROP TABLE IF EXISTS user_fid_mappings CASCADE;

-- 2. Create core tables
CREATE TABLE user_fid_mappings (
    id BIGSERIAL PRIMARY KEY,
    fid BIGINT NOT NULL UNIQUE,
    wallet_address TEXT NOT NULL,
    username TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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

CREATE TABLE notification_history (
    id BIGSERIAL PRIMARY KEY,
    fid BIGINT NOT NULL REFERENCES user_fid_mappings(fid) ON DELETE CASCADE,
    notification_type TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    target_url TEXT,
    notification_data JSONB,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    clicked_at TIMESTAMPTZ
);

-- 3. Essential indexes
CREATE INDEX idx_user_fid_mappings_fid ON user_fid_mappings(fid);
CREATE INDEX idx_user_fid_mappings_address ON user_fid_mappings(wallet_address);
CREATE INDEX idx_notification_history_fid ON notification_history(fid);
CREATE INDEX idx_notification_history_sent_at ON notification_history(sent_at DESC);

-- 4. Enable RLS and allow service role access
ALTER TABLE user_fid_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role access" ON user_fid_mappings FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role access" ON notification_preferences FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role access" ON notification_history FOR ALL USING (auth.role() = 'service_role');

SELECT 'Simple notification reset completed!' as status;