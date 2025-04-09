"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, Eye, ArrowRight } from "lucide-react";
import { z } from "zod";
import Link from "next/link";
import { useRouter } from "next/navigation";

const GroupSchema = z.object({
  name: z.string().min(3, "Group name must be at least 3 characters"),
  password: z.string().min(4, "Password must be at least 4 characters")
});

type Group = {
  id: string;
  name: string;
  created_at: string;
};

export default function AdminPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupPassword, setGroupPassword] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const fetchGroups = async () => {
    setIsLoadingGroups(true);
    try {
      const response = await fetch('/api/groups');
      if (!response.ok) {
        throw new Error('Failed to fetch groups');
      }
      const data = await response.json();
      setGroups(data);
    } catch (error: unknown) {
      console.error("Error fetching groups:", error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to fetch groups");
      }
    } finally {
      setIsLoadingGroups(false);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    
    try {
      // Get admin password from environment variable
      const correctPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;
      
      if (!correctPassword) {
        throw new Error("Admin password not configured");
      }
      
      if (adminPassword !== correctPassword) {
        setError("Incorrect password");
        return;
      }
      
      // Store authentication in session
      sessionStorage.setItem("admin_auth", "true");
      setIsAuthenticated(true);
      toast.success("Admin authentication successful");
      
      // Fetch groups after successful login
      fetchGroups();
    } catch (error: unknown) {
      console.error("Authentication error:", error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Authentication failed");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    
    try {
      // Validate input
      const validationResult = GroupSchema.safeParse({
        name: groupName,
        password: groupPassword
      });
      
      if (!validationResult.success) {
        const errorMessage = validationResult.error.issues[0]?.message || "Invalid input";
        throw new Error(errorMessage);
      }
      
      // Instead of directly using Prisma, make an API call
      const response = await fetch('/api/groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: groupName,
          password_hash: groupPassword, // Update field name to match API
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create group');
      }
      
      const group = await response.json();
      
      toast.success(`Group "${groupName}" created successfully`);
      setGroupName("");
      setGroupPassword("");
      
      // Refresh the list of groups
      fetchGroups();
      
      // Navigate to the group page
      router.push(`/group/${group.id}`);
    } catch (error: unknown) {
      console.error("Error creating group:", error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to create group");
      }
    } finally {
      setIsCreating(false);
    }
  };

  useEffect(() => {
    // Check for admin authentication
    const auth = sessionStorage.getItem("admin_auth");
    if (auth === "true") {
      setIsAuthenticated(true);
      // Fetch groups if authenticated
      fetchGroups();
    }
  }, []);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen p-4 bg-background flex justify-center items-center">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl font-bold text-center">Admin Authentication</CardTitle>
            <CardDescription className="text-center">
              Enter your admin password to manage groups
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="adminPassword">Admin Password</Label>
                <Input
                  id="adminPassword"
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Enter admin password"
                  className="input-enhanced"
                  required
                />
                {error && <p className="text-sm text-destructive">{error}</p>}
              </div>
              <Button
                type="submit"
                className="w-full btn-primary"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Login"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 bg-background">
      <div className="max-w-6xl mx-auto space-y-8 py-8">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage your groups and lists</p>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Create Group Card */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus size={18} className="text-primary" />
                Create New Group
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateGroup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="groupName">Group Name</Label>
                  <Input
                    id="groupName"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder="Enter group name"
                    className="input-enhanced"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="groupPassword">Group Password</Label>
                  <Input
                    id="groupPassword"
                    type="password"
                    value={groupPassword}
                    onChange={(e) => setGroupPassword(e.target.value)}
                    placeholder="Enter group password"
                    className="input-enhanced"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    This password will be used by members to access the group
                  </p>
                </div>
                <Button
                  type="submit"
                  className="w-full btn-primary"
                  disabled={isCreating}
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Group"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Existing Groups Card */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye size={18} className="text-primary" />
                Existing Groups
              </CardTitle>
              <CardDescription>
                Select a group to view and manage
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingGroups ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : groups.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No groups created yet. Create your first group!
                </div>
              ) : (
                <ul className="space-y-2">
                  {groups.map((group) => (
                    <li key={group.id}>
                      <Link href={`/group/${group.id}`}>
                        <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-secondary/50 transition-colors">
                          <div>
                            <p className="font-medium">{group.name}</p>
                            <p className="text-xs text-muted-foreground">
                              Created: {new Date(group.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <ArrowRight size={16} className="text-primary" />
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
              <Button 
                className="w-full mt-4"
                variant="outline"
                onClick={fetchGroups}
                disabled={isLoadingGroups}
              >
                {isLoadingGroups ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Refreshing...
                  </>
                ) : (
                  "Refresh Groups"
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 