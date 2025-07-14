import { getNotificationToken, getUserPreferences, saveNotificationHistory } from './database';

export interface NotificationPayload {
  notificationId: string;
  title: string;
  body: string;
  targetUrl: string;
  tokens: string[];
}

export interface NotificationData {
  fid: number;
  type: string;
  title: string;
  body: string;
  targetUrl?: string;
  data?: any;
}

export class NotificationService {
  private static instance: NotificationService;
  
  private constructor() {}
  
  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }
  
  /**
   * Send notification to a single user
   */
  async sendNotificationToUser(notification: NotificationData): Promise<boolean> {
    try {
      // Get user's notification token
      const tokenData = await getNotificationToken(notification.fid);
      if (!tokenData) {
        console.log(`No notification token found for FID: ${notification.fid}`);
        return false;
      }
      
      // Check user preferences
      const preferences = await getUserPreferences(notification.fid);
      if (!this.shouldSendNotification(notification.type, preferences)) {
        console.log(`Notification blocked by user preferences for FID: ${notification.fid}`);
        return false;
      }
      
      // Send notification
      const success = await this.sendNotification({
        notificationId: `${notification.type}-${Date.now()}-${notification.fid}`,
        title: notification.title,
        body: notification.body,
        targetUrl: notification.targetUrl || 'https://ads-bazaar.vercel.app',
        tokens: [tokenData.notification_token]
      }, tokenData.notification_url);
      
      // Save to history
      await saveNotificationHistory({
        fid: notification.fid,
        notification_type: notification.type,
        title: notification.title,
        body: notification.body,
        target_url: notification.targetUrl,
        notification_data: notification.data
      });
      
      return success;
    } catch (error) {
      console.error('Error sending notification to user:', error);
      return false;
    }
  }
  
  /**
   * Send notification to multiple users
   */
  async sendNotificationToUsers(notifications: NotificationData[]): Promise<{ success: number; failed: number }> {
    const results = await Promise.all(
      notifications.map(notification => this.sendNotificationToUser(notification))
    );
    
    const success = results.filter(Boolean).length;
    const failed = results.length - success;
    
    console.log(`Batch notification results: ${success} successful, ${failed} failed`);
    return { success, failed };
  }
  
  /**
   * Send notification via HTTP request to Farcaster
   */
  private async sendNotification(payload: NotificationPayload, notificationUrl: string): Promise<boolean> {
    try {
      const response = await fetch(notificationUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        console.error('Failed to send notification:', response.status, response.statusText);
        return false;
      }
      
      console.log('Notification sent successfully:', payload.notificationId);
      return true;
    } catch (error) {
      console.error('Error sending notification:', error);
      return false;
    }
  }
  
  /**
   * Check if notification should be sent based on user preferences
   */
  private shouldSendNotification(notificationType: string, preferences: any): boolean {
    if (!preferences) return true; // Default to sending if no preferences set
    
    switch (notificationType) {
      case 'campaign_opportunity':
        return preferences.campaign_opportunities;
      case 'application_update':
        return preferences.application_updates;
      case 'payment_notification':
        return preferences.payment_notifications;
      case 'dispute_alert':
        return preferences.dispute_alerts;
      case 'deadline_reminder':
        return preferences.deadline_reminders;
      default:
        return true;
    }
  }
}

// Notification helper functions for specific AdsBazaar events
export class AdsBazaarNotifications {
  private notificationService = NotificationService.getInstance();
  
  /**
   * Send campaign opportunity notification to matching influencers
   */
  async notifyCampaignOpportunity(fids: number[], campaignDetails: any): Promise<void> {
    const notifications = fids.map(fid => ({
      fid,
      type: 'campaign_opportunity',
      title: `New ${campaignDetails.targetAudience} Campaign - $${campaignDetails.budget}`,
      body: `A new campaign matching your audience is available. Apply before ${new Date(campaignDetails.selectionDeadline * 1000).toLocaleDateString()}`,
      targetUrl: `https://ads-bazaar.vercel.app/marketplace?campaign=${campaignDetails.briefId}`,
      data: campaignDetails
    }));
    
    await this.notificationService.sendNotificationToUsers(notifications);
  }
  
  /**
   * Send application received notification to business owner
   */
  async notifyApplicationReceived(businessFid: number, applicantDetails: any, campaignDetails: any): Promise<void> {
    await this.notificationService.sendNotificationToUser({
      fid: businessFid,
      type: 'application_update',
      title: `New Application for "${campaignDetails.title}"`,
      body: `${applicantDetails.username} has applied to your campaign. Review their profile and decide.`,
      targetUrl: `https://ads-bazaar.vercel.app/brandsDashBoard?campaign=${campaignDetails.briefId}`,
      data: { applicant: applicantDetails, campaign: campaignDetails }
    });
  }
  
  /**
   * Send selection notification to chosen influencer
   */
  async notifyInfluencerSelected(influencerFid: number, campaignDetails: any): Promise<void> {
    await this.notificationService.sendNotificationToUser({
      fid: influencerFid,
      type: 'application_update',
      title: `🎉 You've been selected!`,
      body: `Congratulations! You've been selected for "${campaignDetails.title}". Check your dashboard for next steps.`,
      targetUrl: `https://ads-bazaar.vercel.app/influencersDashboard?campaign=${campaignDetails.briefId}`,
      data: campaignDetails
    });
  }
  
  /**
   * Send payment available notification
   */
  async notifyPaymentAvailable(influencerFid: number, paymentDetails: any): Promise<void> {
    await this.notificationService.sendNotificationToUser({
      fid: influencerFid,
      type: 'payment_notification',
      title: `Payment Ready - $${paymentDetails.amount} cUSD`,
      body: `Your work has been approved! Claim your payment of $${paymentDetails.amount} cUSD now.`,
      targetUrl: `https://ads-bazaar.vercel.app/influencersDashboard?payment=${paymentDetails.briefId}`,
      data: paymentDetails
    });
  }
  
  /**
   * Send dispute alert notification
   */
  async notifyDisputeAlert(userFid: number, disputeDetails: any): Promise<void> {
    await this.notificationService.sendNotificationToUser({
      fid: userFid,
      type: 'dispute_alert',
      title: `Dispute Alert`,
      body: `A dispute has been raised for your campaign "${disputeDetails.campaignTitle}". Review the details.`,
      targetUrl: `https://ads-bazaar.vercel.app/disputeresolution?dispute=${disputeDetails.briefId}`,
      data: disputeDetails
    });
  }
  
  /**
   * Send deadline reminder notification
   */
  async notifyDeadlineReminder(userFid: number, deadlineDetails: any): Promise<void> {
    await this.notificationService.sendNotificationToUser({
      fid: userFid,
      type: 'deadline_reminder',
      title: `Deadline Reminder`,
      body: `${deadlineDetails.message} - ${deadlineDetails.timeLeft} remaining`,
      targetUrl: deadlineDetails.targetUrl,
      data: deadlineDetails
    });
  }
}

// Export singleton instance
export const adsBazaarNotifications = new AdsBazaarNotifications();