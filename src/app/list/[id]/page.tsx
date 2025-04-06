"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { createBrowserClient } from "@supabase/ssr";
import Link from 'next/link';

// Initialize Supabase client
const supabase = createBrowserClient(
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
    <div className="container mx-auto p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header - Fixed at top */}
        <div className="flex items-center px-4 py-3 bg-white border-b">
          <Link 
            href={groupId ? `/group/${groupId}` : '/'}
            className="text-blue-500 hover:text-blue-600 flex items-center space-x-2"
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
              className="shrink-0"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            <span className="text-base">Back to Group</span>
          </Link>
        </div>

        {/* Main scrollable content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto px-4 pt-4 pb-32 space-y-4">
            {/* List Title Section */}
            <div className="bg-white rounded-lg border shadow-sm scroll-mt-24">
              <div className="flex items-center justify-between p-4 border-b">
                {editingTitle ? (
                  <div className="flex items-center gap-2 flex-1">
                    <Input
                      value={editTitleContent}
                      onChange={(e) => setEditTitleContent(e.target.value)}
                      className="h-12 text-base flex-1"
                    />
                    <div className="flex gap-2 shrink-0">
                      <Button
                        onClick={handleSaveTitle}
                        className="h-12 px-4 text-base"
                      >
                        Save
                      </Button>
                      <Button
                        onClick={() => setEditingTitle(false)}
                        variant="outline"
                        className="h-12 px-4 text-base"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 flex-1">
                    <h1 className="text-xl font-semibold flex-1">{listTitle}</h1>
                    <Button
                      onClick={handleStartEditTitle}
                      variant="outline"
                      className="h-12 px-4 text-base"
                    >
                      Edit
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* List Items */}
            {isLoading ? (
              <div className="text-center py-4 text-base text-gray-500">Loading items...</div>
            ) : items.length === 0 ? (
              <div className="text-center py-4 text-base text-gray-500">
                No items yet. Add your first item below.
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((item) => (
                  <div 
                    key={item.id} 
                    className={`bg-white rounded-lg border shadow-sm ${
                      item.is_completed ? 'bg-gray-50 border-gray-200' : ''
                    }`}
                  >
                    {editingItem === item.id ? (
                      <div className="flex flex-wrap items-center gap-2 p-4">
                        <Input
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="h-12 text-base flex-1 min-w-[200px]"
                        />
                        <div className="flex gap-2 shrink-0">
                          <Button
                            onClick={handleSaveEdit}
                            className="h-12 px-4 text-base"
                          >
                            Save
                          </Button>
                          <Button
                            onClick={() => setEditingItem(null)}
                            variant="outline"
                            className="h-12 px-4 text-base"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : confirmingItem === item.id ? (
                      <div className="flex flex-wrap items-center justify-between p-4 gap-2">
                        <span className="text-base text-gray-600 flex-1">
                          Mark &ldquo;{item.content}&rdquo; as bought?
                        </span>
                        <div className="flex gap-2 shrink-0">
                          <Button
                            onClick={() => handleConfirmComplete(item.id)}
                            className="h-12 px-4 text-base bg-green-500 hover:bg-green-600"
                          >
                            Yes
                          </Button>
                          <Button
                            onClick={() => setConfirmingItem(null)}
                            variant="outline"
                            className="h-12 px-4 text-base"
                          >
                            No
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-center justify-between p-4 gap-2">
                        <div className="flex items-center gap-3 flex-1 min-w-[200px]">
                          <input
                            type="checkbox"
                            checked={item.is_completed}
                            onChange={() => handleToggleComplete(item.id, item.is_completed)}
                            className="h-6 w-6 rounded border-gray-300 text-blue-600 focus:ring-blue-500 shrink-0"
                          />
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span className="text-base truncate">
                              {item.content}
                            </span>
                            {item.is_completed && (
                              <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-base font-medium text-green-800 whitespace-nowrap">
                                Bought
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <Button
                            onClick={() => handleStartEdit(item)}
                            variant="outline"
                            className="h-12 px-4 text-base min-w-[60px]"
                          >
                            Edit
                          </Button>
                          <Button
                            onClick={() => handleDeleteItem(item.id)}
                            variant="destructive"
                            className="h-12 px-4 text-base min-w-[60px]"
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

        {/* Fixed Add Item Form at Bottom */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t px-4 py-4 shadow-lg">
          <div className="max-w-2xl mx-auto">
            <form onSubmit={handleAddItem} className="flex gap-2">
              <Input
                value={newItemContent}
                onChange={(e) => setNewItemContent(e.target.value)}
                placeholder="Add new item"
                className="h-12 text-base flex-1"
              />
              <Button
                type="submit"
                disabled={!newItemContent.trim()}
                className="h-12 px-6 text-base whitespace-nowrap"
              >
                Add Item
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
} 