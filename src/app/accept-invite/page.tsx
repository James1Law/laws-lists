import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AcceptInviteClient from "./AcceptInviteClient";
import { type PageProps } from "next";

interface Group {
  id: string;
  name: string;
}

interface Invite {
  id: string;
  email: string;
  accepted: boolean;
  groups: Group;
}

export default async function AcceptInvitePage(props: PageProps) {
  const { searchParams } = props;
  const token = typeof searchParams?.token === 'string' ? searchParams.token : undefined;
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          // @ts-expect-error Known Next.js type issue – safe to ignore
          const cookie = cookieStore.get(name);
          return cookie?.value;
        },
      },
    }
  );

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

  const typedInvite = invite as unknown as Invite;

  // Handle already accepted invite
  if (typedInvite.accepted) {
    return (
      <AcceptInviteClient
        status="accepted"
        message="This invite has already been accepted."
        groupId={typedInvite.groups.id}
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
  if (typedInvite.email.toLowerCase() !== session.user.email?.toLowerCase()) {
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
        id: typedInvite.id,
        groupId: typedInvite.groups.id,
        groupName: typedInvite.groups.name,
        token: token
      }}
    />
  );
} 