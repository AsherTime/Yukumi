"use client"

import React, { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Search, Heart } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { TopNav } from "@/components/top-nav";
import Footer from "@/components/footer"
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Command, CommandItem } from "@/components/ui/command";
import { toast } from "sonner";
import { handleQuickReviewer } from "@/utils/dailyTasks";
import { awardPoints } from "@/utils/awardPoints";


interface Anime {
  id: string
  title: string
  image_url: string
  score: number | null
  status: string
  tags?: string[]
  genres?: string[]
} 

const ANIME_BANNER_URL = "https://ik.imagekit.io/g19tkydww/Background_Images/Leonardo_Phoenix_10_Highresolution_cinematic_animestyle_hero_b_3.jpg?updatedAt=1748013350841";

const scoreOptions = Array.from({ length: 10 }, (_, i) => i + 1);
const statusOptions = [
  { label: "Watching", value: "Watching" },
  { label: "Completed", value: "Completed" },
  { label: "On-Hold", value: "On-Hold" },
  { label: "Dropped", value: "Dropped" },
  { label: "Planning", value: "Planning" },
  { label: "Remove from List", value: "Remove from List" },
];
const statusColors: Record<string, string> = {
  "Remove from List": "text-grey-500",
  Watching: "text-green-500",
  Completed: "text-purple-500",
  "On-Hold": "text-yellow-500",
  Dropped: "text-red-500",
  Planning: "text-blue-500",
};


interface AnimeCardProps {
  anime: Anime;
  favourites: string[];
  selectedStatus: string;
  score: number | null;
  onViewDetails: () => void;
  onTagClick: (tag: string) => void;
  selectedTags: string[];
  handleScoreChange: (animeId: string, newScore: number, selectedStatus: string) => Promise<void>;
  handleStatusChange: (animeId: string, newStatus: string) => Promise<void>;
  toggleFavourite: (animeId: string) => void;
}

const AnimeCard = ({ anime, favourites, selectedStatus,  score, onViewDetails, onTagClick, selectedTags, handleScoreChange, handleStatusChange, toggleFavourite }: AnimeCardProps) => {
  const [openScore, setOpenScore] = useState(false);
  const [openStatus, setOpenStatus] = useState(false);
  const isInList = !!selectedStatus && selectedStatus !== "";
  // Combine tags and genres, deduplicate, and show up to 3
  //const tagSet = new Set([...(anime.tags || []), ...(anime.genres || [])]);
  const tags = anime.tags || [];
  return (
    <Card className="bg-[#181828] border-zinc-800 shadow-lg hover:scale-[1.025] hover:shadow-xl transition-transform duration-200 relative flex flex-col">
<button
  className="absolute top-3 left-3 z-10 bg-black/60 rounded-full p-1 hover:bg-pink-600 transition-colors"
  onClick={() => toggleFavourite(anime.id)}
>
  {favourites.includes(anime.id) ? (
    <Heart className="w-5 h-5 text-pink-500 fill-pink-500" />
  ) : (
    <Heart className="w-5 h-5 text-pink-400" />
  )}
</button>
      <div className="relative w-full h-48 rounded-t-lg overflow-hidden">
        <Image src={anime.image_url || "/placeholder.svg"} alt={anime.title} fill sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-cover" />
      </div>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-bold text-white truncate">{anime.title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2 pb-2">
        {tags.map((tag) => {
  const isSelected = selectedTags.includes(tag);
  return (
    <Badge
      key={tag + anime.id}
      variant={isSelected ? "default" : "secondary"}
      className={`cursor-pointer hover:bg-purple-700 hover:text-white transition-colors ${isSelected ? "bg-purple-700 text-white" : ""}`}
      onClick={() => onTagClick(tag)}
    >
      #{tag}
    </Badge>
  );
})}
      </CardContent>
       <div className="flex flex-col gap-1 text-sm text-zinc-300 pb-2 ml-[30px]">
      {/* ─────────── Score dropdown ─────────── */}
      <Popover open={openScore} onOpenChange={setOpenScore}>
        <PopoverTrigger asChild>
          <button className="text-left w-full">
            Your Score:&nbsp;
            <span className="font-semibold text-white">{score ?? "-"}</span>
          </button>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-32 bg-zinc-800 border-zinc-700">
          <Command>
            {scoreOptions.map((n) => (
              <CommandItem
                key={n}
                onSelect={() => {
                  setOpenScore(false);
                  // If not in list, add with status 'Completed'
                  handleScoreChange(anime.id, n, isInList ? selectedStatus : 'Completed');
                }}
              >
                {n}
              </CommandItem>
            ))}
          </Command>
        </PopoverContent>
      </Popover>

      {/* ─────────── Status Dropdown ─────────── */}
      <Popover open={openStatus} onOpenChange={setOpenStatus}>
        <PopoverTrigger asChild>
          <button className="w-full text-left">
            <Badge
              variant="outline"
              className={`bg-zinc-700 px-2 py-0.5 text-xs font-medium ${
                statusColors[selectedStatus] ?? "text-zinc-200"
              }`}
            >
              {isInList ? selectedStatus : "Add to List"}
            </Badge>
          </button>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-44 bg-zinc-800 border-zinc-700">
          <Command>
            {(isInList ? statusOptions : statusOptions.filter(opt => opt.value !== "Remove from List")).map(({ label, value }) => (
              <CommandItem
                key={value}
                onSelect={() => {
                  setOpenStatus(false);
                  handleStatusChange(anime.id, value);
                }}
                className={statusColors[value] ?? ""}
              >
                {label}
              </CommandItem>
            ))}
          </Command>
        </PopoverContent>
      </Popover>
    </div>
      <CardFooter className="flex gap-2 mt-auto">
        <Button variant="outline" className="flex-1">Join Community</Button>
        <Button variant="secondary" className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 text-white" onClick={onViewDetails}>View Details</Button>
      </CardFooter>
    </Card>
  );
};

interface AnimeSearchBarProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const AnimeSearchBar = ({ value, onChange }: AnimeSearchBarProps) => (
  <div className="flex justify-center w-full py-8">
    <div className="relative w-full max-w-xl">
      <Input
        type="text"
        placeholder="Search anime..."
        id="anime-search"
        value={value}
        onChange={onChange}
        className="pl-10 pr-4 py-3 bg-[#181828] border border-zinc-700 text-white rounded-lg shadow focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all placeholder:text-zinc-400"
      />
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 w-5 h-5" />
    </div>
  </div>
);

const AnimeBanner = () => (
  <section className="w-full relative h-[260px] md:h-[340px] flex items-end justify-center overflow-hidden">
    <Image src={ANIME_BANNER_URL} alt="Anime Banner" fill className="object-cover w-full h-full" priority />
    <div className="absolute inset-0 bg-gradient-to-b from-black/70 to-black/90 flex flex-col items-center justify-center text-center px-4">
      <h1 className="text-2xl md:text-4xl font-extrabold text-white drop-shadow-lg mb-2">FIND THE BEST ANIME FOR YOU</h1>
      <p className="text-zinc-300 mb-4">Take the quiz and discover what fits your vibe</p>
      <Link href="/quiz/find-anime">
        <Button className="px-8 py-3 text-lg font-bold bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg hover:scale-105 hover:shadow-pink-500/40 transition-transform">TRY NOW</Button>
      </Link>
    </div>
  </section>
);


const AnimeBrowser: React.FC = () => {
    const [animeList, setAnimeList] = useState<Anime[]>([])
  const [displayedAnime, setDisplayedAnime] = useState<Anime[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [page, setPage] = useState(1)
  const [favorites, setFavorites] = useState<Anime[]>([])
  const [userScores, setUserScores] = useState<Record<number, string>>({})
  const [userStatuses, setUserStatuses] = useState<Record<number, string>>({})
const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [score, setScore] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("All");
  const [favourites, setFavourites] = useState<string[]>([]);



  const { user } = useAuth()
  const userId = user?.id || "";

/*
  useEffect(() => {
    const start = (page - 1) * 50
    const end = start + 50
    let filtered = animeList
    if (searchQuery.trim()) {
      filtered = filtered.filter(anime =>
        anime.title?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
    if (selectedTag) {
      filtered = [
        ...filtered.filter(anime =>
          [...(anime.tags || []), ...(anime.genres || [])].includes(selectedTag)
        ),
        ...filtered.filter(anime =>
          ![...(anime.tags || []), ...(anime.genres || [])].includes(selectedTag)
        ),
      ]
    }
    setDisplayedAnime(filtered.slice(start, end))
  }, [animeList, searchQuery, page, selectedTag])*/

  const fetchAnimeList = async (): Promise<Anime[]> => {
  const { data, error } = await supabase.from("Anime").select("*, tags, genres").order("rank");
  if (error) {
    console.error("Failed to fetch anime list:", error);
    return [];
  } else {
    return data || [];
  }
};

/*
  const loadNextPage = () => {
    setPage((prev) => prev + 1)
  }

  const loadPreviousPage = () => {
    setPage((prev) => Math.max(1, prev - 1))
  }
*/

useEffect(() => {
  const fetchFavourites = async () => {
    const { data, error } = await supabase
      .from("Profiles")
      .select("favourites")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Failed to fetch favourites:", error.message);
    } else {
      setFavourites(data?.favourites ?? []); // Set local state
    }
  };

  if (userId) fetchFavourites();
}, [userId]);


const toggleFavourite = async (animeId: string) => {
  const isFavourited = favourites.includes(animeId);

  const updatedFavourites = isFavourited
    ? favourites.filter((id) => id !== animeId)
    : [...favourites, animeId];

  const { error } = await supabase
    .from("Profiles")
    .update({ favourites: updatedFavourites })
    .eq("id", userId);

  if (error) {
    console.error("Failed to update favourites:", error.message);
  } else {
    setFavourites(updatedFavourites); // Update local state
  }
};



// Fetch current status and score from Supabase if exists
const fetchUserAnimeData = async (
  userId: string,
  animeList: Anime[]
): Promise<{
  enrichedAnimeList: Anime[],
  statusMap: Record<string, string>,
  scoreMap: Record<string, number | null>
}> => {
  // 1. Fetch user's anime data from Supabase
  const { data: userAnimeRows, error } = await supabase
    .from("UserAnime")
    .select("anime_id, status, score")
    .eq("user_id", userId);

  if (error) {
    console.error("Failed to fetch user anime:", error.message);
    return {
      enrichedAnimeList: animeList,
      statusMap: {},
      scoreMap: {},
    };
  }

  // 2. Map userAnimeRows by anime_id for quick lookup
  const userAnimeMap = new Map<string, { status: string; score: number | null }>();
  userAnimeRows.forEach((row) => {
    userAnimeMap.set(row.anime_id, {
      status: row.status,
      score: row.score,
    });
  });

  // 3. Prepare status and score maps
  const statusMap: Record<string, string> = {};
  const scoreMap: Record<string, number | null> = {};

  // 4. Enrich each anime in animeList with user's status/score
  const enrichedAnimeList = animeList.map((anime) => {
    const userData = userAnimeMap.get(anime.id);
    const status = userData?.status ?? "";
    const score = userData?.score ?? null;

    statusMap[anime.id] = status;
    scoreMap[anime.id] = score;

    return {
      ...anime,
      status,
      score,
    };
  });

  return { enrichedAnimeList, statusMap, scoreMap };
};
const [statusMap, setStatusMap] = useState<Record<string, string>>({});
const [scoreMap, setScoreMap] = useState<Record<string, number | null>>({});

useEffect(() => {
  async function loadData() {
      if (!userId) {
      return;
    }
    const fetchedAnimeList = await fetchAnimeList();
    const { enrichedAnimeList, statusMap, scoreMap } = await fetchUserAnimeData(userId, fetchedAnimeList);
    setAnimeList(enrichedAnimeList);
    setStatusMap(statusMap);
    setScoreMap(scoreMap);
  }
  loadData();
}, [userId]);

const handleTagClick = (tag: string) => {
  setSelectedTags((prevTags) =>
    prevTags.includes(tag)
      ? prevTags.filter((t) => t !== tag)
      : [...prevTags, tag]
  );
};




  // Handle status change
const handleStatusChange = async (animeId: string, newStatus: string) => {
  setLoading(true);

  if (newStatus === "Remove from List") {
    // Delete from Supabase
    const { error } = await supabase
      .from("UserAnime")
      .delete()
      .match({ user_id: userId, anime_id: animeId });

    if (error) console.error("Error removing from list:", error.message);

    // Update local state
    setStatusMap((prev) => {
      const updated = { ...prev };
      delete updated[animeId];
      return updated;
    });

    setScoreMap((prev) => {
      const updated = { ...prev };
      delete updated[animeId];
      return updated;
    });

    setAnimeList((prevList) =>
      prevList.map((anime) =>
        anime.id === animeId ? { ...anime, status: "", score: null } : anime
      )
    );
  } else {
    // Normal status update
    const { error } = await supabase
      .from("UserAnime")
      .upsert(
        {
          user_id: userId,
          anime_id: animeId,
          status: newStatus,
        },
        {
          onConflict: "user_id,anime_id",
        }
      );

    if (error) console.error("Error updating status:", error.message);

    setStatusMap((prev) => ({ ...prev, [animeId]: newStatus }));

    setAnimeList((prevList) =>
      prevList.map((anime) =>
        anime.id === animeId ? { ...anime, status: newStatus } : anime
      )
    );
  }

  setLoading(false);
};

  // Handle score change
  const handleScoreChange = async (animeId: string, newScore: number, selectedStatus: string) => {
    setScoreMap((prev) => ({ ...prev, [animeId]: newScore }));
    setLoading(true);
    const { error } = await supabase
      .from("UserAnime")
      .upsert(
        {
          user_id: userId,
          anime_id: animeId,
          score: newScore,
          status: selectedStatus,
        },
        {
          onConflict: "user_id,anime_id",
        }
      );

    // Update local animeList state immediately
    setAnimeList((prevList) =>
      prevList.map((anime) =>
        anime.id === animeId
          ? { ...anime, score: newScore, status: selectedStatus }
          : anime
      )
    );

    // If you have separate score or status maps, update them too
    setScoreMap(prev => ({
      ...prev,
      [animeId]: newScore,
    }));
    setStatusMap(prev => ({
      ...prev,
      [animeId]: selectedStatus,
    }));

    // Try to award points for the Quick Reviewer task
    if (newScore > 0) {
      try {
        const wasAwarded = await handleQuickReviewer(
          userId,
          animeId,
          'anime'
        );

        if (wasAwarded) {
          toast.success('Review submitted and daily task completed! +25 XP');
        } else {
          // Award points for review submission even if daily task is already completed
          await awardPoints(
            userId,
            'review_submitted',
            5,
            animeId,
            'anime'
          );
          toast.success('Review submitted successfully! +5 XP');
        }
      } catch (pointsError) {
        console.error('Failed to award points for review:', pointsError);
        toast.error('Review submitted, but points system is temporarily unavailable');
      }
    }

    setLoading(false);
    if (error) console.error("Error updating score:", error.message);
  };

  const [showFavouritesOnly, setShowFavouritesOnly] = useState(false);
  

  return (
    <div className="min-h-screen bg-[#10101a] flex flex-col">
      <TopNav />
      <main className="flex-1 flex flex-col">
        <AnimeBanner />
<div className="max-w-7xl mx-auto px-4 flex items-center gap-4 mb-6">        
  <AnimeSearchBar value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
  <div>
    <label htmlFor="status-filter" className="sr-only">Filter by Status</label>
    <select
      id="status-filter"
      value={filterStatus}
      onChange={(e) => setFilterStatus(e.target.value)}
      className="px-3 py-2 rounded border text-sm bg-zinc-800 text-white"
    >
      <option value="All">All</option>
      <option value="Watching">Watching</option>
      <option value="Completed">Completed</option>
      <option value="On-Hold">On-Hold</option>
      <option value="Dropped">Dropped</option>
      <option value="Planning">Planning</option>
    </select>
  </div>
    <button
  onClick={() => setShowFavouritesOnly(prev => !prev)}
  className={`px-3 py-2 rounded text-sm font-medium whitespace-nowrap min-w-[140px] ${showFavouritesOnly ? "bg-zinc-800 text-zinc-200" : "bg-pink-600 text-white"}`}
>
  {showFavouritesOnly ? "Show All" : "Show Favourites"}
</button>

</div>
       {selectedTags.length > 0 && (
  <div className="max-w-7xl mx-auto w-full px-4 pb-2 flex items-center gap-2">
    <span className="text-zinc-300 text-sm">Filtering by tag:</span>
    {/* Render each selected tag as a Badge */}
    {selectedTags.map((tag) => (
      <Badge key={tag} variant="default" className="bg-purple-700 text-white">
        #{tag}
      </Badge>
    ))}
    <Button
      size="sm"
      variant="ghost"
      className="text-xs px-2 py-1"
      onClick={() => setSelectedTags([])}
    >
      Clear
    </Button>
  </div>
)}

        <section className="max-w-7xl mx-auto w-full px-4 pb-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {animeList.length === 0 ? (
              <div className="col-span-full text-center text-zinc-400 py-16 text-lg">No anime found.</div>
            ) : (
              animeList
  .filter((anime) => {
    const matchesStatus = filterStatus === "All" || anime.status === filterStatus;
    const isFavourited = !showFavouritesOnly || favourites.includes(anime.id);
    const matchesTags =
      selectedTags.length === 0 ||
      selectedTags.every(tag => anime.tags?.includes(tag)); // assuming anime.tags is an array
    const matchesSearch =
      searchQuery.trim() === "" ||
      anime.title.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStatus && isFavourited && matchesTags && matchesSearch;
  })


              .map((anime) => (
                <AnimeCard
                  key={anime.id}
                  anime={anime}
                  favourites={favourites}
                  selectedStatus={anime.status}
                  score={anime.score}
                  onViewDetails={() => window.location.href = `/anime/${anime.id}`}
                  onTagClick={handleTagClick}
                  selectedTags={selectedTags}
                  handleScoreChange={handleScoreChange}
                  handleStatusChange={handleStatusChange}
                  toggleFavourite={toggleFavourite}
                />
              ))
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

export default AnimeBrowser