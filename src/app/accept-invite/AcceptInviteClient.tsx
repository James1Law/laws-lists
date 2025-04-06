"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Toaster, toast } from "sonner";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AcceptInviteClientProps {
  invite: {
    id: string;
    groupId: string;
    groupName: string;
    token: string;
  };
}

export default function AcceptInviteClient({ invite }: AcceptInviteClientProps) {
  const router = useRouter();
  const [isAccepting, setIsAccepting] = useState(false);
  const supabase = createClientComponentClient();

  const handleAcceptInvite = async () => {
    setIsAccepting(true);

    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error("No user found");

      // Add user to group
      const { error: memberError } = await supabase
        .from("user_groups")
        .insert([{
          user_id: user.id,
          group_id: invite.groupId,
          role: 'member'
        }]);

      if (memberError) throw memberError;

      // Mark invite as accepted
      const { error: inviteError } = await supabase
        .from("group_invites")
        .update({ accepted: true })
        .eq("id", invite.id);

      if (inviteError) throw inviteError;

      toast.success("Successfully joined group");
      router.push(`/group/${invite.groupId}`);
    } catch (error: any) {
      console.error("Error accepting invite:", error);
      toast.error(error.message || "Failed to accept invite");
    } finally {
      setIsAccepting(false);
    }
  };

  return (
    <div className="min-h-screen p-4 bg-gray-50">
      <Toaster position="top-center" />
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl text-center">
              Join Group: {invite.groupName}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-gray-600">
              You have been invited to join this group. Would you like to accept the invitation?
            </p>
            <div className="flex gap-2 justify-center">
              <Button
                onClick={handleAcceptInvite}
                disabled={isAccepting}
              >
                {isAccepting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Accepting...
                  </>
                ) : (
                  "Accept Invitation"
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push("/dashboard")}
                disabled={isAccepting}
              >
                Decline
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 