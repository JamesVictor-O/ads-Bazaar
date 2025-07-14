'use client';

import { useState, useEffect } from 'react';
import { useProfile } from '@farcaster/auth-kit';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  Check, 
  ExternalLink, 
  Calendar, 
  Filter,
  Search,
  Archive,
  Trash2,
  Settings,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react';
import { format } from 'date-fns';

interface NotificationItem {
  id: number;
  fid: number;
  notification_type: string;
  title: string;
  body: string;
  target_url?: string;
  notification_data?: any;
  sent_at: string;
  clicked_at?: string;
  read_at?: string;
}

interface NotificationHistoryProps {
  onClose?: () => void;
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'campaign_opportunity':
      return '🎯';
    case 'application_update':
      return '📝';
    case 'payment_notification':
      return '💰';
    case 'dispute_alert':
      return '⚠️';
    case 'deadline_reminder':
      return '⏰';
    case 'proof_status_update':
      return '✅';
    case 'proof_submitted':
      return '📤';
    case 'campaign_cancelled':
      return '❌';
    default:
      return '🔔';
  }
};

const getNotificationColor = (type: string) => {
  switch (type) {
    case 'campaign_opportunity':
      return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
    case 'application_update':
      return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    case 'payment_notification':
      return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
    case 'dispute_alert':
      return 'text-red-400 bg-red-500/10 border-red-500/20';
    case 'deadline_reminder':
      return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
    case 'proof_status_update':
      return 'text-green-400 bg-green-500/10 border-green-500/20';
    case 'proof_submitted':
      return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
    case 'campaign_cancelled':
      return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
    default:
      return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
  }
};

const formatNotificationType = (type: string) => {
  return type.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
};

export function NotificationHistory({ onClose }: NotificationHistoryProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const { isAuthenticated, profile } = useProfile();

  useEffect(() => {
    if (isAuthenticated && profile?.fid) {
      loadNotifications();
    }
  }, [isAuthenticated, profile]);

  const loadNotifications = async () => {
    setIsLoading(true);
    try {
      // TODO: Replace with actual API call
      const response = await fetch(`/api/notifications/history?fid=${profile?.fid}`);
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
      // Demo data for now
      setNotifications([
        {
          id: 1,
          fid: profile?.fid || 0,
          notification_type: 'campaign_opportunity',
          title: 'New Tech Campaign Available - $100 Budget',
          body: 'A new campaign matching your Tech expertise is available. Apply now before the deadline.',
          target_url: 'https://ads-bazaar.vercel.app/marketplace?campaign=0x123',
          sent_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          clicked_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: 2,
          fid: profile?.fid || 0,
          notification_type: 'application_update',
          title: '🎉 You\'ve been selected!',
          body: 'Congratulations! You\'ve been selected for "Mobile App Promotion". Check your dashboard for next steps.',
          target_url: 'https://ads-bazaar.vercel.app/influencersDashboard?campaign=0x456',
          sent_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: 3,
          fid: profile?.fid || 0,
          notification_type: 'proof_status_update',
          title: '✅ Content Approved!',
          body: 'Your content for "Mobile App Promotion" has been approved. Payment will be processed soon.',
          target_url: 'https://ads-bazaar.vercel.app/influencersDashboard?campaign=0x456',
          sent_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          clicked_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (notificationId: number) => {
    try {
      await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'POST',
      });
      
      setNotifications(prev => prev.map(notif => 
        notif.id === notificationId 
          ? { ...notif, read_at: new Date().toISOString() }
          : notif
      ));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleNotificationClick = (notification: NotificationItem) => {
    if (!notification.clicked_at) {
      markAsRead(notification.id);
    }
    
    if (notification.target_url) {
      window.open(notification.target_url, '_blank');
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    const matchesFilter = filter === 'all' || 
      (filter === 'read' && notification.clicked_at) ||
      (filter === 'unread' && !notification.clicked_at);
    
    const matchesSearch = searchTerm === '' || 
      notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.body.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === 'all' || notification.notification_type === typeFilter;
    
    return matchesFilter && matchesSearch && matchesType;
  });

  const unreadCount = notifications.filter(n => !n.clicked_at).length;

  if (!isAuthenticated) {
    return (
      <div className="p-6 text-center">
        <Bell className="w-16 h-16 text-slate-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Sign In Required</h3>
        <p className="text-slate-600">Please sign in with Farcaster to view your notification history.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Bell className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Notification History</h2>
          {unreadCount > 0 && (
            <span className="px-2 py-1 bg-red-500 text-white text-xs rounded-full">
              {unreadCount} unread
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadNotifications}
            disabled={isLoading}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Archive className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex gap-2">
          {['all', 'unread', 'read'].map((filterType) => (
            <button
              key={filterType}
              onClick={() => setFilter(filterType as any)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === filterType
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
            </button>
          ))}
        </div>

        <div className="flex gap-2 flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search notifications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Types</option>
            <option value="campaign_opportunity">Campaign Opportunities</option>
            <option value="application_update">Application Updates</option>
            <option value="payment_notification">Payment Notifications</option>
            <option value="proof_status_update">Proof Status Updates</option>
            <option value="proof_submitted">Proof Submitted</option>
            <option value="campaign_cancelled">Campaign Cancelled</option>
            <option value="dispute_alert">Dispute Alerts</option>
            <option value="deadline_reminder">Deadline Reminders</option>
          </select>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading notifications...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {filter === 'all' ? 'No notifications' : `No ${filter} notifications`}
            </h3>
            <p className="text-gray-600">
              {searchTerm ? 'Try adjusting your search terms.' : 'Notifications will appear here when you receive them.'}
            </p>
          </div>
        ) : (
          <AnimatePresence>
            {filteredNotifications.map((notification, index) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                  notification.clicked_at 
                    ? 'bg-gray-50 border-gray-200' 
                    : 'bg-white border-blue-200 shadow-sm'
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-lg border ${getNotificationColor(notification.notification_type)}`}>
                    <span className="text-lg">{getNotificationIcon(notification.notification_type)}</span>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {notification.title}
                      </h3>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {notification.clicked_at ? (
                          <Eye className="w-4 h-4 text-gray-400" />
                        ) : (
                          <EyeOff className="w-4 h-4 text-blue-600" />
                        )}
                        <span className="text-xs text-gray-500">
                          {format(new Date(notification.sent_at), 'MMM d, h:mm a')}
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-2">
                      {notification.body}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <span className={`text-xs px-2 py-1 rounded-full border ${getNotificationColor(notification.notification_type)}`}>
                        {formatNotificationType(notification.notification_type)}
                      </span>
                      
                      {notification.target_url && (
                        <div className="flex items-center gap-1 text-xs text-blue-600">
                          <span>View details</span>
                          <ExternalLink className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}