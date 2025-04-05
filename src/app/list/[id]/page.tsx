"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
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
  const [editingTitle, setEditingTitle] = useState(false);
  const [editTitleContent, setEditTitleContent] = useState("");
  const [groupId, setGroupId] = useState<string | null>(null);
  const [items, setItems] = useState<ListItem[]>([]);
  const [newItemContent, setNewItemContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [confirmingItem, setConfirmingItem] = useState<string | null>(null);

  const fetchListDetails = useCallback(async () => {
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
  }, [listId]);

  useEffect(() => {
    fetchListDetails();
  }, [fetchListDetails]);

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
    if (currentStatus) {
      // If item is already marked as bought, unmark it without confirmation
      try {
        const { error } = await supabase
          .from("list_items")
          .update({ is_completed: false })
          .eq("id", itemId);

        if (error) throw error;

        setItems(items.map(item => 
          item.id === itemId 
            ? { ...item, is_completed: false }
            : item
        ));
      } catch (error) {
        console.error("Error updating item:", error);
        toast.error("Failed to update item");
      }
    } else {
      // If marking as bought, show confirmation first
      setConfirmingItem(itemId);
    }
  };

  const handleConfirmComplete = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from("list_items")
        .update({ is_completed: true })
        .eq("id", itemId);

      if (error) throw error;

      setItems(items.map(item => 
        item.id === itemId 
          ? { ...item, is_completed: true }
          : item
      ));
      setConfirmingItem(null);
      toast.success("Item marked as bought");
    } catch (error) {
      console.error("Error updating item:", error);
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

  const handleSaveTitle = async () => {
    if (!editTitleContent.trim()) return;

    try {
      const { error } = await supabase
        .from("lists")
        .update({ title: editTitleContent.trim() })
        .eq("id", listId);

      if (error) throw error;

      setListTitle(editTitleContent.trim());
      setEditingTitle(false);
      setEditTitleContent("");
      toast.success("List title updated successfully");
    } catch (error) {
      console.error("Error updating list title:", error);
      toast.error("Failed to update list title");
    }
  };

  const handleStartEditTitle = () => {
    setEditingTitle(true);
    setEditTitleContent(listTitle);
  };

  return (
    <div className="min-h-screen p-4">
      <Toaster position="top-center" />
      <div className="max-w-2xl mx-auto space-y-3">
        <div className="flex items-center justify-between">
          <Link 
            href={groupId ? `/group/${groupId}` : '/'}
            className="text-blue-500 hover:text-blue-600 flex items-center space-x-2"
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

        <div className="bg-white rounded-lg border shadow-sm">
          <div className="flex items-center justify-between p-3 border-b">
            {editingTitle ? (
              <div className="flex items-center gap-2 flex-1">
                <Input
                  value={editTitleContent}
                  onChange={(e) => setEditTitleContent(e.target.value)}
                  className="h-8 text-sm flex-1"
                />
                <div className="flex gap-1 shrink-0">
                  <Button
                    onClick={handleSaveTitle}
                    className="h-8 px-3 text-sm"
                  >
                    Save
                  </Button>
                  <Button
                    onClick={() => setEditingTitle(false)}
                    variant="outline"
                    className="h-8 px-3 text-sm"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 flex-1">
                <h1 className="text-lg font-semibold flex-1">{listTitle}</h1>
                <Button
                  onClick={handleStartEditTitle}
                  variant="outline"
                  className="h-7 px-2 text-xs"
                >
                  Edit
                </Button>
              </div>
            )}
          </div>
          <div className="p-3">
            <form onSubmit={handleAddItem}>
              <div className="flex gap-2">
                <Input
                  value={newItemContent}
                  onChange={(e) => setNewItemContent(e.target.value)}
                  placeholder="Add new item"
                  className="h-8 text-sm"
                />
                <Button
                  type="submit"
                  disabled={!newItemContent.trim()}
                  className="h-8 px-3 text-sm"
                >
                  Add
                </Button>
              </div>
            </form>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-2 text-sm text-gray-500">Loading items...</div>
        ) : items.length === 0 ? (
          <div className="text-center py-2 text-sm text-gray-500">
            No items yet. Add your first item above.
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <div 
                key={item.id} 
                className={`bg-white rounded-lg border shadow-sm ${
                  item.is_completed ? 'bg-gray-50 border-gray-200' : ''
                }`}
              >
                {editingItem === item.id ? (
                  <div className="flex items-center gap-2 p-2">
                    <Input
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="h-8 text-sm flex-1"
                    />
                    <div className="flex gap-1 shrink-0">
                      <Button
                        onClick={handleSaveEdit}
                        className="h-8 px-3 text-sm"
                      >
                        Save
                      </Button>
                      <Button
                        onClick={() => setEditingItem(null)}
                        variant="outline"
                        className="h-8 px-3 text-sm"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : confirmingItem === item.id ? (
                  <div className="flex items-center justify-between p-2">
                    <span className="text-sm text-gray-600">Mark &ldquo;{item.content}&rdquo; as bought?</span>
                    <div className="flex gap-1 shrink-0">
                      <Button
                        onClick={() => handleConfirmComplete(item.id)}
                        className="h-7 px-2 text-xs bg-green-500 hover:bg-green-600"
                      >
                        Yes
                      </Button>
                      <Button
                        onClick={() => setConfirmingItem(null)}
                        variant="outline"
                        className="h-7 px-2 text-xs"
                      >
                        No
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <input
                        type="checkbox"
                        checked={item.is_completed}
                        onChange={() => handleToggleComplete(item.id, item.is_completed)}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 shrink-0"
                      />
                      <div className="flex items-center gap-2">
                        <span className="text-sm truncate">
                          {item.content}
                        </span>
                        {item.is_completed && (
                          <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                            Bought
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1 ml-2 shrink-0">
                      <Button
                        onClick={() => handleStartEdit(item)}
                        variant="outline"
                        className="h-7 px-2 text-xs min-w-[48px]"
                      >
                        Edit
                      </Button>
                      <Button
                        onClick={() => handleDeleteItem(item.id)}
                        variant="destructive"
                        className="h-7 px-2 text-xs min-w-[48px]"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 