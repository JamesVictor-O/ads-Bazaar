import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const headers = Object.fromEntries(request.headers.entries());
    
    console.log('Test webhook received:', {
      body,
      headers: {
        'content-type': headers['content-type'],
        'user-agent': headers['user-agent'],
        'x-forwarded-for': headers['x-forwarded-for'],
      }
    });
    
    return NextResponse.json({ 
      success: true, 
      message: 'Webhook received successfully',
      received: {
        body,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Test webhook error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 400 });
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Webhook endpoint is active',
    timestamp: new Date().toISOString(),
    endpoints: {
      production: '/api/farcaster/webhook',
      test: '/api/test-webhook'
    }
  });
}