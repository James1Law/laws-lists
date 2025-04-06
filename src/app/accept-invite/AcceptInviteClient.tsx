"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Toaster, toast } from "sonner";
import { createBrowserClient } from "@supabase/ssr";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ValidInviteProps {
  status: "valid";
  invite: {
    id: string;
    groupId: string;
    groupName: string;
    token: string;
  };
}

interface InvalidInviteProps {
  status: "invalid" | "accepted" | "mismatch";
  message: string;
  groupId?: string;
}

interface UnauthenticatedProps {
  status: "unauthenticated";
  message: string;
  callbackUrl: string;
}

type AcceptInviteClientProps = ValidInviteProps | InvalidInviteProps | UnauthenticatedProps;

export default function AcceptInviteClient(props: AcceptInviteClientProps) {
  const router = useRouter();
  const [isAccepting, setIsAccepting] = useState(false);
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleAcceptInvite = async () => {
    if (props.status !== "valid") return;
    
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
          group_id: props.invite.groupId,
          role: 'member'
        }]);

      if (memberError) throw memberError;

      // Mark invite as accepted
      const { error: inviteError } = await supabase
        .from("group_invites")
        .update({ accepted: true })
        .eq("id", props.invite.id);

      if (inviteError) throw inviteError;

      toast.success("Successfully joined group", {
        description: `You are now a member of ${props.invite.groupName}`,
      });
      
      router.push(`/group/${props.invite.groupId}`);
    } catch (error: Error) {
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
              {props.status === "valid" 
                ? `Join ${props.invite.groupName}`
                : "Group Invite"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-gray-600">
              {props.status === "valid"
                ? "You've been invited to join this group. Would you like to accept the invitation?"
                : props.message}
            </p>

            <div className="flex justify-center gap-2">
              {props.status === "valid" && (
                <>
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
                </>
              )}

              {props.status === "unauthenticated" && (
                <Link 
                  href={`/?callbackUrl=${encodeURIComponent(props.callbackUrl)}`}
                  className="w-full"
                >
                  <Button className="w-full">
                    Sign In to Accept
                  </Button>
                </Link>
              )}

              {(props.status === "invalid" || props.status === "mismatch") && (
                <Button
                  onClick={() => router.push("/dashboard")}
                >
                  Go to Dashboard
                </Button>
              )}

              {props.status === "accepted" && (
                <Button
                  onClick={() => router.push(`/group/${props.groupId}`)}
                >
                  View Group
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 