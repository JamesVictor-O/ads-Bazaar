-- Add new notification preference columns for existing users
-- Run this after the initial migration if you already have users

-- Add new columns to notification_preferences table
ALTER TABLE notification_preferences 
ADD COLUMN IF NOT EXISTS proof_status_updates BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS proof_submitted BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS campaign_cancelled BOOLEAN DEFAULT true;

-- Update existing users to have the new preferences enabled by default
UPDATE notification_preferences 
SET 
  proof_status_updates = true,
  proof_submitted = true,
  campaign_cancelled = true
WHERE 
  proof_status_updates IS NULL 
  OR proof_submitted IS NULL 
  OR campaign_cancelled IS NULL;