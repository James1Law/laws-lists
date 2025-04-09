import { createSupabaseClient, createServiceRoleClient } from '@/lib/supabase-client';
import { NextResponse } from 'next/server';

// GET items for a specific list
export async function GET(
  request: Request,
  { params }: { params: { id: string; listId: string } }
) {
  try {
    // Use service role client to bypass RLS
    const supabase = createServiceRoleClient();
    
    // Fetch items for the list
    const { data, error } = await supabase
      .from('items')
      .select('id, content, bought, list_id, created_at')
      .eq('list_id', params.listId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching items:', error);
      return NextResponse.json(
        { error: 'Failed to fetch items' },
        { status: 500 }
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

// POST to create a new item for a list
export async function POST(
  request: Request,
  { params }: { params: { id: string; listId: string } }
) {
  try {
    const { content } = await request.json();
    // Use service role client to bypass RLS
    const supabase = createServiceRoleClient();
    
    // Create a new item
    const { data, error } = await supabase
      .from('items')
      .insert([
        {
          content,
          bought: false,
          list_id: params.listId,
        },
      ])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating item:', error);
      return NextResponse.json(
        { error: 'Failed to create item' },
        { status: 500 }
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