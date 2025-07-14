import { getNotificationToken, getUserPreferences, saveNotificationHistory } from './database';
import { notificationRateLimiter } from './notification-rate-limiter';
import { notificationRetryQueue } from './notification-retry-queue';
import { notificationAnalytics } from './notification-analytics';

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
      // Check rate limit first
      const rateLimitResult = await notificationRateLimiter.checkRateLimit(
        notification.fid,
        notification.type
      );
      
      if (!rateLimitResult.allowed) {
        console.log(`Notification rate limited for FID: ${notification.fid}, reason: ${rateLimitResult.reason}`);
        return false;
      }

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
      
      if (success) {
        // Save to history on success
        await saveNotificationHistory({
          fid: notification.fid,
          notification_type: notification.type,
          title: notification.title,
          body: notification.body,
          target_url: notification.targetUrl,
          notification_data: notification.data
        });
        
        // Track successful send
        await notificationAnalytics.trackSent(notification.fid, notification.type, notification.data);
        await notificationAnalytics.trackDelivered(notification.fid, notification.type, notification.data);
      } else {
        // Track failed send
        await notificationAnalytics.trackFailed(notification.fid, notification.type, 'Failed to send notification', notification.data);
        
        // Add to retry queue on failure
        await notificationRetryQueue.addToRetryQueue(
          notification,
          'Failed to send notification',
          0
        );
      }
      
      return success;
    } catch (error) {
      console.error('Error sending notification to user:', error);
      return false;
    }
  }
  
  /**
   * Send notification to multiple users
   */
  async sendNotificationToUsers(notifications: NotificationData[]): Promise<{ success: number; failed: number; rateLimited: number }> {
    // Check rate limits for batch sending
    const fids = notifications.map(n => n.fid);
    const notificationType = notifications[0]?.type || 'unknown';
    
    const rateLimitResult = await notificationRateLimiter.checkBatchRateLimit(fids, notificationType);
    
    // Filter out rate-limited users
    const allowedNotifications = notifications.filter(n => 
      rateLimitResult.allowed.includes(n.fid)
    );
    
    // Send notifications to allowed users
    const results = await Promise.all(
      allowedNotifications.map(notification => this.sendNotificationToUser(notification))
    );
    
    const success = results.filter(Boolean).length;
    const failed = results.length - success;
    const rateLimited = rateLimitResult.rejected.length;
    
    console.log(`Batch notification results: ${success} successful, ${failed} failed, ${rateLimited} rate limited`);
    
    if (rateLimited > 0) {
      console.log('Rate limited users:', rateLimitResult.rejected, 'Reasons:', rateLimitResult.reasons);
    }
    
    return { success, failed, rateLimited };
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
      case 'proof_status_update':
        return preferences.proof_status_updates;
      case 'proof_submitted':
        return preferences.proof_submitted;
      case 'campaign_cancelled':
        return preferences.campaign_cancelled;
      case 'auto_approval_alert':
        return preferences.auto_approval_alert;
      case 'campaign_expiry_warning':
        return preferences.campaign_expiry_warning;
      case 'insufficient_applications':
        return preferences.insufficient_applications;
      case 'budget_refund':
        return preferences.budget_refund;
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

  /**
   * Send proof status update notification to influencer
   */
  async notifyProofStatusUpdate(influencerFid: number, proofDetails: any): Promise<void> {
    const isApproved = proofDetails.isApproved;
    const title = isApproved ? '✅ Content Approved!' : '❌ Content Needs Revision';
    const body = isApproved 
      ? `Your content for "${proofDetails.campaignTitle}" has been approved. Payment will be processed soon.`
      : `Your content for "${proofDetails.campaignTitle}" needs revision. Please check the feedback and resubmit.`;
    
    await this.notificationService.sendNotificationToUser({
      fid: influencerFid,
      type: 'proof_status_update',
      title,
      body,
      targetUrl: `https://ads-bazaar.vercel.app/influencersDashboard?campaign=${proofDetails.briefId}`,
      data: proofDetails
    });
  }

  /**
   * Send proof submitted notification to brand
   */
  async notifyProofSubmitted(brandFid: number, submissionDetails: any): Promise<void> {
    await this.notificationService.sendNotificationToUser({
      fid: brandFid,
      type: 'proof_submitted',
      title: 'New Content Submitted',
      body: `${submissionDetails.influencerName} has submitted content for "${submissionDetails.campaignTitle}". Review required.`,
      targetUrl: `https://ads-bazaar.vercel.app/brandsDashBoard?campaign=${submissionDetails.briefId}`,
      data: submissionDetails
    });
  }

  /**
   * Send campaign cancelled notification
   */
  async notifyCampaignCancelled(userFids: number[], cancellationDetails: any): Promise<void> {
    const notifications = userFids.map(fid => ({
      fid,
      type: 'campaign_cancelled',
      title: 'Campaign Cancelled',
      body: `Campaign "${cancellationDetails.campaignTitle}" has been cancelled${cancellationDetails.reason ? '. Reason: ' + cancellationDetails.reason : '.'}`,
      targetUrl: `https://ads-bazaar.vercel.app/marketplace`,
      data: cancellationDetails
    }));
    
    await this.notificationService.sendNotificationToUsers(notifications);
  }

  /**
   * Send auto-approval alert notification to influencer
   */
  async notifyAutoApprovalAlert(influencerFid: number, paymentDetails: any): Promise<void> {
    await this.notificationService.sendNotificationToUser({
      fid: influencerFid,
      type: 'auto_approval_alert',
      title: '⏰ Payment Auto-Approved',
      body: `Your payment of $${paymentDetails.amount} cUSD for "${paymentDetails.campaignTitle}" has been automatically approved after the review deadline.`,
      targetUrl: `https://ads-bazaar.vercel.app/influencersDashboard?payment=${paymentDetails.briefId}`,
      data: paymentDetails
    });
  }

  /**
   * Send campaign expiry warning to brand
   */
  async notifyCampaignExpiryWarning(brandFid: number, campaignDetails: any): Promise<void> {
    const timeLeft = campaignDetails.hoursUntilExpiry > 1 
      ? `${campaignDetails.hoursUntilExpiry} hours` 
      : `${campaignDetails.minutesUntilExpiry} minutes`;
    
    await this.notificationService.sendNotificationToUser({
      fid: brandFid,
      type: 'campaign_expiry_warning',
      title: '⏰ Campaign Expiring Soon',
      body: `Your campaign "${campaignDetails.campaignTitle}" expires in ${timeLeft}. Review applications before the deadline.`,
      targetUrl: `https://ads-bazaar.vercel.app/brandsDashBoard?campaign=${campaignDetails.briefId}`,
      data: campaignDetails
    });
  }

  /**
   * Send insufficient applications alert to brand
   */
  async notifyInsufficientApplications(brandFid: number, campaignDetails: any): Promise<void> {
    await this.notificationService.sendNotificationToUser({
      fid: brandFid,
      type: 'insufficient_applications',
      title: '📊 Low Application Count',
      body: `Your campaign "${campaignDetails.campaignTitle}" has only ${campaignDetails.applicationCount} applications. You may want to create a new campaign with different requirements.`,
      targetUrl: `https://ads-bazaar.vercel.app/brandsDashBoard?campaign=${campaignDetails.briefId}`,
      data: campaignDetails
    });
  }

  /**
   * Send budget refund notification to brand
   */
  async notifyBudgetRefund(brandFid: number, refundDetails: any): Promise<void> {
    await this.notificationService.sendNotificationToUser({
      fid: brandFid,
      type: 'budget_refund',
      title: '💰 Budget Refunded',
      body: `$${refundDetails.amount} cUSD has been refunded for cancelled campaign "${refundDetails.campaignTitle}".`,
      targetUrl: `https://ads-bazaar.vercel.app/brandsDashBoard`,
      data: refundDetails
    });
  }
}

// Export singleton instance
export const adsBazaarNotifications = new AdsBazaarNotifications();