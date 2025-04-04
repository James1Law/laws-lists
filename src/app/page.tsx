"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Toaster, toast } from "sonner";
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Group {
  id: string;
  name: string;
  created_at: string;
}

export default function HomePage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const { data, error } = await supabase
        .from("groups")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setGroups(data || []);
    } catch (error) {
      console.error("Error fetching groups:", error);
      toast.error("Failed to load groups");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-4">
      <Toaster position="top-center" />
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">My Groups</h1>
          <Link 
            href="/create-group"
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors"
          >
            Create New Group
          </Link>
        </div>

        {isLoading ? (
          <div className="text-center py-8">Loading groups...</div>
        ) : groups.length === 0 ? (
          <Card className="p-8">
            <div className="text-center text-gray-500">
              <p className="mb-4">No groups found</p>
              <Link 
                href="/create-group"
                className="text-blue-500 hover:text-blue-600"
              >
                Create your first group
              </Link>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {groups.map((group) => (
              <Link key={group.id} href={`/group/${group.id}`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <CardTitle className="text-xl">{group.name}</CardTitle>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
