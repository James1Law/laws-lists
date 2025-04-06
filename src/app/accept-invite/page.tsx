import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AcceptInviteClient from "./AcceptInviteClient";

type SearchParams = { [key: string]: string | string[] | undefined };

export default async function AcceptInvitePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const token = typeof searchParams.token === 'string' ? searchParams.token : undefined;
  const supabase = createServerComponentClient({ cookies });

  // Get the current session
  const { data: { session } } = await supabase.auth.getSession();

  // If no token provided, redirect to dashboard
  if (!token) {
    redirect("/dashboard");
  }

  // Fetch invite details
  const { data: invite, error: inviteError } = await supabase
    .from("group_invites")
    .select(`
      id,
      email,
      accepted,
      groups (
        id,
        name
      )
    `)
    .eq("token", token)
    .single();

  // Handle invalid or expired invite
  if (inviteError || !invite) {
    return (
      <AcceptInviteClient
        status="invalid"
        message="This invite link is invalid or has expired."
      />
    );
  }

  // Handle already accepted invite
  if (invite.accepted) {
    return (
      <AcceptInviteClient
        status="accepted"
        message="This invite has already been accepted."
        groupId={invite.groups.id}
      />
    );
  }

  // Handle not logged in
  if (!session) {
    // Save the current URL to redirect back after login
    const callbackUrl = `/accept-invite?token=${token}`;
    return (
      <AcceptInviteClient
        status="unauthenticated"
        message="Please sign in to accept this invite."
        callbackUrl={callbackUrl}
      />
    );
  }

  // Handle email mismatch
  if (invite.email.toLowerCase() !== session.user.email?.toLowerCase()) {
    return (
      <AcceptInviteClient
        status="mismatch"
        message="This invite was sent to a different email address."
      />
    );
  }

  // All checks passed, show the accept invite UI
  return (
    <AcceptInviteClient
      status="valid"
      invite={{
        id: invite.id,
        groupId: invite.groups.id,
        groupName: invite.groups.name,
        token: token
      }}
    />
  );
} 