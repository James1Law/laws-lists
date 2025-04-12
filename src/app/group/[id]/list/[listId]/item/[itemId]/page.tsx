"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ArrowLeft, Trash2, Edit, Pencil } from "lucide-react";
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

// Theme options
const themeOptions = [
  { id: "default", label: "Default", emoji: "", bgClass: "bg-background" },
  { id: "birthday", label: "Birthday", emoji: "🎂", bgClass: "bg-yellow-50" },
  { id: "christmas", label: "Christmas", emoji: "🎄", bgClass: "bg-emerald-900 text-white" },
];

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
  
  // For comment editing and deletion
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editedCommentContent, setEditedCommentContent] = useState("");
  const [isUpdatingComment, setIsUpdatingComment] = useState(false);
  
  // For item name editing
  const [isEditingName, setIsEditingName] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [isUpdatingName, setIsUpdatingName] = useState(false);
  
  // For item deletion
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // For theme-related functionality
  const [listTheme, setListTheme] = useState<string>("default");
  const animationTriggered = useRef(false);
  const cleanupFn = useRef<(() => void) | null>(null);

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
      
      // Fetch the parent list to get its theme
      const listResponse = await fetch(`/api/groups/${groupId}/lists/${listId}`);
      if (listResponse.ok) {
        const listData = await listResponse.json();
        setListTheme(listData.theme || "default");
      }
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
    const switchElement = document.getElementById('bought-status');
    const elementRect = switchElement?.getBoundingClientRect() || { left: 0, top: 0, width: 0, height: 0 };
    
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
      
      // Show animation when marking as bought (not when unmarking)
      if (!currentState && listTheme && listTheme !== 'default') {
        import('@/lib/animations').then(({ triggerItemAnimation }) => {
          triggerItemAnimation(elementRect);
        });
      }
      
      // Show success toast
      toast.success(currentState ? 'Item marked as not bought' : 'Item marked as bought');
      
      // If marking as bought (not unmarking), wait ~500ms then redirect back to list page
      if (!currentState) {
        setTimeout(() => {
          // Redirect to list page after delay, passing the item ID as a query parameter
          // to indicate it was recently bought
          router.push(`/group/${groupId}/list/${listId}?recentItem=${itemId}`);
        }, 500); // 500ms delay to allow toast to be visible
      }
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

  // Start editing a comment
  const startEditingComment = (comment: Comment) => {
    setEditingCommentId(comment.id);
    setEditedCommentContent(comment.content);
  };

  // Cancel editing a comment
  const cancelEditingComment = () => {
    setEditingCommentId(null);
    setEditedCommentContent("");
  };

  // Update a comment
  const updateComment = async (commentId: string) => {
    if (!editedCommentContent.trim()) {
      toast.error("Comment cannot be empty");
      return;
    }
    
    setIsUpdatingComment(true);
    
    try {
      const response = await fetch(`/api/groups/${groupId}/lists/${listId}/items/${itemId}/comments`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          commentId, 
          content: editedCommentContent 
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update comment');
      }
      
      const updatedComment = await response.json();
      
      // Update in local state
      setComments(prevComments => 
        prevComments.map(comment => 
          comment.id === commentId ? updatedComment : comment
        )
      );
      
      // Reset editing state
      setEditingCommentId(null);
      setEditedCommentContent("");
      
      toast.success("Comment updated");
    } catch (error: unknown) {
      console.error("Error updating comment:", error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to update comment");
      }
    } finally {
      setIsUpdatingComment(false);
    }
  };

  // Delete a comment
  const deleteComment = async (commentId: string) => {
    // Confirm deletion
    if (!window.confirm("Are you sure you want to delete this comment?")) {
      return;
    }
    
    try {
      const response = await fetch(`/api/groups/${groupId}/lists/${listId}/items/${itemId}/comments?commentId=${commentId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete comment');
      }
      
      // Remove from local state
      setComments(prevComments => 
        prevComments.filter(comment => comment.id !== commentId)
      );
      
      toast.success("Comment deleted");
    } catch (error: unknown) {
      console.error("Error deleting comment:", error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to delete comment");
      }
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

  // Initialize animations based on theme
  useEffect(() => {
    if (isLoading || animationTriggered.current) return;
    
    const timer = setTimeout(() => {
      // Only run animations if we have a special theme
      if (listTheme === 'birthday') {
        import('@/lib/animations').then(({ triggerBirthdayAnimation }) => {
          triggerBirthdayAnimation();
          animationTriggered.current = true;
        });
      } else if (listTheme === 'christmas') {
        import('@/lib/animations').then(({ createSnowfall, removeSnowfall }) => {
          // Clean up any existing snowfall first
          removeSnowfall();
          // Create new snowfall
          cleanupFn.current = createSnowfall();
          animationTriggered.current = true;
        });
      }
    }, 300); // Small delay to ensure the page is rendered
    
    return () => {
      clearTimeout(timer);
      // Clean up any snowfall when unmounting
      if (cleanupFn.current) {
        cleanupFn.current();
        cleanupFn.current = null;
      } else if (listTheme === 'christmas') {
        // In case the cleanup function wasn't captured
        import('@/lib/animations').then(({ removeSnowfall }) => {
          removeSnowfall();
        });
      }
    };
  }, [listTheme, isLoading]);

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

  // Get the current theme styles
  const currentTheme = themeOptions.find(t => t.id === listTheme) || themeOptions[0];

  if (isLoading) {
    return (
      <div className="min-h-screen p-2 bg-background flex justify-center items-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-2 sm:p-4 ${currentTheme.bgClass}`}>
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Back button - more prominent and positioned above the header */}
        <Button 
          variant="outline" 
          size="default" 
          onClick={() => router.push(`/group/${groupId}/list/${listId}`)}
          className={`w-full sm:w-auto flex items-center justify-center gap-1 mb-2 ${
            listTheme === 'christmas' 
              ? 'bg-white/20 border-white/30 text-white hover:bg-white/30 transition-colors' 
              : 'bg-white border-gray-200 text-gray-800 hover:bg-gray-50 transition-colors'
          }`}
        >
          <ArrowLeft size={16} />
          <span>Back to List</span>
        </Button>
        
        {/* Item Header */}
        <header className="flex justify-between items-center gap-2 border-b pb-4">
          <div className="flex-1 min-w-0">
            {isEditingName ? (
              <div className="space-y-2">
                <Textarea
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className={`min-h-[80px] text-base font-semibold ${listTheme === 'christmas' ? 'bg-white text-black' : ''}`}
                  placeholder="Item name"
                  autoFocus
                />
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsEditingName(false);
                      setNewItemName(item?.content || "");
                    }}
                    className={`h-7 text-xs ${
                      listTheme === 'christmas' ? 'bg-white hover:bg-gray-100 text-gray-800' : ''
                    }`}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleUpdateName}
                    disabled={isUpdatingName}
                    className={`h-7 text-xs ${
                      listTheme === 'christmas' ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''
                    }`}
                  >
                    {isUpdatingName ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      "Save"
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <h1 className="text-xl font-bold break-words">
                  {currentTheme.emoji && listTheme !== 'default' && (
                    <span className="mr-1" aria-hidden="true">{currentTheme.emoji}</span>
                  )}
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
              className={`h-7 shrink-0 ${listTheme === 'christmas' ? 'bg-red-700 hover:bg-red-800' : ''}`}
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
          <Card className={`shadow-sm ${listTheme === 'christmas' ? 'bg-white/90' : ''}`}>
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
                    className={`h-9 ${listTheme === 'christmas' ? 'bg-white text-black' : ''}`}
                  />
                </div>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isAddingComment}
                  className={`whitespace-nowrap h-9 ${
                    listTheme === 'christmas' ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''
                  }`}
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
                      className="p-3 rounded-md border text-sm relative"
                    >
                      {/* Always show edit/delete buttons */}
                      <div className="absolute top-2 right-2 flex gap-1">
                        {editingCommentId !== comment.id && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 sm:h-6 sm:w-6 rounded-full bg-gray-50 hover:bg-gray-100 transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                startEditingComment(comment);
                              }}
                            >
                              <Pencil size={14} className="text-gray-500" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 sm:h-6 sm:w-6 rounded-full bg-gray-50 hover:bg-gray-100 transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteComment(comment.id);
                              }}
                            >
                              <Trash2 size={14} className="text-red-500" />
                            </Button>
                          </>
                        )}
                      </div>
                      
                      {/* Edit mode */}
                      {editingCommentId === comment.id ? (
                        <div className="space-y-2">
                          <Textarea
                            value={editedCommentContent}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditedCommentContent(e.target.value)}
                            className={`min-h-[80px] text-sm ${listTheme === 'christmas' ? 'bg-white text-black' : ''}`}
                            autoFocus
                          />
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={cancelEditingComment}
                              className={`h-7 text-xs ${
                                listTheme === 'christmas' ? 'bg-white hover:bg-gray-100 text-gray-800' : ''
                              }`}
                            >
                              Cancel
                            </Button>
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => updateComment(comment.id)}
                              disabled={isUpdatingComment}
                              className={`h-7 text-xs ${
                                listTheme === 'christmas' ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''
                              }`}
                            >
                              {isUpdatingComment ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                "Save"
                              )}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="break-words pr-16">{comment.content}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDate(comment.created_at)}
                          </p>
                        </>
                      )}
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