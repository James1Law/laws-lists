import { createServerClient, type CookieOptions } from "@supabase/ssr";
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
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.delete({ name, ...options });
        },
      },
    }
  );

  // Get the current session
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  // If there's no session or there's an error, redirect to the sign-in page
  if (!session || sessionError) {
    console.error("Session error:", sessionError);
    redirect("/auth/sign-in");
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