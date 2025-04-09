"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { createSupabaseClient } from "@/lib/supabase";

interface List {
  id: string;
  name: string;
  owner_name: string;
  group_id: string;
}

interface Item {
  id: string;
  list_id: string;
  text: string;
  bought_by: string | null;
  created_at: string;
}

interface Group {
  id: string;
  name: string;
}

export default function ListPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [list, setList] = useState<List | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [group, setGroup] = useState<Group | null>(null);
  const [newItemText, setNewItemText] = useState("");
  const [yourName, setYourName] = useState("");
  const [isCreatingItem, setIsCreatingItem] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    fetchListAndItems();
    
    // Load saved name from localStorage
    const savedName = localStorage.getItem("user_name");
    if (savedName) {
      setYourName(savedName);
    }
  }, [params.id]);

  const fetchListAndItems = async () => {
    setIsLoading(true);
    try {
      const supabase = createSupabaseClient();
      
      // Fetch list details
      const { data: listData, error: listError } = await supabase
        .from("lists")
        .select("id, name, owner_name, group_id")
        .eq("id", params.id)
        .single();

      if (listError) throw listError;
      setList(listData);
      
      // Check if user is owner
      const storedName = localStorage.getItem("user_name");
      if (storedName && storedName === listData.owner_name) {
        setIsOwner(true);
      }
      
      // Fetch group info
      const { data: groupData, error: groupError } = await supabase
        .from("groups")
        .select("id, name")
        .eq("id", listData.group_id)
        .single();
        
      if (groupError) throw groupError;
      setGroup(groupData);
      
      // Fetch items
      const { data: itemsData, error: itemsError } = await supabase
        .from("items")
        .select("*")
        .eq("list_id", params.id)
        .order("created_at", { ascending: true });

      if (itemsError) throw itemsError;
      setItems(itemsData || []);
      
      // Check if user has access to the group
      const hasAccess = sessionStorage.getItem(`group_${listData.group_id}_auth`);
      if (hasAccess !== "true") {
        toast.error("Please authenticate with the group first");
        router.push(`/group/${listData.group_id}`);
      }
    } catch (error: unknown) {
      console.error("Error fetching list:", error);
      toast.error("List not found");
      router.push("/");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemText.trim()) return;
    
    setIsCreatingItem(true);
    try {
      const supabase = createSupabaseClient();
      
      const { error } = await supabase
        .from("items")
        .insert([
          {
            list_id: params.id,
            text: newItemText,
            bought_by: null
          },
        ]);

      if (error) throw error;

      toast.success("Item added to list");
      setNewItemText("");
      fetchListAndItems(); // Refresh the list
    } catch (error: unknown) {
      console.error("Error adding item:", error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to add item");
      }
    } finally {
      setIsCreatingItem(false);
    }
  };

  const handleToggleBought = async (item: Item) => {
    if (!yourName) {
      toast.error("Please enter your name before marking items");
      return;
    }
    
    // Save the name for future use
    localStorage.setItem("user_name", yourName);
    
    // If owner of the list, prevent marking items
    if (isOwner) {
      toast.error("As the list creator, you cannot mark items as bought");
      return;
    }
    
    try {
      const supabase = createSupabaseClient();
      
      // If already bought by this person, unbuy it
      const newBoughtBy = item.bought_by === yourName ? null : yourName;
      
      // If bought by someone else, don't allow changing
      if (item.bought_by && item.bought_by !== yourName) {
        toast.error(`This item was already bought by ${item.bought_by}`);
        return;
      }
      
      const { error } = await supabase
        .from("items")
        .update({ bought_by: newBoughtBy })
        .eq("id", item.id);

      if (error) throw error;

      // Update local state
      setItems(items.map(i => 
        i.id === item.id ? { ...i, bought_by: newBoughtBy } : i
      ));
      
      if (newBoughtBy) {
        toast.success("Item marked as bought");
      } else {
        toast.success("Item unmarked");
      }
    } catch (error: unknown) {
      console.error("Error toggling item:", error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to update item");
      }
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    // Only owners can delete items
    if (!isOwner) return;
    
    if (!confirm("Are you sure you want to delete this item?")) return;
    
    try {
      const supabase = createSupabaseClient();
      
      const { error } = await supabase
        .from("items")
        .delete()
        .eq("id", itemId);

      if (error) throw error;

      toast.success("Item deleted");
      // Update local state
      setItems(items.filter(i => i.id !== itemId));
    } catch (error: unknown) {
      console.error("Error deleting item:", error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to delete item");
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen p-4 bg-gray-50">
        <div className="max-w-xl mx-auto text-center py-12">
          Loading...
        </div>
      </div>
    );
  }

  if (!list || !group) {
    return (
      <div className="min-h-screen p-4 bg-gray-50">
        <div className="max-w-xl mx-auto text-center py-12">
          <h1 className="text-2xl font-bold mb-4">List not found</h1>
          <Button onClick={() => router.push("/")}>
            Return to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 bg-gray-50">
      <div className="max-w-xl mx-auto space-y-4">
        <div className="flex items-center gap-4 mb-6">
          <Link
            href={`/group/${group.id}`}
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
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{list.name}</h1>
            <p className="text-gray-500">
              Created by {list.owner_name} • {group.name}
            </p>
          </div>
        </div>

        {/* Your name input for marking items */}
        <Card className="mb-4">
          <CardContent className="pt-4">
            <div className="flex gap-2">
              <Input
                placeholder="Enter your name"
                value={yourName}
                onChange={(e) => setYourName(e.target.value)}
                className="flex-1"
              />
              <Button variant="outline" onClick={() => setYourName(localStorage.getItem("user_name") || "")}>
                Reset
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {isOwner 
                ? "As the list creator, you cannot mark items as bought" 
                : "Your name is used when marking items as bought"}
            </p>
          </CardContent>
        </Card>

        {/* Add new item */}
        {!isOwner && (
          <Card className="mb-4">
            <CardHeader>
              <CardTitle>Add Item to List</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateItem} className="flex gap-2">
                <Input
                  placeholder="Enter item description"
                  value={newItemText}
                  onChange={(e) => setNewItemText(e.target.value)}
                  className="flex-1"
                  disabled={isCreatingItem}
                />
                <Button 
                  type="submit" 
                  disabled={isCreatingItem || !newItemText.trim()}
                >
                  Add
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Items list */}
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">Items</h2>
          
          {items.length === 0 ? (
            <div className="text-center p-6 border rounded-md">
              <p className="text-gray-500">No items in this list yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {items.map((item) => (
                <div 
                  key={item.id} 
                  className={`p-4 border rounded-md flex justify-between items-center ${
                    item.bought_by ? 'bg-gray-50' : 'bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className={`w-5 h-5 rounded-full border flex items-center justify-center cursor-pointer ${
                        item.bought_by ? 'bg-green-100 border-green-500 text-green-500' : 'border-gray-300'
                      }`}
                      onClick={() => handleToggleBought(item)}
                    >
                      {item.bought_by && (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M20 6L9 17 4 12" />
                        </svg>
                      )}
                    </div>
                    <span className={item.bought_by ? 'line-through text-gray-500' : ''}>
                      {item.text}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {isOwner ? (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDeleteItem(item.id)}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6" />
                        </svg>
                      </Button>
                    ) : (
                      // Don't show who bought the item if you're the list owner
                      item.bought_by && <span className="text-xs text-green-600">Bought by {item.bought_by}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 