import { createServiceRoleClient } from '@/lib/supabase-client';
import { NextResponse } from 'next/server';

// GET all groups
export async function GET() {
  try {
    // Use service role client to bypass RLS
    const supabase = createServiceRoleClient();
    
    // Fetch all groups
    const { data, error } = await supabase
      .from('groups')
      .select('id, name, created_at')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching groups:', error);
      return NextResponse.json(
        { error: 'Failed to fetch groups' },
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

// POST to create a new group
export async function POST(request: Request) {
  try {
    const { name, password_hash } = await request.json();
    // Use service role client to bypass RLS
    const supabase = createServiceRoleClient();
    
    // Insert into the Supabase groups table
    const { data, error } = await supabase
      .from('groups')
      .insert([
        {
          name,
          password_hash,
        },
      ])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating group:', error);
      return NextResponse.json(
        { error: 'Failed to create group' },
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