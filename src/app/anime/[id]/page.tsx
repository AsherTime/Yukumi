"use client";
export const runtime = "edge";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { TopNav } from "@/components/top-nav";
import Footer from "@/components/footer";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { handleQuickReviewer } from "@/utils/dailyTasks";
import { toast } from "sonner";
import { awardPoints } from "@/utils/awardPoints";
import { useLoginGate } from '@/contexts/LoginGateContext';

type Anime = {
  image_url: string;
  title: string;
  synopsis: string;
  genres: string[];
  score: number;
  rank: number;
  popularity: number;
  members: number;
  tags: string[];
};

type UserAnime = {
  user_id: string;
  anime_id: string;
  status: string;
  progress: number;
  score: number;
};

type Subanime = {
  id: string;
  title: string;
  parent: string;
  episodes: number;
  type: string;
  aired_from: string;
  aired_to: string;
  studio: string[];
  usersubanime?: {
    progress?: number;
    score?: number;
    user_id?: string;
    subanime_id?: string;
  }[];
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
  const [subanime, setSubanime] = useState<Subanime[]>([]);
  const [, setAnimeList] = useState<UserAnime>();
  const [watchlistStatus, setWatchlistStatus] = useState<string>("Watching");
  const [, setProgress] = useState(0);
  const [score, setScore] = useState(0);
  const [, setShouldUpdate] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const { requireLogin } = useLoginGate();
  const [openSubId, setOpenSubId] = useState<string | null>(null);
  const [localProgressMap, setLocalProgressMap] = useState<{ [key: string]: string }>({});


  const toggleSub = (id: string) => {
    setOpenSubId((prev) => (prev === id ? null : id));
  };


  useEffect(() => {
    const fetchAnimeDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await supabase
          .from("Anime")
          .select("*")
          .eq("id", id)
          .maybeSingle();
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
      setWatchlistStatus(data?.status || "Watching");
      setProgress(data?.progress || 0);
      setScore(data?.score || 0);
    }
    const AnimeRelations = async () => {
      if (!user) {
        try {
          const {
            data,
            error,
          } = await supabase
            .from("subanime")
            .select("*")
            .eq("parent", id);

          if (error) throw error;

          setSubanime(data || []);
        }
        catch (error) {
          console.error("Error fetching anime relations:", error);
          toast.error("Failed to load anime relations. Please try again.");
        }
        return;
      }
      try {
        const {
          data,
          error,
        } = await supabase
          .from("subanime")
          .select(`
        *,
        usersubanime:usersubanime (
          progress,
          score
        )
      `)
          .eq("parent", id)
          .eq("usersubanime.user_id", user.id); // filter user's own progress/score

        if (error) throw error;

        setSubanime(data || []);
      } catch (error) {
        console.error("Error fetching anime relations:", error);
        toast.error("Failed to load anime relations. Please try again.");
      }
    };

    if (id) {
      fetchAnimeDetails();
      inList();
      AnimeRelations();
    }
  }, [id, user]);


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

      // If a score was provided, try to award points for the Quick Reviewer task
      if (score > 0) {
        try {
          const wasAwarded = await handleQuickReviewer(
            user.id,
            id,
            'anime'
          );

          if (wasAwarded) {
            toast.success('Review submitted and daily task completed! +25 XP');
          } else {
            // Award points for review submission even if daily task is already completed
            await awardPoints(
              user.id,
              'review_submitted',
              15,
              id,
              'anime'
            );
            toast.success('Review submitted successfully! +15 XP');
          }
        } catch (pointsError) {
          console.error('Failed to award points for review:', pointsError);
          toast.warning('Review submitted, but points system is temporarily unavailable');
        }
      } else {
        toast.success('Watchlist updated successfully!');
      }

      setShouldUpdate(false);
      setUpdateSuccess(true);
    } catch (error) {
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
      setWatchlistStatus("Watching");
      setProgress(0);
      setScore(0);
      toast.success('Anime removed from your list successfully!');
      router.refresh();
    } catch (error) {
      console.error('Error deleting anime from list:', error);
      toast.error('Failed to remove anime from your list. Please try again.');
    }
  };

  const handleProgressChange = async (subanimeId: string, value: string) => {
    const newProgress = parseInt(value, 10);
    if (!user || isNaN(newProgress)) return;

    const { error } = await supabase
      .from('usersubanime')
      .upsert(
        {
          user_id: user.id,
          subanime_id: subanimeId,
          progress: newProgress
        },
        { onConflict: 'user_id,subanime_id' }
      );

    if (error) {
      console.error('Error updating progress:', error.message);
    }
    else {
      setSubanime((prev) =>
        prev.map((item) =>
          item.id === subanimeId
            ? {
              ...item,
              usersubanime: [
                {
                  ...(item.usersubanime?.[0] || {}),
                  progress: newProgress,
                },
              ],
            }
            : item
        )
      );
      setLocalProgressMap((prev) => ({
        ...prev,
        [subanimeId]: newProgress.toString(),
      }));
      if (newProgress > 0) {
        try {
          const wasAwarded = await handleQuickReviewer(
            user.id,
            subanimeId,
            'anime'
          );

          if (wasAwarded) {
            toast.success('Review submitted and daily task completed! +25 XP');
          } else {
            // Award points for review submission even if daily task is already completed
            await awardPoints(
              user.id,
              'review_submitted',
              15,
              subanimeId,
              'anime'
            );
            toast.success('Review submitted successfully! +15 XP');
          }
        } catch (pointsError) {
          console.error('Failed to award points for review:', pointsError);
          toast.warning('Review submitted, but points system is temporarily unavailable');
        }
      } else {
        toast.success('Watchlist updated successfully!');
      }
    }
  };

  const handleScoreChange = async (subanimeId: string, value: string) => {
    const newScore = parseInt(value, 10);
    if (!user || isNaN(newScore)) return;

    const { error } = await supabase
      .from('usersubanime')
      .upsert(
        {
          user_id: user.id,
          subanime_id: subanimeId,
          score: newScore
        },
        { onConflict: 'user_id,subanime_id' }
      );

    if (error) {
      console.error('Error updating score:', error.message);
    }
    else {
      setSubanime((prev) =>
        prev.map((item) =>
          item.id === subanimeId
            ? {
              ...item,
              usersubanime: [
                {
                  ...(item.usersubanime?.[0] || {}),
                  score: newScore,
                },
              ],
            }
            : item
        )
      );
      if (newScore > 0) {
        try {
          const wasAwarded = await handleQuickReviewer(
            user.id,
            subanimeId,
            'anime'
          );

          if (wasAwarded) {
            toast.success('Review submitted and daily task completed! +25 XP');
          } else {
            // Award points for review submission even if daily task is already completed
            await awardPoints(
              user.id,
              'review_submitted',
              15,
              subanimeId,
              'anime'
            );
            toast.success('Review submitted successfully! +15 XP');
          }
        } catch (pointsError) {
          console.error('Failed to award points for review:', pointsError);
          toast.warning('Review submitted, but points system is temporarily unavailable');
        }
      } else {
        toast.success('Watchlist updated successfully!');
      }
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
            <div className="p-4 relative w-full h-[400px]">
              <Image
                src={anime.image_url || "/placeholder.svg"}
                alt={anime.title || "Anime image"}
                fill
                className="rounded-lg object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
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
              {isInList ? (
                <>
                  {/* Status Dropdown */}
                  <div>
                    <label htmlFor="status" className="block text-sm font-medium text-white mb-1">Status</label>
                    <select
                      id="status"
                      value={watchlistStatus}
                      onChange={(e) => setWatchlistStatus(e.target.value)}
                      className="w-full p-2 rounded bg-zinc-800 text-white border border-zinc-600"
                    >
                      <option value="Watching">Watching</option>
                      <option value="Completed">Completed</option>
                      <option value="On-Hold">On-Hold</option>
                      <option value="Dropped">Dropped</option>
                      <option value="Planning">Planning</option>
                    </select>
                  </div>

                  {/* Score Dropdown - only show if anime is in list */}

                  <div>
                    <label htmlFor="score" className="block text-sm font-medium text-white mb-1">Score</label>
                    <select
                      id="score"
                      value={score > 0 ? score : 'Select Score'}
                      onChange={(e) => setScore(parseInt(e.target.value))}
                      className="w-full p-2 rounded bg-zinc-800 text-white border border-zinc-600"
                    >
                      <option value="">Select Score</option>
                      {[...Array(10)].map((_, i) => (
                        <option key={i + 1} value={i + 1}>{i + 1}</option>
                      ))}
                    </select>
                  </div>
                </>
              ) : (
                <Button onClick={() => {
                  const allowed = requireLogin();
                  if (!allowed) return;
                  setIsInList(true)
                }} className="bg-blue-700 hover:bg-blue-800 text-white transition-colors w-full">+ Add to List</Button>
              )
              }

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


            {/* Anime Relations */}
            {subanime.length > 0 && (
              <div className="bg-[#1f1f1f] text-white p-4 rounded space-y-2">
                <h3 className="font-bold mb-6">Anime Relations</h3>
                {subanime.map((sub) => {
                  const progressValue = localProgressMap[sub.id] ?? sub.usersubanime?.[0]?.progress?.toString() ?? '';
                  return (
                    <div key={sub.id} className="border-b border-gray-700 py-2">
                      <div
                        onClick={() => toggleSub(sub.id)}
                        className="text-lg font-semibold cursor-pointer flex justify-between items-center"
                      >
                        <span>{sub.title}</span>
                        <span>{openSubId === sub.id ? "▲" : "▼"}</span>
                      </div>

                      {openSubId === sub.id && (
                        <div className="mt-1 space-y-1">

                          <div className="flex items-center gap-2">
                            <p className="text-sm text-white">Score:</p>
                            <select
                              className="w-20 rounded px-2 py-1 text-sm bg-[#2a2a2a] text-white border border-gray-600"
                              value={sub.usersubanime?.[0]?.score ?? ''}
                              onMouseDown={(e) => {
                                const allowed = requireLogin();
                                if (!allowed) {
                                  e.preventDefault(); // stop the dropdown from opening
                                }
                              }}
                              onChange={(e) => handleScoreChange(sub.id, e.target.value)}
                            >
                              <option value="">-</option>
                              {[...Array(10)].map((_, i) => (
                                <option key={i + 1} value={i + 1}>{i + 1}</option>
                              ))}
                            </select>
                          </div>

                          <div className="flex items-center gap-2">
                            <p className="text-sm text-white">Progress:</p>
                            <input
                              type="number"
                              className="w-16 rounded px-2 py-1 text-sm bg-[#2a2a2a] text-white border border-gray-600"
                              value={progressValue}
                              onMouseDown={(e) => {
                                const allowed = requireLogin();
                                if (!allowed) {
                                  e.preventDefault(); // stop the dropdown from opening
                                }
                              }}
                              onChange={(e) =>
                                setLocalProgressMap((prev) => ({
                                  ...prev,
                                  [sub.id]: e.target.value,
                                }))
                              }
                              onBlur={() => handleProgressChange(sub.id, progressValue)}
                            />
                            <p className="text-sm text-white">/ {sub.episodes || "-"}</p>
                          </div>

                          <p className="text-sm text-gray-400">Type: {sub.type}</p>
                          <p className="text-sm text-gray-400">
                            Aired: {formatDate(sub.aired_from)}{sub.aired_to && ` - ${formatDate(sub.aired_to)}`}
                          </p>
                          <p className="text-sm text-gray-400">Studio: {sub.studio.join(", ") || "N/A"}</p>
                        </div>
                      )}

                    </div>
                  )
                })
                }
              </div>
            )}
          </div>

          {/* Right Column - Anime Details */}
          <div className="md:col-span-3 space-y-4">
            {/* Title & Synopsis */}
            <div className="bg-[#1f1f1f] text-white p-6">
              <h1 className="text-3xl font-bold">{anime.title}</h1>
            </div>

            <div className="bg-[#1f1f1f] text-white p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 text-center gap-y-6 py-4">
                <div>
                  <p className="text-lg text-gray-300 tracking-wide">SCORE</p>
                  <p className="text-4xl font-semibold mt-1">{anime.score || "N/A"}</p>
                </div>
                <div>
                  <p className="text-lg text-gray-300 tracking-wide">RANK</p>
                  <p className="text-4xl font-semibold mt-1">{anime.rank || "N/A"}</p>
                </div>
                <div>
                  <p className="text-lg text-gray-300 tracking-wide">MEMBERS</p>
                  <p className="text-4xl font-semibold mt-1">{anime.members || "N/A"}</p>
                </div>
                <div>
                  <p className="text-lg text-gray-300 tracking-wide">POPULARITY</p>
                  <p className="text-4xl font-semibold mt-1">{anime.popularity || "N/A"}</p>
                </div>
              </div>
            </div>

            <div className="bg-[#1f1f1f] text-white p-6">
              <h3 className="text-2xl font-semibold mb-4">Synopsis</h3>
              <br></br>
              <p className="text-lg font-bold">Genres: {anime.genres?.join(", ") || "-"}</p>
              <br></br>
              <p className="text-white mt-2 whitespace-pre-line">{anime.synopsis || "No synopsis available."}</p>
            </div>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
