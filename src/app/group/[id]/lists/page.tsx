"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { prisma } from "@/lib/supabase";

// Define the List type
type List = {
  id: string;
  name: string;
  ownerName: string;
  groupId: string;
  createdAt: Date;
};

// Validate URL parameters
const ParamsSchema = z.object({
  id: z.string().uuid("Invalid group ID format")
});

export default function GroupListsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [group, setGroup] = useState<{ id: string; name: string; password: string } | null>(null);
  const [lists, setLists] = useState<List[]>([]);
  const [showCreateList, setShowCreateList] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch group data from database
  const fetchGroup = async (id: string) => {
    try {
      const group = await prisma.group.findUnique({
        where: { id }
      });
      
      if (!group) {
        throw new Error("Group not found");
      }
      
      return group;
    } catch (error: unknown) {
      console.error("Error fetching group:", error);
      if (error instanceof Error) {
        throw new Error(error.message);
      } else {
        throw new Error("Failed to fetch group");
      }
    }
  };

  // Fetch lists for this group
  const fetchLists = useCallback(async () => {
    try {
      const lists = await prisma.list.findMany({
        where: { groupId: params.id },
        orderBy: { createdAt: "desc" }
      });
      
      setLists(lists);
    } catch (error: unknown) {
      console.error("Error fetching lists:", error);
      if (error instanceof Error) {
        throw new Error(error.message);
      } else {
        throw new Error("Failed to fetch lists");
      }
    }
  }, [params.id]);

  // Validate params and check authentication when component mounts
  useEffect(() => {
    const validateAndAuth = async () => {
      setLoading(true);
      try {
        // Validate the group ID parameter
        const result = ParamsSchema.safeParse({ id: params.id });
        
        if (!result.success) {
          throw new Error("Invalid group ID format");
        }
        
        // Check if authenticated for this group
        const storedAuth = sessionStorage.getItem(`group_auth_${params.id}`);
        if (storedAuth !== "true") {
          // Redirect to password page if not authenticated
          router.push(`/group/${params.id}`);
          return;
        }
        
        // Fetch group data
        const groupData = await fetchGroup(params.id);
        setGroup(groupData);
        
        // Fetch lists for this group
        await fetchLists();
      } catch (error: unknown) {
        console.error("Error loading group or lists:", error);
        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError("Failed to load group or lists");
        }
      } finally {
        setLoading(false);
      }
    };
    
    validateAndAuth();
  }, [params.id, router, fetchLists]);

  // Create a new list
  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate inputs
    if (!newListName.trim()) {
      toast.error("List name is required");
      return;
    }
    
    if (!ownerName.trim()) {
      toast.error("Owner name is required");
      return;
    }
    
    setCreating(true);
    
    try {
      // Create new list in database
      const list = await prisma.list.create({
        data: {
          name: newListName.trim(),
          ownerName: ownerName.trim(),
          groupId: params.id
        }
      });
      
      // Update lists state
      setLists([list, ...lists]);
      
      // Reset form
      setNewListName("");
      setOwnerName("");
      setShowCreateList(false);
      
      toast.success("List created successfully");
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

  // Handle signing out
  const handleSignOut = () => {
    sessionStorage.removeItem(`group_auth_${params.id}`);
    router.push(`/group/${params.id}`);
  };

  // View a list
  const viewList = (listId: string) => {
    router.push(`/group/${params.id}/list/${listId}`);
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-500">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
            <Button 
              onClick={() => router.push("/")}
              className="mt-4 w-full"
            >
              Return Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render create list form
  const renderCreateListForm = () => (
    <Card className="mb-6">
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
              placeholder="Enter list name"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ownerName">Owner Name</Label>
            <Input
              id="ownerName"
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              placeholder="Enter your name"
              required
            />
          </div>
          <div className="flex space-x-2">
            <Button
              type="submit"
              disabled={creating}
            >
              {creating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create List"
              )}
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

  // Render lists
  const renderLists = () => (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {lists.length === 0 ? (
        <div className="md:col-span-2 lg:col-span-3 text-center py-12">
          <p className="text-gray-500">No lists available. Create your first list!</p>
        </div>
      ) : (
        lists.map(list => (
          <Card key={list.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle>{list.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">Created by: {list.ownerName}</p>
              <p className="text-sm text-gray-500">
                {new Date(list.createdAt).toLocaleDateString()}
              </p>
              <Button
                onClick={() => viewList(list.id)}
                className="mt-4 w-full"
              >
                View List
              </Button>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );

  // Main render
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">{group?.name}</h1>
          <Button variant="outline" onClick={handleSignOut}>
            Sign Out
          </Button>
        </div>

        <div className="mb-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Lists</h2>
            {!showCreateList && (
              <Button onClick={() => setShowCreateList(true)}>
                <Plus className="mr-2 h-4 w-4" />
                New List
              </Button>
            )}
          </div>
        </div>

        {showCreateList && renderCreateListForm()}
        {renderLists()}
      </div>
    </div>
  );
} 