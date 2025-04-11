"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ArrowLeft, Trash2, Edit, Save, X } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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
import { format } from "date-fns";

// Define types
type Item = {
  id: string;
  content: string;
  bought: boolean;
  list_id: string;
  created_at: string;
};

type Comment = {
  id: string;
  content: string;
  created_at: string;
};

export default function ItemPage() {
  const router = useRouter();
  const params = useParams();
  const groupId = params.id as string;
  const listId = params.listId as string;
  const itemId = params.itemId as string;
  
  const [item, setItem] = useState<Item | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [isAddingComment, setIsAddingComment] = useState(false);
  
  // For item name editing
  const [isEditingName, setIsEditingName] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [isUpdatingName, setIsUpdatingName] = useState(false);
  
  // For item deletion
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch item details
  const fetchItem = useCallback(async () => {
    try {
      const response = await fetch(`/api/groups/${groupId}/lists/${listId}/items/${itemId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch item details');
      }
      const data = await response.json();
      setItem(data);
      setNewItemName(data.content); // Initialize the edit name field
    } catch (error) {
      console.error("Error fetching item:", error);
      toast.error("Failed to load item details");
      router.push(`/group/${groupId}/list/${listId}`);
    } finally {
      setIsLoading(false);
    }
  }, [groupId, listId, itemId, router]);

  // Fetch comments for the item
  const fetchComments = useCallback(async () => {
    setIsLoadingComments(true);
    try {
      const response = await fetch(`/api/groups/${groupId}/lists/${listId}/items/${itemId}/comments`);
      if (!response.ok) {
        throw new Error('Failed to fetch comments');
      }
      const data = await response.json();
      setComments(data);
    } catch (error) {
      console.error("Error fetching comments:", error);
      toast.error("Failed to load comments");
    } finally {
      setIsLoadingComments(false);
    }
  }, [groupId, listId, itemId]);

  // Toggle item bought status
  const toggleItemCompletion = async () => {
    if (!item) return;
    
    const currentState = item.bought;
    
    // Optimistically update UI
    setItem({
      ...item,
      bought: !currentState
    });
    
    try {
      const response = await fetch(`/api/groups/${groupId}/lists/${listId}/items/${itemId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bought: !currentState }),
      });
      
      if (!response.ok) {
        // If error, revert the change
        setItem({
          ...item,
          bought: currentState
        });
        
        throw new Error('Failed to update item');
      }
      
      toast.success(currentState ? 'Item marked as not bought' : 'Item marked as bought');
    } catch (error) {
      console.error("Error toggling item status:", error);
      toast.error("Failed to update item");
    }
  };

  // Update item name
  const handleUpdateName = async () => {
    if (!newItemName.trim()) {
      toast.error("Item name cannot be empty");
      return;
    }
    
    if (!item) return;
    
    setIsUpdatingName(true);
    
    try {
      const response = await fetch(`/api/groups/${groupId}/lists/${listId}/items/${itemId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: newItemName }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update item name');
      }
      
      const updatedItem = await response.json();
      
      // Update local state
      setItem(updatedItem);
      setIsEditingName(false);
      
      toast.success("Item name updated");
    } catch (error: unknown) {
      console.error("Error updating item name:", error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to update item name");
      }
    } finally {
      setIsUpdatingName(false);
    }
  };

  // Delete the item
  const handleDeleteItem = async () => {
    setIsDeleting(true);
    
    try {
      const response = await fetch(`/api/groups/${groupId}/lists/${listId}/items/${itemId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete item');
      }
      
      toast.success('Item deleted');
      
      // Navigate back to the list page
      router.push(`/group/${groupId}/list/${listId}`);
    } catch (error) {
      console.error("Error deleting item:", error);
      toast.error("Failed to delete item");
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  // Add a comment
  const addComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) {
      toast.error("Please enter a comment");
      return;
    }
    
    setIsAddingComment(true);
    
    try {
      const response = await fetch(`/api/groups/${groupId}/lists/${listId}/items/${itemId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: newComment }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to add comment');
      }
      
      const newCommentData = await response.json();
      
      // Add to local state
      setComments(prevComments => [newCommentData, ...prevComments]);
      setNewComment("");
      
      toast.success("Comment added");
    } catch (error: unknown) {
      console.error("Error adding comment:", error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to add comment");
      }
    } finally {
      setIsAddingComment(false);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'PPP p'); // e.g., "Apr 29, 2023 12:34 PM"
    } catch (error) {
      return dateString;
    }
  };

  useEffect(() => {
    // Check authentication status
    const auth = sessionStorage.getItem(`group_auth_${groupId}`);
    
    if (auth !== "true") {
      // Redirect to group auth page if not authenticated
      router.push(`/group/${groupId}`);
      return;
    }
    
    // Fetch item details and comments
    fetchItem();
    fetchComments();
  }, [groupId, listId, itemId, router, fetchItem, fetchComments]);

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
          onClick={() => router.push(`/group/${groupId}/list/${listId}`)}
          className="w-full sm:w-auto flex items-center justify-center gap-1 mb-2 bg-white border-gray-200 text-gray-800 hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Back to List</span>
        </Button>
        
        {/* Item Header */}
        <header className="flex justify-between items-center gap-2 border-b pb-4">
          <div className="flex-1 min-w-0">
            {isEditingName ? (
              <div className="flex items-center gap-1 flex-1">
                <Input
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="h-8 text-base font-semibold"
                  placeholder="Item name"
                  autoFocus
                />
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={handleUpdateName}
                  disabled={isUpdatingName}
                  className="h-7 w-7 p-1 text-green-600"
                >
                  {isUpdatingName ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save size={14} />}
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    setIsEditingName(false);
                    setNewItemName(item?.content || "");
                  }}
                  className="h-7 w-7 p-1 text-red-600"
                >
                  <X size={14} />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <h1 className="text-xl font-bold break-words">
                  {item?.content || 'Loading item...'}
                </h1>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setIsEditingName(true)}
                  className="h-7 w-7 p-1 text-gray-500"
                >
                  <Edit size={12} />
                </Button>
              </div>
            )}
          </div>
          
          {!isEditingName && (
            <Button 
              variant="destructive" 
              size="sm"
              onClick={() => setShowDeleteDialog(true)}
              className="h-7 shrink-0"
            >
              <Trash2 size={14} className="mr-1" />
              <span className="hidden sm:inline">Delete</span>
            </Button>
          )}
        </header>

        <div className="grid grid-cols-1 gap-4">
          {/* Toggle for bought status */}
          <div className="flex items-center gap-2 p-2">
            <Switch 
              id="bought-status" 
              checked={item?.bought || false}
              onCheckedChange={toggleItemCompletion}
            />
            <Label htmlFor="bought-status" className="text-sm font-medium">
              {item?.bought ? "Marked as bought" : "Mark as bought"}
            </Label>
          </div>
          
          {/* Comments section */}
          <Card className="shadow-sm">
            <CardHeader className="p-3 pb-2">
              <CardTitle className="text-base">Comments</CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              {/* Add comment form */}
              <form onSubmit={addComment} className="flex gap-2 mb-4">
                <div className="flex-1">
                  <Input
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="h-9"
                  />
                </div>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isAddingComment}
                  className="whitespace-nowrap h-9"
                >
                  {isAddingComment ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Add"
                  )}
                </Button>
              </form>
              
              {/* Comments list */}
              <div className="space-y-3">
                {isLoadingComments ? (
                  <div className="flex justify-center p-4">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : comments.length === 0 ? (
                  <p className="text-center text-muted-foreground text-sm py-4">
                    No comments yet
                  </p>
                ) : (
                  comments.map(comment => (
                    <div 
                      key={comment.id} 
                      className="p-3 rounded-md border text-sm"
                    >
                      <p className="break-words">{comment.content}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDate(comment.created_at)}
                      </p>
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
            <AlertDialogTitle className="text-base">Delete item?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              This will permanently delete the item &quot;{item?.content}&quot; and all its comments. 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-2">
            <AlertDialogCancel disabled={isDeleting} className="h-8 text-xs">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault();
                handleDeleteItem();
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
                "Delete Item"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 