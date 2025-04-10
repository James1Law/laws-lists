"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, List, ArrowLeft, LogOut, Lock, ChevronRight } from "lucide-react";
import { toast } from "sonner";

type GroupDetails = {
  id: string;
  name: string;
  created_at: string;
};

type List = {
  id: string;
  title: string;
  created_at: string;
  group_id: string;
};

export default function GroupPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [group, setGroup] = useState<GroupDetails | null>(null);
  const [lists, setLists] = useState<List[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState("");
  const [newListName, setNewListName] = useState("");
  const [isCreatingList, setIsCreatingList] = useState(false);

  // Wrap the functions in useCallback to avoid dependency issues
  const fetchGroupDetails = useCallback(async () => {
    try {
      const response = await fetch(`/api/groups/${params.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch group details');
      }
      const data = await response.json();
      setGroup(data);
    } catch (error) {
      console.error("Error fetching group:", error);
      toast.error("Failed to load group details");
    }
  }, [params.id]);

  // Fetch lists for the group
  const fetchLists = useCallback(async () => {
    try {
      const response = await fetch(`/api/groups/${params.id}/lists`);
      if (!response.ok) {
        throw new Error('Failed to fetch lists');
      }
      const data = await response.json();
      setLists(data);
    } catch (error) {
      console.error("Error fetching lists:", error);
      toast.error("Failed to load lists");
    } finally {
      setIsLoading(false);
    }
  }, [params.id]);

  // Handle authentication
  const handleAuthenticate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthenticating(true);
    setAuthError("");
    
    try {
      const response = await fetch(`/api/groups/${params.id}/auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Authentication failed');
      }
      
      // Store in session storage
      sessionStorage.setItem(`group_auth_${params.id}`, "true");
      setIsAuthenticated(true);
      
      // Fetch lists after authentication
      fetchLists();
      
      toast.success("Group access granted");
    } catch (error: unknown) {
      console.error("Authentication error:", error);
      if (error instanceof Error) {
        setAuthError(error.message);
      } else {
        setAuthError("Authentication failed");
      }
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Create a new list
  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListName.trim()) {
      toast.error("Please enter a list name");
      return;
    }
    
    setIsCreatingList(true);
    
    try {
      const response = await fetch(`/api/groups/${params.id}/lists`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newListName }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create list');
      }
      
      const newList = await response.json();
      
      // Add to local state
      setLists(prevLists => [newList, ...prevLists]);
      setNewListName("");
      
      toast.success(`List "${newListName}" created`);
    } catch (error: unknown) {
      console.error("Error creating list:", error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to create list");
      }
    } finally {
      setIsCreatingList(false);
    }
  };

  // Logout from group
  const handleLogout = () => {
    sessionStorage.removeItem(`group_auth_${params.id}`);
    setIsAuthenticated(false);
    toast.info("Logged out from group");
  };

  useEffect(() => {
    // Check if the user is authenticated
    const auth = sessionStorage.getItem(`group_auth_${params.id}`);
    
    // Fetch group details
    fetchGroupDetails();
    
    if (auth === "true") {
      setIsAuthenticated(true);
      fetchLists();
    } else {
      setIsLoading(false);
    }
  }, [params.id, fetchGroupDetails, fetchLists]);

  // Authentication screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen p-2 sm:p-4 bg-background flex justify-center items-center">
        <Card className="w-full max-w-sm shadow-sm">
          <CardHeader className="space-y-1 p-3">
            <div className="flex items-center gap-1 mb-1">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => router.push("/")}
                className="h-7 w-7 p-0"
              >
                <ArrowLeft size={16} />
              </Button>
              <span className="text-xs text-muted-foreground">Back to Home</span>
            </div>
            <CardTitle className="text-xl font-bold">
              {group ? group.name : 'Loading group...'}
            </CardTitle>
            <CardDescription className="text-xs">
              Enter the group password to access
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <form onSubmit={handleAuthenticate} className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="password" className="text-sm">Group Password</Label>
                <div className="relative">
                  <Lock className="absolute left-2 top-2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="pl-8 h-8 text-sm"
                    required
                  />
                </div>
                {authError && <p className="text-xs text-destructive">{authError}</p>}
              </div>
              <Button
                type="submit"
                className="w-full h-8 text-sm"
                disabled={isAuthenticating}
              >
                {isAuthenticating ? (
                  <>
                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Access Group"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-2 sm:p-4 bg-background">
      <div className="max-w-4xl mx-auto space-y-4">
        <header className="flex justify-between items-center gap-2 border-b pb-2">
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => router.push("/")}
              className="h-7 w-7 p-0"
            >
              <ArrowLeft size={16} />
            </Button>
            <div>
              <h1 className="text-xl font-bold truncate">{group?.name || 'Loading group...'}</h1>
              <p className="text-xs text-muted-foreground">
                Manage your lists and gift items
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="h-7 px-2"
          >
            <LogOut size={14} className="mr-1" />
            <span className="text-xs">Log out</span>
          </Button>
        </header>

        <div className="grid grid-cols-1 gap-3">
          {/* Create List Form - More Compact */}
          <Card className="shadow-sm">
            <CardContent className="p-2">
              <form onSubmit={handleCreateList} className="flex flex-col sm:flex-row gap-1.5">
                <div className="flex-1">
                  <div className="flex items-center mb-1 sm:hidden">
                    <Plus size={14} className="text-primary mr-1" />
                    <span className="text-sm font-medium">Create New List</span>
                  </div>
                  <div className="relative">
                    <Input
                      value={newListName}
                      onChange={(e) => setNewListName(e.target.value)}
                      placeholder="e.g. Christmas 2025"
                      className="h-8 text-sm pl-7 sm:pl-2"
                      required
                    />
                    <Plus size={14} className="absolute left-2 top-2 text-muted-foreground sm:hidden" />
                  </div>
                </div>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isCreatingList}
                  className="whitespace-nowrap h-8"
                >
                  {isCreatingList ? (
                    <>
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                      <span className="hidden sm:inline">Creating...</span>
                    </>
                  ) : (
                    'Create'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Lists */}
          <Card className="shadow-sm">
            <CardHeader className="p-3 pb-0">
              <div className="flex justify-between items-center">
                <CardTitle className="text-base flex items-center gap-1">
                  <List size={16} className="text-primary" />
                  Your Lists
                </CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={fetchLists}
                  className="h-7 px-2"
                >
                  <span className="text-xs">Refresh</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-3 pt-2">
              {isLoading ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : lists.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-sm text-muted-foreground">No lists created yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Create your first list above</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {lists.map((list) => (
                    <div
                      key={list.id}
                      className="border rounded-md p-3 hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => router.push(`/group/${params.id}/list/${list.id}`)}
                    >
                      <div className="flex justify-between items-center">
                        <div className="min-w-0">
                          <h3 className="font-medium text-sm truncate">{list.title}</h3>
                          <p className="text-xs text-muted-foreground">
                            Created: {new Date(list.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <ChevronRight size={16} className="text-muted-foreground shrink-0" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}