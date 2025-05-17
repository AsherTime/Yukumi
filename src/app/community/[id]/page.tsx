"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { TopNav } from "@/components/top-nav";
import { supabase } from "@/lib/supabase";
import { Heart, MessageCircle, Share2, Upload } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "react-hot-toast";

// Types
interface Community {
  id: string;
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

interface Post {
  id: string;
  title: string;
  content: string;
  created_at: string;
  user_id: string;
  image_url: string;
  Profiles?: {
    display_name: string;
    avatar_url: string;
  };
}

const bgImageUrl = "https://rhspkjpeyewjugifcvil.supabase.co/storage/v1/object/sign/animepagebg/Flux_Dev_a_stunning_illustration_of_Create_a_highquality_origi_2.jpg?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InN0b3JhZ2UtdXJsLXNpZ25pbmcta2V5X2EwNWE5MzA2LTNiZGItNDliNC1hZGQ2LTFjMjEzNjhiYzcwMSJ9.eyJ1cmwiOiJhbmltZXBhZ2ViZy9GbHV4X0Rldl9hX3N0dW5uaW5nX2lsbHVzdHJhdGlvbl9vZl9DcmVhdGVfYV9oaWdocXVhbGl0eV9vcmlnaV8yLmpwZyIsImlhdCI6MTc0NzUxMjU1NiwiZXhwIjoxNzc5MDQ4NTU2fQ.Yr4W2KUDf1CWy5aI4dcTEWkJVTR0okuddtHugyA_niM";

export default function CommunityIdPage() {
  const [activeTab, setActiveTab] = useState<"recommended" | "recent">("recommended");
  const [community, setCommunity] = useState<Community | null>(null);
  const [anime, setAnime] = useState<Anime | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joined, setJoined] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    const fetchCommunityAndAnime = async () => {
      setLoading(true);
      setError(null);
      
      const communityId = params.id; // this is the community's bigint id
      if (!communityId) {
        setError("No community ID provided");
        setLoading(false);
        return;
      }
      try {
        // 1. Fetch the community by its id
        const { data: communityData, error: communityError } = await supabase
          .from("community")
          .select("*")
          .eq("id", communityId)
          .maybeSingle();

        if (communityError || !communityData) {
          setError(communityError?.message || "Community not found");
          setLoading(false);
          return;
        }

        // 2. Fetch the anime by the community's anime_id
        const { data: animeData, error: animeError } = await supabase
          .from("Anime")
          .select("*")
          .eq("id", communityData.anime_id)
          .single();

        if (animeError || !animeData) {
          setError(animeError?.message || "Anime not found");
          setLoading(false);
          return;
        }

        setCommunity(communityData);
        setAnime(animeData);
      } catch (error) {
        console.error("Error in fetchCommunityAndAnime:", error);
        setError("Failed to fetch community data");
      } finally {
        setLoading(false);
      }
    };

    fetchCommunityAndAnime();
  }, [params.id]);

  useEffect(() => {
    const checkIfJoined = async () => {
      if (!user || !community) return;
      
      const { data, error } = await supabase
        .from('members')
        .select('id')
        .eq('follower_id', user.id)
        .eq('community_id', community.id)
        .single();

      if (!error && data) {
        setJoined(true);
      }
    };

    checkIfJoined();
  }, [user, community]);

  useEffect(() => {
    if (!anime) return;
    const fetchPosts = async () => {
      const { data, error } = await supabase
        .from("posts")
        .select(`id, title, content, created_at, user_id, image_url, Profiles(display_name, avatar_url)`)
        .eq("animetitle_post", anime.title)
        .order("created_at", { ascending: false });
      if (!error && data) {
        // Ensure Profiles is always a single object, not an array
        setPosts(data.map((post: any) => ({
          ...post,
          Profiles: Array.isArray(post.Profiles) ? post.Profiles[0] : post.Profiles
        })));
      }
    };
    fetchPosts();
  }, [anime]);

  const handleJoinCommunity = async () => {
    if (!user || !community) return;

    try {
      // Add to follows table
      const { error: followError } = await supabase
        .from('members')
        .insert([
          {
            follower_id: user.id,
            community_id: community.id
          }
        ]);

      if (followError) {
        console.log('Follow error details:', followError?.message, followError?.code, followError?.details);
        console.error('Error adding follow:', followError);
        throw followError;
      }

      // Update community members count
      const { error: updateError } = await supabase
        .from('community')
        .update({ members: community.members + 1 })
        .eq('id', community.id);

      if (updateError) {
        console.error('Error updating member count:', updateError);
        throw updateError;
      }
      console.log('Successfully joined community!');
      setJoined(true);
      toast.success('Successfully joined community!');
    } catch (error) {
      console.error('Error joining community:', error);
      toast.error('Failed to join community');
    }
  };

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
    <div className="relative min-h-screen">
      {/* Background image with gradient overlay */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `linear-gradient(to bottom, rgba(30, 27, 75, 0.7), rgba(0,0,0,0.85)), url('${bgImageUrl}')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          filter: "brightness(0.95)"
        }}
      />
      {/* Main content */}
      <div className="relative z-10">
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
          
          <Button
            className={`px-6 py-2 rounded-full text-lg font-semibold transition-colors ${
              joined 
                ? "bg-zinc-700 text-zinc-300 cursor-default" 
                : "bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:from-pink-600 hover:to-purple-700"
            }`}
            disabled={joined}
            onClick={handleJoinCommunity}
          >
            {joined ? "Joined" : "+ Join Community"}
          </Button>

          <Button
            className="w-full bg-black border border-white/10 hover:bg-white/5"
            onClick={() => router.push(`/upload?community_id=${community.id}`)}
          >
            <Upload className="mr-2 h-4 w-4" />
            POST NOW
          </Button>
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
              {posts.length === 0 ? (
                <div className="text-zinc-400 text-center py-8">No posts yet for this community.</div>
              ) : (
                posts.map((post) => (
                  <div key={post.id} className="bg-[#1f1f1f] rounded-xl overflow-hidden">
                    <div className="bg-[#2e2e2e] p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden">
                          <Image
                            src={post.Profiles?.avatar_url || "/avatar-placeholder.png"}
                            alt={post.Profiles?.display_name || "User"}
                            width={40}
                            height={40}
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <p className="font-medium">{post.Profiles?.display_name || "Anonymous"}</p>
                          <p className="text-sm text-zinc-400">{new Date(post.created_at).toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                    <div className="px-6 py-4">
                      <h3 className="text-xl font-bold mb-2">{post.title}</h3>
                      <p className="mb-4">{post.content}</p>
                      {post.image_url && (
                        <img src={post.image_url} alt={post.title} className="rounded-lg max-h-64 mb-4" />
                      )}
                    </div>
                  </div>
                ))
              )}
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
    </div>
  );
} 