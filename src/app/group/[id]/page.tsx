"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, List, ArrowLeft, LogOut, Lock } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

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

  // Fetch group details
  const fetchGroupDetails = async () => {
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
  };

  // Fetch lists for the group
  const fetchLists = async () => {
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
  };

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
  }, [params.id]);

  // Authentication screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen p-4 bg-background flex justify-center items-center">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => router.push("/")}
                className="h-8 w-8"
              >
                <ArrowLeft size={18} />
              </Button>
              <span className="text-sm text-muted-foreground">Back to Home</span>
            </div>
            <CardTitle className="text-2xl font-bold">
              {group ? group.name : 'Loading group...'}
            </CardTitle>
            <CardDescription>
              Enter the group password to access
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAuthenticate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Group Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter group password"
                    className="input-enhanced pl-10"
                    required
                  />
                </div>
                {authError && <p className="text-sm text-destructive">{authError}</p>}
              </div>
              <Button
                type="submit"
                className="w-full btn-primary"
                disabled={isAuthenticating}
              >
                {isAuthenticating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
    <div className="min-h-screen p-4 bg-background">
      <div className="max-w-6xl mx-auto space-y-8 py-4">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => router.push("/admin")}
              className="h-8 w-8"
            >
              <ArrowLeft size={18} />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{group?.name}</h1>
              <p className="text-sm text-muted-foreground">
                Manage your lists and gift items
              </p>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleLogout}
            className="flex items-center gap-1"
          >
            <LogOut size={14} />
            Log out
          </Button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Create List Form */}
          <Card className="shadow-md md:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Plus size={18} className="text-primary" />
                Create New List
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateList} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="listName">List Name</Label>
                  <Input
                    id="listName"
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    placeholder="e.g. Christmas 2025"
                    className="input-enhanced"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full btn-primary"
                  disabled={isCreatingList}
                >
                  {isCreatingList ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create List"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Lists */}
          <div className="md:col-span-2">
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <List size={18} className="text-primary" />
                  Your Lists
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : lists.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No lists created yet. Create your first list!
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {lists.map((list) => (
                      <Link key={list.id} href={`/group/${params.id}/list/${list.id}`}>
                        <Card className="cursor-pointer hover:border-primary/50 transition-colors">
                          <CardContent className="p-4">
                            <h3 className="font-medium text-lg">{list.title}</h3>
                            <p className="text-xs text-muted-foreground mt-1">
                              Created: {new Date(list.created_at).toLocaleDateString()}
                            </p>
                          </CardContent>
                          <CardFooter className="pt-0 pb-4 px-4">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-primary px-0 h-auto font-normal text-sm"
                            >
                              View List
                              <ArrowLeft size={14} className="ml-1 rotate-180" />
                            </Button>
                          </CardFooter>
                        </Card>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}