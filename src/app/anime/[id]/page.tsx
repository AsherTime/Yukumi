"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TopNav } from "@/components/top-nav";
import Footer from "@/components/footer";
import { ListPlus, Pause, X, Play, Calendar, Check, ChevronDown } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

/*

interface AnimeEntry{
  id: number
  created_at: string
  user_id: number
  animes1_id: number
  status: string
  progress: number
  score: number
}

interface UserEntry {
  id: number
  created_at: string
  firebase_uid: string
  username: string
  picture_url: string
  auth_provider: string
  display_name: string
  gender: string
  country: string
  age: number
  favourites: number[]
}

export default function AnimeDetail() {
 

  const [userData, setUserData] = useState<UserEntry | null>(null);
  
  const [watchlistStatus, setWatchlistStatus] = useState<string | null>(null);
  const [firebase_uid, setFirebase_uid] = useState<string | null>(null);
  const [animeStatus, setAnimeStatus] = useState<AnimeEntry | null>(null);




  const handleStatusChange = async (status: string, progress: number, score: number) => {
  if(status == "Add To My List") return;
    try {
      // Step 1: Check if the anime is already in the watchlist
      const response = await fetch(`https://x8ki-letl-twmt.n7.xano.io/api:P5mUuktq/user_anime/checkAdd`,{
        method: "POST",
        headers: {
          "Content-Type" : "application/json",
        },
        body: JSON.stringify({
          user_id: userData?.id,
          animes1_id: id,
          status: status,
          progress: progress,
          score: score
        })
      })
      const data = await response.json();
      
      // Update UI state
      setAnimeStatus(data);
      setWatchlistStatus(status);
    } catch (error) { 
      console.error("Error updating watchlist:", error);
    }
  };  

  
  
*/

export default function AnimeDetail() {

  type Anime = {
    image_url: string;
    title: string;
    synopsis: string;
  }

  const params = useParams();
  const id = params?.id ? String(params.id) : undefined;
  const {user} = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [anime, setAnime] = useState<Anime | null>(null);
  const [watchlistStatus, setWatchlistStatus] = useState<string | null>(null);
  const [progress, setProgress] = useState(1); 
  const [score, setScore] = useState(1);


  useEffect(() => {
    const fetchAnimeDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await supabase
        .from("Anime")
        .select("image_url, title, synopsis")
        .eq("id", id)
        .single();
        console.log(data)
        setAnime(data.data);
      } catch (error) {
        console.error("Error fetching anime details:", error);
        setError("Failed to load anime details. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchAnimeDetails();
    }
  }, [id]);

  const handleStatusChange = (
    status: string,
    progress: number,
    score: number,
  ) => {
    if(status == "Add To My List") return;
    useEffect(() => {
      const checkAndInsert = async () => {
        if (!user?.id) return;
  
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();
  
        if (sessionError || !session) {
          console.error("Error retrieving session:", sessionError);
          return;
        }
  
        try {
          const response = await fetch(
            "https://rhspkjpeyewjugifcvil.supabase.co/functions/v1/upsert-user-anime",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${session.access_token}`,
              },
              body: JSON.stringify({
                user_id: user.id,
                anime_id: id,
                status,
                progress,
                score,
              }),
            }
          );
  
          if (!response.ok) {
            console.error("Failed to call edge function:", await response.text());
            return;
          }
  
          const result = await response.json();
          console.log("Edge function result:", result);
        } catch (error) {
          console.error("Error calling edge function:", error);
        }
      };
  
      checkAndInsert();
    }, [id, status, progress, score, user]);
  };
  

  const handleUpdate = () => {
    handleStatusChange(watchlistStatus ?? "Add to My List", progress, score);
  };

  //if (loading) return <p className="text-center text-gray-300">Loading anime details...</p>;
  if (error) return <p className="text-center text-red-500">{error}</p>;
  if (!anime) return <p className="text-center text-gray-400">Anime not found</p>;

  return (
    <div className="container mx-auto px-4 py-8 space-y-12">
      <TopNav />

      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Left Column - Image & Community */}
          <div className="space-y-4">
            {/* Anime Image */}
            <div className="bg-white p-4 flex justify-center items-center h-[400px] relative">
              <Image
                src={anime.image_url || "/placeholder.svg"}
                alt={anime.title || "Anime image"}
                fill
                className="rounded-lg object-contain"
              />
            </div>

            {/* Join Community Button */}
            <button className="w-full py-3 bg-[#4f74c8] text-white font-medium rounded hover:bg-[#1c439b] transition-colors">
              JOIN COMMUNITY
            </button>

            {/* Streaming Platforms */}
            <div className="bg-[#f8f8f8] text-black p-4 rounded">
              <h3 className="font-bold mb-3">Streaming Platforms</h3>
              <div className="space-y-3">
                <Link href="https://www.crunchyroll.com" className="flex items-center space-x-2 hover:bg-gray-200 p-1 rounded">
                  <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center">
                    <span className="text-white text-xs">CR</span>
                  </div>
                  <span>Crunchyroll</span>
                </Link>

                <Link href="https://www.netflix.com" className="flex items-center space-x-2 hover:bg-gray-200 p-1 rounded">
                  <div className="w-6 h-6 rounded-full bg-red-600 flex items-center justify-center">
                    <span className="text-white text-xs">N</span>
                  </div>
                  <span>Netflix</span>
                </Link>

                <button className="flex items-center text-[#1c439b] hover:underline">
                  <ChevronDown className="h-4 w-4 mr-1" />
                  <span>More services</span>
                </button>

                <p className="text-xs text-gray-500 mt-2">May be unavailable in your region.</p>
              </div>
            </div>
          </div>

          {/* Right Column - Anime Details */}
          <div className="md:col-span-3 space-y-4">
            {/* Title & Synopsis */}
            <div className="bg-white text-black p-6">
              <h1 className="text-3xl font-bold">{anime.title}</h1>
              <p className="text-gray-700 mt-2">{anime.synopsis || "No synopsis available."}</p>
            </div>

            {/* Watchlist Actions */}
            <div className="bg-white p-4 rounded shadow">
    <div className="flex flex-wrap gap-2">
      {[
        { label: "Add to My List", icon: <ListPlus className="h-4 w-4 mr-2" />, status: "Add to My List" },
        { label: "CURRENTLY WATCHING", icon: <Play className="h-4 w-4 mr-2" />, status: "Currently Watching" },
        { label: "PLAN TO WATCH", icon: <Calendar className="h-4 w-4 mr-2" />, status: "Plan to Watch" },
        { label: "ON-HOLD", icon: <Pause className="h-4 w-4 mr-2" />, status: "On-Hold" },
        { label: "DROPPED", icon: <X className="h-4 w-4 mr-2" />, status: "Dropped" },
        { label: "COMPLETED", icon: <Check className="h-4 w-4 mr-2" />, status: "Completed" },
      ].map(({ label, icon, status }) => (
        <button
          key={status}
          onClick={() => setWatchlistStatus(status)}
          className={`flex items-center px-3 py-1.5 rounded text-sm 
            ${watchlistStatus === status ? "bg-[#1c439b] text-white" : "bg-[#f8f8f8] text-[#323232] hover:bg-gray-300"}
          `}
        >
          {icon}
          {label}
        </button>
      ))}
    </div>

    {/* Progress & Score Inputs */}
    <div className="mt-4 flex items-center space-x-4">
      {/* Progress Control */}
      <div className="flex items-center space-x-2">
        <button onClick={() => setProgress((prev) => Math.max(prev - 1, 0))} className="px-2 py-1 bg-gray-300 rounded">➖</button>
        <span className="text-gray-800 font-medium">{progress} Episodes</span>
        <button onClick={() => setProgress((prev) => prev + 1)} className="px-2 py-1 bg-gray-300 rounded">➕</button>
      </div>

      {/* Score Selection */}
      <select value={score} onChange={(e) => setScore(Number(e.target.value))} className="text-gray-800 font-medium">
        <option value={0}>Select Score</option>
        {[...Array(10)].map((_, i) => (
          <option key={i + 1} value={i + 1}>
            {i + 1}
          </option>
        ))}
      </select>
    </div>
    <button
        onClick={handleUpdate}
        className="mt-4 w-full bg-[#1c439b] text-white py-2 rounded font-medium hover:bg-[#162e6a] transition"
      >
        Update
      </button>
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
  )};