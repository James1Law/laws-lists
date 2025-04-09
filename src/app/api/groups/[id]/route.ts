import { createSupabaseClient } from '@/lib/supabase-client';
import { NextResponse } from 'next/server';

// GET a specific group by ID
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createSupabaseClient();
    
    // Fetch the group
    const { data, error } = await supabase
      .from('groups')
      .select('id, name, created_at')
      .eq('id', params.id)
      .single();
    
    if (error) {
      console.error('Error fetching group:', error);
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in API route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 