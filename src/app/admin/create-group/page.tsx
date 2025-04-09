"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { createSupabaseClient } from "@/lib/supabase-client";

export default function CreateGroupPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupPassword, setGroupPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if user is authenticated as admin
    const isAdmin = sessionStorage.getItem("adminAuthenticated") === "true";
    setIsAuthenticated(isAdmin);

    if (!isAdmin) {
      router.push("/admin");
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const supabase = createSupabaseClient();
      
      // Create new group with password
      const { data, error } = await supabase
        .from("groups")
        .insert([
          {
            name: groupName,
            password: groupPassword, // Storing as plain text for simplicity
          },
        ])
        .select();

      if (error) throw error;

      toast.success(`Group "${groupName}" created successfully`);
      
      // Show the share link for the new group
      if (data && data.length > 0) {
        const groupId = data[0].id;
        toast.success(`Group URL: ${window.location.origin}/group/${groupId}`, {
          description: "Share this link with others to access this group",
          duration: 8000,
        });
      }

      // Reset form
      setGroupName("");
      setGroupPassword("");
    } catch (error: unknown) {
      console.error("Error creating group:", error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to create group");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen p-4 bg-gray-50">
      <div className="max-w-md mx-auto space-y-6">
        <div className="flex items-center mb-6">
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
          <h1 className="text-2xl font-bold">Create New Group</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>New Group Details</CardTitle>
            <CardDescription>
              Create a new group with a password for restricted access
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="groupName">Group Name</Label>
                <Input
                  id="groupName"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="e.g. Christmas 2025"
                  required
                  className="h-12 text-base"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="groupPassword">Group Password</Label>
                <Input
                  id="groupPassword"
                  type="text" // Making it text so admin can see the password (for simplicity)
                  value={groupPassword}
                  onChange={(e) => setGroupPassword(e.target.value)}
                  placeholder="e.g. family2025"
                  required
                  className="h-12 text-base"
                />
                <p className="text-xs text-gray-500">
                  This password will be used by others to access the group
                </p>
              </div>
              <Button
                type="submit"
                className="w-full h-12 text-base"
                disabled={isLoading}
              >
                {isLoading ? "Creating..." : "Create Group"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 