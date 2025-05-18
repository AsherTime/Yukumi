"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
// If you generated Supabase types with the CLI, import them instead of `any`

interface Community {
  id: number;
  title: string;
}

interface Props {
  userId: string | null;
}

export default function JoinedCommunitiesSidebar({ userId }: Props) {
  const [communities, setCommunities] = useState<Community[]>([]);
  const router = useRouter();

 useEffect(() => {
  if (!userId) return;

  const fetchCommunities = async () => {
    console.log(userId)
    const { data, error } = await supabase
      .from("members")
      .select("community_id, community(title)") // only fetch the title from the related community
      .eq("user_id", userId);

    if (error) {
      console.error("Failed to fetch communities:", error.message);
      return;
    }

    // Map to [{ id: community_id, title }]
    const mapped: Community[] = (data as any[]).map((row) => ({
      id: row.community_id,
      title: row.community?.title,
    }));

    setCommunities(mapped);
  };

  fetchCommunities();
}, [userId]);


  return (
    <aside className="w-60 shrink-0 border-r border-gray-200 p-4">
      <h2 className="mb-3 text-lg font-semibold">Your Communities</h2>

      <ul className="space-y-1">
        {communities.map((c) => (
          <li key={c.id}>
            <button
              onClick={() => router.push(`/community/${c.id}`)}
              className="w-full rounded px-3 py-2 text-left hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {c.title}
            </button>
          </li>
        ))}

        {communities.length === 0 && (
          <li className="text-sm text-gray-500">
            You haven’t joined any communities yet.
          </li>
        )}
      </ul>
    </aside>
  );
}
