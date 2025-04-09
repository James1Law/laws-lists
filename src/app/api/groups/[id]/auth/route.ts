import { createSupabaseClient } from '@/lib/supabase-client';
import { NextResponse } from 'next/server';

// POST for group authentication
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { password } = await request.json();
    const supabase = createSupabaseClient();
    
    // Verify the group exists and password matches
    const { data, error } = await supabase
      .from('groups')
      .select('id, password_hash')
      .eq('id', params.id)
      .single();
    
    if (error || !data) {
      console.error('Error fetching group:', error);
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      );
    }
    
    // Check password
    if (data.password_hash !== password) {
      return NextResponse.json(
        { error: 'Incorrect password' },
        { status: 401 }
      );
    }
    
    // Success
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in auth API route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 