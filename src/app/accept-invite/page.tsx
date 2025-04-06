import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AcceptInviteClient from "./AcceptInviteClient";

export default async function AcceptInvitePage({
  searchParams,
}: {
  searchParams: { token?: string };
}) {
  const supabase = createServerComponentClient({ cookies });

  // Get the current session
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    // Save the token in the URL when redirecting to sign in
    const callbackUrl = `/accept-invite?token=${searchParams.token}`;
    redirect(`/?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }

  if (!searchParams.token) {
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
    .eq("token", searchParams.token)
    .single();

  if (inviteError || !invite) {
    redirect("/dashboard");
  }

  // Check if invite is for the current user
  if (invite.email.toLowerCase() !== session.user.email?.toLowerCase()) {
    redirect("/dashboard");
  }

  // Check if already accepted
  if (invite.accepted) {
    redirect(`/group/${invite.groups.id}`);
  }

  return (
    <AcceptInviteClient
      invite={{
        id: invite.id,
        groupId: invite.groups.id,
        groupName: invite.groups.name,
        token: searchParams.token
      }}
    />
  );
} 