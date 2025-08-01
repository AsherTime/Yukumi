"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Input } from "@/components/ui/input";

interface Community {
  id: number;
  title: string;
  banner_url: string
}

interface Props {
  userId: string | null;
}

export default function JoinedCommunitiesSidebar({ userId }: Props) {
  const [communities, setCommunities] = useState<Community[]>([]);
  const router = useRouter();
  const [search, setSearch] = useState("");

  const filteredCommunities = useMemo(() => {
    if (!search.trim()) {
      return communities;
    }
    return communities.filter(c =>
      c.title.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, communities]);

  useEffect(() => {
    if (!userId) return;

    const fetchCommunities = async () => {
      // first, get the community IDs
      const { data: memberships, error } = await supabase
        .from("members")
        .select("community_id")
        .eq("user_id", userId);

      if (error) {
        console.error(error);
        return;
      }

      const communityIds = memberships?.map(m => m.community_id) ?? [];

      // then, get the community details
      const { data: communities, error: commError } = await supabase
        .from("community")
        .select("id, title, banner_url")
        .in("id", communityIds);

      if (commError) {
        console.error(commError);
        return;
      }

      // map them
      const mapped: Community[] = communities.map(c => ({
        id: c.id,
        title: c.title,
        banner_url: c.banner_url
      }));

      setCommunities(mapped);
    };

    fetchCommunities();
  }, [userId]);


  return (
    <aside className="w-60 shrink-0 border-r bg-transparent border-gray-200 p-4">

      <div className="sticky top-0 z-10 pb-4">
        <Input
          id="community-search"
          type="text"
          placeholder="Search your communities..."
          className="pl-2 pr-4 py-3 bg-[#181828] border border-zinc-700 text-white rounded-lg shadow focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all placeholder:text-zinc-400"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <ul className="space-y-4"> {/* Increased spacing between items */}
        {filteredCommunities.map((c) => (
          <li key={c.id}>
            <button
              onClick={() => router.push(`/community/${c.id}`)}
              className={`
          w-full px-6 py-4 text-white font-medium rounded-full
          bg-gradient-to-r from-pink-400 to-purple-600
          hover:opacity-90 transition-all duration-200
          ${c.banner_url ? 'bg-cover bg-center text-white' : ''}
        `}
              style={c.banner_url ? { backgroundImage: `url(${c.banner_url})` } : {}}
            >
              <span className={`${c.banner_url ? 'bg-black/70' : ''} rounded-md`}>
                {c.title}
              </span>
            </button>
          </li>
        ))}

        {communities.length === 0 && (
          <li className="text-sm text-gray-500">
            You haven&apos;t joined any communities yet.
          </li>
        )}
      </ul>


    </aside>
  );
}
