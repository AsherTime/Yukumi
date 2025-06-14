"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TopNav } from "@/components/top-nav";
import Footer from "@/components/footer";
import { ListPlus, Pause, X, Play, Calendar, Check, ChevronDown } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { handleQuickReviewer } from "@/utils/dailyTasks";
import { toast } from "sonner";
import { awardPoints } from "@/utils/awardPoints";
import { se } from "date-fns/locale";
import { set } from "date-fns";

type Anime = {
  image_url: string;
  title: string;
  synopsis: string;
  type: string;
  episodes: number;
  season: string;
  aired_from: string;
  aired_to: string;
  genres: string[];
  score: number;
  rank: number;
  popularity: number;
  members: number;
  tags: string[];
  studio: string[]
};

type UserAnime = {
  user_id: string;
  anime_id: string;
  status: string;
  progress: number;
  score: number;
};

function formatDate(dateStr?: string) {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}


export default function AnimeDetail() {

  const params = useParams();
  const id = params?.id ? String(params.id) : undefined;
  const { user } = useAuth();
  const router = useRouter();
  const [isInList, setIsInList] = useState(false);
  const [, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [anime, setAnime] = useState<Anime | null>(null);
  const [animeList, setAnimeList] = useState<UserAnime>();
  const [watchlistStatus, setWatchlistStatus] = useState<string>("");
  const [progress, setProgress] = useState(1);
  const [score, setScore] = useState(1);
  const [shouldUpdate, setShouldUpdate] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);


  useEffect(() => {
    const fetchAnimeDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await supabase
          .from("Anime")
          .select("*")
          .eq("id", id)
          .single();
        setAnime(data.data);
      } catch (error) {
        console.error("Error fetching anime details:", error);
        setError("Failed to load anime details. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    const inList = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from("UserAnime")
        .select("*")
        .eq("user_id", user.id)
        .eq("anime_id", id)
        .maybeSingle();
      if (error) throw error;
      setIsInList(!!data);
      setAnimeList(data || null);
      setWatchlistStatus(data?.status || "");
      setProgress(data?.progress || 1);
      setScore(data?.score || 1);
    }
    if (id) {
      fetchAnimeDetails();
      inList();
    }
  }, [id, user]);

  useEffect(() => {
    console.log("Anime? :", isInList);
    console.log("Anime List:", animeList);
  }, [animeList]);


  const handleUpdate = async () => {
    if (!user || !id) return;

    try {
      // Update watchlist status and progress
      const { error } = await supabase
        .from("UserAnime")
        .upsert(
          {
            user_id: user.id,
            anime_id: id,
            status: watchlistStatus,
            score: score,
          },
          {
            onConflict: 'user_id,anime_id'
          }
        )

      if (error) throw error;

      setShouldUpdate(false);
      setUpdateSuccess(true);
    } catch (error: any) {
      console.error('Error updating watchlist:', error?.message || error);
      console.log('Full error object:', error);
      toast.error('Failed to update watchlist. Please try again.');
    }
  };

  const handleDelete = async () => {
    if (!user || !id) return;

    try {
      const { error } = await supabase
        .from("UserAnime")
        .delete()
        .eq("user_id", user.id)
        .eq("anime_id", id);
      if (error) throw error;
      setIsInList(false);
      setWatchlistStatus("");
      setProgress(1);
      setScore(1);
      toast.success('Anime removed from your list successfully!');
    } catch (error) {
      console.error('Error deleting anime from list:', error);
      toast.error('Failed to remove anime from your list. Please try again.');
    }
  };

  const handleVisitCommunity = async () => {
    if (!id) return;
    // Fetch the community for this anime
    const { data: community, error } = await supabase
      .from('community')
      .select('id')
      .eq('anime_id', id)
      .maybeSingle();
    if (error || !community) {
      alert('Community not found for this anime!');
      return;
    }
    router.push(`/community/${community.id}`);
  };

  if (error) return <p className="text-center text-red-500">{error}</p>;
  if (!anime) return <p className="text-center text-gray-400">Loading anime...</p>;

  return (
    <div className="container mx-auto px-4 py-8 space-y-12">
      <TopNav />

      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Left Column - Image & Community */}
          <div className="space-y-4">
            {/* Anime Image */}
            <div className="p-4 flex justify-center items-center relative" style={{ maxHeight: '400px' }}>
              <Image
                src={anime.image_url || "/placeholder.svg"}
                alt={anime.title || "Anime image"}
                width={500}
                height={400}
                className="rounded-lg object-contain w-full h-full"
              />
            </div>


            {/* Join Community Button */}
            <button
              className="w-full py-3  text-white font-medium rounded bg-[#B624FF] hover:bg-[#B624FF]/80 transition-colors"
              onClick={handleVisitCommunity}
            >
              VISIT COMMUNITY
            </button>

            <div className="bg-[#1f1f1f] text-white p-4 rounded space-y-4 mt-4">
              {/* Status Dropdown */}
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-white mb-1">Status</label>
                <select
                  id="status"
                  value={watchlistStatus}
                  onChange={(e) => setWatchlistStatus(e.target.value)}
                  className="w-full p-2 rounded bg-zinc-800 text-white border border-zinc-600"
                >
                  {!isInList && <option value="">Add to List</option>}
                  <option value="Watching">Watching</option>
                  <option value="Completed">Completed</option>
                  <option value="On-Hold">On-Hold</option>
                  <option value="Dropped">Dropped</option>
                  <option value="Planning">Planning</option>
                </select>
              </div>

              {/* Score Dropdown - only show if anime is in list */}
              {isInList && (
                <div>
                  <label htmlFor="score" className="block text-sm font-medium text-white mb-1">Score</label>
                  <select
                    id="score"
                    value={score}
                    onChange={(e) => setScore(parseInt(e.target.value))}
                    className="w-full p-2 rounded bg-zinc-800 text-white border border-zinc-600"
                  >
                    <option value="">Select Score</option>
                    {[...Array(10)].map((_, i) => (
                      <option key={i + 1} value={i + 1}>{i + 1}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Update & Delete Buttons */}
              {isInList && (
                <div className="flex space-x-4">
                  <button
                    onClick={handleUpdate}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                  >
                    Update
                  </button>
                  <button
                    onClick={handleDelete}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
                  >
                    Delete
                  </button>
                  {updateSuccess && (
                    <span className="text-green-400 text-lg pt-1">Updated!</span>
                  )}
                </div>
              )}
            </div>


            {/* Anime Details */}
            <div className="bg-[#1f1f1f] text-white p-4 rounded space-y-2">
              <h3 className="font-bold mb-6">Anime Details</h3>
              <p>Type: {anime.type || "-"}</p>
              <p>Premiered: {anime.season || "-"}</p>
              <p>Episodes: {anime.episodes || "-"}</p>
              <p>Aired: {formatDate(anime.aired_from) || "-"} to {formatDate(anime.aired_to) || "-"}</p>
              <p>Genres: {anime.genres?.join(", ") || "-"}</p>
              <p>Studio: {anime.studio?.join(", ") || "-"}</p>
            </div>
          </div>

          {/* Right Column - Anime Details */}
          <div className="md:col-span-3 space-y-4">
            {/* Title & Synopsis */}
            <div className="bg-[#1f1f1f] text-white p-6">
              <h1 className="text-3xl font-bold">{anime.title}</h1>
            </div>

            <div className="bg-[#1f1f1f] text-white p-6">

            </div>

            <div className="bg-[#1f1f1f] text-white p-6">
              <h3 className="text-lg font-semibold mb-4">Synopsis</h3>
              <p className="text-white mt-2 whitespace-pre-line">{anime.synopsis || "No synopsis available."}</p>
            </div>



            {/* Watch Now Button */}
            <Button className="bg-[#B624FF] hover:bg-[#B624FF]/80 text-white px-6 py-3 text-lg w-full">
              Watch Now
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
