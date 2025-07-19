import { NextRequest, NextResponse } from 'next/server';
import { adsBazaarNotifications } from '@/lib/notification-service';
import { getFidFromAddress } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const { type, address, data } = await request.json();
    
    if (!type || !address) {
      return NextResponse.json(
        { error: 'Type and address are required' }, 
        { status: 400 }
      );
    }

    // Get FID for the address
    const fid = await getFidFromAddress(address);
    if (!fid) {
      return NextResponse.json(
        { error: 'No FID found for this address. Please enable notifications first.' },
        { status: 404 }
      );
    }

    let result;
    switch (type) {
      case 'campaign_opportunity':
        result = await adsBazaarNotifications.notifyCampaignOpportunity(
          [fid],
          {
            briefId: '0x123',
            targetAudience: 'Test Audience',
            budget: '100',
            selectionDeadline: Math.floor(Date.now() / 1000) + 86400,
            ...data
          }
        );
        break;

      case 'influencer_selected':
        result = await adsBazaarNotifications.notifyInfluencerSelected(
          fid,
          {
            briefId: '0x123',
            title: 'Test Campaign',
            ...data
          }
        );
        break;

      case 'payment_available':
        result = await adsBazaarNotifications.notifyPaymentAvailable(
          fid,
          {
            briefId: '0x123',
            amount: '50',
            ...data
          }
        );
        break;

      case 'application_received':
        result = await adsBazaarNotifications.notifyApplicationReceived(
          fid,
          {
            username: 'Test Influencer',
            address: '0x456',
            ...data
          },
          {
            briefId: '0x123',
            title: 'Test Campaign',
            ...data
          }
        );
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid notification type' },
          { status: 400 }
        );
    }

    return NextResponse.json({ 
      success: true, 
      fid,
      type,
      result 
    });
  } catch (error) {
    console.error('Error sending test notification:', error);
    return NextResponse.json(
      { error: 'Failed to send test notification' },
      { status: 500 }
    );
  }
}