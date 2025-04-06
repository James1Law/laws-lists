import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import ShareGroup from "./ShareGroup";

interface Group {
  id: string;
  name: string;
  created_at: string;
}

export default async function GroupPage(props: {
  params: { id: string };
}) {
  const { params } = props;
  const groupId = params.id;
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
  
  if (!session) {
    redirect("/");
  }

  // Fetch group details and check membership
  const { data: userGroup, error: userGroupError } = await supabase
    .from("user_groups")
    .select(`
      role,
      groups (
        id,
        name,
        created_at
      )
    `)
    .eq("group_id", groupId)
    .eq("user_id", session.user.id)
    .single();

  if (userGroupError || !userGroup) {
    console.error("Error fetching group:", userGroupError);
    redirect("/dashboard");
  }

  const isOwner = userGroup.role === "owner";
  const group = userGroup.groups as unknown as Group;

  return (
    <div className="min-h-screen p-4 bg-gray-50">
      <div className="max-w-xl mx-auto space-y-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="text-gray-500 hover:text-gray-700"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-2xl font-bold">{group.name}</h1>
          </div>
        </div>

        {/* Group content will go here */}
        
        <div className="mt-8">
          <ShareGroup 
            groupId={group.id} 
            groupName={group.name}
            isOwner={isOwner} 
          />
        </div>
      </div>
    </div>
  );
} 