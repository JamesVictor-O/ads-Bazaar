import { supabase } from './database';

interface NotificationAnalyticsData {
  fid: number;
  notification_type: string;
  event_type: 'sent' | 'delivered' | 'opened' | 'clicked' | 'failed';
  timestamp: Date;
  metadata?: any;
}

interface AnalyticsMetrics {
  totalSent: number;
  totalDelivered: number;
  totalOpened: number;
  totalClicked: number;
  totalFailed: number;
  deliveryRate: number;
  openRate: number;
  clickThroughRate: number;
  failureRate: number;
}

interface NotificationTypeMetrics extends AnalyticsMetrics {
  notificationType: string;
}

interface UserEngagementMetrics {
  fid: number;
  totalNotifications: number;
  openedNotifications: number;
  clickedNotifications: number;
  engagementRate: number;
  lastActiveAt?: Date;
}

export class NotificationAnalytics {
  private static instance: NotificationAnalytics;

  private constructor() {}

  static getInstance(): NotificationAnalytics {
    if (!NotificationAnalytics.instance) {
      NotificationAnalytics.instance = new NotificationAnalytics();
    }
    return NotificationAnalytics.instance;
  }

  /**
   * Track notification event
   */
  async trackEvent(data: NotificationAnalyticsData): Promise<void> {
    try {
      await supabase
        .from('notification_analytics')
        .insert({
          fid: data.fid,
          notification_type: data.notification_type,
          event_type: data.event_type,
          timestamp: data.timestamp.toISOString(),
          metadata: data.metadata || {},
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Error tracking notification event:', error);
    }
  }

  /**
   * Track notification sent
   */
  async trackSent(fid: number, notificationType: string, metadata?: any): Promise<void> {
    await this.trackEvent({
      fid,
      notification_type: notificationType,
      event_type: 'sent',
      timestamp: new Date(),
      metadata
    });
  }

  /**
   * Track notification delivered
   */
  async trackDelivered(fid: number, notificationType: string, metadata?: any): Promise<void> {
    await this.trackEvent({
      fid,
      notification_type: notificationType,
      event_type: 'delivered',
      timestamp: new Date(),
      metadata
    });
  }

  /**
   * Track notification opened (when user sees it in Farcaster)
   */
  async trackOpened(fid: number, notificationType: string, metadata?: any): Promise<void> {
    await this.trackEvent({
      fid,
      notification_type: notificationType,
      event_type: 'opened',
      timestamp: new Date(),
      metadata
    });
  }

  /**
   * Track notification clicked (when user clicks through to app)
   */
  async trackClicked(fid: number, notificationType: string, metadata?: any): Promise<void> {
    await this.trackEvent({
      fid,
      notification_type: notificationType,
      event_type: 'clicked',
      timestamp: new Date(),
      metadata
    });
  }

  /**
   * Track notification failed
   */
  async trackFailed(fid: number, notificationType: string, error: string, metadata?: any): Promise<void> {
    await this.trackEvent({
      fid,
      notification_type: notificationType,
      event_type: 'failed',
      timestamp: new Date(),
      metadata: { error, ...metadata }
    });
  }

  /**
   * Get overall notification metrics
   */
  async getOverallMetrics(
    startDate?: Date,
    endDate?: Date
  ): Promise<AnalyticsMetrics> {
    try {
      const dateFilter = this.buildDateFilter(startDate, endDate);
      
      const { data: events, error } = await supabase
        .from('notification_analytics')
        .select('event_type')
        .gte('timestamp', dateFilter.start)
        .lte('timestamp', dateFilter.end);

      if (error) {
        console.error('Error fetching overall metrics:', error);
        return this.getEmptyMetrics();
      }

      return this.calculateMetrics(events || []);
    } catch (error) {
      console.error('Error calculating overall metrics:', error);
      return this.getEmptyMetrics();
    }
  }

  /**
   * Get metrics by notification type
   */
  async getMetricsByType(
    startDate?: Date,
    endDate?: Date
  ): Promise<NotificationTypeMetrics[]> {
    try {
      const dateFilter = this.buildDateFilter(startDate, endDate);
      
      const { data: events, error } = await supabase
        .from('notification_analytics')
        .select('notification_type, event_type')
        .gte('timestamp', dateFilter.start)
        .lte('timestamp', dateFilter.end);

      if (error) {
        console.error('Error fetching metrics by type:', error);
        return [];
      }

      // Group by notification type
      const eventsByType = (events || []).reduce((acc, event) => {
        if (!acc[event.notification_type]) {
          acc[event.notification_type] = [];
        }
        acc[event.notification_type].push(event);
        return acc;
      }, {} as Record<string, any[]>);

      // Calculate metrics for each type
      return Object.entries(eventsByType).map(([type, typeEvents]) => ({
        notificationType: type,
        ...this.calculateMetrics(typeEvents)
      }));
    } catch (error) {
      console.error('Error calculating metrics by type:', error);
      return [];
    }
  }

  /**
   * Get user engagement metrics
   */
  async getUserEngagementMetrics(
    startDate?: Date,
    endDate?: Date
  ): Promise<UserEngagementMetrics[]> {
    try {
      const dateFilter = this.buildDateFilter(startDate, endDate);
      
      const { data: events, error } = await supabase
        .from('notification_analytics')
        .select('fid, event_type, timestamp')
        .gte('timestamp', dateFilter.start)
        .lte('timestamp', dateFilter.end);

      if (error) {
        console.error('Error fetching user engagement metrics:', error);
        return [];
      }

      // Group by user (fid)
      const eventsByUser = (events || []).reduce((acc, event) => {
        if (!acc[event.fid]) {
          acc[event.fid] = [];
        }
        acc[event.fid].push(event);
        return acc;
      }, {} as Record<number, any[]>);

      // Calculate engagement for each user
      return Object.entries(eventsByUser).map(([fid, userEvents]) => {
        const totalNotifications = userEvents.filter(e => e.event_type === 'sent').length;
        const openedNotifications = userEvents.filter(e => e.event_type === 'opened').length;
        const clickedNotifications = userEvents.filter(e => e.event_type === 'clicked').length;
        const engagementRate = totalNotifications > 0 
          ? (openedNotifications + clickedNotifications) / totalNotifications 
          : 0;

        const lastActiveEvent = userEvents
          .filter(e => e.event_type === 'opened' || e.event_type === 'clicked')
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

        return {
          fid: parseInt(fid),
          totalNotifications,
          openedNotifications,
          clickedNotifications,
          engagementRate,
          lastActiveAt: lastActiveEvent ? new Date(lastActiveEvent.timestamp) : undefined
        };
      }).sort((a, b) => b.engagementRate - a.engagementRate);
    } catch (error) {
      console.error('Error calculating user engagement metrics:', error);
      return [];
    }
  }

  /**
   * Get notification funnel metrics
   */
  async getFunnelMetrics(
    notificationType: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    failed: number;
    funnelSteps: Array<{ step: string; count: number; percentage: number }>;
  }> {
    try {
      const dateFilter = this.buildDateFilter(startDate, endDate);
      
      const { data: events, error } = await supabase
        .from('notification_analytics')
        .select('event_type')
        .eq('notification_type', notificationType)
        .gte('timestamp', dateFilter.start)
        .lte('timestamp', dateFilter.end);

      if (error) {
        console.error('Error fetching funnel metrics:', error);
        return {
          sent: 0,
          delivered: 0,
          opened: 0,
          clicked: 0,
          failed: 0,
          funnelSteps: []
        };
      }

      const eventCounts = this.countEventTypes(events || []);
      const sent = eventCounts.sent;

      const funnelSteps = [
        { step: 'Sent', count: sent, percentage: 100 },
        { step: 'Delivered', count: eventCounts.delivered, percentage: sent > 0 ? (eventCounts.delivered / sent) * 100 : 0 },
        { step: 'Opened', count: eventCounts.opened, percentage: sent > 0 ? (eventCounts.opened / sent) * 100 : 0 },
        { step: 'Clicked', count: eventCounts.clicked, percentage: sent > 0 ? (eventCounts.clicked / sent) * 100 : 0 },
      ];

      return {
        sent: eventCounts.sent,
        delivered: eventCounts.delivered,
        opened: eventCounts.opened,
        clicked: eventCounts.clicked,
        failed: eventCounts.failed,
        funnelSteps
      };
    } catch (error) {
      console.error('Error calculating funnel metrics:', error);
      return {
        sent: 0,
        delivered: 0,
        opened: 0,
        clicked: 0,
        failed: 0,
        funnelSteps: []
      };
    }
  }

  /**
   * Get time-series data for notifications
   */
  async getTimeSeriesData(
    interval: 'hour' | 'day' | 'week' = 'day',
    startDate?: Date,
    endDate?: Date
  ): Promise<Array<{ timestamp: string; sent: number; opened: number; clicked: number; failed: number }>> {
    try {
      const dateFilter = this.buildDateFilter(startDate, endDate);
      
      // Use PostgreSQL date_trunc for time series grouping
      const { data: events, error } = await supabase
        .from('notification_analytics')
        .select('event_type, timestamp')
        .gte('timestamp', dateFilter.start)
        .lte('timestamp', dateFilter.end);

      if (error) {
        console.error('Error fetching time series data:', error);
        return [];
      }

      // Group events by time interval
      const timeGroups = (events || []).reduce((acc, event) => {
        const timestamp = new Date(event.timestamp);
        const key = this.getTimeKey(timestamp, interval);
        
        if (!acc[key]) {
          acc[key] = [];
        }
        acc[key].push(event);
        return acc;
      }, {} as Record<string, any[]>);

      // Calculate metrics for each time period
      return Object.entries(timeGroups)
        .map(([timestamp, timeEvents]) => ({
          timestamp,
          ...this.countEventTypes(timeEvents)
        }))
        .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    } catch (error) {
      console.error('Error calculating time series data:', error);
      return [];
    }
  }

  // Helper methods
  private buildDateFilter(startDate?: Date, endDate?: Date) {
    const end = endDate || new Date();
    const start = startDate || new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    
    return {
      start: start.toISOString(),
      end: end.toISOString()
    };
  }

  private calculateMetrics(events: any[]): AnalyticsMetrics {
    const counts = this.countEventTypes(events);
    const totalSent = counts.sent;
    
    return {
      totalSent,
      totalDelivered: counts.delivered,
      totalOpened: counts.opened,
      totalClicked: counts.clicked,
      totalFailed: counts.failed,
      deliveryRate: totalSent > 0 ? (counts.delivered / totalSent) * 100 : 0,
      openRate: totalSent > 0 ? (counts.opened / totalSent) * 100 : 0,
      clickThroughRate: totalSent > 0 ? (counts.clicked / totalSent) * 100 : 0,
      failureRate: totalSent > 0 ? (counts.failed / totalSent) * 100 : 0
    };
  }

  private countEventTypes(events: any[]): {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    failed: number;
  } {
    return events.reduce((acc, event) => {
      acc[event.event_type] = (acc[event.event_type] || 0) + 1;
      return acc;
    }, {
      sent: 0,
      delivered: 0,
      opened: 0,
      clicked: 0,
      failed: 0
    });
  }

  private getEmptyMetrics(): AnalyticsMetrics {
    return {
      totalSent: 0,
      totalDelivered: 0,
      totalOpened: 0,
      totalClicked: 0,
      totalFailed: 0,
      deliveryRate: 0,
      openRate: 0,
      clickThroughRate: 0,
      failureRate: 0
    };
  }

  private getTimeKey(timestamp: Date, interval: 'hour' | 'day' | 'week'): string {
    switch (interval) {
      case 'hour':
        return timestamp.toISOString().substring(0, 13) + ':00:00.000Z';
      case 'day':
        return timestamp.toISOString().substring(0, 10) + 'T00:00:00.000Z';
      case 'week':
        const weekStart = new Date(timestamp);
        weekStart.setDate(timestamp.getDate() - timestamp.getDay());
        return weekStart.toISOString().substring(0, 10) + 'T00:00:00.000Z';
      default:
        return timestamp.toISOString().substring(0, 10) + 'T00:00:00.000Z';
    }
  }
}

// Export singleton instance
export const notificationAnalytics = NotificationAnalytics.getInstance();