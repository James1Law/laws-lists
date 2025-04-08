"use client";

import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ShareGroupProps {
  groupId: string;
  isOwner: boolean;
  groupName: string;
}

export default function ShareGroup({ groupId, isOwner, groupName }: ShareGroupProps) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast.error("Please enter an email address");
      return;
    }

    setIsLoading(true);

    try {
      // Generate a secure random token
      const token = crypto.randomUUID();
      const normalizedEmail = email.trim().toLowerCase();

      // Create the invite
      const { error: inviteError } = await supabase
        .from("group_invites")
        .insert([{
          group_id: groupId,
          email: normalizedEmail,
          token,
          accepted: false
        }]);

      if (inviteError) throw inviteError;

      // Construct the invite link using the site URL
      const siteUrl = process.env.NEXT_PUBLIC_VERCEL_URL 
        ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
        : process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
      const inviteLink = `${siteUrl}/accept-invite?token=${token}`;

      // Send the invite email
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-invite-email`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({ 
          email: normalizedEmail, 
          groupName, 
          inviteLink 
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send invite email');
      }

      // Show success message
      toast.success(`Invite sent to ${normalizedEmail}`, {
        description: "They will receive an email with instructions to join the group.",
        duration: 5000
      });

      // Reset form
      setEmail("");
      setIsDialogOpen(false);
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("Error sending invite:", error);
        toast.error(
          error.message === 'Failed to send invite email'
            ? "Failed to send invite email. The invite was created but email delivery failed."
            : "Failed to create invite"
        );
        // If the invite was created but email failed, keep the dialog open
        if (error.message !== 'Failed to send invite email') {
          setIsDialogOpen(false);
        }
      } else {
        console.error("Unknown error:", error);
        toast.error("An unknown error occurred");
        setIsDialogOpen(false);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOwner) return null;

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          Share Group
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share Group</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleShare} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email address"
              disabled={isLoading}
            />
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Sending Invite...
              </>
            ) : (
              "Send Invite"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
} 