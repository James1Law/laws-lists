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
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching lists:', error);
      return NextResponse.json(
        { error: 'Failed to fetch lists' },
        { status: 500 }
      );
    }
    
    // Sort manually to ensure nulls are last
    // And position is the primary sort key with created_at as secondary
    const sortedData = data.sort((a, b) => {
      // If both have position values, sort by position
      if (a.position !== null && b.position !== null) {
        return a.position - b.position;
      }
      // If only a has position, a comes first
      if (a.position !== null) return -1;
      // If only b has position, b comes first
      if (b.position !== null) return 1;
      // If neither has position, sort by created_at descending
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
    
    return NextResponse.json(sortedData);
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
    // Use service role client to bypass RLS
    const supabase = createServiceRoleClient();
    
    // Get the highest position value to put the new list at the top
    const { data: highestPositionList } = await supabase
      .from('lists')
      .select('position')
      .eq('group_id', params.id)
      .order('position', { ascending: false })
      .limit(1)
      .single();
    
    // Default to position 0 if no lists exist or if there was an error
    const newPosition = highestPositionList?.position !== undefined 
      ? highestPositionList.position - 1 
      : 0;
    
    // Create a new list
    const { data, error } = await supabase
      .from('lists')
      .insert([
        {
          title: name, // Map the name from request to title in database
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
    
    return NextResponse.json(data);
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
    
    // Use service role client to bypass RLS
    const supabase = createServiceRoleClient();
    
    // Process list updates in sequence
    const updatePromises = lists.map(({ id, position }) => 
      supabase
        .from('lists')
        .update({ position })
        .eq('id', id)
        .eq('group_id', params.id)
    );
    
    await Promise.all(updatePromises);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating list positions:', error);
    return NextResponse.json(
      { error: 'Failed to update list positions' },
      { status: 500 }
    );
  }
} 