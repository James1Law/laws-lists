import { createServiceRoleClient } from '@/lib/supabase-client';
import { NextResponse } from 'next/server';

// PATCH to update an item (toggle bought status)
export async function PATCH(
  request: Request,
  { params }: { params: { id: string; listId: string; itemId: string } }
) {
  try {
    const { bought } = await request.json();
    // Use service role client to bypass RLS
    const supabase = createServiceRoleClient();
    
    // Update the item
    const { data, error } = await supabase
      .from('items')
      .update({ bought })
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