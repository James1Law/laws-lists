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
      .select('id, title, group_id, created_at, theme')
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

// PATCH to update a list (e.g. rename)
export async function PATCH(
  request: Request,
  { params }: { params: { id: string; listId: string } }
) {
  try {
    const { title } = await request.json();
    
    // Validate input
    if (!title || typeof title !== 'string' || title.trim() === '') {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }
    
    // Use service role client to bypass RLS
    const supabase = createServiceRoleClient();
    
    // Check if list exists and belongs to the group
    const { data: existingList, error: checkError } = await supabase
      .from('lists')
      .select('id')
      .eq('id', params.listId)
      .eq('group_id', params.id)
      .single();
    
    if (checkError || !existingList) {
      console.error('Error finding list:', checkError);
      return NextResponse.json(
        { error: 'List not found' },
        { status: 404 }
      );
    }
    
    // Update the list
    const { data, error } = await supabase
      .from('lists')
      .update({ title: title.trim() })
      .eq('id', params.listId)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating list:', error);
      return NextResponse.json(
        { error: 'Failed to update list' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error('Error in API route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE to remove a list and all its items
export async function DELETE(
  request: Request,
  { params }: { params: { id: string; listId: string } }
) {
  try {
    // Use service role client to bypass RLS
    const supabase = createServiceRoleClient();
    
    // Check if list exists and belongs to the group
    const { data: existingList, error: checkError } = await supabase
      .from('lists')
      .select('id')
      .eq('id', params.listId)
      .eq('group_id', params.id)
      .single();
    
    if (checkError || !existingList) {
      console.error('Error finding list:', checkError);
      return NextResponse.json(
        { error: 'List not found' },
        { status: 404 }
      );
    }
    
    // First delete all items in the list
    const { error: deleteItemsError } = await supabase
      .from('items')
      .delete()
      .eq('list_id', params.listId);
    
    if (deleteItemsError) {
      console.error('Error deleting items:', deleteItemsError);
      return NextResponse.json(
        { error: 'Failed to delete list items' },
        { status: 500 }
      );
    }
    
    // Then delete the list itself
    const { error: deleteListError } = await supabase
      .from('lists')
      .delete()
      .eq('id', params.listId);
    
    if (deleteListError) {
      console.error('Error deleting list:', deleteListError);
      return NextResponse.json(
        { error: 'Failed to delete list' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Error in API route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 