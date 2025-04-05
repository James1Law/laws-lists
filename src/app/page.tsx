"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
  const [editingGroup, setEditingGroup] = useState<string | null>(null);
  const [editGroupName, setEditGroupName] = useState("");

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

  const handleStartEdit = (group: Group) => {
    setEditingGroup(group.id);
    setEditGroupName(group.name);
  };

  const handleSaveEdit = async () => {
    if (!editingGroup || !editGroupName.trim()) return;

    try {
      const { error } = await supabase
        .from("groups")
        .update({ name: editGroupName.trim() })
        .eq("id", editingGroup);

      if (error) throw error;

      setGroups(groups.map(group =>
        group.id === editingGroup
          ? { ...group, name: editGroupName.trim() }
          : group
      ));
      setEditingGroup(null);
      setEditGroupName("");
      toast.success("Group name updated successfully");
    } catch (error) {
      console.error("Error updating group name:", error);
      toast.error("Failed to update group name");
    }
  };

  return (
    <div className="min-h-screen p-4">
      <Toaster position="top-center" />
      <div className="max-w-2xl mx-auto space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold">My Groups</h1>
          <Link 
            href="/create-group"
            className="bg-blue-500 hover:bg-blue-600 text-white h-8 px-3 text-sm rounded-md transition-colors inline-flex items-center"
          >
            Create New Group
          </Link>
        </div>

        {isLoading ? (
          <div className="text-center py-2 text-sm text-gray-500">Loading groups...</div>
        ) : groups.length === 0 ? (
          <div className="bg-white rounded-lg border shadow-sm p-8">
            <div className="text-center text-gray-500">
              <p className="mb-4">No groups found</p>
              <Link 
                href="/create-group"
                className="text-blue-500 hover:text-blue-600"
              >
                Create your first group
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {groups.map((group) => (
              <div 
                key={group.id}
                className="bg-white rounded-lg border shadow-sm"
              >
                {editingGroup === group.id ? (
                  <div className="flex items-center gap-2 p-2">
                    <Input
                      value={editGroupName}
                      onChange={(e) => setEditGroupName(e.target.value)}
                      className="h-8 text-sm flex-1"
                    />
                    <div className="flex gap-1 shrink-0">
                      <Button
                        onClick={handleSaveEdit}
                        className="h-8 px-3 text-sm"
                      >
                        Save
                      </Button>
                      <Button
                        onClick={() => setEditingGroup(null)}
                        variant="outline"
                        className="h-8 px-3 text-sm"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-2">
                    <Link 
                      href={`/group/${group.id}`}
                      className="flex-1 min-w-0"
                    >
                      <span className="text-sm font-medium block truncate">
                        {group.name}
                      </span>
                    </Link>
                    <div className="flex gap-1 ml-2 shrink-0">
                      <Button
                        onClick={() => handleStartEdit(group)}
                        variant="outline"
                        className="h-7 px-2 text-xs min-w-[48px]"
                      >
                        Edit
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
