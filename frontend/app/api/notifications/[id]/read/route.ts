import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/database';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const notificationId = parseInt(params.id);

  if (!notificationId || isNaN(notificationId)) {
    return NextResponse.json({ 
      success: false, 
      error: 'Valid notification ID is required' 
    }, { status: 400 });
  }

  try {
    const { data, error } = await supabase
      .from('notification_history')
      .update({ 
        clicked_at: new Date().toISOString()
      })
      .eq('id', notificationId)
      .select()
      .single();

    if (error) {
      console.error('Error marking notification as read:', error);
      return NextResponse.json({ 
        success: false, 
        error: error.message 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      notification: data
    });

  } catch (error) {
    console.error('Error in mark notification as read API:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}