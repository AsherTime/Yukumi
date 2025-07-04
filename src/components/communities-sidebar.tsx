"use client"

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type CommunitiesSidebarProps = {
  selectedAnime: string[];
  setSelectedAnime: React.Dispatch<React.SetStateAction<string[]>>;
};

export function CommunitiesSidebar({
  selectedAnime,
  setSelectedAnime,
}: CommunitiesSidebarProps) {
  const [allAnime, setAllAnime] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchAnime = async () => {
      const { data, error } = await supabase.from("Anime").select("title");

      if (error) {
        console.error("Error fetching anime:", error);
      } else if (data) {
        const titles = data.map((anime) => anime.title);
        setAllAnime(titles);
      }
    };

    fetchAnime();
  }, []);

  const addCommunity = (title: string) => {
    if (!selectedAnime.includes(title)) {
      setSelectedAnime((prev) => [...prev, title]);
    }
  };

  const removeCommunity = (title: string) => {
    setSelectedAnime((prev) => prev.filter((anime) => anime !== title));
  };

  const filteredAnime = allAnime.filter(
    (title) =>
      title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !selectedAnime.includes(title)
  );

  return (
    <div className="w-[250px] border-r border-zinc-800 flex flex-col">
      <div className="h-[calc(100vh-104px)] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800 px-4 pb-4 pt-4">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search anime..."
          className="w-full p-2 rounded bg-zinc-900 text-white placeholder-zinc-500 mb-4"
        />

        {/* Selected Communities */}
        {selectedAnime.length > 0 && (
          <div className="mb-6">
            <p className="text-xs text-zinc-400 mb-2">Selected Communities:</p>
            {selectedAnime.map((title) => (
              <div
                key={title}
                className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-zinc-800/50 group"
              >
                <span className="text-white text-sm">{title}</span>
                <button
                  onClick={() => removeCommunity(title)}
                  className="opacity-0 group-hover:opacity-100"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Search Results */}
        {searchQuery && filteredAnime.length > 0 && (
          <div>
            <p className="text-xs text-zinc-400 mb-2">Search Results:</p>
            {filteredAnime.map((title) => (
              <div
                key={title}
                className="py-2 px-3 rounded-lg hover:bg-zinc-800/50 cursor-pointer"
                onClick={() => addCommunity(title)}
              >
                <span className="text-white text-sm">{title}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


