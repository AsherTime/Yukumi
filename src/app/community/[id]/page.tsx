"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { TopNav } from "@/components/top-nav";
import { supabase } from "@/lib/supabase";
import { Heart, MessageCircle, Share2 } from "lucide-react";
import { useParams } from "next/navigation";

// Types
interface Community {
  id: number;
  title: string;
  members: number;
  anime_id: string;
  banner_url: string;
  avatar_url: string;
  description: string;
  trending_tags: string[];
  trending_topics: string[];
}

interface Anime {
  id: string;
  title: string;
  image_url: string;
  banner_url?: string;
}

export default function CommunityIdPage() {
  const [activeTab, setActiveTab] = useState<"recommended" | "recent">("recommended");
  const [community, setCommunity] = useState<Community | null>(null);
  const [anime, setAnime] = useState<Anime | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joined, setJoined] = useState(false);
  const params = useParams();

  useEffect(() => {
    const fetchCommunityAndAnime = async () => {
      setLoading(true);
      setError(null);
      
      const animeId = params.id;
      console.log("Fetching community for anime ID:", animeId);
      
      if (!animeId) {
        setError("No anime ID provided");
        setLoading(false);
        return;
      }
      
      try {
        // First fetch the anime details
        const { data: animeData, error: animeError } = await supabase
          .from("Anime")
          .select("*")
          .eq("id", animeId)
          .single();

        if (animeError) {
          console.error("Error fetching anime:", animeError);
          setError(animeError.message);
          return;
        }

        if (!animeData) {
          setError("Anime not found");
          return;
        }

        setAnime(animeData);

        // Then fetch or create the community for this anime
        let { data: communityData, error: communityError } = await supabase
          .from("community")
          .select("*")
          .eq("anime_id", animeId)
          .maybeSingle();

        if (communityError) {
          console.error("Error fetching community:", communityError);
          setError(communityError.message);
          return;
        }

        // If community doesn't exist, create it
        if (!communityData) {
          console.log("Creating new community for anime:", animeData.title);
          const { data: newCommunity, error: createError } = await supabase
            .from("community")
            .insert([
              {
                anime_id: animeId,
                title: animeData.title,
                members: 0,
                banner_url: animeData.banner_url || null,
                avatar_url: animeData.image_url || null,
                description: `Welcome to the ${animeData.title} community!`,
                trending_tags: [],
                trending_topics: []
              }
            ])
            .select()
            .single();

          if (createError) {
            console.error("Error creating community:", createError);
            setError(createError.message);
            return;
          }

          communityData = newCommunity;
        }

        console.log("Fetched/Created community data:", communityData);
        setCommunity(communityData);
      } catch (error) {
        console.error("Error in fetchCommunityAndAnime:", error);
        setError("Failed to fetch community data");
      } finally {
        setLoading(false);
      }
    };

    fetchCommunityAndAnime();
  }, [params.id]);

  if (loading) {
    return <div className="min-h-screen bg-black text-white flex items-center justify-center">Loading...</div>;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Error</h2>
          <p className="text-zinc-400">{error}</p>
        </div>
      </div>
    );
  }

  if (!community || !anime) {
    return <div className="min-h-screen bg-black text-white flex items-center justify-center">Community not found</div>;
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <TopNav />
      
      {/* Banner */}
      <div className="w-full h-48 md:h-64 relative">
        <Image
          src={community.banner_url || anime.banner_url || "/banner-placeholder.jpg"}
          alt="Community Banner"
          fill
          className="object-cover w-full h-full"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-transparent" />
      </div>

      {/* Header Section */}
      <div className="relative z-10 max-w-5xl mx-auto -mt-16 flex flex-col md:flex-row items-center md:items-end gap-6 px-4">
        <div className="flex items-end gap-4 w-full md:w-auto">
          <div className="w-32 h-32 rounded-full border-4 border-white overflow-hidden bg-zinc-800">
            <Image 
              src={community.avatar_url || anime.image_url || "/avatar-placeholder.png"} 
              alt="Community Avatar" 
              width={128} 
              height={128} 
              className="object-cover w-full h-full" 
            />
          </div>
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl md:text-4xl font-bold leading-tight">{community.title || anime.title}</h1>
            <div className="flex gap-4 text-zinc-300 text-sm md:text-base">
              <span>Members: <span className="font-semibold text-white">{community.members}</span></span>
            </div>
          </div>
        </div>
        <div className="flex-1 flex justify-end w-full md:w-auto">
          <Button
            className={`px-6 py-2 rounded-full text-lg font-semibold transition-colors ${
              joined 
                ? "bg-zinc-700 text-zinc-300 cursor-default" 
                : "bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:from-pink-600 hover:to-purple-700"
            }`}
            disabled={joined}
            onClick={() => setJoined(true)}
          >
            {joined ? "Joined" : "+ Join Community"}
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="max-w-5xl mx-auto mt-8 px-4">
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab("recommended")}
            className={`px-6 py-2 rounded-full font-medium transition-all ${
              activeTab === "recommended"
                ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white"
                : "bg-[#1f1f1f] text-zinc-400 hover:bg-[#2a2a2a]"
            }`}
          >
            Recommended
          </button>
          <button
            onClick={() => setActiveTab("recent")}
            className={`px-6 py-2 rounded-full font-medium transition-all ${
              activeTab === "recent"
                ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white"
                : "bg-[#1f1f1f] text-zinc-400 hover:bg-[#2a2a2a]"
            }`}
          >
            Recent
          </button>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="max-w-5xl mx-auto mt-4 flex flex-col md:flex-row gap-8 px-4 pb-8">
        {/* Main Posts Feed */}
        <div className="flex-1 min-w-0">
          <div className="space-y-4">
            {/* Example Post Card - Repeat this structure for each post */}
            <div className="bg-[#1f1f1f] rounded-xl overflow-hidden">
              <div className="bg-[#2e2e2e] p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden">
                      <Image
                        src="/avatar-placeholder.png"
                        alt="User Avatar"
                        width={40}
                        height={40}
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <p className="font-medium">Username</p>
                      <p className="text-sm text-zinc-400">2 hours ago</p>
                    </div>
                  </div>
                  <Button variant="ghost" className="text-zinc-400 hover:text-white">
                    Follow
                  </Button>
                </div>
              </div>
              <div className="px-6 py-4">
                <p className="text-lg mb-4">Post content goes here...</p>
                <div className="flex items-center gap-6">
                  <button className="flex items-center gap-2 text-zinc-400 hover:text-pink-500 transition-colors">
                    <Heart size={20} />
                    <span>123</span>
                  </button>
                  <button className="flex items-center gap-2 text-zinc-400 hover:text-blue-500 transition-colors">
                    <MessageCircle size={20} />
                    <span>45</span>
                  </button>
                  <button className="flex items-center gap-2 text-zinc-400 hover:text-green-500 transition-colors">
                    <Share2 size={20} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-full md:w-80 flex-shrink-0 space-y-8">
          {/* Trending Tags */}
          <div className="bg-[#18181b] rounded-2xl border border-zinc-800 shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Trending Topics</h3>
            <div className="flex flex-wrap gap-2">
              {community.trending_tags?.map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1 rounded-full font-medium text-sm bg-gradient-to-r from-pink-500 to-purple-600 text-white"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Community Description */}
          {community.description && (
            <div className="bg-[#18181b] rounded-2xl border border-zinc-800 shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">About</h3>
              <p className="text-zinc-300">{community.description}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 