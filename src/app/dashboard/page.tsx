import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const supabase = createServerComponentClient({ cookies });

  // Get the current session
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    redirect("/");
  }

  // Fetch user's groups
  const { data: userGroups, error: userGroupsError } = await supabase
    .from("user_groups")
    .select(`
      group_id,
      groups (
        id,
        name,
        created_at
      )
    `)
    .eq("user_id", session.user.id)
    .order("created_at", { foreignTable: "groups", ascending: false });

  if (userGroupsError) {
    console.error("Error fetching groups:", userGroupsError);
    throw new Error("Failed to load groups");
  }

  // Transform the data to get just the groups
  const groups = userGroups.map(ug => ug.groups);

  return <DashboardClient initialGroups={groups} userId={session.user.id} />;
} 