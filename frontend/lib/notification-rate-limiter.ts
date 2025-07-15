import { supabase } from './database';

interface RateLimitConfig {
  maxNotificationsPerMinute: number;
  maxNotificationsPerHour: number;
  maxNotificationsPerDay: number;
  cooldownPeriod: number; // seconds
}

interface RateLimitResult {
  allowed: boolean;
  reason?: string;
  retryAfter?: number; // seconds
  remainingQuota?: {
    perMinute: number;
    perHour: number;
    perDay: number;
  };
}

export class NotificationRateLimiter {
  private config: RateLimitConfig;
  private cache: Map<string, { count: number; resetTime: number }> = new Map();

  constructor(config: Partial<RateLimitConfig> = {}) {
    this.config = {
      maxNotificationsPerMinute: config.maxNotificationsPerMinute || 5,
      maxNotificationsPerHour: config.maxNotificationsPerHour || 50,
      maxNotificationsPerDay: config.maxNotificationsPerDay || 100,
      cooldownPeriod: config.cooldownPeriod || 30,
    };
  }

  /**
   * Check if user can receive a notification
   */
  async checkRateLimit(fid: number, notificationType: string): Promise<RateLimitResult> {
    try {
      // Check different time windows
      const now = Date.now();
      const oneMinuteAgo = now - 60 * 1000;
      const oneHourAgo = now - 60 * 60 * 1000;
      const oneDayAgo = now - 24 * 60 * 60 * 1000;

      // Get recent notifications from database
      const { data: recentNotifications, error } = await supabase
        .from('notification_history')
        .select('sent_at, notification_type')
        .eq('fid', fid)
        .gte('sent_at', new Date(oneDayAgo).toISOString())
        .order('sent_at', { ascending: false });

      if (error) {
        console.error('Error checking rate limit:', error);
        return { allowed: true }; // Default to allowing if DB error
      }

      const notifications = recentNotifications || [];

      // Count notifications in different time windows
      const notificationsLastMinute = notifications.filter(
        n => new Date(n.sent_at).getTime() > oneMinuteAgo
      ).length;

      const notificationsLastHour = notifications.filter(
        n => new Date(n.sent_at).getTime() > oneHourAgo
      ).length;

      const notificationsLastDay = notifications.length;

      // Check rate limits
      if (notificationsLastMinute >= this.config.maxNotificationsPerMinute) {
        return {
          allowed: false,
          reason: 'Rate limit exceeded: too many notifications per minute',
          retryAfter: 60,
          remainingQuota: {
            perMinute: 0,
            perHour: Math.max(0, this.config.maxNotificationsPerHour - notificationsLastHour),
            perDay: Math.max(0, this.config.maxNotificationsPerDay - notificationsLastDay)
          }
        };
      }

      if (notificationsLastHour >= this.config.maxNotificationsPerHour) {
        return {
          allowed: false,
          reason: 'Rate limit exceeded: too many notifications per hour',
          retryAfter: 3600,
          remainingQuota: {
            perMinute: Math.max(0, this.config.maxNotificationsPerMinute - notificationsLastMinute),
            perHour: 0,
            perDay: Math.max(0, this.config.maxNotificationsPerDay - notificationsLastDay)
          }
        };
      }

      if (notificationsLastDay >= this.config.maxNotificationsPerDay) {
        return {
          allowed: false,
          reason: 'Rate limit exceeded: too many notifications per day',
          retryAfter: 86400,
          remainingQuota: {
            perMinute: Math.max(0, this.config.maxNotificationsPerMinute - notificationsLastMinute),
            perHour: Math.max(0, this.config.maxNotificationsPerHour - notificationsLastHour),
            perDay: 0
          }
        };
      }

      // Check cooldown period for same notification type
      const lastSameTypeNotification = notifications.find(
        n => n.notification_type === notificationType
      );

      if (lastSameTypeNotification) {
        const timeSinceLastSameType = now - new Date(lastSameTypeNotification.sent_at).getTime();
        if (timeSinceLastSameType < this.config.cooldownPeriod * 1000) {
          return {
            allowed: false,
            reason: `Cooldown period active for ${notificationType}`,
            retryAfter: Math.ceil((this.config.cooldownPeriod * 1000 - timeSinceLastSameType) / 1000),
            remainingQuota: {
              perMinute: Math.max(0, this.config.maxNotificationsPerMinute - notificationsLastMinute),
              perHour: Math.max(0, this.config.maxNotificationsPerHour - notificationsLastHour),
              perDay: Math.max(0, this.config.maxNotificationsPerDay - notificationsLastDay)
            }
          };
        }
      }

      // All checks passed
      return {
        allowed: true,
        remainingQuota: {
          perMinute: Math.max(0, this.config.maxNotificationsPerMinute - notificationsLastMinute),
          perHour: Math.max(0, this.config.maxNotificationsPerHour - notificationsLastHour),
          perDay: Math.max(0, this.config.maxNotificationsPerDay - notificationsLastDay)
        }
      };

    } catch (error) {
      console.error('Error in rate limiter:', error);
      return { allowed: true }; // Default to allowing if error occurs
    }
  }

  /**
   * Check if multiple users can receive notifications (batch check)
   */
  async checkBatchRateLimit(
    fids: number[], 
    notificationType: string
  ): Promise<{ allowed: number[]; rejected: number[]; reasons: Record<number, string> }> {
    const allowed: number[] = [];
    const rejected: number[] = [];
    const reasons: Record<number, string> = {};

    // Check each user individually
    for (const fid of fids) {
      const result = await this.checkRateLimit(fid, notificationType);
      if (result.allowed) {
        allowed.push(fid);
      } else {
        rejected.push(fid);
        reasons[fid] = result.reason || 'Rate limit exceeded';
      }
    }

    return { allowed, rejected, reasons };
  }

  /**
   * Get rate limit status for a user
   */
  async getRateLimitStatus(fid: number): Promise<{
    quotaUsed: { perMinute: number; perHour: number; perDay: number };
    quotaRemaining: { perMinute: number; perHour: number; perDay: number };
    nextResetTimes: { minute: Date; hour: Date; day: Date };
  }> {
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const { data: notifications } = await supabase
      .from('notification_history')
      .select('sent_at')
      .eq('fid', fid)
      .gte('sent_at', oneDayAgo.toISOString());

    const notificationTimes = (notifications || []).map(n => new Date(n.sent_at).getTime());

    const quotaUsed = {
      perMinute: notificationTimes.filter(t => t > oneMinuteAgo.getTime()).length,
      perHour: notificationTimes.filter(t => t > oneHourAgo.getTime()).length,
      perDay: notificationTimes.length
    };

    const quotaRemaining = {
      perMinute: Math.max(0, this.config.maxNotificationsPerMinute - quotaUsed.perMinute),
      perHour: Math.max(0, this.config.maxNotificationsPerHour - quotaUsed.perHour),
      perDay: Math.max(0, this.config.maxNotificationsPerDay - quotaUsed.perDay)
    };

    const nextResetTimes = {
      minute: new Date(Math.ceil(now.getTime() / 60000) * 60000),
      hour: new Date(Math.ceil(now.getTime() / 3600000) * 3600000),
      day: new Date(Math.ceil(now.getTime() / 86400000) * 86400000)
    };

    return { quotaUsed, quotaRemaining, nextResetTimes };
  }

  /**
   * Update rate limiter configuration
   */
  updateConfig(newConfig: Partial<RateLimitConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Clear rate limit cache (for testing)
   */
  clearCache(): void {
    this.cache.clear();
  }
}

// Export singleton instance
export const notificationRateLimiter = new NotificationRateLimiter();

// Export type-specific rate limiters with different configs
export const urgentNotificationRateLimiter = new NotificationRateLimiter({
  maxNotificationsPerMinute: 10,
  maxNotificationsPerHour: 100,
  maxNotificationsPerDay: 200,
  cooldownPeriod: 10
});

export const marketingNotificationRateLimiter = new NotificationRateLimiter({
  maxNotificationsPerMinute: 1,
  maxNotificationsPerHour: 5,
  maxNotificationsPerDay: 10,
  cooldownPeriod: 300 // 5 minutes
});