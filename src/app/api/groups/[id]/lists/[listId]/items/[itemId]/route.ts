import { createServiceRoleClient } from '@/lib/supabase-client';
import { NextResponse } from 'next/server';

// GET a specific item by ID
export async function GET(
  request: Request,
  { params }: { params: { id: string; listId: string; itemId: string } }
) {
  try {
    // Use service role client to bypass RLS
    const supabase = createServiceRoleClient();
    
    // Fetch the item
    const { data, error } = await supabase
      .from('items')
      .select('id, content, bought, list_id, created_at')
      .eq('id', params.itemId)
      .eq('list_id', params.listId)
      .single();
    
    if (error) {
      console.error('Error fetching item:', error);
      return NextResponse.json(
        { error: 'Item not found' },
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

// PATCH to update an item (toggle bought status or update content)
export async function PATCH(
  request: Request,
  { params }: { params: { id: string; listId: string; itemId: string } }
) {
  try {
    const body = await request.json();
    // Use service role client to bypass RLS
    const supabase = createServiceRoleClient();
    
    // Determine what fields to update (bought status or content or both)
    const updateData: { bought?: boolean; content?: string } = {};
    
    if (body.bought !== undefined) {
      updateData.bought = body.bought;
    }
    
    if (body.content !== undefined) {
      // Validate content is not empty
      if (!body.content || body.content.trim() === '') {
        return NextResponse.json(
          { error: 'Item content cannot be empty' },
          { status: 400 }
        );
      }
      updateData.content = body.content.trim();
    }
    
    // Update the item
    const { data, error } = await supabase
      .from('items')
      .update(updateData)
      .eq('id', params.itemId)
      .eq('list_id', params.listId)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating item:', error);
      return NextResponse.json(
        { error: 'Failed to update item' },
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

// DELETE an item
export async function DELETE(
  request: Request,
  { params }: { params: { id: string; listId: string; itemId: string } }
) {
  try {
    // Use service role client to bypass RLS
    const supabase = createServiceRoleClient();
    
    // Delete the item
    const { error } = await supabase
      .from('items')
      .delete()
      .eq('id', params.itemId)
      .eq('list_id', params.listId);
    
    if (error) {
      console.error('Error deleting item:', error);
      return NextResponse.json(
        { error: 'Failed to delete item' },
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