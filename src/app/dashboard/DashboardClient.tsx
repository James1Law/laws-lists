"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { createBrowserClient } from "@supabase/ssr";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Group {
  id: string;
  name: string;
  created_at: string;
}

interface DashboardClientProps {
  initialGroups: Group[];
  userId: string;
}

export default function DashboardClient({ initialGroups, userId }: DashboardClientProps) {
  const router = useRouter();
  const [groups, setGroups] = useState<Group[]>(initialGroups);
  const [isCreating, setIsCreating] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.push("/");
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("Error signing out:", error);
        toast.error(error.message || "Failed to sign out");
      } else {
        console.error("Unknown error:", error);
        toast.error("An unknown error occurred");
      }
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newGroupName.trim()) {
      toast.error("Please enter a group name");
      return;
    }

    setIsCreating(true);

    try {
      // Create the group
      const { data: group, error: groupError } = await supabase
        .from("groups")
        .insert([{ name: newGroupName.trim() }])
        .select()
        .single();

      if (groupError) throw groupError;

      // Add the user to the group
      const { error: memberError } = await supabase
        .from("user_groups")
        .insert([{
          user_id: userId,
          group_id: group.id,
          role: 'owner'
        }]);

      if (memberError) throw memberError;

      // Update the local state
      setGroups([group, ...groups]);
      setNewGroupName("");
      setIsDialogOpen(false);
      toast.success("Group created successfully");
      router.push(`/group/${group.id}`);
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("Error creating group:", error);
        toast.error(error.message || "Failed to create group");
      } else {
        console.error("Unknown error:", error);
        toast.error("An unknown error occurred");
      }
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">My Groups</h1>
          <div className="flex items-center gap-2">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="h-10">Create New Group</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Group</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateGroup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="groupName">Group Name</Label>
                    <Input
                      id="groupName"
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                      placeholder="Enter group name"
                      disabled={isCreating}
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isCreating}
                  >
                    {isCreating ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Creating...
                      </>
                    ) : (
                      "Create Group"
                    )}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
            <Button
              onClick={handleSignOut}
              variant="outline"
            >
              Sign Out
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          {groups.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-gray-500">
                  <p className="mb-4">No groups found</p>
                  <Button
                    onClick={() => setIsDialogOpen(true)}
                    variant="link"
                    className="text-blue-500 hover:text-blue-600"
                  >
                    Create your first group
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            groups.map((group) => (
              <Link key={group.id} href={`/group/${group.id}`}>
                <Card className="hover:border-blue-200 hover:shadow-md transition-all">
                  <CardContent className="flex items-center justify-between p-4">
                    <span className="font-medium">{group.name}</span>
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
                      className="text-gray-400"
                    >
                      <path d="m9 18 6-6-6-6" />
                    </svg>
                  </CardContent>
                </Card>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
} 