"use client";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { TopNav } from "@/components/top-nav";
import { supabase } from "@/lib/supabase";
import { Heart, MessageCircle, Share2, Upload, UserCircle, Eye } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "react-hot-toast";
import JoinedCommunitiesSidebar from "@/components/joined-communities";
import { motion, AnimatePresence } from "framer-motion";
import { FiMoreHorizontal } from "react-icons/fi";
import Link from "next/link";
import { FollowButton } from "@/components/ui/FollowButton";
import { PostgrestError } from "@supabase/supabase-js";
import { ContentFeed } from "@/components/content-feed";
import Footer from "@/components/footer"
import PostCardContainer from "@/components/post-card-container";
import fetchPost from "@/utils/fetch-post";
import handleLike from "@/utils/handleLike";
import useSavedPosts from "@/utils/use-saved-posts";
import handleFollow from "@/utils/handleFollow";

// Types
interface Community {
  id: string;
  title: string;
  members: number;
  anime_id: string;
  banner_url: string;
  avatar_url: string;
  description: string;
  rules: string;
  trending_tags: string[];
  trending_topics: string[];
}

interface Anime {
  id: string;
  title: string;
  image_url: string;
  banner_url?: string;
}


const bgImageUrl = "https://rhspkjpeyewjugifcvil.supabase.co/storage/v1/object/sign/animepagebg/Flux_Dev_a_stunning_illustration_of_Create_a_highquality_origi_2.jpg?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InN0b3JhZ2UtdXJsLXNpZ25pbmcta2V5X2EwNWE5MzA2LTNiZGItNDliNC1hZGQ2LTFjMjEzNjhiYzcwMSJ9.eyJ1cmwiOiJhbmltZXBhZ2ViZy9GbHV4X0Rldl9hX3N0dW5uaW5nX2lsbHVzdHJhdGlvbl9vZl9DcmVhdGVfYV9oaWdocXVhbGl0eV9vcmlnaV8yLmpwZyIsImlhdCI6MTc0NzUxMjU1NiwiZXhwIjoxNzc5MDQ4NTU2fQ.Yr4W2KUDf1CWy5aI4dcTEWkJVTR0okuddtHugyA_niM";




export default function CommunityIdPage() {
  const [activeTab, setActiveTab] = useState<"Recommended" | "Recents">("Recommended");
  const [community, setCommunity] = useState<Community | null>(null);
  const [anime, setAnime] = useState<Anime | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joined, setJoined] = useState(false);
  const params = useParams();
  const { user } = useAuth();
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const POSTS_PER_PAGE = 10;
  const { postsData, setPostsData, fetchPosts } = fetchPost();
  const { saved, toggleSave } = useSavedPosts(user, setPostsData, fetchPosts); // pass fetchPosts here
  const { handleLikeClick } = handleLike(user, setPostsData, fetchPosts);
  const { following, handleFollowToggle } = handleFollow(user);

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
        .eq('user_id', user.id)
        .eq('community_id', community.id)
        .single();

      if (!error && data) {
        setJoined(true);
      }
    };

    checkIfJoined();
  }, [user, community]);



  const handleJoinCommunity = async () => {
    if (!user || !community) return;

    try {
      // Add to follows table
      const { error: followError } = await supabase
        .from('members')
        .insert([
          {
            user_id: user.id,
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





  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };



  const filteredPosts = postsData
    .filter((post) => post.animetitle_post === anime?.title)
    .filter((post) =>
      selectedTags.length === 0 ||
      selectedTags.every(tag => post.tags?.includes(tag))
    );

  const uniquePosts = Array.from(new Map(filteredPosts.map(p => [p.id, p])).values());

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
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: `linear-gradient(to bottom, rgba(30, 27, 75, 0.7), rgba(0,0,0,0.85)), url('${bgImageUrl}')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundAttachment: "fixed",
          filter: "brightness(0.95)"
        }}
      />
      {/* Main content */}
      <div className="relative z-10">
        <TopNav />
        {/* Banner */}
        <div className="w-full flex justify-center relative">
          <div className="hidden md:block fixed top-16 left-0 w-64 h-[calc(100vh-4rem)] bg-[#18181b] border-r border-zinc-800 px-4 py-6 z-30">
            <JoinedCommunitiesSidebar userId={user?.id ?? null} />
          </div>

          <div className="w-[80%] h-48 md:h-64 relative rounded-2xl shadow-2xl ml-[14.5rem]">
            <Image
              src={community.banner_url || anime.banner_url || "/banner-placeholder.jpg"}
              alt="Community Banner"
              fill
              className="object-cover w-full h-full rounded-2xl"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-transparent rounded-2xl" />
          </div>
          {/* Overlapping Avatar and Header - now outside the banner container */}
          <div className="absolute left-1/2 -translate-x-1/2 -bottom-12 flex items-end justify-between z-20 w-[80%] ml-[7.5rem]">
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white overflow-hidden bg-zinc-800 shadow-lg">
              <Image
                src={community.avatar_url || anime.image_url || "/avatar-placeholder.png"}
                alt="Community Avatar"
                width={128}
                height={128}
                className="object-cover w-full h-full"
              />
            </div>
            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6 pb-4 md:pb-0 flex-1">
              <h1 className="text-2xl md:text-3xl font-bold leading-tight text-white drop-shadow-lg">{community.title || anime.title}</h1>
              <div className="flex gap-4 text-zinc-300 text-sm md:text-base">
                <span>Members: <span className="font-semibold text-white">{community.members}</span></span>
              </div>
              <Button
                className={`px-6 py-2 rounded-full text-lg font-semibold transition-colors ml-0 md:ml-4 ${joined
                  ? "bg-zinc-700 text-zinc-300 cursor-default"
                  : "bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:from-pink-600 hover:to-purple-700"
                  }`}
                disabled={joined}
                onClick={handleJoinCommunity}
              >
                {joined ? "Joined" : "+ Join Community"}
              </Button>
              <Button
                className="w-auto bg-black border border-white/10 hover:bg-white/5 ml-0 md:ml-2"
                onClick={() => router.push(`/upload?community_id=${community.id}`)}
              >
                <Upload className="mr-2 h-4 w-4" />
                Create Post
              </Button>
            </div>
          </div>
        </div>
        {/* Header Spacer for Overlap */}
        <div className="h-20 md:h-24" />
        <div className="flex">
          {/* Left Sidebar */}


          {/* Main Content Layout */}
          <div className="flex-1">
            <div className="max-w-7xl mx-auto mt-4 px-4 pb-8">
              <div className="flex flex-col md:flex-row gap-8 md:ml-32">

                {/* ➜ Main Posts Feed column */}
                <div className="flex-1 flex flex-col bg-[#18181b] space-y-4">     {/* ← NEW wrapper */}
                  <AnimatePresence mode="wait">
                    {uniquePosts.length === 0 ? (
                      <motion.div
                        key="no-posts"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="text-center text-zinc-400 py-12"
                      >
                        No posts found in this category.
                      </motion.div>
                    ) : (
                      uniquePosts.map((post, idx) => (
                        <PostCardContainer
                          key={post.id || idx}  // Use post.id if available, fallback to index
                          post={post}
                          idx={idx}
                          total={uniquePosts.length}
                          onLikeToggle={handleLikeClick}
                          following={following}
                          handleFollowToggle={handleFollowToggle}
                          saved={saved}
                          onToggleSave={() => toggleSave(post.id)}
                        />
                      ))
                    )}
                  </AnimatePresence>
                </div>

                {/* Right Sidebar */}
                <div className="w-full md:w-80 flex-shrink-0 space-y-8 ml-auto">
                  {/* Trending Tags */}
                  <div className="bg-[#18181b] rounded-2xl border border-zinc-800 shadow-md p-6">
                    <h3 className="text-lg font-semibold mb-4">Trending Topics</h3>
                    <div className="flex flex-wrap gap-2">
                      {community.trending_tags?.map((tag, index) => (
                        <button
                          key={index}
                          onClick={() => toggleTag(tag)}
                          className={`px-3 py-1 rounded-full font-medium text-sm ${selectedTags.includes(tag)
                            ? "bg-purple-700 text-white"
                            : "bg-zinc-700 text-zinc-300"
                            }`}
                        >
                          {tag}
                        </button>
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
                  {community.rules && (
                    <div className="bg-[#18181b] rounded-2xl border border-zinc-800 shadow-md p-6">
                      <h3 className="text-lg font-semibold mb-4">Rules</h3>
                      <p className="text-zinc-300">{community.rules}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="relative z-50">
        <Footer />
      </div>
    </div>
  );
}