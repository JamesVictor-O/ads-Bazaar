# AdsBazaar Notification System - Fresh Setup Guide

## 🔄 Clean Database Reset

### Option 1: Full Reset (Recommended)
Use the comprehensive script with all features:
```sql
-- Execute this in your Supabase SQL Editor
\include supabase-reset-notifications.sql
```

### Option 2: Simple Reset (Quick)
Use the minimal script for basic functionality:
```sql  
-- Execute this in your Supabase SQL Editor
\include supabase-simple-reset.sql
```

## 📋 Step-by-Step Instructions

### 1. **Access Supabase Dashboard**
- Go to https://supabase.com/dashboard
- Select your AdsBazaar project
- Navigate to **SQL Editor**

### 2. **Execute Reset Script**
- Copy the contents of `supabase-reset-notifications.sql` (full) OR `supabase-simple-reset.sql` (simple)
- Paste into the SQL Editor
- Click **Run**

### 3. **Verify Tables Created**
Run this verification query:
```sql
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('user_fid_mappings', 'notification_preferences', 'notification_history')
ORDER BY table_name;
```

### 4. **Check Environment Variables**
Ensure your `.env.local` has:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## 🗃️ Database Schema Overview

### Table: `user_fid_mappings`
Maps Farcaster FIDs to wallet addresses:
- `fid` - Farcaster user ID
- `wallet_address` - Connected wallet address  
- `username` - Farcaster username (optional)

### Table: `notification_preferences`  
User notification settings:
- `fid` - Links to user_fid_mappings
- `campaign_opportunities` - New campaign alerts
- `application_updates` - Application status changes
- `payment_notifications` - Payment/escrow updates
- `dispute_alerts` - Dispute notifications
- `deadline_reminders` - Deadline warnings

### Table: `notification_history`
Log of all sent notifications:
- `fid` - Recipient user
- `notification_type` - Type of notification
- `title` & `body` - Notification content
- `target_url` - Deep link URL
- `sent_at` - When notification was sent
- `clicked_at` - When user clicked (NULL = unread)

## 🔧 Testing the Setup

### 1. Test User Registration
```bash
curl -X POST http://localhost:3000/api/notifications/register \
  -H "Content-Type: application/json" \
  -d '{"fid": 12345, "address": "0x1234...5678", "username": "testuser"}'
```

### 2. Test Notification History
```bash
curl "http://localhost:3000/api/notifications/history?fid=12345&limit=10"
```

### 3. Check Database Directly
```sql
-- Check registered users
SELECT * FROM user_fid_mappings;

-- Check notification preferences  
SELECT * FROM notification_preferences;

-- Check notification history
SELECT * FROM notification_history ORDER BY sent_at DESC LIMIT 10;
```

## 🎯 Integration with Campaign Events

The notification system automatically triggers on:

- **Campaign Created** → Notifies potential influencers
- **Campaign Cancelled** → Notifies applied influencers  
- **Campaign Expired** → Notifies business and influencers
- **Application Updates** → Notifies both parties
- **Payment Events** → Notifies recipients

## 🚀 Ready to Use!

After running the reset script:
1. ✅ All old notification data is cleared
2. ✅ Fresh tables with proper schema are created
3. ✅ Indexes are optimized for performance
4. ✅ Row Level Security is configured
5. ✅ Your app can start sending notifications immediately

The notification system will now work seamlessly with your campaign automatic refresh functionality!