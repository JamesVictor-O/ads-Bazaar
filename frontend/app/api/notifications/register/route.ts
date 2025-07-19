import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const { fid, address, username } = await request.json();
    
    if (!fid || !address) {
      return NextResponse.json(
        { error: 'FID and address are required' }, 
        { status: 400 }
      );
    }

    // Store or update the FID-to-address mapping
    const { data, error } = await supabase
      .from('user_fid_mappings')
      .upsert({
        fid: parseInt(fid),
        wallet_address: address.toLowerCase(),
        username: username || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select();

    if (error) {
      console.error('Error storing FID mapping:', error);
      return NextResponse.json(
        { error: 'Failed to register notification mapping' },
        { status: 500 }
      );
    }

    console.log(`Registered FID ${fid} to address ${address}`);
    
    return NextResponse.json({ 
      success: true, 
      mapping: data?.[0] 
    });
  } catch (error) {
    console.error('Error in notification registration:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}