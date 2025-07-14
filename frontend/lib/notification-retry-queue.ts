import { supabase } from './database';
import { NotificationData } from './notification-service';

interface RetryQueueItem {
  id: string;
  fid: number;
  notification: NotificationData;
  attempts: number;
  maxAttempts: number;
  nextRetryAt: Date;
  lastError?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface RetryConfig {
  maxAttempts: number;
  baseDelay: number; // milliseconds
  maxDelay: number; // milliseconds
  backoffMultiplier: number;
  jitter: boolean;
}

export class NotificationRetryQueue {
  private isProcessing = false;
  private processingInterval: NodeJS.Timeout | null = null;
  private config: RetryConfig;

  constructor(config: Partial<RetryConfig> = {}) {
    this.config = {
      maxAttempts: config.maxAttempts || 3,
      baseDelay: config.baseDelay || 5000, // 5 seconds
      maxDelay: config.maxDelay || 300000, // 5 minutes
      backoffMultiplier: config.backoffMultiplier || 2,
      jitter: config.jitter !== false, // enabled by default
    };
  }

  /**
   * Add a notification to the retry queue
   */
  async addToRetryQueue(
    notification: NotificationData,
    error: string,
    attempts: number = 0
  ): Promise<void> {
    const id = `${notification.type}-${notification.fid}-${Date.now()}`;
    const nextRetryAt = this.calculateNextRetryTime(attempts);

    try {
      // Store in database retry queue table
      await supabase
        .from('notification_retry_queue')
        .insert({
          id,
          fid: notification.fid,
          notification_type: notification.type,
          notification_data: notification,
          attempts,
          max_attempts: this.config.maxAttempts,
          next_retry_at: nextRetryAt.toISOString(),
          last_error: error,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      console.log(`Added notification to retry queue: ${id}, next retry at: ${nextRetryAt}`);
    } catch (dbError) {
      console.error('Error adding to retry queue:', dbError);
    }
  }

  /**
   * Start processing the retry queue
   */
  startProcessing(intervalMs: number = 30000): void {
    if (this.isProcessing) {
      console.log('Retry queue processing already started');
      return;
    }

    this.isProcessing = true;
    console.log('Starting notification retry queue processing');

    this.processingInterval = setInterval(async () => {
      await this.processRetryQueue();
    }, intervalMs);
  }

  /**
   * Stop processing the retry queue
   */
  stopProcessing(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
    this.isProcessing = false;
    console.log('Stopped notification retry queue processing');
  }

  /**
   * Process items in the retry queue
   */
  private async processRetryQueue(): Promise<void> {
    try {
      const now = new Date();

      // Get items ready for retry
      const { data: retryItems, error } = await supabase
        .from('notification_retry_queue')
        .select('*')
        .lte('next_retry_at', now.toISOString())
        .lt('attempts', this.config.maxAttempts)
        .order('next_retry_at', { ascending: true })
        .limit(50); // Process up to 50 items at a time

      if (error) {
        console.error('Error fetching retry queue items:', error);
        return;
      }

      if (!retryItems || retryItems.length === 0) {
        return; // No items to process
      }

      console.log(`Processing ${retryItems.length} retry queue items`);

      // Process each item
      for (const item of retryItems) {
        await this.processRetryItem(item);
      }

      // Clean up old failed items
      await this.cleanupFailedItems();
    } catch (error) {
      console.error('Error processing retry queue:', error);
    }
  }

  /**
   * Process a single retry item
   */
  private async processRetryItem(item: any): Promise<void> {
    try {
      const notification: NotificationData = item.notification_data;
      const attempts = item.attempts + 1;

      console.log(`Retrying notification ${item.id}, attempt ${attempts}/${this.config.maxAttempts}`);

      // Import notification service dynamically to avoid circular dependency
      const { NotificationService } = await import('./notification-service');
      const notificationService = NotificationService.getInstance();

      // Attempt to send notification
      const success = await notificationService.sendNotificationToUser(notification);

      if (success) {
        // Success - remove from retry queue
        await supabase
          .from('notification_retry_queue')
          .delete()
          .eq('id', item.id);

        console.log(`Successfully sent notification ${item.id} after ${attempts} attempts`);
      } else {
        // Failed - update retry count and schedule next retry
        if (attempts >= this.config.maxAttempts) {
          // Max attempts reached - mark as failed
          await supabase
            .from('notification_retry_queue')
            .update({
              attempts,
              last_error: 'Max retry attempts reached',
              updated_at: new Date().toISOString(),
            })
            .eq('id', item.id);

          console.log(`Notification ${item.id} failed after ${attempts} attempts`);
        } else {
          // Schedule next retry
          const nextRetryAt = this.calculateNextRetryTime(attempts);
          
          await supabase
            .from('notification_retry_queue')
            .update({
              attempts,
              next_retry_at: nextRetryAt.toISOString(),
              last_error: 'Retry attempt failed',
              updated_at: new Date().toISOString(),
            })
            .eq('id', item.id);

          console.log(`Scheduled retry for notification ${item.id}, next attempt at: ${nextRetryAt}`);
        }
      }
    } catch (error) {
      console.error(`Error processing retry item ${item.id}:`, error);
    }
  }

  /**
   * Calculate next retry time using exponential backoff
   */
  private calculateNextRetryTime(attempts: number): Date {
    const baseDelay = this.config.baseDelay;
    const maxDelay = this.config.maxDelay;
    const backoffMultiplier = this.config.backoffMultiplier;

    // Calculate delay with exponential backoff
    let delay = baseDelay * Math.pow(backoffMultiplier, attempts);
    
    // Apply maximum delay limit
    delay = Math.min(delay, maxDelay);

    // Add jitter to prevent thundering herd
    if (this.config.jitter) {
      const jitterAmount = delay * 0.1; // 10% jitter
      delay += (Math.random() - 0.5) * 2 * jitterAmount;
    }

    return new Date(Date.now() + delay);
  }

  /**
   * Clean up old failed items
   */
  private async cleanupFailedItems(): Promise<void> {
    try {
      const cutoffDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago

      const { error } = await supabase
        .from('notification_retry_queue')
        .delete()
        .gte('attempts', this.config.maxAttempts)
        .lt('created_at', cutoffDate.toISOString());

      if (error) {
        console.error('Error cleaning up failed retry items:', error);
      }
    } catch (error) {
      console.error('Error in cleanup:', error);
    }
  }

  /**
   * Get retry queue statistics
   */
  async getRetryQueueStats(): Promise<{
    pending: number;
    processing: number;
    failed: number;
    oldestPending?: Date;
  }> {
    try {
      const now = new Date();

      const { data: stats, error } = await supabase
        .from('notification_retry_queue')
        .select('attempts, max_attempts, next_retry_at, created_at')
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching retry queue stats:', error);
        return { pending: 0, processing: 0, failed: 0 };
      }

      const items = stats || [];
      const pending = items.filter(item => 
        item.attempts < item.max_attempts && 
        new Date(item.next_retry_at) > now
      ).length;

      const processing = items.filter(item => 
        item.attempts < item.max_attempts && 
        new Date(item.next_retry_at) <= now
      ).length;

      const failed = items.filter(item => 
        item.attempts >= item.max_attempts
      ).length;

      const oldestPending = items.length > 0 ? new Date(items[0].created_at) : undefined;

      return { pending, processing, failed, oldestPending };
    } catch (error) {
      console.error('Error getting retry queue stats:', error);
      return { pending: 0, processing: 0, failed: 0 };
    }
  }

  /**
   * Clear all items from retry queue (for testing)
   */
  async clearRetryQueue(): Promise<void> {
    try {
      await supabase
        .from('notification_retry_queue')
        .delete()
        .neq('id', ''); // Delete all items

      console.log('Retry queue cleared');
    } catch (error) {
      console.error('Error clearing retry queue:', error);
    }
  }
}

// Export singleton instance
export const notificationRetryQueue = new NotificationRetryQueue();

// Auto-start processing in production
if (process.env.NODE_ENV === 'production') {
  notificationRetryQueue.startProcessing();
}