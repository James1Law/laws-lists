"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, ArrowLeft, Plus, Trash2, Edit, Save, X, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Define types
type ListDetails = {
  id: string;
  title: string;
  group_id: string;
  created_at: string;
};

type Item = {
  id: string;
  content: string;
  bought: boolean;
  list_id: string;
  created_at: string;
  comment_count: number;
};

export default function ListPage() {
  const router = useRouter();
  const params = useParams();
  const groupId = params.id as string;
  const listId = params.listId as string;
  
  const [list, setList] = useState<ListDetails | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newItemContent, setNewItemContent] = useState("");
  const [isCreatingItem, setIsCreatingItem] = useState(false);
  
  // For list editing
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [newListTitle, setNewListTitle] = useState("");
  const [isUpdatingTitle, setIsUpdatingTitle] = useState(false);
  
  // For list deletion
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Wrap the functions in useCallback to avoid dependency issues
  const fetchListDetails = useCallback(async () => {
    try {
      const response = await fetch(`/api/groups/${groupId}/lists/${listId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch list details');
      }
      const data = await response.json();
      setList(data);
      setNewListTitle(data.title); // Initialize the edit title field
    } catch (error) {
      console.error("Error fetching list:", error);
      toast.error("Failed to load list details");
    }
  }, [groupId, listId]);

  // Fetch items for the list
  const fetchItems = useCallback(async () => {
    try {
      const response = await fetch(`/api/groups/${groupId}/lists/${listId}/items`);
      if (!response.ok) {
        throw new Error('Failed to fetch items');
      }
      const data = await response.json();
      setItems(data || []);
    } catch (error) {
      console.error("Error fetching items:", error);
      toast.error("Failed to load items");
    } finally {
      setIsLoading(false);
    }
  }, [groupId, listId]);

  // Handle updating list title
  const handleUpdateTitle = async () => {
    if (!newListTitle.trim()) {
      toast.error("List name cannot be empty");
      return;
    }
    
    setIsUpdatingTitle(true);
    
    try {
      const response = await fetch(`/api/groups/${groupId}/lists/${listId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: newListTitle }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update list name');
      }
      
      const updatedList = await response.json();
      
      // Update local state
      setList(updatedList);
      setIsEditingTitle(false);
      
      toast.success("List name updated");
    } catch (error: unknown) {
      console.error("Error updating list name:", error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to update list name");
      }
    } finally {
      setIsUpdatingTitle(false);
    }
  };
  
  // Handle list deletion
  const handleDeleteList = async () => {
    setIsDeleting(true);
    
    try {
      const response = await fetch(`/api/groups/${groupId}/lists/${listId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete list');
      }
      
      toast.success("List deleted successfully");
      
      // Navigate back to the group page
      router.push(`/group/${groupId}`);
    } catch (error: unknown) {
      console.error("Error deleting list:", error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to delete list");
      }
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  // Create a new item
  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemContent.trim()) {
      toast.error("Please enter an item");
      return;
    }
    
    setIsCreatingItem(true);
    
    try {
      const response = await fetch(`/api/groups/${groupId}/lists/${listId}/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: newItemContent }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create item');
      }
      
      const newItem = await response.json();
      
      // Add to local state
      setItems(prevItems => [newItem, ...prevItems]);
      setNewItemContent("");
      
      toast.success(`Item added`);
    } catch (error: unknown) {
      console.error("Error creating item:", error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to create item");
      }
    } finally {
      setIsCreatingItem(false);
    }
  };

  // Navigate to item detail page
  const navigateToItem = (item: Item) => {
    router.push(`/group/${groupId}/list/${listId}/item/${item.id}`);
  };

  useEffect(() => {
    // Check authentication status
    const auth = sessionStorage.getItem(`group_auth_${groupId}`);
    
    if (auth !== "true") {
      // Redirect to group auth page if not authenticated
      router.push(`/group/${groupId}`);
      return;
    }
    
    // Fetch list details and items
    fetchListDetails();
    fetchItems();
  }, [groupId, listId, router, fetchListDetails, fetchItems]);

  if (isLoading) {
    return (
      <div className="min-h-screen p-2 bg-background flex justify-center items-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
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
          onClick={() => router.push(`/group/${groupId}`)}
          className="w-full sm:w-auto flex items-center justify-center gap-1 mb-2 bg-white border-gray-200 text-gray-800 hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Back to Lists</span>
        </Button>
        
        {/* List Header */}
        <header className="flex justify-between items-center gap-2 border-b pb-2">
          <div className="flex-1 min-w-0">
            {isEditingTitle ? (
              <div className="flex items-center gap-1 flex-1">
                <Input
                  value={newListTitle}
                  onChange={(e) => setNewListTitle(e.target.value)}
                  className="h-8 text-base font-semibold"
                  placeholder="List name"
                  autoFocus
                />
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={handleUpdateTitle}
                  disabled={isUpdatingTitle}
                  className="h-7 w-7 p-1 text-green-600"
                >
                  {isUpdatingTitle ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save size={14} />}
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    setIsEditingTitle(false);
                    setNewListTitle(list?.title || "");
                  }}
                  className="h-7 w-7 p-1 text-red-600"
                >
                  <X size={14} />
                </Button>
              </div>
            ) : (
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <h1 className="text-xl font-bold truncate">{list?.title || 'Loading list...'}</h1>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setIsEditingTitle(true)}
                    className="h-7 w-7 p-1 text-gray-500"
                  >
                    <Edit size={12} />
                  </Button>
                </div>
              </div>
            )}
          </div>
          
          <Button 
            variant="destructive" 
            size="sm"
            onClick={() => setShowDeleteDialog(true)}
            className="h-7 shrink-0"
          >
            <Trash2 size={14} className="mr-1" />
            <span className="hidden sm:inline">Delete</span>
          </Button>
        </header>

        <div className="grid grid-cols-1 gap-3">
          {/* Compact Create Item Form */}
          <Card className="shadow-sm">
            <CardContent className="p-3">
              <form onSubmit={handleCreateItem} className="flex gap-2">
                <div className="flex-1">
                  <Input
                    id="itemContent"
                    value={newItemContent}
                    onChange={(e) => setNewItemContent(e.target.value)}
                    placeholder="Enter item name"
                    className="h-9"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isCreatingItem}
                  className="whitespace-nowrap h-9"
                >
                  {isCreatingItem ? (
                    <>
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                      <span className="hidden sm:inline">Adding...</span>
                    </>
                  ) : (
                    <>
                      <Plus size={14} className="mr-1" />
                      Add Item
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Items List */}
          <Card className="shadow-sm">
            <CardHeader className="p-3 pb-0">
              <div className="flex justify-between items-center">
                <CardTitle className="text-base">Items</CardTitle>
                <CardDescription className="text-xs mt-0">
                  {items.length === 0 ? "No items yet" : `${items.length} item${items.length === 1 ? '' : 's'}`}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-3 pt-2">
              <div className="space-y-1">
                {items.length === 0 ? (
                  <p className="text-center text-muted-foreground py-3 text-sm">No items yet</p>
                ) : (
                  items.map(item => (
                    <div 
                      key={item.id} 
                      className={`relative flex items-center justify-between p-3 rounded-md border text-sm hover:bg-accent/5 cursor-pointer transition-colors ${item.bought ? 'bg-green-50/50' : ''}`}
                      onClick={() => navigateToItem(item)}
                    >
                      <div className="flex items-center flex-1 min-w-0 gap-2">
                        <span 
                          className={`${item.bought ? "text-muted-foreground" : ""}`}
                          style={{ wordWrap: "break-word", overflowWrap: "break-word" }}
                        >
                          {item.content}
                        </span>
                        {item.bought && (
                          <span className="bg-green-100 text-green-800 text-xs px-1.5 py-0.5 rounded-md font-medium shrink-0">
                            Bought
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col items-end justify-between shrink-0 ml-2">
                        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                        {item.comment_count > 0 && (
                          <span className="text-xs text-gray-500 mt-1">
                            💬 {item.comment_count}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="max-w-[90vw] sm:max-w-lg p-4">
          <AlertDialogHeader className="space-y-1">
            <AlertDialogTitle className="text-base">Delete list?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              This will permanently delete the list &quot;{list?.title}&quot; and all items within it. 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-2">
            <AlertDialogCancel disabled={isDeleting} className="h-8 text-xs">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault();
                handleDeleteList();
              }}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 h-8 text-xs"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete List"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 