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
    display_name: string;
  };
  tags?: string[];
}

const bgImageUrl = "https://rhspkjpeyewjugifcvil.supabase.co/storage/v1/object/sign/animepagebg/Flux_Dev_a_stunning_illustration_of_Create_a_highquality_origi_2.jpg?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InN0b3JhZ2UtdXJsLXNpZ25pbmcta2V5X2EwNWE5MzA2LTNiZGItNDliNC1hZGQ2LTFjMjEzNjhiYzcwMSJ9.eyJ1cmwiOiJhbmltZXBhZ2ViZy9GbHV4X0Rldl9hX3N0dW5uaW5nX2lsbHVzdHJhdGlvbl9vZl9DcmVhdGVfYV9oaWdocXVhbGl0eV9vcmlnaV8yLmpwZyIsImlhdCI6MTc0NzUxMjU1NiwiZXhwIjoxNzc5MDQ4NTU2fQ.Yr4W2KUDf1CWy5aI4dcTEWkJVTR0okuddtHugyA_niM";

// Custom hook for view counting on visible post
function useViewCountOnVisible(postId: string) {
  const ref = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const hasCountedRef = useRef(false);
  useEffect(() => {
    if (!ref.current) return;
    const observer = new window.IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && !hasCountedRef.current) {
          timerRef.current = setTimeout(() => {
            supabase.rpc("increment_post_view", { post_id: postId })
              .then(({ error }) => {
                if (error) {
                  console.error("Failed to increment view (feed):", error);
                } else {
                  console.log("View counted (feed) for", postId);
                  hasCountedRef.current = true;
                }
              });
          }, 8000);
        } else {
          if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
          }
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(ref.current);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      observer.disconnect();
    };
  }, [postId]);
  return ref;
}

function PostCard({ post, idx, total, formatDate, setMenuOpenId, menuOpenId, user, setShowConfirmId, showConfirmId, setReportConfirmId, handleDelete, handleLikeClick, handleCommentClick }: {
  post: Post,
  idx: number,
  total: number,
  formatDate: (dateString: string) => string,
  setMenuOpenId: React.Dispatch<React.SetStateAction<string | null>>,
  menuOpenId: string | null,
  user: any,
  setShowConfirmId: React.Dispatch<React.SetStateAction<string | null>>,
  showConfirmId: string | null,
  setReportConfirmId: React.Dispatch<React.SetStateAction<string | null>>,
  handleDelete: (postId: string) => void,
  handleLikeClick: (e: React.MouseEvent, postId: string, liked: boolean) => void,
  handleCommentClick: (postId: string) => void,
}) {
  const viewRef = useViewCountOnVisible(post.id);
  return (
    <motion.section
      ref={viewRef}
      key={post.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3, delay: idx * 0.04 }}
      className={
        idx !== total - 1
          ? "border-b border-zinc-800"
          : ""
      }
    >
      {/* Top Row: Avatar, Username, Timestamp, Follow, More */}
      <div className="flex items-center justify-between px-6 pt-5 pb-2">
        <div className="flex items-center gap-3">
          <Link href={`/profile/${post.user_id}`} className="flex items-center gap-3 group" prefetch={false}>
            {post.Profiles?.avatar_url ? (
              <img
                src={post.Profiles.avatar_url}
                alt={post.Profiles.display_name || "User"}
                className="w-10 h-10 rounded-full object-cover border border-zinc-700 group-hover:ring-2 group-hover:ring-blue-500 transition"
              />
            ) : (
              <UserCircle className="w-10 h-10 text-zinc-500 group-hover:text-blue-400 transition" />
            )}
            <div>
              <div className="text-white font-semibold text-base leading-tight group-hover:underline group-hover:text-blue-400 transition">{post.Profiles?.display_name || "Anonymous"}</div>
              <div className="text-xs text-zinc-400">{formatDate(post.created_at)}</div>
            </div>
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <FollowButton 
            followedId={post.user_id} 
            className="rounded-full px-4 py-1 bg-blue-900 text-blue-400 font-semibold shadow hover:bg-blue-800 transition text-xs" 
          />
          <div className="relative inline-block text-left">
            <button
              className="bg-black/30 p-2 rounded-full text-white hover:text-gray-300"
              onClick={() =>
                setMenuOpenId((prev) => (prev === post.id ? null : post.id))
              }
            >
              <FiMoreHorizontal size={20} />
            </button>
            {menuOpenId === post.id && (
              <div className="absolute right-0 mt-2 w-28 bg-white rounded shadow z-10">
                {user?.id === post.user_id ? (
                  <button
                    className="block w-full px-4 py-2 text-left text-red-600 hover:bg-gray-100"
                    onClick={() => {
                      setShowConfirmId(post.id); // this will trigger the popup
                      setMenuOpenId(null);
                    }}
                  >
                    Delete
                  </button>
                ) : (
                  <button
                    className="block w-full px-4 py-2 text-left text-yellow-600 hover:bg-gray-100"
                    onClick={() => {
                      setReportConfirmId(post.id);
                      setMenuOpenId(null);
                    }}
                  >
                    Report
                  </button>
                )}
              </div>
            )}
            {showConfirmId === post.id && (
              <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-20">
                <div className="bg-white p-6 rounded-lg shadow-lg text-center">
                  <p className="mb-4 text-black text-lg font-semibold">
                    Are you sure you want to delete this post? This action cannot be undone.
                  </p>
                  <div className="flex justify-center gap-4">
                    <button
                      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                      onClick={() => {
                        handleDelete(post.id);
                        setShowConfirmId(null);
                      }}
                    >
                      Yes
                    </button>
                    <button
                      className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
                      onClick={() => setShowConfirmId(null)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Title */}
      <h3 className="text-2xl font-bold text-white px-6 pb-2">{post.title}</h3>
      {/* Image */}
      {post.image_url && (
        <div className="relative h-64 mb-4 px-6 overflow-hidden rounded-xl">
          <img
            src={post.image_url}
            alt={post.title}
            className="h-full w-full object-cover mx-auto"
            loading="lazy"
          />
        </div>
      )}
      {/* Content */}
      <p className="text-gray-300 px-6 pb-2" dangerouslySetInnerHTML={{ __html: post.content }}></p>
      {/* Tags */}
      <div className="flex flex-wrap gap-2 px-6 pb-2 mt-1">
        {post.post_collections && (
          <span className="px-2 py-1 rounded-full text-xs font-semibold text-blue-400 bg-blue-500/10">
            {post.post_collections}
          </span>
        )}
        {post.animetitle_post && (
          <span className="px-2 py-1 rounded-full text-xs font-semibold text-purple-400 bg-purple-500/10">
            {post.animetitle_post}
          </span>
        )}
      </div>
      {/* User Tags */}
      {post.tags && post.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 px-6 pb-2">
          {post.tags.map((tag: string) => (
            <span key={tag} className="px-2 py-1 rounded-full text-xs font-semibold text-gray-300 bg-[#232232]">
              #{tag}
            </span>
          ))}
        </div>
      )} 
      {/* Bottom Row: Like, Comment, View */}
      <div className="flex items-center justify-end gap-6 px-6 py-3">
        <button
          onClick={(e) => handleLikeClick(e, post.id, post.liked_by_user)}
          className={`flex items-center gap-1 text-zinc-400 hover:text-pink-500 transition-colors group ${post.liked_by_user ? 'font-bold text-pink-500' : ''}`}
        >
          <Heart className="w-5 h-5 mr-1 group-hover:scale-110 transition-transform" fill={post.liked_by_user ? '#ec4899' : 'none'} />
          <span>{post.likes_count || 0}</span>
        </button>
        <button
          onClick={() => handleCommentClick(post.id)}
          className="flex items-center gap-1 text-zinc-400 hover:text-purple-400 transition-colors"
        >
          <MessageCircle className="w-5 h-5 mr-1" />
          {post.comments_count}
        </button>
        <span className="flex items-center gap-1 text-zinc-500">
          <Eye className="w-5 h-5 mr-1" />
          {/* Optional: Add view count if available */}
        </span>
      </div>
    </motion.section>
  );
}


export default function CommunityIdPage() {
  const [activeTab, setActiveTab] = useState<"Recommended" | "Recents">("Recommended");
  const [community, setCommunity] = useState<Community | null>(null);
  const [anime, setAnime] = useState<Anime | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joined, setJoined] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const params = useParams();
  const [postsData, setPostsData] = useState<Post[]>([]);
    const { user } = useAuth();
    const router = useRouter();
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const POSTS_PER_PAGE = 10;

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

 const fetchPostsWithMeta = async (reset = false) => {
    try {
      let from = (reset ? 0 : (page - 1) * POSTS_PER_PAGE);
      let to = from + POSTS_PER_PAGE - 1;
      const { data: posts, error: postsError, count } = await supabase
        .from("posts")
        .select(`
          id, title, content, created_at, user_id, image_url, 
          Profiles(display_name, avatar_url), 
          animetitle_post, post_collections, original_work, reference_link,
          post_tags (
            tags (name)
          )
        `, { count: "exact" })
        .order("created_at", { ascending: false })
        .range(from, to);
        
      if (postsError) {
        if (postsError.message === "Requested range not satisfiable") {
          // No more posts to fetch, end pagination
          setHasMore(false);
          setLoadingMore(false);
          return;
        }
        console.error("Error fetching posts:", postsError, postsError?.message, postsError?.details);
        return;
      }
      if (!posts) return;
      const postsWithMeta = await Promise.all(
        posts.map(async (post) => {
          // Map tags from join
          const tags = post.post_tags?.map((pt: any) => pt.tags?.name).filter(Boolean) || [];
          const [{ count: likesCount }, { count: commentsCount }, { data: likeRecord }] = await Promise.all([
            supabase.from("likes").select("*", { count: "exact", head: true }).eq("post_id", post.id),
            supabase.from("comments").select("*", { count: "exact", head: true }).eq("post_id", post.id),
            supabase.from("likes").select("*").eq("post_id", post.id).eq("user_id", user?.id).maybeSingle(),
          ]);
          return {
            ...post,
            tags,
            likes_count: likesCount || 0,
            comments_count: commentsCount || 0,
            liked_by_user: !!likeRecord,
            Profiles: post.Profiles && Array.isArray(post.Profiles) ? post.Profiles[0] : post.Profiles,
          };
        })
      );
      if (reset) {
    setPostsData(postsWithMeta);
  } else {
    // Deduplicate when appending
    setPostsData(prev => {
      const combined = [...prev, ...postsWithMeta];
      const uniqueMap = new Map();
      combined.forEach(p => uniqueMap.set(p.id, p));
      return Array.from(uniqueMap.values());
    });
  }
      setHasMore(postsWithMeta.length === POSTS_PER_PAGE);
      setLoadingMore(false);
    } catch (err) {
      console.error("Error in fetchPostsWithMeta:", err);
    }
  };

  useEffect(() => {
    if (!user) return;
    setPage(1);
    fetchPostsWithMeta(true);
  }, [user]);

  useEffect(() => {
    if (page === 1) return;
    fetchPostsWithMeta();
    // eslint-disable-next-line
  }, [page]);

    const toggleLike = async (postId: string, liked: boolean) => {
      if (!user) {
        console.log("No user found, cannot like");
        return;
      }
  
      try {
        console.log("Attempting to toggle like:", { postId, liked, userId: user.id });
  
        if (liked) {
          // Unlike the post
          const { error: unlikeError } = await supabase
            .from("likes")
            .delete()
            .eq("post_id", postId)
            .eq("user_id", user.id);
  
          if (unlikeError) {
            console.error("Error unliking post:", unlikeError);
            return;
          }
          console.log("Successfully unliked post");
        } else {
          // Like the post
          const { error: likeError } = await supabase
            .from("likes")
            .insert({
              post_id: postId,
              user_id: user.id
            });
  
          if (likeError) {
            console.error("Error liking post:", likeError);
            return;
          }
          console.log("Successfully liked post");
        }
  
        // Update the UI immediately
        setPostsData(prevPosts => 
          prevPosts.map(post => 
            post.id === postId 
              ? {
                  ...post,
                  liked_by_user: !liked,
                  likes_count: liked ? post.likes_count - 1 : post.likes_count + 1
                }
              : post
          )
        );
  
        // Then refresh the data in the background
        fetchPostsWithMeta(true); // Ensure this call uses reset = true

      } catch (error) {
        console.error("Error in toggleLike:", error);
      }
    };

  const handleCommentClick = (postId: string) => {
    router.push(`/post/${postId}`);
  };

  // Add a click handler with event prevention
  const handleLikeClick = async (e: React.MouseEvent, postId: string, liked: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    await toggleLike(postId, liked);
  };

   const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

const [selectedTags, setSelectedTags] = useState<string[]>([]);

const toggleTag = (tag: string) => {
  setSelectedTags((prev) =>
    prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
  );
};

    const deletePostIfOwner = async (
        postId: string,
        currentUserId: string
      ): Promise<{ success: boolean; error?: PostgrestError | string }> => {
        // Step 1: Fetch the post to check ownership
        const { data: post, error: fetchError } = await supabase
          .from('posts')
          .select('user_id')
          .eq('id', postId)
          .single();
      
        if (fetchError) {
          return { success: false, error: fetchError };
        }
      
        if (!post || post.user_id !== currentUserId) {
          return { success: false, error: 'Unauthorized: You are not the owner of this post.' };
        }
      
        // Step 2: Delete the post
        const { error: deleteError } = await supabase
          .from('posts')
          .delete()
          .eq('id', postId);
      
        if (deleteError) {
          return { success: false, error: deleteError };
        }
      
        return { success: true };
      };

  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [showConfirmId, setShowConfirmId] = useState<string | null>(null);

  const handleDelete = async (postId: string) => {
  const result = await deletePostIfOwner(postId, user?.id || "");
  
  if (result.success) {
    alert('Post deleted.');
  } else {
    alert(`Failed to delete post: ${result.error}`);
  }

  setShowConfirmId(null);
  setMenuOpenId(null);
};

  const [reportConfirmId, setReportConfirmId] = useState<string | null>(null);

  const handleReport = async (postId: string) => {
  try {
    const { error } = await supabase
      .from("posts")
      .update({ isReported: true })
      .eq("id", postId);

    if (error) {
      console.error("Report failed:", error);
      alert("Failed to report the post.");
    } else {
      alert("Post reported successfully.");
    }
  } catch (err) {
    console.error("Unexpected error reporting post:", err);
    alert("Something went wrong.");
  }
};

const filteredPosts = postsData
  .filter((post) => post.animetitle_post === anime?.title)
  .filter((post) => 
    selectedTags.length === 0 || 
    selectedTags.every(tag => post.tags?.includes(tag))
  );



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
          <div className="w-[80%] h-48 md:h-64 relative rounded-2xl shadow-2xl">
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
          <div className="absolute left-1/2 -translate-x-1/2 -bottom-12 flex items-end gap-6 z-20 w-[80%]">
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
                className={`px-6 py-2 rounded-full text-lg font-semibold transition-colors ml-0 md:ml-4 ${
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
        {/* Main 3-column layout - move upward by reducing mt-6 to mt-2 */}
        <div className="flex flex-row max-w-7xl mx-auto px-4 mt-2 gap-6">
          {/* Left Sidebar */}
          <div className="hidden md:block w-64 min-h-screen bg-[#18181b] border-r border-zinc-800 px-4 py-6 flex-shrink-0">
            <JoinedCommunitiesSidebar userId={user?.id ?? null} />
          </div>
          {/* Main Feed Column */}
          <div className="flex-1 max-w-2xl w-full">
            <div className="bg-[#1f1f1f] border border-zinc-800 rounded-2xl shadow-md w-full">
              {/* Filter Bar inside card, sticky */}
              <div className="sticky top-0 z-10 w-full bg-[#1f1f1f] border-b border-zinc-800 rounded-t-2xl">
                <div className="flex gap-3 min-w-max py-2 px-4">
                  {["Recommended", "Recents"].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab as "Recommended" | "Recents")}
                      className={`px-6 py-2 rounded-full font-semibold transition-all duration-200 whitespace-nowrap focus:outline-none
                        ${activeTab === tab
                          ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold shadow scale-105"
                          : "bg-[#232232] text-zinc-300 hover:bg-gradient-to-r hover:from-pink-500 hover:to-purple-600 hover:text-white"}
                      `}
                      style={{ boxShadow: activeTab === tab ? '0 2px 16px 0 rgba(236,72,153,0.2)' : undefined }}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>
              {/* Posts Feed */}
              <div className="flex flex-col space-y-4">
                <ContentFeed
                  selectedAnime={anime ? [anime.title] : []}
                  recentPosts={postsData}
                  setRecentPosts={setPostsData}
                  homepageStyle={true}
                  filterType={activeTab}
                />
              </div>
            </div>
          </div>
          {/* Right Sidebar */}
          <div className="hidden lg:block w-80 flex-shrink-0 space-y-8">
            {/* Trending Tags */}
            <div className="bg-[#18181b] rounded-2xl border border-zinc-800 shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">Trending Topics</h3>
              <div className="flex flex-wrap gap-2">
                {community.trending_tags?.map((tag, index) => (
                  <button
                    key={index}
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1 rounded-full font-medium text-sm ${
                      selectedTags.includes(tag)
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
          </div>
        </div>
      </div>
    </div>
  );
} 