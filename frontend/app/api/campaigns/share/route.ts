import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Use service role for database writes
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Track campaign share
export async function POST(request: NextRequest) {
  try {
    const { campaignId, platform, userAddress } = await request.json();

    if (!campaignId) {
      return NextResponse.json(
        { error: 'Campaign ID is required' },
        { status: 400 }
      );
    }

    // Insert share record
    const { error } = await supabase
      .from('campaign_shares')
      .insert({
        campaign_id: campaignId,
        platform: platform || 'unknown',
        user_address: userAddress,
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error tracking share:', error);
      return NextResponse.json(
        { error: 'Failed to track share' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in share tracking:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get share count for campaign
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('campaignId');

    if (!campaignId) {
      return NextResponse.json(
        { error: 'Campaign ID is required' },
        { status: 400 }
      );
    }

    const { data, error, count } = await supabase
      .from('campaign_shares')
      .select('*', { count: 'exact', head: true })
      .eq('campaign_id', campaignId);

    if (error) {
      console.error('Error fetching share count:', error);
      return NextResponse.json(
        { error: 'Failed to fetch share count' },
        { status: 500 }
      );
    }

    return NextResponse.json({ shareCount: count || 0 });
  } catch (error) {
    console.error('Error in share count fetch:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}