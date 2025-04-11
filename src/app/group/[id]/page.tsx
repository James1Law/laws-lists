"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, ArrowLeft, LogOut, Lock, ChevronRight, GripVertical, Check, Copy } from "lucide-react";
import { toast } from "sonner";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";

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
  position: number | null;
  totalItems?: number;
  boughtItems?: number;
};

// Sortable list item component
function SortableListItem({ list, onClick }: { list: List, onClick: () => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ 
    id: list.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
  };

  // Calculate totals with fallbacks for older data that might not have the counts
  const totalItems = list.totalItems ?? 0;
  const boughtItems = list.boughtItems ?? 0;

  return (
    <div
      style={style}
      className={cn(
        "transition-colors",
        isDragging && "opacity-70"
      )}
    >
      <Card className="relative hover:bg-accent/5 transition-colors border-muted overflow-hidden">
        {/* Drag handle with increased size */}
        <div
          ref={setNodeRef}
          {...attributes}
          {...listeners}
          className="absolute top-1/2 left-1.5 -translate-y-1/2 cursor-grab active:cursor-grabbing p-1.5 h-8 w-8 rounded-md hover:bg-accent/10 flex items-center justify-center z-10"
          style={{ touchAction: 'none' }}
          title="Drag to reorder"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
        
        {/* Optimized single-row layout */}
        <div 
          className="flex items-center pl-10 pr-2 py-2.5 cursor-pointer min-h-[44px]" 
          onClick={onClick}
        >
          {/* List title - left aligned, truncated if needed */}
          <div className="flex-1 min-w-0 mr-3">
            <h3 className="font-medium text-sm truncate">{list.title}</h3>
          </div>
          
          {/* Counter and chevron in one group - right aligned */}
          <div className="flex items-center gap-2 text-muted-foreground shrink-0">
            {/* Progress counter */}
            <div className="text-xs flex items-center whitespace-nowrap">
              <span>{boughtItems} / {totalItems} bought</span>
              <span className="text-green-500 ml-1 inline-flex items-center">
                <Check className="h-3 w-3" />
              </span>
            </div>
            
            {/* Chevron indicator */}
            <ChevronRight className="h-3.5 w-3.5" />
          </div>
        </div>
      </Card>
    </div>
  );
}

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
  const [isSavingOrder, setIsSavingOrder] = useState(false);

  // Set up dnd-kit sensors with stricter activation constraints
  const sensors = useSensors(
    useSensor(PointerSensor, {
      // Only activate with more deliberate drag gestures
      activationConstraint: {
        distance: 10, // Require more movement to start drag
        tolerance: 5,
        delay: 250, // Longer delay to prevent accidental drags
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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

  // Handle drag end event for reordering
  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;
    
    // Track the updated lists to use for the API call
    let updatedListsForApi: { id: string; position: number }[] = [];
    
    // Optimistically update the UI
    setLists((prevItems) => {
      const oldIndex = prevItems.findIndex((item) => item.id === active.id);
      const newIndex = prevItems.findIndex((item) => item.id === over.id);
      
      if (oldIndex === -1 || newIndex === -1) return prevItems;
      
      // Create a new array with the item moved to the new position
      const newItems = arrayMove(prevItems, oldIndex, newIndex);
      
      // Update positions based on new order
      const itemsWithNewPositions = newItems.map((item, index) => ({
        ...item,
        position: index,
      }));
      
      // Store the updated list data for the API call
      updatedListsForApi = itemsWithNewPositions.map(item => ({
        id: item.id,
        position: item.position,
      }));
      
      return itemsWithNewPositions;
    });

    // Save the new order to the database
    setIsSavingOrder(true);
    try {
      const response = await fetch(`/api/groups/${params.id}/lists`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lists: updatedListsForApi,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update list order');
      }
      
      // Update was successful - no need to show a toast for a common action
    } catch (error) {
      console.error("Error updating list order:", error);
      toast.error("Failed to save list order");
      // If there's an error, refresh the lists from the server
      fetchLists();
    } finally {
      setIsSavingOrder(false);
    }
  }, [params.id, fetchLists]);

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

  // Navigate to a list
  const navigateToList = (listId: string) => {
    router.push(`/group/${params.id}/list/${listId}`);
  };

  // Copy the current URL to clipboard
  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url)
      .then(() => {
        toast.success("Link copied to clipboard");
      })
      .catch((error) => {
        console.error("Failed to copy link:", error);
        toast.error("Failed to copy link");
      });
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
          <CardContent className="p-3">
            <Button 
              variant="outline" 
              size="default" 
              onClick={() => router.push("/")}
              className="w-full mb-4 flex items-center justify-center gap-1 bg-white border-gray-200 text-gray-800 hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft size={16} />
              <span>Back to Groups</span>
            </Button>
            
            <div className="mb-4">
              <h2 className="text-xl font-bold mb-1">
                {group ? group.name : 'Loading group...'}
              </h2>
              <p className="text-xs text-muted-foreground">
                Enter the group password to access
              </p>
            </div>
            
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
        {/* Back button - more prominent and positioned above the header */}
        <Button 
          variant="outline" 
          size="default" 
          onClick={() => router.push("/")}
          className="w-full sm:w-auto flex items-center justify-center gap-1 mb-2 bg-white border-gray-200 text-gray-800 hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Back to Groups</span>
        </Button>
        
        {/* Group Header */}
        <header className="flex justify-between items-center gap-2 border-b pb-2">
          <div>
            <h1 className="text-xl font-bold line-clamp-1">
              {group?.name || 'Loading...'}
            </h1>
            <p className="text-xs text-muted-foreground">
              Manage your lists
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopyLink}
              className="h-8 text-xs"
            >
              <Copy className="h-3 w-3 mr-1" />
              Copy Link
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="h-8 text-xs"
            >
              <LogOut className="h-3 w-3 mr-1" />
              Logout
            </Button>
          </div>
        </header>
        
        {/* Create new list form in a card */}
        <div className="grid grid-cols-1 gap-3">
          <Card className="shadow-sm">
            <CardContent className="p-3">
              <form onSubmit={handleCreateList} className="flex gap-2">
                <div className="flex-1">
                  <Input
                    type="text"
                    placeholder="Enter list name"
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    className="h-9"
                  />
                </div>
                <Button 
                  type="submit"
                  size="sm"
                  disabled={isCreatingList}
                  className="h-9"
                >
                  {isCreatingList ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-1" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-1" />
                      Add List
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
          
          {/* Group lists section */}
          <div className="space-y-2">
            <h2 className="text-sm font-medium flex items-center gap-1.5">
              {isSavingOrder && 
                <div className="flex items-center gap-1 text-xs text-amber-600">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>Saving...</span>
                </div>
              }
              {!isSavingOrder &&
                <span className="text-xs text-green-600">
                  ✓ Use the <GripVertical className="inline h-3 w-3 mx-0.5" /> handle to reorder lists
                </span>
              }
            </h2>
            
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : lists.length === 0 ? (
              <div className="bg-muted/30 rounded-md p-8 text-center">
                <p className="text-sm text-muted-foreground">
                  No lists yet. Create your first list above.
                </p>
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext 
                  items={lists.map(list => list.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="grid gap-2">
                    {lists.map((list) => (
                      <SortableListItem
                        key={list.id}
                        list={list}
                        onClick={() => navigateToList(list.id)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}