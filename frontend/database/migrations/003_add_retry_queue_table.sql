-- Add notification retry queue table
CREATE TABLE notification_retry_queue (
  id VARCHAR(255) PRIMARY KEY,
  fid INTEGER NOT NULL,
  notification_type VARCHAR(50) NOT NULL,
  notification_data JSONB NOT NULL,
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  next_retry_at TIMESTAMP NOT NULL,
  last_error TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_notification_retry_queue_fid ON notification_retry_queue(fid);
CREATE INDEX idx_notification_retry_queue_type ON notification_retry_queue(notification_type);
CREATE INDEX idx_notification_retry_queue_next_retry ON notification_retry_queue(next_retry_at);
CREATE INDEX idx_notification_retry_queue_attempts ON notification_retry_queue(attempts);
CREATE INDEX idx_notification_retry_queue_created_at ON notification_retry_queue(created_at);

-- Create trigger for updated_at
CREATE TRIGGER update_notification_retry_queue_updated_at
    BEFORE UPDATE ON notification_retry_queue
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE notification_retry_queue ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY "Service role can manage retry queue"
  ON notification_retry_queue
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Grant permissions
GRANT ALL ON notification_retry_queue TO service_role;