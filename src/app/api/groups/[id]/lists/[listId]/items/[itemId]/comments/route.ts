import { createServiceRoleClient } from '@/lib/supabase-client';
import { NextResponse } from 'next/server';

// GET comments for a specific item
export async function GET(
  request: Request,
  { params }: { params: { id: string; listId: string; itemId: string } }
) {
  try {
    // Use service role client to bypass RLS
    const supabase = createServiceRoleClient();
    
    // Fetch comments for the item
    const { data, error } = await supabase
      .from('comments')
      .select('id, content, created_at')
      .eq('item_id', params.itemId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching comments:', error);
      return NextResponse.json(
        { error: 'Failed to fetch comments' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Error in API route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST to create a new comment for an item
export async function POST(
  request: Request,
  { params }: { params: { id: string; listId: string; itemId: string } }
) {
  try {
    const { content } = await request.json();
    
    if (!content || typeof content !== 'string' || content.trim() === '') {
      return NextResponse.json(
        { error: 'Comment content is required' },
        { status: 400 }
      );
    }
    
    // Use service role client to bypass RLS
    const supabase = createServiceRoleClient();
    
    // Create a new comment
    const { data, error } = await supabase
      .from('comments')
      .insert([
        {
          content,
          item_id: params.itemId,
        },
      ])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating comment:', error);
      return NextResponse.json(
        { error: 'Failed to create comment' },
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