import { NextResponse } from 'next/server';
import { supabase } from '@/lib/database';

export async function GET() {
  try {
    // Test database connection
    const { data, error } = await supabase
      .from('notification_tokens')
      .select('count')
      .limit(1);

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ 
        success: false, 
        error: error.message,
        details: 'Make sure you have run the database migration and configured your environment variables'
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Database connection successful',
      data: data
    });
  } catch (error) {
    console.error('Connection error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      details: 'Check your NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables'
    }, { status: 500 });
  }
}

export async function POST() {
  try {
    // Test inserting a sample notification token
    const testFid = 12345;
    const testToken = 'test_token_' + Date.now();
    
    const { data, error } = await supabase
      .from('notification_tokens')
      .upsert({
        fid: testFid,
        notification_token: testToken,
        notification_url: 'https://test.com/notify',
        enabled: true
      })
      .select();

    if (error) {
      console.error('Insert error:', error);
      return NextResponse.json({ 
        success: false, 
        error: error.message 
      }, { status: 500 });
    }

    // Clean up test data
    await supabase
      .from('notification_tokens')
      .delete()
      .eq('fid', testFid);

    return NextResponse.json({ 
      success: true, 
      message: 'Database write/read test successful',
      data: data
    });
  } catch (error) {
    console.error('Test error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}