"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { createSupabaseClient } from "@/lib/supabase";

interface Group {
  id: string;
  name: string;
  password: string;
  created_at: string;
}

export default function ManageGroupsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [groups, setGroups] = useState<Group[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if user is authenticated as admin
    const isAdmin = sessionStorage.getItem("adminAuthenticated") === "true";
    setIsAuthenticated(isAdmin);

    if (!isAdmin) {
      router.push("/admin");
      return;
    }

    // Fetch groups
    fetchGroups();
  }, [router]);

  const fetchGroups = async () => {
    setIsLoading(true);
    try {
      const supabase = createSupabaseClient();
      
      const { data, error } = await supabase
        .from("groups")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setGroups(data || []);
    } catch (error: unknown) {
      console.error("Error fetching groups:", error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to fetch groups");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteGroup = async (groupId: string, groupName: string) => {
    if (!confirm(`Are you sure you want to delete the group "${groupName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const supabase = createSupabaseClient();
      
      // Delete all related lists and items first
      // This assumes cascade delete is not set up in the database
      const { error: listsError } = await supabase
        .from("lists")
        .delete()
        .eq("group_id", groupId);

      if (listsError) throw listsError;

      // Delete the group
      const { error } = await supabase
        .from("groups")
        .delete()
        .eq("id", groupId);

      if (error) throw error;

      toast.success(`Group "${groupName}" deleted successfully`);
      
      // Refresh the list
      fetchGroups();
    } catch (error: unknown) {
      console.error("Error deleting group:", error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to delete group");
      }
    }
  };

  const copyGroupLink = (groupId: string, groupName: string) => {
    const groupLink = `${window.location.origin}/group/${groupId}`;
    navigator.clipboard.writeText(groupLink);
    toast.success(`Link for "${groupName}" copied to clipboard`);
  };

  if (!isAuthenticated) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen p-4 bg-gray-50">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Link
              href="/admin"
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
                className="mr-2"
              >
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-2xl font-bold">Manage Groups</h1>
          </div>
          <Button onClick={() => router.push("/admin/create-group")}>
            Create New Group
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Groups</CardTitle>
            <CardDescription>
              Manage all your groups and their access
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-4">Loading groups...</div>
            ) : groups.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-gray-500">No groups found</p>
                <Button 
                  onClick={() => router.push("/admin/create-group")}
                  className="mt-4"
                >
                  Create Your First Group
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {groups.map((group) => (
                  <div 
                    key={group.id} 
                    className="border rounded-md p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                  >
                    <div>
                      <h3 className="font-medium text-lg">{group.name}</h3>
                      <p className="text-sm text-gray-500">
                        Password: {group.password}
                      </p>
                      <p className="text-xs text-gray-400">
                        Created: {new Date(group.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline" 
                        size="sm"
                        onClick={() => copyGroupLink(group.id, group.name)}
                      >
                        Copy Link
                      </Button>
                      <Button
                        variant="outline" 
                        size="sm"
                        onClick={() => router.push(`/group/${group.id}`)}
                      >
                        View
                      </Button>
                      <Button
                        variant="destructive" 
                        size="sm"
                        onClick={() => handleDeleteGroup(group.id, group.name)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 