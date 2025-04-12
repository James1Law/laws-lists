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

// PATCH to update a comment
export async function PATCH(
  request: Request,
  { params }: { params: { id: string; listId: string; itemId: string } }
) {
  try {
    const { commentId, content } = await request.json();
    
    if (!commentId) {
      return NextResponse.json(
        { error: 'Comment ID is required' },
        { status: 400 }
      );
    }
    
    if (!content || typeof content !== 'string' || content.trim() === '') {
      return NextResponse.json(
        { error: 'Comment content is required' },
        { status: 400 }
      );
    }
    
    // Use service role client to bypass RLS
    const supabase = createServiceRoleClient();
    
    // Update the comment
    const { data, error } = await supabase
      .from('comments')
      .update({ content })
      .eq('id', commentId)
      .eq('item_id', params.itemId) // Ensure comment belongs to this item
      .select()
      .single();
    
    if (error) {
      console.error('Error updating comment:', error);
      return NextResponse.json(
        { error: 'Failed to update comment' },
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

// DELETE to remove a comment
export async function DELETE(
  request: Request,
  { params }: { params: { id: string; listId: string; itemId: string } }
) {
  try {
    const url = new URL(request.url);
    const commentId = url.searchParams.get('commentId');
    
    if (!commentId) {
      return NextResponse.json(
        { error: 'Comment ID is required' },
        { status: 400 }
      );
    }
    
    // Use service role client to bypass RLS
    const supabase = createServiceRoleClient();
    
    // Delete the comment
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId)
      .eq('item_id', params.itemId); // Ensure comment belongs to this item
    
    if (error) {
      console.error('Error deleting comment:', error);
      return NextResponse.json(
        { error: 'Failed to delete comment' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in API route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 