"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { z } from "zod";
import { prisma } from "@/lib/supabase";

// Define schema for params
const ParamsSchema = z.object({
  id: z.string().uuid()
});

interface List {
  id: string;
  name: string;
  owner_name: string;
  group_id: string;
}

interface Item {
  id: string;
  text: string;
  bought_by: string | null;
}

export default function ListPage({ params }: { params: { id: string } }) {
  // Validate params
  const validationResult = ParamsSchema.safeParse(params);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [list, setList] = useState<List | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [newItemText, setNewItemText] = useState("");
  const [adding, setAdding] = useState(false);
  const [yourName, setYourName] = useState("");
  const [nameSet, setNameSet] = useState(false);
  const [loadingItem, setLoadingItem] = useState<string | null>(null);

  const fetchList = useCallback(async () => {
    try {
      const list = await prisma.list.findUnique({
        where: { id: params.id },
        include: { group: true }
      });
      
      if (!list) {
        throw new Error("List not found");
      }
      
      setList(list as unknown as List);
      
      // Check group authentication
      const storedAuth = sessionStorage.getItem(`group_${list.groupId}_auth`);
      if (storedAuth !== "true") {
        // Redirect to group page to authenticate
        router.push(`/group/${list.groupId}`);
        return;
      }
      
      // Check if name is stored
      const storedName = sessionStorage.getItem(`list_${params.id}_name`);
      if (storedName) {
        setYourName(storedName);
        setNameSet(true);
      }
    } catch (error: unknown) {
      console.error("Error fetching list:", error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("List not found");
      }
      router.push("/");
    } finally {
      setIsLoading(false);
    }
  }, [params.id, router]);

  const fetchItems = useCallback(async () => {
    if (!list) return;
    
    try {
      const items = await prisma.item.findMany({
        where: { listId: params.id },
        orderBy: [
          { boughtBy: 'asc' }, // null values first
          { createdAt: 'desc' }
        ]
      });
      
      setItems(items as unknown as Item[]);
    } catch (error: unknown) {
      console.error("Error fetching items:", error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to load items");
      }
    }
  }, [list, params.id]);

  useEffect(() => {
    // If invalid params, redirect to home
    if (!validationResult.success) {
      toast.error("Invalid list ID");
      router.push("/");
      return;
    }
    
    fetchList();
  }, [params.id, router, fetchList, validationResult.success]);

  useEffect(() => {
    if (list) {
      fetchItems();
    }
  }, [list, fetchItems]);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemText.trim()) return;
    
    setAdding(true);
    try {
      await prisma.item.create({
        data: {
          text: newItemText,
          listId: params.id
        }
      });
      
      toast.success("Item added successfully");
      setNewItemText("");
      fetchItems();
    } catch (error: unknown) {
      console.error("Error adding item:", error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to add item");
      }
    } finally {
      setAdding(false);
    }
  };

  const handleSetName = (e: React.FormEvent) => {
    e.preventDefault();
    if (!yourName.trim()) return;
    
    // Store name in session storage
    sessionStorage.setItem(`list_${params.id}_name`, yourName);
    setNameSet(true);
    toast.success("Name set successfully");
  };

  const handleToggleBought = async (itemId: string, currentBoughtBy: string | null) => {
    if (list?.owner_name === yourName) {
      toast.error("As the list owner, you cannot mark items as bought");
      return;
    }
    
    setLoadingItem(itemId);
    try {
      // If already bought by this user, mark as unbought
      // If bought by someone else, don't allow changes
      // If not bought, mark as bought by this user
      let newBoughtBy = null;
      
      if (currentBoughtBy === null) {
        newBoughtBy = yourName;
      } else if (currentBoughtBy === yourName) {
        newBoughtBy = null;
      } else {
        toast.error(`This item was already bought by ${currentBoughtBy}`);
        setLoadingItem(null);
        return;
      }
      
      await prisma.item.update({
        where: { id: itemId },
        data: { boughtBy: newBoughtBy }
      });
      
      fetchItems();
    } catch (error: unknown) {
      console.error("Error updating item:", error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to update item");
      }
    } finally {
      setLoadingItem(null);
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

  if (!list) {
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

  const renderNameForm = () => (
    <Card className="mb-4">
      <CardContent className="p-4">
        <form onSubmit={handleSetName} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="yourName">Your Name</Label>
            <Input
              id="yourName"
              value={yourName}
              onChange={(e) => setYourName(e.target.value)}
              placeholder="Enter your name"
              required
            />
            <p className="text-xs text-gray-500">
              Your name will be shown when you mark items as bought
            </p>
          </div>
          <Button
            type="submit"
          >
            Set Name
          </Button>
        </form>
      </CardContent>
    </Card>
  );

  const renderAddItemForm = () => (
    <form onSubmit={handleAddItem} className="mb-6">
      <div className="flex gap-2">
        <div className="flex-1">
          <Input
            value={newItemText}
            onChange={(e) => setNewItemText(e.target.value)}
            placeholder="Add a new item"
            disabled={adding}
            required
          />
        </div>
        <Button
          type="submit"
          disabled={adding}
        >
          {adding ? "Adding..." : "Add"}
        </Button>
      </div>
    </form>
  );

  const renderItems = () => (
    <div className="space-y-2">
      {items.length === 0 ? (
        <div className="text-center p-6 border rounded-md">
          <p className="text-gray-500">No items in this list yet</p>
        </div>
      ) : (
        items.map((item) => {
          const isBought = !!item.bought_by;
          const boughtByYou = item.bought_by === yourName;
          const isOwner = list.owner_name === yourName;
          
          // Owner shouldn't see who bought what
          const displayBoughtBy = isOwner ? null : item.bought_by;
          
          return (
            <Card key={item.id} className={`overflow-hidden ${isBought ? 'bg-gray-50' : ''}`}>
              <CardContent className="p-3 flex items-center justify-between">
                <div className="flex items-start gap-3 flex-1">
                  {!isOwner && (
                    <Checkbox
                      checked={isBought}
                      onCheckedChange={() => handleToggleBought(item.id, item.bought_by)}
                      disabled={loadingItem === item.id || (isBought && !boughtByYou)}
                      id={`item-${item.id}`}
                      className="mt-0.5"
                    />
                  )}
                  <div className="flex-1">
                    <label
                      htmlFor={`item-${item.id}`}
                      className={`text-base cursor-pointer ${isBought ? 'line-through text-gray-500' : ''}`}
                    >
                      {item.text}
                    </label>
                    
                    {displayBoughtBy && (
                      <p className="text-xs text-gray-500 mt-1">
                        {boughtByYou ? "Bought by you" : `Bought by ${displayBoughtBy}`}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );

  return (
    <div className="min-h-screen p-4 bg-gray-50">
      <div className="max-w-xl mx-auto space-y-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link
              href={`/group/${list.group_id}`}
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
            <h1 className="text-2xl font-bold">{list.name}</h1>
          </div>
          
          {nameSet && (
            <div className="text-sm text-gray-500">
              Signed in as {yourName}
            </div>
          )}
        </div>

        {!nameSet ? (
          renderNameForm()
        ) : (
          <>
            {renderAddItemForm()}
            {renderItems()}
          </>
        )}
      </div>
    </div>
  );
} 