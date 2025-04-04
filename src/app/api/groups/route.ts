import { createSupabaseClient } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { name, password_hash } = await request.json();
    const supabase = createSupabaseClient();

    // Insert the new group
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