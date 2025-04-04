"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Toaster, toast } from "sonner";
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import bcrypt from "bcryptjs";

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface List {
  id: string;
  title: string;
  created_at: string;
}

export default function GroupPage() {
  const params = useParams();
  const groupId = params.id as string;
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [groupName, setGroupName] = useState("");
  const [lists, setLists] = useState<List[]>([]);
  const [newListTitle, setNewListTitle] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    // Check localStorage for access
    const accessKey = `group_access_${groupId}`;
    const hasStoredAccess = localStorage.getItem(accessKey) === "true";
    setHasAccess(hasStoredAccess);

    if (hasStoredAccess) {
      fetchGroupDetails();
    } else {
      // Even if they don't have access, fetch the group name for display
      fetchGroupName();
    }
  }, [groupId]);

  const fetchGroupName = async () => {
    try {
      const { data, error } = await supabase
        .from("groups")
        .select("name")
        .eq("id", groupId)
        .single();

      if (error) throw error;
      setGroupName(data.name);
    } catch (error) {
      console.error("Error fetching group name:", error);
    }
  };

  const fetchGroupDetails = async () => {
    setIsLoading(true);
    try {
      // Fetch lists
      const { data: listsData, error: listsError } = await supabase
        .from("lists")
        .select("*")
        .eq("group_id", groupId)
        .order("created_at", { ascending: true });

      if (listsError) throw listsError;
      setLists(listsData || []);
    } catch (error) {
      console.error("Error fetching group details:", error);
      toast.error("Failed to load group details");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);

    try {
      // Fetch group data
      const { data: group, error } = await supabase
        .from("groups")
        .select("password_hash")
        .eq("id", groupId)
        .single();

      if (error) throw error;

      // Compare passwords
      const isPasswordCorrect = await bcrypt.compare(password, group.password_hash);

      if (isPasswordCorrect) {
        localStorage.setItem(`group_access_${groupId}`, "true");
        setHasAccess(true);
        fetchGroupDetails();
      } else {
        toast.error("Incorrect password");
      }
    } catch (error) {
      console.error("Error verifying password:", error);
      toast.error("Failed to verify password");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListTitle.trim()) return;

    try {
      const { data, error } = await supabase
        .from("lists")
        .insert([
          {
            title: newListTitle.trim(),
            group_id: groupId
          }
        ])
        .select()
        .single();

      if (error) throw error;

      setLists([...lists, data]);
      setNewListTitle("");
      toast.success("List created successfully");
    } catch (error) {
      console.error("Error creating list:", error);
      toast.error("Failed to create list");
    }
  };

  if (hasAccess === null) {
    return (
      <div className="min-h-screen p-4">
        <div className="max-w-2xl mx-auto">
          <div className="animate-pulse flex justify-center py-12">
            Loading...
          </div>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen p-4">
        <Toaster position="top-center" />
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <Link 
              href="/"
              className="text-blue-500 hover:text-blue-600 flex items-center space-x-2"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="20" 
                height="20" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              <span>Back to Groups</span>
            </Link>
          </div>

          <Card className="w-full">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-center">
                Enter Password for {groupName}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-12 text-base"
                    placeholder="Enter password"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full h-12 text-base"
                  disabled={isVerifying}
                >
                  {isVerifying ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Verifying...</span>
                    </div>
                  ) : (
                    "Unlock Group"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4">
      <Toaster position="top-center" />
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Link 
            href="/"
            className="text-blue-500 hover:text-blue-600 flex items-center space-x-2"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            <span>Back to Groups</span>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">{groupName}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateList} className="space-y-4">
              <div className="flex space-x-2">
                <Input
                  value={newListTitle}
                  onChange={(e) => setNewListTitle(e.target.value)}
                  placeholder="Enter list title"
                  className="h-12 text-base"
                />
                <Button
                  type="submit"
                  disabled={!newListTitle.trim()}
                  className="h-12"
                >
                  Create
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="text-center py-8">Loading lists...</div>
        ) : lists.length === 0 ? (
          <Card className="p-8">
            <div className="text-center text-gray-500">
              <p>No lists found. Create your first list above.</p>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {lists.map((list) => (
              <Link key={list.id} href={`/list/${list.id}`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <CardTitle className="text-xl">{list.title}</CardTitle>
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