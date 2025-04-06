import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import DashboardClient from "./DashboardClient";

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
      },
    }
  );

  // Get the current session
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
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
  const groups = userGroups.map((userGroup) => (userGroup as UserGroup).groups);

  return <DashboardClient initialGroups={groups} userId={session.user.id} />;
} 