"use client"

import React, { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Search, Heart } from "lucide-react"
import Image from "next/image"
import { TopNav } from "@/components/top-nav";
import Footer from "@/components/footer"
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { handleQuickReviewer } from "@/utils/dailyTasks";
import { Command, CommandItem } from "@/components/ui/command";
import { toast } from "sonner";
import { awardPoints } from "@/utils/awardPoints";
import { useLoginGate } from '@/contexts/LoginGateContext';


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

const AnimeCard = ({ anime, favourites, selectedStatus, score, onViewDetails, onTagClick, selectedTags, handleScoreChange, handleStatusChange, toggleFavourite }: AnimeCardProps) => {
  const [openScore, setOpenScore] = useState(false);
  const [openStatus, setOpenStatus] = useState(false);
  const [communityId, setCommunityId] = useState<number | null>(null);
  const isInList = !!selectedStatus && selectedStatus !== "";
  const router = useRouter();
  const { requireLogin } = useLoginGate();

  const handleOpenChange = (nextState: boolean) => {
    if (nextState) {
      // Only allow opening if logged in
      const allowed = requireLogin();
      if (allowed) setOpenStatus(true);
    } else {
      setOpenStatus(false);
    }
  };


  useEffect(() => {
    async function fetchCommunity() {
      const { data, error } = await supabase.from("community").select("id").eq("anime_id", anime.id).maybeSingle();
      if (error) {
        console.error("Failed to fetch community data:", error.message);
        return false;
      }
      setCommunityId(data?.id);
    }
    fetchCommunity();
  }, [anime.id]);



  // Combine tags and genres, deduplicate, and show up to 3
  //const tagSet = new Set([...(anime.tags || []), ...(anime.genres || [])]);
  const tags = anime.tags || [];
  return (
    <Card className="bg-[#181828] border-zinc-800 shadow-lg hover:scale-[1.025] hover:shadow-xl transition-transform duration-200 relative flex flex-col">
      <button
        className="absolute top-3 left-3 z-10 bg-black/60 rounded-full p-1 hover:bg-pink-600 transition-colors"
        onClick={() => {
          const allowed = requireLogin();
          if (!allowed) return;
          toggleFavourite(anime.id)
        }}
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
      <CardHeader className="pb-2 mb-2 ml-2">
        <CardTitle className="text-lg font-bold text-white truncate">{anime.title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2 pb-2 mb-2">
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
      <div className="flex flex-col gap-1 text-sm text-zinc-300 pb-2 ml-[30px] mb-2">
        {/* ─────────── Score dropdown ─────────── */}
        {isInList && (
          <Popover open={openScore} onOpenChange={setOpenScore}>
            <PopoverTrigger asChild>
              <button className="text-left w-full mb-2 ml-1">
                Your Score:&nbsp;
                <span className="font-semibold text-white">{score === 0 ? "-" : score}</span>
              </button>
            </PopoverTrigger>
            <PopoverContent className="p-0 w-32 bg-zinc-800 border-zinc-700">
              <Command>
                {scoreOptions.map((n) => (
                  <CommandItem
                    key={n}
                    onSelect={() => {
                      setOpenScore(false);
                      handleScoreChange(anime.id, n, selectedStatus);
                    }}
                    className="cursor-pointer hover:bg-zinc-700 hover:text-white transition-colors"
                  >
                    {n}
                  </CommandItem>
                ))}
              </Command>
            </PopoverContent>
          </Popover>
        )}

        {/* ─────────── Status Dropdown ─────────── */}
        <Popover open={openStatus} onOpenChange={handleOpenChange}>
          <PopoverTrigger asChild>
            <button className="w-full text-left p-1 rounded-md transition-all duration-200 ease-in-out hover:bg-zinc-700 hover:shadow-md
                     flex items-center justify-between ml-[-10px]">
              <Badge
                className={`px-3 py-1 text-sm font-medium rounded-lg text-white 
                  ${statusColors?.[selectedStatus] || 'bg-zinc-700'}`}
              >
                {isInList ? selectedStatus : "Add to List"}
              </Badge>
              {/* Dropdown Icon */}
              {isInList &&
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-4 w-4 text-zinc-400 ml-2"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0L5.23 8.29a.75.75 0 01.02-1.06z"
                    clipRule="evenodd"
                  />
                </svg>
              }
            </button>
          </PopoverTrigger>

          {/* You will apply this class to your PopoverContent component */}
          <PopoverContent className="p-2 w-48 bg-zinc-800 border border-zinc-700 rounded-xl shadow-lg -translate-x-4">
            {/* Popover content from your previous code */}
            <Command>
              {(isInList
                ? statusOptions
                : statusOptions.filter(opt => opt.value !== "Remove from List")
              ).map(({ label, value }) => (
                <CommandItem
                  key={value}
                  onSelect={() => {
                    setOpenStatus(false);
                    handleStatusChange(anime.id, value);
                  }}
                  className={`px-3 py-2 rounded-md cursor-pointer text-sm font-medium transition-colors 
                    hover:bg-zinc-700 focus:bg-zinc-700 focus:outline-none 
                    ${statusColors?.[value] ?? ""}`}
                >
                  {label}
                </CommandItem>
              ))}
            </Command>
          </PopoverContent>

        </Popover>
      </div>
      <CardFooter className="flex gap-2 mt-auto">
        <Button variant="outline" className="flex-1" onClick={() => router.push(`/community/${communityId}`)}>Visit Community</Button>
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

const AnimeBanner = () => {
  const router = useRouter();
  const { requireLogin } = useLoginGate();
  return (
    <section className="w-full relative h-[260px] md:h-[340px] flex items-end justify-center overflow-hidden">
      <Image src={ANIME_BANNER_URL} alt="Anime Banner" fill className="object-cover w-full h-full" priority />
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 to-black/90 flex flex-col items-center justify-center text-center px-4">
        <h1 className="hidden md:block text-2xl md:text-4xl font-extrabold text-white drop-shadow-lg mb-2">FIND THE BEST ANIME FOR YOU</h1>
        <p className="text-zinc-300 mb-4">Take the quiz and discover what fits your vibe</p>
        <Button
          onClick={() => {
            const allowed = requireLogin();
            if (!allowed) return;
            router.push("/quiz/find-anime")
          }}
          className="px-8 py-3 text-lg font-bold bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg hover:scale-105 hover:shadow-pink-500/40 transition-transform">TRY NOW</Button>
      </div>
    </section>
  )
};


const AnimeBrowser: React.FC = () => {
  const [animeList, setAnimeList] = useState<Anime[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("All");
  const [favourites, setFavourites] = useState<string[]>([]);
  const { user } = useAuth()
  const userId = user?.id || "";

  const fetchAnimeList = async (): Promise<Anime[]> => {
    const { data, error } = await supabase.from("Anime").select("*, tags, genres").order("rank");
    if (error) {
      console.error("Failed to fetch anime list:", error);
      return [];
    } else {
      return data || [];
    }
  };

  useEffect(() => {
    const fetchFavourites = async () => {
      const { data, error } = await supabase
        .from("Profiles")
        .select("favourites")
        .eq("id", userId)
        .maybeSingle();

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

  const [, setStatusMap] = useState<Record<string, string>>({});
  const [, setScoreMap] = useState<Record<string, number | null>>({});

  useEffect(() => {
    async function loadData() {
      const statusOrder = ["Watching", "Completed", "On-Hold", "Dropped", "Planning"];

      // This runs for everyone (even if not logged in)
      const fetchedAnimeList = await fetchAnimeList();
      let enrichedAnimeList = fetchedAnimeList;
      let statusMap = {};
      let scoreMap = {};

      // Only run this if user is logged in
      if (userId) {
        const userData = await fetchUserAnimeData(userId, fetchedAnimeList);
        enrichedAnimeList = userData.enrichedAnimeList;
        statusMap = userData.statusMap;
        scoreMap = userData.scoreMap;
      }

      const sortedAnimeList = enrichedAnimeList.sort((a, b) => {
        const aStatusIndex = statusOrder.indexOf(a.status);
        const bStatusIndex = statusOrder.indexOf(b.status);

        const aRank = aStatusIndex === -1 ? Infinity : aStatusIndex;
        const bRank = bStatusIndex === -1 ? Infinity : bStatusIndex;

        if (aRank !== bRank) {
          return aRank - bRank;
        }

        return (b.score || 0) - (a.score || 0);
      });

      setAnimeList(sortedAnimeList);
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
          15,
          animeId,
          'anime'
        );
        toast.success('Review submitted successfully! +15 XP');
      }
    } catch (pointsError) {
      console.error('Failed to award points for review:', pointsError);
      toast.warning('Review submitted, but points system is temporarily unavailable');
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
        <div className="max-w-7xl mx-auto px-4 flex flex-col lg:flex-row items-stretch lg:items-center gap-4 mb-6">
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