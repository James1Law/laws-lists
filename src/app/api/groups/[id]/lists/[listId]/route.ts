import { createServiceRoleClient } from '@/lib/supabase-client';
import { NextResponse } from 'next/server';

// GET a specific list by ID
export async function GET(
  request: Request,
  { params }: { params: { id: string; listId: string } }
) {
  try {
    // Use service role client to bypass RLS
    const supabase = createServiceRoleClient();
    
    // Fetch the list
    const { data, error } = await supabase
      .from('lists')
      .select('id, title, group_id, created_at')
      .eq('id', params.listId)
      .eq('group_id', params.id)
      .single();
    
    if (error) {
      console.error('Error fetching list:', error);
      return NextResponse.json(
        { error: 'List not found' },
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