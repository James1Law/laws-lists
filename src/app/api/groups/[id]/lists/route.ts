import { createServiceRoleClient } from '@/lib/supabase-client';
import { NextResponse } from 'next/server';

// GET lists for a specific group
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Use service role client to bypass RLS
    const supabase = createServiceRoleClient();
    
    // Fetch lists for the group
    const { data, error } = await supabase
      .from('lists')
      .select('id, title, created_at, group_id, position')
      .eq('group_id', params.id)
      .order('position', { ascending: true });
    
    if (error) {
      console.error('Error fetching lists:', error);
      return NextResponse.json(
        { error: 'Failed to fetch lists' },
        { status: 500 }
      );
    }
    
    // Fetch item counts for each list
    const listsWithCounts = await Promise.all(
      data.map(async (list) => {
        // Get total items count
        const { count: totalItems, error: totalError } = await supabase
          .from('items')
          .select('*', { count: 'exact', head: true })
          .eq('list_id', list.id);
        
        // Get bought items count
        const { count: boughtItems, error: boughtError } = await supabase
          .from('items')
          .select('*', { count: 'exact', head: true })
          .eq('list_id', list.id)
          .eq('bought', true);
        
        if (totalError || boughtError) {
          console.error('Error fetching item counts:', totalError || boughtError);
          return {
            ...list,
            totalItems: 0,
            boughtItems: 0
          };
        }
        
        return {
          ...list,
          totalItems: totalItems || 0,
          boughtItems: boughtItems || 0
        };
      })
    );
    
    // Sort lists by position with nulls last
    const sortedLists = listsWithCounts.sort((a, b) => {
      // If both have position values, sort by position
      if (a.position !== null && b.position !== null) {
        return a.position - b.position;
      }
      // If only a has position, a comes first
      if (a.position !== null) return -1;
      // If only b has position, b comes first
      if (b.position !== null) return 1;
      // If neither has position, sort by created_at descending (newest first)
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
    
    return NextResponse.json(sortedLists);
  } catch (error) {
    console.error('Error in API route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST to create a new list for a group
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { name } = await request.json();
    
    // Validate input
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json(
        { error: 'List name is required' },
        { status: 400 }
      );
    }
    
    // Use service role client to bypass RLS
    const supabase = createServiceRoleClient();
    
    // Get the minimum position value (lowest number will be at the top)
    const { data: lowestPositionList } = await supabase
      .from('lists')
      .select('position')
      .eq('group_id', params.id)
      .order('position', { ascending: true })
      .limit(1)
      .single();
    
    // Position the new list at the top
    // If there's a list with position 0, use position -1
    // If no lists exist or the first list has position null, use position 0
    const newPosition = lowestPositionList?.position !== null && lowestPositionList?.position !== undefined
      ? lowestPositionList.position - 1
      : 0;
    
    // Create a new list
    const { data, error } = await supabase
      .from('lists')
      .insert([
        {
          title: name.trim(), // Map the name from request to title in database
          group_id: params.id,
          position: newPosition,
        },
      ])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating list:', error);
      return NextResponse.json(
        { error: 'Failed to create list' },
        { status: 500 }
      );
    }
    
    // Fetch counts for the new list
    const listWithCounts = {
      ...data,
      totalItems: 0,
      boughtItems: 0
    };
    
    return NextResponse.json(listWithCounts);
  } catch (error) {
    console.error('Error in API route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH to update list positions
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { lists } = await request.json();
    
    if (!Array.isArray(lists) || lists.length === 0) {
      return NextResponse.json(
        { error: 'Invalid lists data' },
        { status: 400 }
      );
    }
    
    // Validate list data
    const isValidListData = lists.every(item => 
      typeof item.id === 'string' && 
      typeof item.position === 'number' && 
      Number.isInteger(item.position)
    );
    
    if (!isValidListData) {
      return NextResponse.json(
        { error: 'Lists must have valid id and position values' },
        { status: 400 }
      );
    }
    
    // Use service role client to bypass RLS
    const supabase = createServiceRoleClient();
    
    // Verify all lists belong to this group
    const listIds = lists.map(list => list.id);
    const { data: existingLists, error: checkError } = await supabase
      .from('lists')
      .select('id')
      .eq('group_id', params.id)
      .in('id', listIds);
    
    if (checkError) {
      console.error('Error checking list ownership:', checkError);
      return NextResponse.json(
        { error: 'Failed to verify list ownership' },
        { status: 500 }
      );
    }
    
    if (existingLists.length !== listIds.length) {
      return NextResponse.json(
        { error: 'Some lists do not belong to this group' },
        { status: 403 }
      );
    }
    
    // Update each list position with efficient batching
    const updatePromises = lists.map(({ id, position }) => 
      supabase
        .from('lists')
        .update({ position })
        .eq('id', id)
        .eq('group_id', params.id)
    );
    
    const results = await Promise.all(updatePromises);
    
    // Check for errors in any of the update operations
    const errors = results.filter(result => result.error);
    if (errors.length > 0) {
      console.error('Errors updating list positions:', errors);
      return NextResponse.json(
        { error: 'Some list positions failed to update' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating list positions:', error);
    return NextResponse.json(
      { error: 'Failed to update list positions' },
      { status: 500 }
    );
  }
} 