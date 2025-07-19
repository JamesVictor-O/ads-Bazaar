-- Create campaign_shares table for tracking social shares
CREATE TABLE IF NOT EXISTS campaign_shares (
  id SERIAL PRIMARY KEY,
  campaign_id VARCHAR(66) NOT NULL, -- Ethereum address format
  platform VARCHAR(50) NOT NULL DEFAULT 'unknown', -- 'farcaster', 'twitter', 'facebook', 'copy', etc.
  user_address VARCHAR(42), -- Optional: track which user shared (Ethereum address)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Add index for fast campaign lookups
  INDEX idx_campaign_shares_campaign_id (campaign_id),
  INDEX idx_campaign_shares_created_at (created_at)
);

-- Add comment for documentation
COMMENT ON TABLE campaign_shares IS 'Tracks successful shares of campaigns across different platforms';
COMMENT ON COLUMN campaign_shares.campaign_id IS 'Blockchain campaign ID (briefId)';
COMMENT ON COLUMN campaign_shares.platform IS 'Platform where campaign was shared (farcaster, twitter, facebook, copy)';
COMMENT ON COLUMN campaign_shares.user_address IS 'Optional Ethereum address of user who shared';
COMMENT ON COLUMN campaign_shares.created_at IS 'Timestamp when share was recorded';