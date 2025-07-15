import { NextRequest, NextResponse } from 'next/server';
import { parseWebhookEvent } from '@farcaster/miniapp-node';
import { supabase } from '@/lib/database'; // You'll need to set up your database connection

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const headers = Object.fromEntries(request.headers.entries());
    
    // Parse and verify the webhook event
    const event = parseWebhookEvent(body, headers);
    
    console.log('Farcaster webhook event received:', event);
    
    switch (event.type) {
      case 'miniapp.add':
        await handleMiniAppAdd(event);
        break;
      case 'miniapp.remove':
        await handleMiniAppRemove(event);
        break;
      case 'miniapp.enable':
        await handleMiniAppEnable(event);
        break;
      case 'miniapp.disable':
        await handleMiniAppDisable(event);
        break;
      default:
        console.log('Unhandled event type:', event.type);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Invalid webhook' }, { status: 400 });
  }
}

async function handleMiniAppAdd(event: any) {
  const { fid, notificationToken, notificationUrl } = event.data;
  
  try {
    // Store the notification token and URL
    await supabase
      .from('notification_tokens')
      .upsert({
        fid,
        notification_token: notificationToken,
        notification_url: notificationUrl,
        enabled: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select();
    
    console.log(`Mini app added for FID: ${fid}`);
  } catch (error) {
    console.error('Error storing notification token:', error);
  }
}

async function handleMiniAppRemove(event: any) {
  const { fid } = event.data;
  
  try {
    // Remove the notification token
    await supabase
      .from('notification_tokens')
      .delete()
      .eq('fid', fid);
    
    console.log(`Mini app removed for FID: ${fid}`);
  } catch (error) {
    console.error('Error removing notification token:', error);
  }
}

async function handleMiniAppEnable(event: any) {
  const { fid } = event.data;
  
  try {
    // Enable notifications for this user
    await supabase
      .from('notification_tokens')
      .update({ 
        enabled: true,
        updated_at: new Date().toISOString()
      })
      .eq('fid', fid);
    
    console.log(`Notifications enabled for FID: ${fid}`);
  } catch (error) {
    console.error('Error enabling notifications:', error);
  }
}

async function handleMiniAppDisable(event: any) {
  const { fid } = event.data;
  
  try {
    // Disable notifications for this user
    await supabase
      .from('notification_tokens')
      .update({ 
        enabled: false,
        updated_at: new Date().toISOString()
      })
      .eq('fid', fid);
    
    console.log(`Notifications disabled for FID: ${fid}`);
  } catch (error) {
    console.error('Error disabling notifications:', error);
  }
}