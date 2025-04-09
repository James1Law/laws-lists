"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { createSupabaseClient } from "@/lib/supabase";

interface Group {
  id: string;
  name: string;
  password: string;
  created_at: string;
}

interface List {
  id: string;
  name: string;
  owner_name: string;
  created_at: string;
}

export default function GroupPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [group, setGroup] = useState<Group | null>(null);
  const [lists, setLists] = useState<List[]>([]);
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showCreateList, setShowCreateList] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    // Check if authenticated through session storage
    const storedAuth = sessionStorage.getItem(`group_${params.id}_auth`);
    if (storedAuth === "true") {
      setIsAuthenticated(true);
    }
    
    fetchGroup();
  }, [params.id]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchLists();
    }
  }, [isAuthenticated, params.id]);

  const fetchGroup = async () => {
    try {
      const supabase = createSupabaseClient();
      
      const { data, error } = await supabase
        .from("groups")
        .select("id, name, password, created_at")
        .eq("id", params.id)
        .single();

      if (error) throw error;
      
      setGroup(data);
    } catch (error: unknown) {
      console.error("Error fetching group:", error);
      toast.error("Group not found");
      router.push("/");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLists = async () => {
    try {
      const supabase = createSupabaseClient();
      
      const { data, error } = await supabase
        .from("lists")
        .select("id, name, owner_name, created_at")
        .eq("group_id", params.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      setLists(data || []);
    } catch (error: unknown) {
      console.error("Error fetching lists:", error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to load lists");
      }
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (group && password === group.password) {
      // Store authentication in session storage
      sessionStorage.setItem(`group_${params.id}_auth`, "true");
      setIsAuthenticated(true);
      toast.success("Access granted!");
    } else {
      toast.error("Incorrect password");
    }
  };

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    
    try {
      const supabase = createSupabaseClient();
      
      const { error } = await supabase
        .from("lists")
        .insert([
          {
            group_id: params.id,
            name: newListName,
            owner_name: ownerName,
          },
        ]);

      if (error) throw error;

      toast.success("List created successfully");
      setNewListName("");
      setOwnerName("");
      setShowCreateList(false);
      fetchLists();
    } catch (error: unknown) {
      console.error("Error creating list:", error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to create list");
      }
    } finally {
      setCreating(false);
    }
  };

  const renderPasswordForm = () => (
    <Card>
      <CardHeader>
        <CardTitle>Password Required</CardTitle>
        <CardDescription>
          Enter the password to access this group
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">Group Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
              className="h-12 text-base"
            />
          </div>
          <Button
            type="submit"
            className="w-full h-12 text-base"
          >
            Enter Group
          </Button>
        </form>
      </CardContent>
    </Card>
  );

  const renderCreateListForm = () => (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>Create New List</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleCreateList} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="listName">List Name</Label>
            <Input
              id="listName"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              placeholder="e.g. John's Wishlist"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ownerName">Your Name</Label>
            <Input
              id="ownerName"
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              placeholder="e.g. John"
              required
            />
            <p className="text-xs text-gray-500">
              As the list creator, you won't see who bought which items
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              type="submit"
              disabled={creating}
            >
              {creating ? "Creating..." : "Create List"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowCreateList(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );

  const renderLists = () => (
    <div className="space-y-4">
      {lists.length === 0 ? (
        <div className="text-center p-6 border rounded-md">
          <p className="text-gray-500 mb-4">No lists in this group yet</p>
          <Button onClick={() => setShowCreateList(true)}>
            Create Your First List
          </Button>
        </div>
      ) : (
        lists.map((list) => (
          <Card key={list.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                <div>
                  <h3 className="font-medium text-lg">{list.name}</h3>
                  <p className="text-sm text-gray-500">
                    Created by {list.owner_name}
                  </p>
                </div>
                <Button 
                  className="mt-2 md:mt-0" 
                  onClick={() => router.push(`/list/${list.id}`)}
                >
                  View List
                </Button>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen p-4 bg-gray-50">
        <div className="max-w-xl mx-auto text-center py-12">
          Loading...
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen p-4 bg-gray-50">
        <div className="max-w-xl mx-auto text-center py-12">
          <h1 className="text-2xl font-bold mb-4">Group not found</h1>
          <Button onClick={() => router.push("/")}>
            Return to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 bg-gray-50">
      <div className="max-w-xl mx-auto space-y-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-gray-500 hover:text-gray-700"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-2xl font-bold">{group.name}</h1>
          </div>
        </div>

        {!isAuthenticated ? (
          renderPasswordForm()
        ) : (
          <>
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Lists</h2>
              {!showCreateList && (
                <Button onClick={() => setShowCreateList(true)}>
                  Create New List
                </Button>
              )}
            </div>

            {showCreateList && renderCreateListForm()}
            {renderLists()}
          </>
        )}
      </div>
    </div>
  );
} 