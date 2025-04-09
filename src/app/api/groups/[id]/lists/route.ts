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
      .select('id, title, created_at, group_id')
      .eq('group_id', params.id)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching lists:', error);
      return NextResponse.json(
        { error: 'Failed to fetch lists' },
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

// POST to create a new list for a group
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { name } = await request.json();
    // Use service role client to bypass RLS
    const supabase = createServiceRoleClient();
    
    // Create a new list
    const { data, error } = await supabase
      .from('lists')
      .insert([
        {
          title: name, // Map the name from request to title in database
          group_id: params.id,
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