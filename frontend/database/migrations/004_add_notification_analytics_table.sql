-- Add notification analytics table
CREATE TABLE notification_analytics (
  id SERIAL PRIMARY KEY,
  fid INTEGER NOT NULL,
  notification_type VARCHAR(50) NOT NULL,
  event_type VARCHAR(20) NOT NULL CHECK (event_type IN ('sent', 'delivered', 'opened', 'clicked', 'failed')),
  timestamp TIMESTAMP NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance and analytics queries
CREATE INDEX idx_notification_analytics_fid ON notification_analytics(fid);
CREATE INDEX idx_notification_analytics_type ON notification_analytics(notification_type);
CREATE INDEX idx_notification_analytics_event_type ON notification_analytics(event_type);
CREATE INDEX idx_notification_analytics_timestamp ON notification_analytics(timestamp);
CREATE INDEX idx_notification_analytics_created_at ON notification_analytics(created_at);

-- Composite indexes for common query patterns
CREATE INDEX idx_notification_analytics_type_event ON notification_analytics(notification_type, event_type);
CREATE INDEX idx_notification_analytics_fid_timestamp ON notification_analytics(fid, timestamp);
CREATE INDEX idx_notification_analytics_type_timestamp ON notification_analytics(notification_type, timestamp);

-- Index for time-series queries
CREATE INDEX idx_notification_analytics_timestamp_day ON notification_analytics(DATE(timestamp));
CREATE INDEX idx_notification_analytics_timestamp_hour ON notification_analytics(DATE_TRUNC('hour', timestamp));

-- Enable RLS
ALTER TABLE notification_analytics ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for service role
CREATE POLICY "Service role can manage notification analytics"
  ON notification_analytics
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Grant permissions to service role
GRANT ALL ON notification_analytics TO service_role;
GRANT ALL ON SEQUENCE notification_analytics_id_seq TO service_role;

-- Create a function to clean up old analytics data (optional)
CREATE OR REPLACE FUNCTION cleanup_old_analytics()
RETURNS void AS $$
BEGIN
  DELETE FROM notification_analytics
  WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- Create materialized view for dashboard metrics (optional, for performance)
CREATE MATERIALIZED VIEW notification_metrics_daily AS
SELECT 
  DATE(timestamp) as date,
  notification_type,
  COUNT(CASE WHEN event_type = 'sent' THEN 1 END) as sent_count,
  COUNT(CASE WHEN event_type = 'delivered' THEN 1 END) as delivered_count,
  COUNT(CASE WHEN event_type = 'opened' THEN 1 END) as opened_count,
  COUNT(CASE WHEN event_type = 'clicked' THEN 1 END) as clicked_count,
  COUNT(CASE WHEN event_type = 'failed' THEN 1 END) as failed_count
FROM notification_analytics
GROUP BY DATE(timestamp), notification_type
ORDER BY date DESC, notification_type;

-- Create index on materialized view
CREATE INDEX idx_notification_metrics_daily_date ON notification_metrics_daily(date);
CREATE INDEX idx_notification_metrics_daily_type ON notification_metrics_daily(notification_type);

-- Grant permissions on materialized view
GRANT SELECT ON notification_metrics_daily TO service_role;

-- Create function to refresh materialized view
CREATE OR REPLACE FUNCTION refresh_notification_metrics()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW notification_metrics_daily;
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to refresh metrics daily (requires pg_cron extension)
-- SELECT cron.schedule('refresh-notification-metrics', '0 1 * * *', 'SELECT refresh_notification_metrics();');