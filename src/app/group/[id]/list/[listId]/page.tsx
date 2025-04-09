"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowLeft, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

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

  // Wrap the functions in useCallback to avoid dependency issues
  const fetchListDetails = useCallback(async () => {
    try {
      const response = await fetch(`/api/groups/${groupId}/lists/${listId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch list details');
      }
      const data = await response.json();
      setList(data);
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

  // Toggle item bought status
  const toggleItemCompletion = async (itemId: string, currentState: boolean) => {
    try {
      // Optimistically update UI
      setItems(prevItems => 
        prevItems.map(item => 
          item.id === itemId ? { ...item, bought: !currentState } : item
        )
      );
      
      const response = await fetch(`/api/groups/${groupId}/lists/${listId}/items/${itemId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bought: !currentState }),
      });
      
      if (!response.ok) {
        // If error, revert the change
        setItems(prevItems => 
          prevItems.map(item => 
            item.id === itemId ? { ...item, bought: currentState } : item
          )
        );
        throw new Error('Failed to update item');
      }
    } catch (error) {
      console.error("Error toggling item status:", error);
      toast.error("Failed to update item");
    }
  };

  // Delete an item
  const deleteItem = async (itemId: string) => {
    try {
      // Store item for recovery
      const itemToDelete = items.find(item => item.id === itemId);
      
      // Optimistically update UI
      setItems(prevItems => prevItems.filter(item => item.id !== itemId));
      
      const response = await fetch(`/api/groups/${groupId}/lists/${listId}/items/${itemId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        // If error, revert the deletion
        if (itemToDelete) {
          setItems(prevItems => [...prevItems, itemToDelete]);
        }
        throw new Error('Failed to delete item');
      }
      
      toast.success('Item deleted');
    } catch (error) {
      console.error("Error deleting item:", error);
      toast.error("Failed to delete item");
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
    
    // Fetch list details and items
    fetchListDetails();
    fetchItems();
  }, [groupId, listId, router, fetchListDetails, fetchItems]);

  if (isLoading) {
    return (
      <div className="min-h-screen p-4 bg-background flex justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 bg-background">
      <div className="max-w-4xl mx-auto space-y-8 py-4">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => router.push(`/group/${groupId}`)}
              className="h-8 w-8"
            >
              <ArrowLeft size={18} />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{list?.title || 'Loading list...'}</h1>
              <p className="text-sm text-muted-foreground">
                Manage items in this list
              </p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-6">
          {/* Create Item Form */}
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Plus size={18} className="text-primary" />
                Add New Item
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateItem} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="itemContent">Item Description</Label>
                  <Input
                    id="itemContent"
                    value={newItemContent}
                    onChange={(e) => setNewItemContent(e.target.value)}
                    placeholder="e.g. New headphones"
                    className="input-enhanced"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full btn-primary"
                  disabled={isCreatingItem}
                >
                  {isCreatingItem ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    "Add Item"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Items List */}
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                Items
              </CardTitle>
              {items.length === 0 ? (
                <CardDescription>
                  No items yet. Add your first item above.
                </CardDescription>
              ) : (
                <CardDescription>
                  {items.filter(item => item.bought).length} of {items.length} items purchased
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              {items.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  This list is empty. Add items using the form above.
                </div>
              ) : (
                <ul className="space-y-3">
                  {items.map((item) => (
                    <li key={item.id} className="flex items-center gap-3 p-3 rounded-lg border">
                      <Checkbox 
                        id={`item-${item.id}`}
                        checked={item.bought}
                        onCheckedChange={() => toggleItemCompletion(item.id, item.bought)}
                        className="h-5 w-5"
                      />
                      <Label 
                        htmlFor={`item-${item.id}`}
                        className={`flex-grow cursor-pointer ${item.bought ? 'line-through text-muted-foreground' : ''}`}
                      >
                        {item.content}
                      </Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteItem(item.id)}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 