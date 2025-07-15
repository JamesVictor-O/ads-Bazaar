import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/database';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const fid = searchParams.get('fid');
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');
  const type = searchParams.get('type');
  const read = searchParams.get('read'); // 'true', 'false', or null for all

  if (!fid) {
    return NextResponse.json({ 
      success: false, 
      error: 'FID is required' 
    }, { status: 400 });
  }

  try {
    let query = supabase
      .from('notification_history')
      .select('*')
      .eq('fid', parseInt(fid))
      .order('sent_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (type && type !== 'all') {
      query = query.eq('notification_type', type);
    }

    if (read === 'true') {
      query = query.not('clicked_at', 'is', null);
    } else if (read === 'false') {
      query = query.is('clicked_at', null);
    }

    const { data: notifications, error } = await query;

    if (error) {
      console.error('Error fetching notification history:', error);
      return NextResponse.json({ 
        success: false, 
        error: error.message 
      }, { status: 500 });
    }

    // Get total count for pagination
    let countQuery = supabase
      .from('notification_history')
      .select('*', { count: 'exact', head: true })
      .eq('fid', parseInt(fid));

    if (type && type !== 'all') {
      countQuery = countQuery.eq('notification_type', type);
    }

    if (read === 'true') {
      countQuery = countQuery.not('clicked_at', 'is', null);
    } else if (read === 'false') {
      countQuery = countQuery.is('clicked_at', null);
    }

    const { count, error: countError } = await countQuery;

    if (countError) {
      console.error('Error getting notification count:', countError);
    }

    return NextResponse.json({
      success: true,
      notifications: notifications || [],
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit
      }
    });

  } catch (error) {
    console.error('Error in notification history API:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}