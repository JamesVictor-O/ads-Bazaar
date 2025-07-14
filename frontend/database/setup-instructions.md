# Database Setup Instructions for AdsBazaar Notifications

## 1. Create a Supabase Project

1. Go to [Supabase](https://supabase.com) and create a new project
2. Choose a database password and save it
3. Wait for the project to be created

## 2. Get Your Environment Variables

After your project is created, go to **Settings > API** and copy:

- **Project URL** (for `NEXT_PUBLIC_SUPABASE_URL`)
- **anon/public key** (for `NEXT_PUBLIC_SUPABASE_ANON_KEY`)  
- **service_role key** (for `SUPABASE_SERVICE_ROLE_KEY`) - **Keep this secret!**

## 3. Update Your Environment Variables

Add these to your `.env` file:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

## 4. Run the Database Migration

1. Open your Supabase project dashboard
2. Go to **SQL Editor**
3. Create a new query
4. Copy and paste the entire contents of `database/migrations/001_create_notification_tables.sql`
5. Click **Run** to execute the migration

## 5. Verify the Setup

After running the migration, you should see these tables in your **Database > Tables** section:

- `notification_tokens` - Stores Farcaster user tokens
- `notification_preferences` - Stores user notification preferences  
- `notification_history` - Stores notification history/logs

## 6. Test the Connection

You can test the database connection by:

1. Starting your development server: `npm run dev`
2. Opening the browser console
3. The webhook endpoint should be available at `/api/farcaster/webhook`

## Database Schema Overview

### notification_tokens
- Stores Farcaster user notification tokens
- Primary key: `id`
- Unique constraint: `fid` (Farcaster ID)
- Tracks if notifications are enabled

### notification_preferences  
- Stores user notification preferences
- Foreign key: `fid` references `notification_tokens`
- Boolean flags for different notification types
- Can be linked to wallet addresses

### notification_history
- Stores all sent notifications
- Foreign key: `fid` references `notification_tokens` 
- Tracks notification delivery and clicks
- JSON field for additional notification data

## Security Features

- **Row Level Security (RLS)** enabled on all tables
- **Service role policies** for backend access
- **Triggers** for automatic `updated_at` timestamps
- **Indexes** for optimal query performance

## Optional Features

- **Cleanup function** for old notifications (90+ days)
- **Statistics view** for notification analytics
- **Scheduled cleanup** (requires pg_cron extension)

## Troubleshooting

### Common Issues:

1. **"relation does not exist"** - Make sure you ran the migration SQL
2. **"permission denied"** - Check your service role key is correct
3. **"connection refused"** - Verify your Supabase URL is correct

### Testing Database Connection:

```javascript
// Test in browser console or create a test page
const { supabase } = require('./lib/database');

// Test connection
supabase.from('notification_tokens').select('count').then(console.log);
```

## Next Steps

Once the database is set up:

1. Add the `NotificationButton` component to your dashboard pages
2. Test the webhook endpoint with Farcaster Mini App
3. Integrate with your smart contract event monitoring
4. Configure notification triggers for campaign events

The notification system is now ready to use!