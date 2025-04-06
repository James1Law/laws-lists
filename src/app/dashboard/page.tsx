import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import DashboardClient from "./DashboardClient";
import type { CookieOptions } from "@supabase/ssr";

interface Group {
  id: string;
  name: string;
  created_at: string;
}

interface UserGroup {
  groups: Group;
}

export default async function DashboardPage() {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          // @ts-expect-error Known Next.js type issue – safe to ignore
          return cookieStore.get(name)?.value;
        },
        set: (_name: string, _value: string, _options: CookieOptions) => {
          // This is only used for server-side cookie setting, which we don't need here
        },
        remove: (_name: string, _options: CookieOptions) => {
          // This is only used for server-side cookie removal, which we don't need here
        },
      },
    }
  );

  // Get the current session
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  // If there's no session or there's an error, redirect to the sign-in page
  if (!session || sessionError) {
    console.error("Session error:", sessionError);
    redirect("/");
  }

  // Fetch user's groups
  const { data: userGroups, error: userGroupsError } = await supabase
    .from("user_groups")
    .select(`
      groups (
        id,
        name,
        created_at
      )
    `)
    .eq("user_id", session.user.id);

  if (userGroupsError) {
    console.error("Error fetching user groups:", userGroupsError);
    redirect("/");
  }

  // Transform the data to get just the groups
  const groups = userGroups.map((userGroup) => {
    const typedGroup = userGroup as unknown as UserGroup;
    return typedGroup.groups;
  });

  return <DashboardClient initialGroups={groups} userId={session.user.id} />;
} 