"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { TopNav } from "@/components/top-nav";
import { supabase } from "@/lib/supabase";
import { Upload } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "react-hot-toast";
import JoinedCommunitiesSidebar from "@/components/joined-communities";
import { motion, AnimatePresence } from "framer-motion";
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

interface Post {
  id: string;
  title: string;
  content: string;
  created_at: string;
  user_id: string;
  likes_count: number;
  comments_count: number;
  liked_by_user: boolean;
  image_url: string;
  animetitle_post: string | null;
  post_collections: string | null;
  original_work: boolean;
  reference_link: string | null;
  Profiles?: {
    avatar_url: string;
    username: string;
  };
  tags?: string[];
  views: number;
}


const bgImageUrl = "https://rhspkjpeyewjugifcvil.supabase.co/storage/v1/object/sign/animepagebg/Flux_Dev_a_stunning_illustration_of_Create_a_highquality_origi_2.jpg?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InN0b3JhZ2UtdXJsLXNpZ25pbmcta2V5X2EwNWE5MzA2LTNiZGItNDliNC1hZGQ2LTFjMjEzNjhiYzcwMSJ9.eyJ1cmwiOiJhbmltZXBhZ2ViZy9GbHV4X0Rldl9hX3N0dW5uaW5nX2lsbHVzdHJhdGlvbl9vZl9DcmVhdGVfYV9oaWdocXVhbGl0eV9vcmlnaV8yLmpwZyIsImlhdCI6MTc0NzUxMjU1NiwiZXhwIjoxNzc5MDQ4NTU2fQ.Yr4W2KUDf1CWy5aI4dcTEWkJVTR0okuddtHugyA_niM";




export default function CommunityIdPage() {
  const [community, setCommunity] = useState<Community | null>(null);
  const [anime, setAnime] = useState<Anime | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joined, setJoined] = useState(false);
  const params = useParams();
  const { user } = useAuth();
  const router = useRouter();
  const [followedIds, setFollowedIds] = useState<string[]>([]);
  const [recentPosts, setRecentPosts] = useState<Post[]>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("recentPosts");
      return stored ? JSON.parse(stored) : [];
    }
    return [];
  });

  const { postsData, setPostsData, fetchPosts } = fetchPost();
  const { saved, toggleSave } = useSavedPosts(user, setPostsData, fetchPosts); // pass fetchPosts here
  const { handleLikeClick } = handleLike(user, setPostsData, fetchPosts);
  const { following, handleFollowToggle } = handleFollow(user);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Fetch followed user IDs for 'Following' filter
  useEffect(() => {
    const fetchFollowedIds = async () => {
      if (!user?.id) return;
      const { data, error } = await supabase
        .from("follows")
        .select("followed_id")
        .eq("follower_id", user.id);
      if (!error && data) {
        setFollowedIds(data.map((row: any) => row.followed_id));
      }
    };
    if (user) fetchFollowedIds();
  }, [following])

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



  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(prev =>
      prev === category ? null : category // toggle off if already selected
    );
  };

  const filteredPosts = postsData
    .filter((post) => post.animetitle_post === anime?.title)
    .filter((post) =>
      selectedTags.length === 0 ||
      selectedTags.every(tag => post.tags?.includes(tag))
    )
    .filter((post) => {
      if (!selectedCategory) return true;
      if (selectedCategory === "Following") return followedIds.includes(post.user_id);
      return post.post_collections?.includes(selectedCategory);
    })

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
    <div className="flex flex-col relative min-h-screen">
      {/* Background Image */}
      <div
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: `linear-gradient(to bottom, rgba(30, 27, 75, 0.7), rgba(0,0,0,0.85)), url('${bgImageUrl}')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundAttachment: "fixed",
          filter: "brightness(0.95)",
        }}
      />

      {/* Top Nav */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <TopNav />
      </div>

      {/* Sidebar (fixed) */}
      <div className="hidden md:block fixed top-16 left-0 w-64 h-[calc(100vh-4rem)] overflow-y-auto border-r border-zinc-800 px-4 py-6 z-30 pb-24">
        <JoinedCommunitiesSidebar userId={user?.id ?? null} />
      </div>

      {/* Main Content Area (margin left to avoid sidebar overlap) */}
      <div className="flex-1 relative z-10 ml-0 md:ml-64 pt-20 pb-12 px-4 md:px-8">
        <div className="max-w-7xl mx-auto space-y-12">
          {/* === BANNER + AVATAR/HEADER === */}
          <div className="px-4 md:px-8 pt-6 pb-12">
            {/* Banner */}
            <div className="w-full h-48 md:h-64 relative rounded-2xl shadow-2xl">
              <Image
                src={community.banner_url || anime.banner_url || "/banner-placeholder.jpg"}
                alt="Community Banner"
                fill
                className="object-cover w-full h-full rounded-2xl"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-transparent rounded-2xl" />
            </div>

            {/* Avatar + Header */}
            <div className="relative z-20 -mt-12 flex flex-col md:flex-row md:items-end justify-between w-full gap-4">
              <div className="flex items-end gap-4">
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white overflow-hidden bg-zinc-800 shadow-lg">
                  <Image
                    src={community.avatar_url?.trim() || anime.image_url?.trim() || "/avatar-placeholder.png"}
                    alt="Community Avatar"
                    width={128}
                    height={128}
                    className="object-cover w-full h-full"
                  />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-white drop-shadow-lg">{community.title || anime.title}</h1>
                  <p className="text-sm text-zinc-300">Members: <span className="font-semibold text-white">{community.members}</span></p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 md:gap-4">
                <Button
                  className={`px-6 py-2 rounded-full text-lg font-semibold transition-colors ${joined
                    ? "bg-zinc-700 text-zinc-300 cursor-default"
                    : "bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:from-pink-600 hover:to-purple-700"
                    }`}
                  disabled={joined}
                  onClick={handleJoinCommunity}
                >
                  {joined ? "Joined" : "+ Join Community"}
                </Button>
                <Button
                  className="w-auto bg-black border border-white/10 hover:bg-white/5"
                  onClick={() => router.push(`/upload?community_id=${community.id}`)}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Create Post
                </Button>
              </div>
            </div>
          </div>
        </div>
        {/* === POSTS FEED + RIGHT SIDEBAR === */}
        <div className="max-w-7xl mx-auto px-4 md:px-8 pb-16">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Main Posts Feed */}
            <div className="flex-1 flex flex-col bg-[#18181b] space-y-4">
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
                      key={post.id || idx}
                      post={post}
                      idx={idx}
                      total={uniquePosts.length}
                      onLikeToggle={handleLikeClick}
                      following={following}
                      handleFollowToggle={handleFollowToggle}
                      saved={saved}
                      onToggleSave={() => toggleSave(post.id)}
                      onPostOpen={(post: Post) => {
                        setRecentPosts(prev => {
                          const filtered = prev.filter(p => p.id !== post.id);
                          const updated = [post, ...filtered].slice(0, 10);
                          localStorage.setItem("recentPosts", JSON.stringify(updated));
                          return updated;
                        });
                      }}
                    />
                  ))
                )}
              </AnimatePresence>
            </div>

            {/* Right Sidebar */}
            <div className="w-full md:w-80 flex-shrink-0 space-y-8">
              <div className="bg-[#18181b] rounded-2xl border border-zinc-800 shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4">Categories</h3>
                <div className="flex flex-wrap gap-2">
                  {["Fanart", "Memes", "Discussion", "News", "Following"].map((category) => (
                    <button
                      key={category}
                      onClick={() => handleCategorySelect(category)}
                      className={`px-3 py-1 rounded-full font-medium text-sm ${selectedCategory === category
                        ? "bg-purple-700 text-white"
                        : "bg-zinc-700 text-zinc-300"
                        }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              {/* Trending Tags */}
              {community.trending_tags && community.trending_tags.length > 0 && (
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
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="z-50">
        <Footer />
      </div>
    </div>
  );
}