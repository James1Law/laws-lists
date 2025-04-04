"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Toaster, toast } from "sonner";
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface ListItem {
  id: string;
  content: string;
  is_completed: boolean;
  created_at: string;
}

export default function ListDetailPage() {
  const params = useParams();
  const listId = params.id as string;
  const [listTitle, setListTitle] = useState("");
  const [groupId, setGroupId] = useState<string | null>(null);
  const [items, setItems] = useState<ListItem[]>([]);
  const [newItemContent, setNewItemContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  useEffect(() => {
    fetchListDetails();
  }, [listId]);

  const fetchListDetails = async () => {
    try {
      // Fetch list title and group_id
      const { data: listData, error: listError } = await supabase
        .from("lists")
        .select("title, group_id")
        .eq("id", listId)
        .single();

      if (listError) throw listError;
      setListTitle(listData.title);
      setGroupId(listData.group_id);

      // Fetch list items
      const { data: itemsData, error: itemsError } = await supabase
        .from("list_items")
        .select("*")
        .eq("list_id", listId)
        .order("created_at", { ascending: true });

      if (itemsError) throw itemsError;
      setItems(itemsData || []);
    } catch (error) {
      console.error("Error fetching list details:", error);
      toast.error("Failed to load list details");
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemContent.trim()) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("list_items")
        .insert([
          {
            list_id: listId,
            content: newItemContent.trim(),
          },
        ])
        .select()
        .single();

      if (error) throw error;

      setItems([...items, data]);
      setNewItemContent("");
      toast.success("Item added successfully");
    } catch (error) {
      console.error("Error adding item:", error);
      toast.error("Failed to add item");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleComplete = async (itemId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("list_items")
        .update({ is_completed: !currentStatus })
        .eq("id", itemId);

      if (error) throw error;

      setItems(items.map(item => 
        item.id === itemId 
          ? { ...item, is_completed: !currentStatus }
          : item
      ));
    } catch (error) {
      console.error("Error toggling item:", error);
      toast.error("Failed to update item");
    }
  };

  const handleStartEdit = (item: ListItem) => {
    setEditingItem(item.id);
    setEditContent(item.content);
  };

  const handleSaveEdit = async () => {
    if (!editingItem || !editContent.trim()) return;

    try {
      const { error } = await supabase
        .from("list_items")
        .update({ content: editContent.trim() })
        .eq("id", editingItem);

      if (error) throw error;

      setItems(items.map(item =>
        item.id === editingItem
          ? { ...item, content: editContent.trim() }
          : item
      ));
      setEditingItem(null);
      setEditContent("");
      toast.success("Item updated successfully");
    } catch (error) {
      console.error("Error updating item:", error);
      toast.error("Failed to update item");
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from("list_items")
        .delete()
        .eq("id", itemId);

      if (error) throw error;

      setItems(items.filter(item => item.id !== itemId));
      toast.success("Item deleted successfully");
    } catch (error) {
      console.error("Error deleting item:", error);
      toast.error("Failed to delete item");
    }
  };

  return (
    <div className="min-h-screen p-4">
      <Toaster position="top-center" />
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Link 
            href={groupId ? `/group/${groupId}` : '/'}
            className="text-blue-500 hover:text-blue-600 flex items-center space-x-2 mb-4"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            <span>Back to Group</span>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">{listTitle}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddItem} className="space-y-4">
              <div className="flex space-x-2">
                <Input
                  value={newItemContent}
                  onChange={(e) => setNewItemContent(e.target.value)}
                  placeholder="Add new item"
                  className="h-12 text-base"
                />
                <Button
                  type="submit"
                  disabled={isLoading || !newItemContent.trim()}
                  className="h-12"
                >
                  Add
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {items.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1">
                    <input
                      type="checkbox"
                      checked={item.is_completed}
                      onChange={() => handleToggleComplete(item.id, item.is_completed)}
                      className="h-5 w-5"
                    />
                    {editingItem === item.id ? (
                      <div className="flex-1 flex space-x-2">
                        <Input
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="h-10"
                        />
                        <Button onClick={handleSaveEdit} className="h-10">
                          Save
                        </Button>
                        <Button
                          onClick={() => setEditingItem(null)}
                          variant="outline"
                          className="h-10"
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <span className={item.is_completed ? "line-through text-gray-500" : ""}>
                        {item.content}
                      </span>
                    )}
                  </div>
                  {editingItem !== item.id && (
                    <div className="flex space-x-2">
                      <Button
                        onClick={() => handleStartEdit(item)}
                        variant="outline"
                        className="h-10"
                      >
                        Edit
                      </Button>
                      <Button
                        onClick={() => handleDeleteItem(item.id)}
                        variant="destructive"
                        className="h-10"
                      >
                        Delete
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
} 